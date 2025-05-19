/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_STAC_API_URL: string;
  readonly VITE_STAC_API_PATHNAME: string;
  readonly VITE_STAC_TILER_PATHNAME: string;
  readonly VITE_STAC_ITEMS_LIMIT: string;
  // more env vars...
}
