# Security Policy

## Supported Versions

Only the latest version on the `main` branch is actively maintained with security patches.

| Version | Supported          |
| ------- | ------------------ |
| Latest (`main`) | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Lexora, please **do not** open a public issue. Public disclosure exposes users before a fix can be verified.

Instead, please report vulnerabilities via **GitHub Private Vulnerability Reporting**:
1. Navigate to the repository's [Security Advisories](https://github.com/SFRREX/lexora/security/advisories) tab.
2. Click **Report a vulnerability** to submit your advisory privately to the maintainers.

Please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal proof of concept.
- Affected endpoints, components, or dependencies.

We will acknowledge receipt within 48 hours, investigate promptly, and release a coordinated advisory and patch.

## Security Architecture & Practices

### 1. Zero Client-Side Secrets
- External provider credentials (`GEMINI_API_KEY`, `GPTZERO_API_KEY`, `COPYLEAKS_API_KEY`, `COPYLEAKS_EMAIL`) are stored strictly in server-side environment variables and are never prefixed with `VITE_` or bundled into client assets.
- In development, the Vite proxy middleware (`server/vitePluginGemini.js`) handles upstream authentication without exposing keys to the browser.
- In production, serverless endpoints (`api/`) execute in Node.js environments and handle API calls securely.

### 2. Payload & Resource Guardrails
- **Payload Size Limits:** Upstream request bodies are capped at 2MB with immediate stream termination to prevent denial-of-service (DoS) via unbounded buffers.
- **Error Sanitization:** Outbound API errors are sanitized via regular expressions to strip Google API keys, Bearer tokens, query parameters, and sensitive upstream trace details before reaching the client.

### 3. External Links & DOM Insertion
- External citations and bibliography links strictly specify `rel="noopener noreferrer"` and `target="_blank"`.
- Text rendering relies on React's standard escaping; no untrusted HTML or dynamic `eval` is executed in the application.

### 4. Dependency Auditing
- Dependencies are continuously audited using `npm audit`.
- The CI pipeline runs `npm audit --audit-level=high` on every push and pull request.
