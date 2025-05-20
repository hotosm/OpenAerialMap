import { useQuery } from '@tanstack/react-query';
import { type StacCatalog, type StacCollection } from 'stac-ts';
import { StacFeatureCollection, StacQueryables } from '../types/stac';
import { StacItemFilter } from '../context/StacContext';

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
    queryFn: async () => {
      const response = await fetch(STAC_API_PATH);
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
      const response = await fetch(`${STAC_API_PATH}/collections`);
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
export function useStacItems(
  collection: string | undefined,
  filters: StacItemFilter
) {
  return useQuery<StacFeatureCollection>({
    queryKey: ['stacItems', collection, filters],
    queryFn: async () => {
      let stacItemsFetchURL = `${STAC_API_PATH}/collections/${collection}/items?limit=${STAC_ITEMS_LIMIT}`;
      let hasQueryParams = false;
      if (
        filters.dateFilter &&
        filters.dateFilter.startDate &&
        filters.dateFilter.endDate
      ) {
        const datetimeValue = `${new Date(filters.dateFilter.startDate).toISOString()}/${new Date(filters.dateFilter.endDate).toISOString()}`;
        stacItemsFetchURL += `?datetime=${encodeURIComponent(datetimeValue)}`;
        hasQueryParams = true;
      }
      if (filters.itemIdFilter && filters.itemIdFilter.itemId) {
        // Add CQL2 text filter for item ID
        const connector = hasQueryParams ? '&' : '?';
        stacItemsFetchURL += `${connector}filter-lang=cql2-text&filter=${encodeURIComponent(`id = '${filters.itemIdFilter.itemId}'`)}`;
      }
      const response = await fetch(stacItemsFetchURL);
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
  return useQuery<StacQueryables>({
    queryKey: ['stacQueryables', collection],
    queryFn: async () => {
      const response = await fetch(
        `${STAC_API_PATH}/collections/${collection}/queryables`
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
