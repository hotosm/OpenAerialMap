import { useQuery } from '@tanstack/react-query';
import { type StacCatalog, type StacCollection } from 'stac-ts';
import { StacFeatureCollection } from '../types/stac';

const STAC_CATALOG_API_URL = import.meta.env.VITE_STAC_CATALOG_API_URL;

/**
 * Fetches STAC catalog data from the provided endpoint
 */
export function useStacCatalog() {
  return useQuery<StacCatalog>({
    queryKey: ['stacCatalog'],
    queryFn: async () => {
      const response = await fetch(STAC_CATALOG_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch STAC catalog: ${response.statusText}`);
      }
      return response.json();
    }
  });
}

export function useStacCollections() {
  return useQuery<StacCollection & { collections: StacCollection[] }>({
    queryKey: ['stacCollections'],
    queryFn: async () => {
      const response = await fetch(`${STAC_CATALOG_API_URL}/collections`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch STAC collections: ${response.statusText}`
        );
      }
      return response.json();
    }
  });
}

/**
 * @param collection The STAC collection ID
 */
export function useStacItems(collection: string | undefined) {
  return useQuery<StacFeatureCollection>({
    queryKey: ['stacItems', collection],
    queryFn: async () => {
      const response = await fetch(
        `${STAC_CATALOG_API_URL}/collections/${collection}/items`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch STAC items: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: collection !== undefined
  });
}

/**
 * @param collection The STAC collection ID
 */
export function useStacQueryables(collection: string | undefined) {
  return useQuery({
    queryKey: ['stacQueryables', collection],
    queryFn: async () => {
      const response = await fetch(
        `${STAC_CATALOG_API_URL}/collections/${collection}/queryables`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch STAC queryables: ${response.statusText}`
        );
      }
      return response.json();
    },
    enabled: collection !== undefined
  });
}
