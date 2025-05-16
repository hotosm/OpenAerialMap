import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/'
);

import { ChakraProvider } from '@chakra-ui/react';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  // useQuery,
  // useMutation,
  // useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useStacCollections, useStacItems } from '$hooks/useStacCatalog';

import system from './styles/theme';
import MapComponent from './components/map';
import Sidebar from './components/sidebar';

// If using a router add the public url to the base path.
// const publicUrl = process.env.BASE_URL || '';

const queryClient = new QueryClient();

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <AppContent />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const {
    data: stacCollections,
    isLoading: isStacCollectionLoading,
    error: isStacCollectionsError
  } = useStacCollections();
  const availableCollections = stacCollections?.collections;
  const handleSelectCollection = (id: string) => {
    setSelectedCollection(id);
  };

  const {
    data: stacItems,
    isLoading: isStacItemsLoading,
    error: isStacItemsError
  } = useStacItems(selectedCollection);

  return (
    <>
      <Sidebar
        selectedCollection={selectedCollection}
        availableCollections={availableCollections}
        handleSelectCollection={handleSelectCollection}
        isStacCollectionLoading={isStacCollectionLoading}
        isStacCollectionsError={isStacCollectionsError}
        stacItems={stacItems}
        isStacItemsLoading={isStacItemsLoading}
        isStacItemsError={isStacItemsError}
        onSelectionChange={setSelectedItems}
      />
      <MapComponent
        selectedCollection={selectedCollection}
        selectedItems={selectedItems}
      />
    </>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
