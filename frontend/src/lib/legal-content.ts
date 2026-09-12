// Source of truth: docs/GramIntel_Legal_Document_Template.docx — regenerate if the docx changes.
// Legal text stays in English in all UI languages (authoritative version).
export const LEGAL_SOURCE = "docs/GramIntel_Legal_Document_Template.docx";
export const LEGAL_SECTIONS: { h: string | null; body: string[] }[] = [
  {
    "h": null,
    "body": [
      "GRAMINTEL\nBUSINESS ADVISORY AND FINANCING FACILITATION AGREEMENT",
      "LEGAL DOCUMENT TEMPLATE",
      "This document is a template intended to record the terms governing the use of GramIntel, a hyper-local business advisory and financial structuring application. It should be reviewed and adapted by a qualified legal professional before being used as a final binding agreement."
    ]
  },
  {
    "h": "1. PARTIES TO THE AGREEMENT",
    "body": [
      "This Agreement is made and entered into at __________________ on this ____ day of __________, ______, BETWEEN:",
      "GRAMINTEL, hereinafter referred to as the “Platform” or “GramIntel”, operating the GramIntel software application for business advisory, feasibility analysis and financing facilitation; AND",
      "Mr./Ms./M/s. ______________________________________, residing/registered at ____________________________________________________, hereinafter referred to as the “Applicant”.",
      "The Platform and the Applicant are collectively referred to as the “Parties” and individually as a “Party”."
    ]
  },
  {
    "h": "2. RECITALS",
    "body": [
      "WHEREAS the Applicant seeks assistance in evaluating a proposed business opportunity and understanding its financial requirements;",
      "AND WHEREAS GramIntel provides a software-based workflow that uses location, business-category, financial and other available data to generate feasibility and financial-structuring outputs;",
      "AND WHEREAS the GramIntel system may generate a feasibility report, financial plan, repayment schedule, multilingual narrative and an applicant-to-officer case workflow;",
      "AND WHEREAS the Parties desire to record the terms and conditions governing the Applicant’s use of the Platform;",
      "NOW THIS AGREEMENT WITNESSETH and it is hereby agreed by and between the Parties as follows:"
    ]
  },
  {
    "h": "3. PURPOSE OF THE AGREEMENT",
    "body": [
      "The purpose of this Agreement is to establish the terms under which the Applicant may use GramIntel to assess a proposed rural or semi-urban business opportunity, review indicative financial structuring, and, where applicable, submit a case for review by an authorized officer or financing institution."
    ]
  },
  {
    "h": "4. INFORMATION PROVIDED BY THE APPLICANT",
    "body": [
      "The Applicant may provide information including, but not limited to, village, block, district, available margin capital, proposed business category, contact information, identity/authentication information and other information requested by the Platform.",
      "The Applicant represents that information supplied to GramIntel is, to the best of the Applicant’s knowledge, true, accurate and complete. The Applicant shall promptly correct any material error discovered in submitted information."
    ]
  },
  {
    "h": "5. SERVICES PROVIDED BY GRAMINTEL",
    "body": [
      "Location and business-category based feasibility analysis using available market, competition, supply, demand, pricing and risk signals.",
      "Deterministic financial structuring based on the configured scheme rules and the margin capital entered by the Applicant.",
      "Generation of an indicative project cost, loan amount, EMI and repayment schedule where applicable.",
      "Generation of business narratives and multilingual presentation in supported languages.",
      "Creation and management of an applicant case that may be submitted for officer review.",
      "Case communication, status history and decision workflow where those features are enabled."
    ]
  },
  {
    "h": "6. FINANCIAL AND SCHEME OUTPUTS",
    "body": [
      "For the current GramIntel implementation, the financial engine treats available margin capital as 10% of project cost and calculates project cost and maximum loan subject to configured scheme limits. The current implementation includes Micro Finance and Term Loan routes with configured interest, tenure, moratorium and maximum-loan parameters.",
      "All financial figures produced by GramIntel are software-generated calculations and/or indicative outputs. They shall not by themselves constitute a sanction letter, loan commitment, guarantee, disbursement promise, or legally binding offer of credit by GramIntel."
    ]
  },
  {
    "h": "7. NO LENDER-BORROWER RELATIONSHIP WITH GRAMINTEL",
    "body": [
      "Unless GramIntel is separately and expressly authorized and contracted to act as a lender, GramIntel is not the lender under any financing transaction arising from use of the Platform. A loan, subsidy, grant or other financial facility, if any, shall be governed by the separate terms and documentation of the relevant lender, scheme authority or financing institution."
    ]
  },
  {
    "h": "8. FEASIBILITY REPORT AND DATA SOURCES",
    "body": [
      "GramIntel may use live or seeded/backup data sources for nearby places and market signals. External services may be unavailable or may return incomplete information. Where fallback data is used, the Platform may identify the source or confidence level in the user interface.",
      "The Applicant acknowledges that a feasibility score or recommendation is an analytical aid and not a guarantee that a business will be profitable, eligible for financing, or successful in the market."
    ]
  },
  {
    "h": "9. APPLICATION AND OFFICER REVIEW WORKFLOW",
    "body": [
      "Where the Applicant submits a case, the case may move through the following workflow:",
      "DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED",
      "Submission does not guarantee approval. An authorized officer may review the case, request clarification, communicate through the case chat, and approve or reject the case in accordance with applicable rules."
    ]
  },
  {
    "h": "10. AUTHENTICATION AND ACCOUNT SECURITY",
    "body": [
      "GramIntel may use OTP and/or Google-based authentication. The Applicant is responsible for maintaining control of the email account or authentication method used to access the Platform and shall not knowingly share authentication credentials or OTPs."
    ]
  },
  {
    "h": "11. ELECTRONIC RECORDS AND COMMUNICATION",
    "body": [
      "The Applicant consents, subject to applicable law, to receiving case-related communications electronically, including status notifications, decision notifications and other operational messages. Electronic records may include submitted information, case status, decision history and communications associated with the Applicant’s case."
    ]
  },
  {
    "h": "12. DATA USE AND PRIVACY",
    "body": [
      "GramIntel shall process Applicant information for purposes connected with authentication, business analysis, case management, communication, security, service operation and improvement, subject to applicable law and the Platform’s privacy policy. Sensitive credentials, secret keys and authentication secrets shall not be intentionally exposed through application logs or public source control."
    ]
  },
  {
    "h": "13. ARTIFICIAL INTELLIGENCE AND AUTOMATED OUTPUTS",
    "body": [
      "Certain narrative, chat or explanatory outputs may be generated with artificial-intelligence services or deterministic templates. AI-generated content may contain errors or omissions. Applicants and officers should verify material facts, financial assumptions, eligibility requirements and legal requirements before relying on them."
    ]
  },
  {
    "h": "14. APPLICANT RESPONSIBILITIES",
    "body": [
      "Provide accurate information and supporting documents when requested.",
      "Review generated reports and financial assumptions before submitting a case.",
      "Use the Platform only for lawful purposes.",
      "Not attempt to bypass authentication, manipulate case status, interfere with external services or access another person’s case.",
      "Comply with the separate terms of any lender, government scheme or financing institution."
    ]
  },
  {
    "h": "15. LIMITATION OF REPRESENTATIONS",
    "body": [
      "Except as expressly stated in a separate written agreement, GramIntel does not represent or warrant that any business opportunity identified by the Platform will be profitable, that any financing will be sanctioned, or that external data will always be current, complete or available."
    ]
  },
  {
    "h": "16. INTELLECTUAL PROPERTY",
    "body": [
      "Subject to rights in third-party services and data, the software, interface, branding, source code, design, workflows and original materials comprising GramIntel remain the property of their respective owners. The Applicant receives a limited right to use the Platform for its intended purpose and does not receive ownership of the underlying software."
    ]
  },
  {
    "h": "17. SERVICE AVAILABILITY",
    "body": [
      "The Platform may depend on external mapping, geocoding, market-data, AI, email or authentication services. Temporary outages, rate limits, network failures or changes in third-party services may affect functionality. GramIntel may use fallback or cached information where implemented."
    ]
  },
  {
    "h": "18. TERM AND TERMINATION",
    "body": [
      "This Agreement shall commence on the date of acceptance or use of the relevant GramIntel service and shall continue until the Applicant’s account or case is closed, or until terminated in accordance with applicable law or the Platform’s applicable terms.",
      "Termination shall not affect obligations or rights that by their nature are intended to survive termination, including provisions concerning records, intellectual property, limitation of liability, dispute resolution and applicable law."
    ]
  },
  {
    "h": "19. GOVERNING LAW AND DISPUTE RESOLUTION",
    "body": [
      "This Agreement shall be governed by the laws applicable in India, subject to any mandatory statutory or regulatory requirements. The Parties shall first attempt to resolve disputes through good-faith discussion. If the dispute cannot be resolved amicably, it shall be submitted to the competent courts/tribunals having jurisdiction as agreed or required by applicable law."
    ]
  },
  {
    "h": "20. AMENDMENT",
    "body": [
      "Any material amendment to this Agreement shall be made in writing or through an electronically recorded acceptance mechanism where legally valid. Updated terms may apply to future use of the Platform as permitted by applicable law."
    ]
  },
  {
    "h": "21. ENTIRE UNDERSTANDING",
    "body": [
      "This Agreement, together with any applicable GramIntel terms of service, privacy policy and separate financing documents, constitutes the understanding between the Parties concerning the Applicant’s use of the Platform, to the extent permitted by applicable law."
    ]
  },
  {
    "h": "22. DECLARATION AND ACCEPTANCE",
    "body": [
      "The Applicant confirms that the Applicant has read and understood this Agreement and agrees to the terms stated herein. The Applicant further understands that GramIntel’s software-generated feasibility and financial outputs are advisory/indicative and do not themselves constitute a financing sanction.",
      "IN WITNESS WHEREOF, the Parties have accepted this Agreement on the date and place first written above.",
      "Witness 1: __________________________    Signature: __________________________",
      "Witness 2: __________________________    Signature: __________________________"
    ]
  },
  {
    "h": "IMPORTANT LEGAL NOTE",
    "body": [
      "This template is designed for a GramIntel software/project context and is not a substitute for legal advice. Before using it with real applicants, lenders, government schemes or financial institutions, have an advocate or other appropriately qualified legal professional review the document, especially the provisions on data protection, electronic consent, liability, financing facilitation, consumer protection, sector-specific regulation, stamping, and enforceability."
    ]
  }
];
export const LEGAL_SIGN_TABLE: { left: string[]; right: string[] } = {
  "left": [
    "For GramIntel / Authorized Representative",
    "Signature: __________________________",
    "Name: ______________________________",
    "Date: ______________________________"
  ],
  "right": [
    "Applicant",
    "Signature: __________________________",
    "Name: ______________________________",
    "Date: ______________________________"
  ]
};
