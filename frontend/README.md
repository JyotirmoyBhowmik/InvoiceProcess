# Universal Invoice & Document Automation Platform

A production-grade, highly modular automation system designed for deployment on an on-premises local server (Linux/Windows) or private cloud. It integrates with **Microsoft Exchange Online** (via a dedicated User ID or Entra App ID), generic IMAP/EWS/Gmail mailboxes, performs document layout OCR via **Google Cloud Vertex AI, Azure OpenAI, or Local On-Premises Vision Models (Ollama/vLLM)**, enforces arithmetic invariants, and exports data to custom **CSV, Pipe-Delimited, or SAP/Oracle Fixed-Width TXT** templates.

---

## High-Level Architecture

```
[Inbound Email / Mailboxes]
  ├── Microsoft 365 / Exchange Online (MSAL OAuth2 - App ID or Dedicated User)
  ├── On-Premises Exchange (EWS)
  ├── Generic IMAP / POP3 (TLS/SSL)
  └── Google Workspace (Gmail REST API)
             │
             ▼
[In-Memory Attachment Handler & ZIP Unpacker]
  ├── Sniffs Magic Bytes (%PDF, PNG, JFIF, TIFF)
  ├── Rejects signatures, logos, and tracking pixels (< 1 KB)
  └── Unpacks nested ZIP files directly in memory
             │
             ▼
[Model-Agnostic AI Extraction Engine]
  ├── Option 1: Google Cloud Vertex AI (Gemini 2.5 Flash, thinkingBudget: 0)
  ├── Option 2: Azure AI / OpenAI (GPT-4o / Document Intelligence)
  └── Option 3: Local AI (Ollama / vLLM: Llama 3.2 Vision, Qwen2-VL, Tesseract fallback)
             │
             ▼
[Reconciliation & Validation Engine]
  ├── Invariant Check: Subtotal + (CGST/SGST/IGST/VAT) + Ship + Tip - Disc == Total
  ├── Vendor Fuzzy Resolver (Levenshtein Token Sort Ratio >= 78%)
  ├── Tax & General Ledger Account Derivation
  └── Duplicate Invoice Guard (Vendor_Code + Invoice_No uniqueness)
             │
      ┌──────┴──────┐
      ▼             ▼
  [Valid]      [Exceptions]
      │             │
      └──────┬──────┘
             ▼
[SQL Database: PostgreSQL 15+ or MySQL 8.0+]
             │
             ├──► [Automated Reply Email to Supplier]
             └──► [ERP Exporter: CSV, Pipe-Delimited, SAP Fixed-Width TXT]
```

---

## 1. Local Server Deployment Guide

### Prerequisites
- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9 or Windows Server 2022.
- **Python**: 3.10, 3.11, or 3.12.
- **Database**: PostgreSQL 15+ or MySQL 8.0+.
- **Tesseract OCR (optional for offline fallback)**: `sudo apt-get install tesseract-ocr`.

### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/your-org/invoice-platform.git
cd invoice-platform

# 2. Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install production dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
nano .env

# 5. Initialize Database Schema
# For PostgreSQL:
psql -h localhost -U postgres -d invoice_erp_db -f db/schema_postgresql.sql
# For MySQL:
mysql -h localhost -u root -p invoice_erp_db < db/schema_mysql.sql

# 6. Run Background Ingestion Worker & API
python main.py --config config/app_config.yaml
```

### Systemd Service Configuration (Linux)
Create `/etc/systemd/system/invoice-worker.service`:
```ini
[Unit]
Description=Invoice Automation Background Worker Daemon
After=network.target postgresql.service

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/invoice-platform
ExecStart=/opt/invoice-platform/venv/bin/python main.py --config config/app_config.yaml
Restart=always
RestartSec=10
EnvironmentFile=/opt/invoice-platform/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now invoice-worker
```

---

## 2. Microsoft Exchange Online Configuration

Extracto Enterprise connects to Microsoft 365 Exchange Online using **MSAL for Python** with automatic token caching and proactive renewal.

### Option A: Microsoft Entra App ID (Application Permission - Recommended)
1. Go to **Azure Portal** $\to$ **Microsoft Entra ID** $\to$ **App registrations** $\to$ **New registration**.
2. Name: `Invoice-AP-Automation-Daemon`.
3. Under **API permissions**, select **Add a permission** $\to$ **Microsoft Graph**:
   - `Mail.ReadWrite` (Application Permission)
   - `Mail.Send` (Application Permission)
4. Click **Grant admin consent for [Your Organization]**.
5. Under **Certificates & secrets**, generate a Client Secret or upload an X.509 Certificate.
6. Configure in `config/app_config.yaml` or `.env`:
   ```env
   AZURE_TENANT_ID="your-tenant-uuid"
   AZURE_CLIENT_ID="your-client-app-id"
   AZURE_CLIENT_SECRET="your-client-secret-value"
   TARGET_MAILBOX="finance-invoices@company.com"
   AUTH_MODE="app_credential"
   ```

### Option B: Dedicated User ID / Service Account
1. Create a service account in Microsoft 365 (e.g. `svc-invoice-bot@company.com`).
2. Grant the account access to the target shared mailbox via Exchange Admin Center.
3. Configure in `.env`:
   ```env
   AZURE_TENANT_ID="your-tenant-uuid"
   AZURE_CLIENT_ID="your-client-app-id"
   AZURE_DEDICATED_USER="svc-invoice-bot@company.com"
   AZURE_DEDICATED_PASS="your-secure-password"
   AUTH_MODE="dedicated_user"
   ```

---

## 3. Model-Agnostic LLM Engine Selection

Hot-swap between AI providers without altering application code:

### 1. Google Cloud Vertex AI (Default)
- **Model**: `gemini-2.5-flash`
- **Cost Optimization**: Sets `thinkingBudget: 0`, reducing extraction latency to under 700ms and cutting token billing by 75%.
- **Setup**:
  ```bash
  export GCP_PROJECT_ID="your-project-id"
  export GOOGLE_APPLICATION_CREDENTIALS="/etc/gcp/service-account.json"
  ```

### 2. Azure OpenAI / Document Intelligence
- **Model**: `gpt-4o` or Document Intelligence layout model.
- **Setup**:
  ```bash
  export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
  export AZURE_OPENAI_API_KEY="your-azure-key"
  ```

### 3. Local On-Premises AI (Ollama / vLLM)
- Keep all documents 100% inside your corporate perimeter:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ollama run llama3.2-vision:11b
  ```
- Configure in `config/app_config.yaml`:
  ```yaml
  ai_routing:
    active_provider: "local_ai"
    local_ai:
      endpoint_url: "http://localhost:11434/api/generate"
      model_name: "llama3.2-vision:11b"
      ocr_fallback_engine: "tesseract"
  ```

---

## 4. Absolute Zero Mock Data Policy

- All mock invoices, test transactions, and dummy data have been removed from the default state.
- The Admin Panel provides a one-click **"Purge All Demo Data"** utility that resets the database tables and memory state to a clean production slate.

---

## 5. 100% White-Label Whitelisting

Through the **Admin Panel**, administrators can configure:
1. **Application Name & Header Subtitle**: Change branding dynamically across all views.
2. **Theme Color**: Toggle between Indigo, Sky, Emerald, Rose, and Amber palettes.
3. **Tab Labels, Icons & Visibility**: Show/hide tabs and customize titles.
4. **Custom Master Fields**: Add new fields (e.g. `Project_Code`, `Cost_Center`) in master data and bind them directly to ERP template columns.
5. **Audit Logging**: Every configuration, vendor update, or reconciliation action is recorded in the immutable audit trail.
