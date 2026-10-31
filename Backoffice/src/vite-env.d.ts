/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'prism' | 'http';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PRISM_BASE_URL?: string;
  readonly VITE_MOCK_LATENCY_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
