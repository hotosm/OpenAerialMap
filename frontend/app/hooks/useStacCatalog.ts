import { useQuery } from '@tanstack/react-query';
import { type StacCatalog, type StacCollection } from 'stac-ts';
import { StacFeatureCollection } from '../types/stac';
import { useQuery } from '@tanstack/react-query';
import { type StacCatalog, type StacCollection } from 'stac-ts';
import { StacFeatureCollection } from '../types/stac';

const STAC_API = import.meta.env.VITE_STAC_API_URL;
const STAC_PATH = import.meta.env.VITE_STAC_API_PATHNAME;
const RASTER_PATH = import.meta.env.VITE_STAC_TILER_PATHNAME;
const STAC_API_PATH = `${STAC_API}/${STAC_PATH}`;
export const RASTER_API_PATH = `${STAC_API}/${RASTER_PATH}`;
const STAC_ITEMS_LIMIT = import.meta.env.VITE_STAC_ITEMS_LIMIT;
/**
 * Fetches STAC catalog data from the provided endpoint
 */
export function useStacCatalog() {
  return useQuery<StacCatalog>({
    queryKey: ['stacCatalog'],
    queryKey: ['stacCatalog'],
    queryFn: async () => {
      const response = await fetch(STAC_API_PATH);
      if (!response.ok) {
        throw new Error(`Failed to fetch STAC catalog: ${response.statusText}`);
      }
      return response.json();
    }
    }
  });
}

export function useStacCollections() {
  return useQuery<StacCollection & { collections: StacCollection[] }>({
    queryKey: ['stacCollections'],
    queryKey: ['stacCollections'],
    queryFn: async () => {
      const response = await fetch(`${STAC_API_PATH}/collections`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch STAC collections: ${response.statusText}`
          `Failed to fetch STAC collections: ${response.statusText}`
        );
      }
      return response.json();
    }
    }
  });
}

/**
 * @param collection The STAC collection ID
 */
export function useStacItems(collection: string | undefined) {
  return useQuery<StacFeatureCollection>({
    queryKey: ['stacItems', collection],
    queryKey: ['stacItems', collection],
    queryFn: async () => {
      const response = await fetch(
        `${STAC_API_PATH}/collections/${collection}/items?limit=${STAC_ITEMS_LIMIT}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch STAC items: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: collection !== undefined
    enabled: collection !== undefined
  });
}

/**
 * @param collection The STAC collection ID
 */
export function useStacQueryables(collection: string | undefined) {
  return useQuery({
    queryKey: ['stacQueryables', collection],
    queryKey: ['stacQueryables', collection],
    queryFn: async () => {
      const response = await fetch(
        `${STAC_API_PATH}/collections/${collection}/queryables`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch STAC queryables: ${response.statusText}`
          `Failed to fetch STAC queryables: ${response.statusText}`
        );
      }
      return response.json();
    },
    enabled: collection !== undefined
    enabled: collection !== undefined
  });
}
