import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/'
);

import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  // useQuery,
  // useMutation,
  // useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import system from './styles/theme';
import MapComponent from './components/map';
import Sidebar from './components/sidebar';
import { StacProvider } from './context/StacContext';

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
  return (
    <StacProvider>
      <Sidebar />
      <MapComponent />
    </StacProvider>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
