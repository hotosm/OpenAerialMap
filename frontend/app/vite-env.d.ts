/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_STAC_CATALOG_API_URL: string;
  // more env vars...
}
