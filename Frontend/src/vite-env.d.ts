/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de l'API FastAPI (phase backend). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
