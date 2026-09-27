from typing import Any, Dict, Tuple
import yaml
from core.logger import get_logger

class TaxEngine:
    """Derives tax codes, GL accounts, and cost centers from expense classification."""

    def __init__(self, config: Dict[str, Any], matrix_path: str = "config/tax_matrix.yaml"):
        self.config = config
        self.tax_matrix: Dict[str, Any] = {}
        self.logger = get_logger()
        self._load_matrix(matrix_path)

    def _load_matrix(self, path: str) -> None:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                self.tax_matrix = data.get("tax_matrix", {})
        except Exception:
            # Fallback to rules in app_config
            self.tax_matrix = self.config.get("rules", {}).get("expense_categories", {})

    def derive(self, category: str) -> Tuple[str, str, str]:
        """Returns (tax_code, gl_account, cost_center) for a given category."""
        clean_cat = category.strip()
        matched = self.tax_matrix.get(clean_cat)

        if not matched:
            matched = self.tax_matrix.get("Default", {
                "tax_code": "TX_GEN_13",
                "gl_account": "GL-699999",
                "cost_center": "CC-GEN-OVERHEAD"
            })

        tax_code = matched.get("tax_code", matched.get("default_tax_code", "TX_GEN_13"))
        gl_account = matched.get("gl_account", "GL-699999")
        cost_center = matched.get("cost_center", "CC-GEN-OVERHEAD")

        return tax_code, gl_account, cost_center
