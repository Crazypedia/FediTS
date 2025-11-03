/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_VIRUSTOTAL_API_KEY?: string;
  readonly VITE_PHISHTANK_API_KEY?: string;
  readonly VITE_ALIENVAULT_API_KEY?: string;
  readonly VITE_SECURITYTRAILS_API_KEY?: string;
  readonly VITE_IPQS_API_KEY?: string;
  readonly VITE_ABUSEIPDB_API_KEY?: string;
  readonly VITE_PRIVACY_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
