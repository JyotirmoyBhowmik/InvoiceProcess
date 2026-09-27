import json
import os
from typing import Any, Dict, List, Optional, Tuple
from rapidfuzz import fuzz
from core.logger import get_logger

class VendorResolver:
    """Matches raw extracted vendor names and Tax IDs against PostgreSQL/MySQL DB or fallback vendors.json."""

    def __init__(
        self,
        db_repository: Optional[Any] = None,
        vendors_filepath: str = "config/vendors.json",
        similarity_threshold: float = 78.0,
    ):
        self.db_repository = db_repository
        self.vendors_filepath = vendors_filepath
        self.similarity_threshold = similarity_threshold
        self.vendors: List[Dict[str, Any]] = []
        self.logger = get_logger()
        self._load_vendors()

    def _load_vendors(self) -> None:
        """First attempts to fetch vendors from SQL database; falls back to vendors.json."""
        if self.db_repository:
            try:
                db_vendors = self.db_repository.get_all_vendors_with_aliases()
                if db_vendors:
                    self.vendors = db_vendors
                    self.logger.info("vendors_loaded_from_sql_db", count=len(self.vendors))
                    return
            except Exception as e:
                self.logger.warn("db_vendor_load_fallback", error=str(e))

        # Fallback to vendors.json file
        if os.path.exists(self.vendors_filepath):
            try:
                with open(self.vendors_filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.vendors = data.get("vendors", [])
                self.logger.info("vendors_loaded_from_json_fallback", count=len(self.vendors))
            except Exception as e:
                self.logger.error("vendors_json_load_failed", error=str(e))

    def resolve(self, extracted_name: str, extracted_tax_id: Optional[str] = None) -> Tuple[str, Optional[str], float]:
        """Checks Tax ID deterministically, then performs fuzzy matching on canonical names & aliases."""
        clean_name = (extracted_name or "").strip()
        clean_tax_id = (extracted_tax_id or "").strip().upper()

        # Step 1: Deterministic Tax ID match
        if clean_tax_id:
            for v in self.vendors:
                registered_ids = [t.upper() for t in v.get("tax_ids", [])]
                if clean_tax_id in registered_ids:
                    self.logger.info("vendor_matched_by_tax_id", vendor_code=v["vendor_code"], tax_id=clean_tax_id)
                    return v["vendor_code"], v.get("default_category"), 100.0

        # Step 2: Fuzzy match over canonical names and aliases
        best_code = "VEND_UNKNOWN"
        best_category = None
        highest_score = 0.0

        for v in self.vendors:
            candidates = [v["canonical_name"]] + v.get("aliases", [])
            for cand in candidates:
                score = fuzz.token_sort_ratio(clean_name.lower(), cand.lower())
                if score > highest_score:
                    highest_score = score
                    best_code = v["vendor_code"]
                    best_category = v.get("default_category")

        if highest_score >= self.similarity_threshold:
            self.logger.info(
                "vendor_matched_by_fuzzy_name",
                vendor_code=best_code,
                name=clean_name,
                score=highest_score,
            )
            return best_code, best_category, highest_score

        self.logger.warn("vendor_unresolved", raw_name=clean_name, best_score=highest_score)
        return "VEND_UNKNOWN", None, highest_score
