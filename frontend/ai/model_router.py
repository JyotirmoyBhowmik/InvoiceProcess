import json
import os
import requests
from typing import Any, Dict, Tuple, Optional
from google import genai
from google.genai import types

from ai.prompts import INVOICE_EXTRACTION_SYSTEM_INSTRUCTION, INVOICE_EXTRACTION_PROMPT
from ai.schemas import NormalizedInvoice
from core.logger import get_logger

class MultiModelAIRouter:
    """Production AI Router that directs document OCR and entity parsing to:
    1. Google Cloud Vertex AI (Gemini 2.5 Flash with thinkingBudget: 0)
    2. Azure AI (Document Intelligence or Azure OpenAI GPT-4o)
    3. Local AI (Ollama vision model / vLLM on on-premises server)
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("ai_routing", {})
        self.active_provider = self.config.get("active_provider", "vertex_ai")
        self.logger = get_logger()

    def extract(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int, str]:
        """Routes document extraction to selected model with automated fallback."""
        provider = self.active_provider

        try:
            if provider == "vertex_ai":
                return self._call_vertex_ai(document_bytes, mime_type, filename)
            elif provider == "azure_ai":
                return self._call_azure_ai(document_bytes, mime_type, filename)
            elif provider == "local_ai":
                return self._call_local_ai(document_bytes, mime_type, filename)
            else:
                return self._call_vertex_ai(document_bytes, mime_type, filename)
        except Exception as primary_error:
            self.logger.error("primary_model_failed", provider=provider, error=str(primary_error))
            # Fallback to Vertex AI if another provider fails
            if provider != "vertex_ai":
                self.logger.info("engaging_vertex_ai_fallback")
                return self._call_vertex_ai(document_bytes, mime_type, filename)
            raise primary_error

    def _call_vertex_ai(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int, str]:
        client = genai.Client(vertexai=True)
        encoded_doc = types.Part.from_bytes(data=document_bytes, mime_type=mime_type)
        schema_json = NormalizedInvoice.model_json_schema()

        response = client.models.generate_content(
            model=self.config.get("vertex_ai", {}).get("model", "gemini-2.5-flash"),
            contents=[
                types.Content(
                    role="user",
                    parts=[encoded_doc, types.Part.from_text(text=INVOICE_EXTRACTION_PROMPT)],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=INVOICE_EXTRACTION_SYSTEM_INSTRUCTION,
                temperature=0.05,
                max_output_tokens=1024,
                response_mime_type="application/json",
                response_schema=schema_json,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        parsed_dict = json.loads(response.text)
        invoice = NormalizedInvoice.model_validate(parsed_dict)
        tokens = 180
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens = (response.usage_metadata.prompt_token_count or 0) + (
                response.usage_metadata.candidates_token_count or 0
            )
        return invoice, tokens, "Google Vertex AI (Gemini 2.5 Flash)"

    def _call_azure_ai(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int, str]:
        azure_cfg = self.config.get("azure_ai", {})
        endpoint = azure_cfg.get("endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT", "")
        api_key = azure_cfg.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY", "")
        deployment = azure_cfg.get("deployment_name", "gpt-4o")
        api_version = azure_cfg.get("api_version", "2024-08-01-preview")

        import base64
        b64_doc = base64.b64encode(document_bytes).decode("utf-8")

        url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"
        headers = {"api-key": api_key, "Content-Type": "application/json"}

        payload = {
            "messages": [
                {"role": "system", "content": INVOICE_EXTRACTION_SYSTEM_INSTRUCTION},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": INVOICE_EXTRACTION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64_doc}"},
                        },
                    ],
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.05,
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        raw_json_str = data["choices"][0]["message"]["content"]
        invoice = NormalizedInvoice.model_validate(json.loads(raw_json_str))
        tokens = data.get("usage", {}).get("total_tokens", 250)
        return invoice, tokens, f"Azure AI ({deployment})"

    def _call_local_ai(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int, str]:
        local_cfg = self.config.get("local_ai", {})
        endpoint = local_cfg.get("endpoint_url", "http://localhost:11434/api/generate")
        model = local_cfg.get("model_name", "llama3.2-vision:11b")

        import base64
        b64_doc = base64.b64encode(document_bytes).decode("utf-8")

        prompt = f"{INVOICE_EXTRACTION_SYSTEM_INSTRUCTION}\n\n{INVOICE_EXTRACTION_PROMPT}\nReturn valid JSON adhering to schema."

        payload = {
            "model": model,
            "prompt": prompt,
            "images": [b64_doc],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.05},
        }

        resp = requests.post(endpoint, json=payload, timeout=90)
        resp.raise_for_status()
        raw_text = resp.json().get("response", "{}")
        invoice = NormalizedInvoice.model_validate(json.loads(raw_text))
        return invoice, 0, f"Local On-Premises AI ({model})"
