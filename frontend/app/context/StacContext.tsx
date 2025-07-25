import { createContext, ReactNode, useContext, useState } from 'react';
import { StacCollection } from 'stac-ts';
import {
  useStacCollections,
  useStacItems,
  useStacQueryables
} from '../hooks/useStacCatalog';
import { StacFeatureCollection, StacQueryables } from '../types/stac';

export interface DateFilter {
  startDate: string | undefined;
  endDate: string | undefined;
}

export interface ItemIdFilter {
  itemId: string | undefined;
}

export type StacItemFilter = {
  itemIdFilter: ItemIdFilter;
  dateFilter: DateFilter;
};

interface StacContextType {
  selectedCollection?: string;
  availableCollections?: StacCollection[];
  stacItems?: StacFeatureCollection;
  selectedItem: string | undefined;

  isStacCollectionLoading: boolean;
  isStacCollectionsError: Error | null;
  isStacItemsLoading: boolean;
  isStacItemsError: Error | null;
  isStacQueryablesLoading: boolean;
  isStacQueryablesError: Error | null;

  handleSelectCollection: (id: string) => void;
  handleSelectQueryable: (id: string) => void;
  handleSetFilter: (filters: StacItemFilter) => void;
  setSelectedItem: (items: string) => void;

  stacQueryables?: StacQueryables;
  filters: StacItemFilter;

  bbox: number[];
  setBbox: (bbox: number[]) => void;
}

const StacContext = createContext<StacContextType | undefined>(undefined);

interface StacProviderProps {
  children: ReactNode;
}

export function StacProvider({ children }: StacProviderProps) {
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >();
  const [selectedQueryable, setSelectedQueryable] = useState<
    string | undefined
  >();
  const [selectedItem, setSelectedItem] = useState<string>();
  const [filters, setFilters] = useState<{
    itemIdFilter: ItemIdFilter;
    dateFilter: DateFilter;
  }>({
    itemIdFilter: { itemId: undefined },
    dateFilter: { startDate: undefined, endDate: undefined }
  });
  const [bbox, setBbox] = useState<number[]>([-180, -90, 180, 90]);

  const {
    data: stacCollections,
    isLoading: isStacCollectionLoading,
    error: isStacCollectionsError
  } = useStacCollections();

  const {
    data: stacItems,
    isLoading: isStacItemsLoading,
    error: isStacItemsError
  } = useStacItems(selectedCollection, filters, bbox);

  const {
    data: stacQueryables,
    isLoading: isStacQueryablesLoading,
    error: isStacQueryablesError
  } = useStacQueryables(selectedCollection);

  const handleSelectCollection = (id: string) => {
    setSelectedCollection(id);
  };
  const handleSelectQueryable = (id: string) => {
    setSelectedQueryable(id);
  };

  const handleSetFilter = (filters: StacItemFilter) => setFilters(filters);

  const value = {
    selectedCollection,
    availableCollections: stacCollections?.collections,
    stacItems,

    isStacCollectionLoading,
    isStacCollectionsError,
    isStacItemsLoading,
    isStacItemsError,

    stacQueryables,
    selectedQueryable,
    isStacQueryablesLoading,
    isStacQueryablesError,

    filters,
    selectedItem,

    handleSelectCollection,
    handleSelectQueryable,
    handleSetFilter,
    setSelectedItem,

    bbox,
    setBbox
  };

  return <StacContext.Provider value={value}>{children}</StacContext.Provider>;
}

export function useStac() {
  const context = useContext(StacContext);
  if (context === undefined) {
    throw new Error('useStac must be used within a StacProvider');
  }
  return context;
}
