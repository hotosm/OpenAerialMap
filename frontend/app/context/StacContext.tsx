import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StacCollection } from 'stac-ts';
import { StacFeatureCollection } from '../types/stac';
import {
  useStacCollections,
  useStacItems,
  useStacQueryables
} from '../hooks/useStacCatalog';

interface StacContextType {
  selectedCollection?: string;
  availableCollections?: StacCollection[];
  stacItems?: StacFeatureCollection;

  isStacCollectionLoading: boolean;
  isStacCollectionsError: Error | null;
  isStacItemsLoading: boolean;
  isStacItemsError: Error | null;
  isStacQueryablesLoading: boolean;
  isStacQueryablesError: Error | null;

  handleSelectCollection: (id: string) => void;

  // additional data
  stacQueryables?: any;
}

const StacContext = createContext<StacContextType | undefined>(undefined);

interface StacProviderProps {
  children: ReactNode;
}

export function StacProvider({ children }: StacProviderProps) {
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >();

  const {
    data: stacCollections,
    isLoading: isStacCollectionLoading,
    error: isStacCollectionsError
  } = useStacCollections();

  const {
    data: stacItems,
    isLoading: isStacItemsLoading,
    error: isStacItemsError
  } = useStacItems(selectedCollection);

  const {
    data: stacQueryables,
    isLoading: isStacQueryablesLoading,
    error: isStacQueryablesError
  } = useStacQueryables(selectedCollection);

  const handleSelectCollection = (id: string) => {
    setSelectedCollection(id);
  };

  const value = {
    selectedCollection,
    availableCollections: stacCollections?.collections,
    stacItems,

    isStacCollectionLoading,
    isStacCollectionsError,
    isStacItemsLoading,
    isStacItemsError,
    isStacQueryablesLoading,
    isStacQueryablesError,

    handleSelectCollection,

    stacQueryables
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
