// High quality vector SVG invoice converted to data URL for instantaneous one-click loading
export const SAMPLE_INVOICE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
  </defs>

  <!-- Top Accent Bar -->
  <rect x="0" y="0" width="800" height="12" fill="url(#headerGrad)" />

  <!-- Vendor Header & Logo -->
  <g transform="translate(50, 45)">
    <circle cx="28" cy="28" r="28" fill="#4f46e5" />
    <path d="M18 36 L28 16 L38 36 Z M24 30 L32 30" stroke="#ffffff" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <text x="70" y="24" font-size="22" font-weight="bold" fill="#0f172a">NEXUS DYNAMICS CLOUD CORP</text>
    <text x="70" y="42" font-size="12" fill="#64748b">Tax ID: US-EIN-884920194 • VAT: EU940129841</text>
    <text x="70" y="58" font-size="12" fill="#64748b">100 Innovation Way, Suite 400, Austin, TX 78701</text>
  </g>

  <!-- Invoice Meta Box -->
  <g transform="translate(520, 45)">
    <rect width="230" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
    <text x="20" y="32" font-size="12" font-weight="bold" fill="#64748b" letter-spacing="1">INVOICE NUMBER</text>
    <text x="20" y="52" font-size="16" font-weight="bold" fill="#0f172a">#INV-2025-0842</text>
    <text x="20" y="74" font-size="12" fill="#64748b">Issue Date: <tspan font-weight="600" fill="#1e293b">2025-02-14</tspan></text>
    <text x="20" y="90" font-size="12" fill="#64748b">Due Date: <tspan font-weight="600" fill="#dc2626">2025-03-16</tspan></text>
  </g>

  <!-- Bill To & Payment Info -->
  <g transform="translate(50, 175)">
    <rect width="700" height="90" rx="8" fill="#f1f5f9" />
    <text x="25" y="28" font-size="11" font-weight="bold" fill="#475569" letter-spacing="1">BILLED TO (CUSTOMER)</text>
    <text x="25" y="48" font-size="15" font-weight="bold" fill="#0f172a">Quantum Leap Systems LLC</text>
    <text x="25" y="66" font-size="12" fill="#475569">Attn: Accounts Payable • billing@quantumleap.tech</text>
    <text x="25" y="80" font-size="12" fill="#475569">742 Evergreen Terrace, Suite 2B, Springfield, OR 97477</text>

    <!-- Payment details on right -->
    <text x="440" y="28" font-size="11" font-weight="bold" fill="#475569" letter-spacing="1">TERMS & CURRENCY</text>
    <text x="440" y="48" font-size="13" font-weight="bold" fill="#0f172a">Net 30 Days (Direct Wire)</text>
    <text x="440" y="66" font-size="12" fill="#475569">Currency: <tspan font-weight="bold">USD ($)</tspan></text>
    <text x="440" y="80" font-size="12" fill="#10b981">PO Number: PO-99410-X</text>
  </g>

  <!-- Table Header -->
  <g transform="translate(50, 290)">
    <rect width="700" height="36" rx="4" fill="#1e293b" />
    <text x="20" y="22" font-size="12" font-weight="bold" fill="#f8fafc">ITEM / DESCRIPTION</text>
    <text x="410" y="22" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">QTY</text>
    <text x="510" y="22" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="end">UNIT PRICE</text>
    <text x="680" y="22" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="end">TOTAL (USD)</text>
  </g>

  <!-- Line Item 1 -->
  <g transform="translate(50, 340)">
    <rect width="700" height="55" fill="#ffffff" />
    <text x="20" y="22" font-size="13.5" font-weight="600" fill="#0f172a">Enterprise Kubernetes Cluster Hosting</text>
    <text x="20" y="40" font-size="11.5" fill="#64748b">Dedicated tier, multi-region failover, 32 Nodes SLA 99.99%</text>
    <text x="410" y="26" font-size="13" fill="#0f172a" text-anchor="middle">1.0</text>
    <text x="510" y="26" font-size="13" fill="#0f172a" text-anchor="end">$2,450.00</text>
    <text x="680" y="26" font-size="13.5" font-weight="600" fill="#0f172a" text-anchor="end">$2,450.00</text>
    <line x1="0" y1="54" x2="700" y2="54" stroke="#e2e8f0" stroke-width="1" />
  </g>

  <!-- Line Item 2 -->
  <g transform="translate(50, 396)">
    <rect width="700" height="55" fill="#fcfcfd" />
    <text x="20" y="22" font-size="13.5" font-weight="600" fill="#0f172a">Vector DB Storage &amp; Embedding Pipeline</text>
    <text x="20" y="40" font-size="11.5" fill="#64748b">150M active vector dimensions &amp; HNSW indexing batch</text>
    <text x="410" y="26" font-size="13" fill="#0f172a" text-anchor="middle">3.0</text>
    <text x="510" y="26" font-size="13" fill="#0f172a" text-anchor="end">$380.00</text>
    <text x="680" y="26" font-size="13.5" font-weight="600" fill="#0f172a" text-anchor="end">$1,140.00</text>
    <line x1="0" y1="54" x2="700" y2="54" stroke="#e2e8f0" stroke-width="1" />
  </g>

  <!-- Line Item 3 -->
  <g transform="translate(50, 452)">
    <rect width="700" height="55" fill="#ffffff" />
    <text x="20" y="22" font-size="13.5" font-weight="600" fill="#0f172a">AI Model Inference Quota (Pro Rated Tier)</text>
    <text x="20" y="40" font-size="11.5" fill="#64748b">Approx 4.8M token consumption batch (subject to rebate audit)</text>
    <text x="410" y="26" font-size="13" fill="#0f172a" text-anchor="middle">1.0</text>
    <text x="510" y="26" font-size="13" fill="#0f172a" text-anchor="end">$425.50</text>
    <text x="680" y="26" font-size="13.5" font-weight="600" fill="#0f172a" text-anchor="end">$425.50</text>
    <text x="280" y="42" font-size="10" font-style="italic" fill="#d97706" opacity="0.85">* Promo credit pending approval? [verify]</text>
    <line x1="0" y1="54" x2="700" y2="54" stroke="#e2e8f0" stroke-width="1" />
  </g>

  <!-- Line Item 4 -->
  <g transform="translate(50, 508)">
    <rect width="700" height="55" fill="#fcfcfd" />
    <text x="20" y="22" font-size="13.5" font-weight="600" fill="#0f172a">24/7 Dedicated APM SRE Incident Support</text>
    <text x="20" y="40" font-size="11.5" fill="#64748b">Quarterly SLA retainer coverage</text>
    <text x="410" y="26" font-size="13" fill="#0f172a" text-anchor="middle">2.0</text>
    <text x="510" y="26" font-size="13" fill="#0f172a" text-anchor="end">$500.00</text>
    <text x="680" y="26" font-size="13.5" font-weight="600" fill="#0f172a" text-anchor="end">$1,000.00</text>
    <line x1="0" y1="54" x2="700" y2="54" stroke="#cbd5e1" stroke-width="1.5" />
  </g>

  <!-- Financial Summary Section -->
  <g transform="translate(420, 580)">
    <rect width="330" height="185" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="20" y="28" font-size="13" fill="#64748b">Subtotal</text>
    <text x="310" y="28" font-size="13" font-weight="600" fill="#1e293b" text-anchor="end">$5,015.50</text>

    <text x="20" y="58" font-size="13" fill="#64748b">State &amp; Local Tax (8.25%)</text>
    <text x="310" y="58" font-size="13" font-weight="600" fill="#1e293b" text-anchor="end">$413.78</text>

    <text x="20" y="88" font-size="13" fill="#64748b">Early Renewal Discount</text>
    <text x="310" y="88" font-size="13" font-weight="600" fill="#16a34a" text-anchor="end">-$150.00</text>

    <line x1="20" y1="108" x2="310" y2="108" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4" />

    <text x="20" y="145" font-size="16" font-weight="bold" fill="#0f172a">TOTAL DUE</text>
    <text x="310" y="145" font-size="22" font-weight="800" fill="#4f46e5" text-anchor="end">$5,279.28</text>
  </g>

  <!-- Stamp / Signature Box -->
  <g transform="translate(50, 585)">
    <rect width="320" height="150" rx="8" fill="#fdf4ff" stroke="#f0abfc" stroke-dasharray="5 3" />
    <text x="20" y="30" font-size="11" font-weight="bold" fill="#86198f" letter-spacing="1">PAYMENT INSTRUCTIONS</text>
    <text x="20" y="55" font-size="11.5" fill="#4a044e">Bank: Chase Manhattan Bank N.A.</text>
    <text x="20" y="75" font-size="11.5" fill="#4a044e">Routing (ABA): 121000358</text>
    <text x="20" y="95" font-size="11.5" fill="#4a044e">Account #: •••••• 4892 (Fedwire/SWIFT)</text>
    <text x="20" y="125" font-size="11" font-weight="bold" fill="#9333ea">Thank you for your business!</text>
  </g>

  <!-- Bottom Footer -->
  <g transform="translate(50, 1000)">
    <line x1="0" y1="0" x2="700" y2="0" stroke="#e2e8f0" stroke-width="1" />
    <text x="350" y="24" font-size="11" fill="#94a3b8" text-anchor="middle">Nexus Dynamics Cloud Corp • Page 1 of 1 • System generated invoice #INV-2025-0842</text>
  </g>
</svg>
`)}`;

export const SAMPLE_INVOICE_DATA = {
  currency: { value: 'USD', isUnsure: false, confidenceScore: 98 },
  currencySymbol: '$',
  baseCurrency: 'USD',
  exchangeRate: 1.0,
  convertedTotalAmount: 5279.28,
  vendorName: { value: 'NEXUS DYNAMICS CLOUD CORP', isUnsure: false, confidenceScore: 99 },
  vendorAddress: { value: '100 Innovation Way, Suite 400, Austin, TX 78701', isUnsure: false, confidenceScore: 97 },
  vendorTaxId: { value: 'US-EIN-884920194', isUnsure: false, confidenceScore: 95 },
  customerName: { value: 'Quantum Leap Systems LLC', isUnsure: false, confidenceScore: 99 },
  customerAddress: { value: '742 Evergreen Terrace, Suite 2B, Springfield, OR 97477', isUnsure: false, confidenceScore: 96 },
  invoiceNumber: { value: 'INV-2025-0842', isUnsure: false, confidenceScore: 100 },
  invoiceDate: { value: '2025-02-14', isUnsure: false, confidenceScore: 99 },
  dueDate: { value: '2025-03-16', isUnsure: false, confidenceScore: 99 },
  paymentTerms: { value: 'Net 30 Days (Direct Wire)', isUnsure: false, confidenceScore: 95 },
  subtotal: { value: 5015.50, isUnsure: false, confidenceScore: 98 },
  taxAmount: { value: 413.78, isUnsure: false, confidenceScore: 98 },
  taxBreakdown: {
    cgst: { value: 0, isUnsure: false, confidenceScore: 98 },
    sgst: { value: 0, isUnsure: false, confidenceScore: 98 },
    igst: { value: 413.78, isUnsure: false, confidenceScore: 98 },
    vat: { value: 0, isUnsure: false, confidenceScore: 98 },
    otherTax: { value: 0, isUnsure: false, confidenceScore: 98 },
  },
  discountAmount: { value: 150.00, isUnsure: false, confidenceScore: 94 },
  shippingAmount: { value: 0.00, isUnsure: false, confidenceScore: 99 },
  tipAmount: { value: 0.00, isUnsure: false, confidenceScore: 100 },
  totalAmount: { value: 5279.28, isUnsure: false, confidenceScore: 100 },
  isMathReconciled: true,
  mathDiscrepancy: 0.00,
  overallConfidenceScore: 96,
  tokensConsumed: 180,
  lineItems: [
    {
      id: 'item-1',
      description: { value: 'Enterprise Kubernetes Cluster Hosting', isUnsure: false, confidenceScore: 98 },
      quantity: { value: 1.0, isUnsure: false, confidenceScore: 99 },
      unitPrice: { value: 2450.00, isUnsure: false, confidenceScore: 99 },
      amount: { value: 2450.00, isUnsure: false, confidenceScore: 99 }
    },
    {
      id: 'item-2',
      description: { value: 'Vector DB Storage & Embedding Pipeline', isUnsure: false, confidenceScore: 97 },
      quantity: { value: 3.0, isUnsure: false, confidenceScore: 99 },
      unitPrice: { value: 380.00, isUnsure: false, confidenceScore: 98 },
      amount: { value: 1140.00, isUnsure: false, confidenceScore: 99 }
    },
    {
      id: 'item-3',
      description: { 
        value: 'AI Model Inference Quota (Pro Rated Tier)', 
        isUnsure: true, 
        confidenceScore: 68,
        reasonUnsure: 'Faded pencil annotation: "Promo credit pending approval? [verify]" may alter final bill.'
      },
      quantity: { value: 1.0, isUnsure: false, confidenceScore: 95 },
      unitPrice: { value: 425.50, isUnsure: false, confidenceScore: 96 },
      amount: { 
        value: 425.50, 
        isUnsure: true, 
        confidenceScore: 72,
        reasonUnsure: 'May be eligible for retroactive credit or pending deduction.'
      }
    },
    {
      id: 'item-4',
      description: { value: '24/7 Dedicated APM SRE Incident Support', isUnsure: false, confidenceScore: 99 },
      quantity: { value: 2.0, isUnsure: false, confidenceScore: 99 },
      unitPrice: { value: 500.00, isUnsure: false, confidenceScore: 99 },
      amount: { value: 1000.00, isUnsure: false, confidenceScore: 99 }
    }
  ]
};
