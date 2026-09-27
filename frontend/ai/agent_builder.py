import base64
import json
import os
from typing import Any, Dict, Tuple
from google.cloud import discoveryengine_v1 as discoveryengine
from google import genai
from google.genai import types

from ai.prompts import INVOICE_EXTRACTION_SYSTEM_INSTRUCTION, INVOICE_EXTRACTION_PROMPT
from ai.schemas import NormalizedInvoice
from core.logger import get_logger

class VertexAgentBuilderExtractor:
    """Invokes Vertex AI Agent Builder Grounded Generation and Gemini 2.5 Flash with schema enforcement and low token cost."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("agent_builder", {})
        self.project_id = self.config.get("project_id") or os.getenv("GCP_PROJECT_ID", "")
        self.location = self.config.get("location", "global")
        self.data_store_id = self.config.get("data_store_id") or os.getenv("AGENT_BUILDER_DATASTORE_ID", "")
        self.serving_config_id = self.config.get("serving_config_id", "default_search")
        self.max_tokens = int(self.config.get("max_output_tokens", 1024))
        self.temperature = float(self.config.get("temperature", 0.05))
        self.model_name = self.config.get("model_name", "gemini-2.5-flash")
        self.logger = get_logger()

        # Initialize Google GenAI client (Vertex AI mode)
        self.ai = genai.Client(vertexai=True)

    def extract_document(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int]:
        """Extracts structured invoice data using schema-constrained decoding with thinkingBudget=0 for low token cost."""
        self.logger.info("vertex_extraction_started", filename=filename, size=len(document_bytes), mime=mime_type)

        encoded_doc = types.Part.from_bytes(data=document_bytes, mime_type=mime_type)
        schema_json = NormalizedInvoice.model_json_schema()

        try:
            # Low latency and zero-token thinkingBudget
            response = self.ai.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            encoded_doc,
                            types.Part.from_text(text=INVOICE_EXTRACTION_PROMPT),
                        ],
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=INVOICE_EXTRACTION_SYSTEM_INSTRUCTION,
                    temperature=self.temperature,
                    max_output_tokens=self.max_tokens,
                    response_mime_type="application/json",
                    response_schema=schema_json,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )

            raw_text = response.text or "{}"
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("`").replace("json\n", "", 1)

            parsed_dict = json.loads(raw_text)
            invoice_obj = NormalizedInvoice.model_validate(parsed_dict)

            tokens_used = 0
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                tokens_used = (response.usage_metadata.prompt_token_count or 0) + (
                    response.usage_metadata.candidates_token_count or 0
                )

            self.logger.info(
                "vertex_extraction_success",
                filename=filename,
                invoice_number=invoice_obj.header.invoice_number,
                vendor=invoice_obj.vendor.name,
                currency=invoice_obj.header.currency,
                total=invoice_obj.financials.total_amount,
                tokens_used=tokens_used,
            )

            return invoice_obj, tokens_used

        except Exception as e:
            self.logger.error("vertex_extraction_failed", filename=filename, error=str(e), exc_info=True)
            raise RuntimeError(f"Vertex AI extraction failed for {filename}: {str(e)}") from e
