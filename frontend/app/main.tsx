import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/'
);

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  // useQuery,
  // useMutation,
  // useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import MapComponent from './components/map';
import Sidebar from './components/sidebar';
import { StacProvider } from './context/StacContext';
import Detail from '$components/detail';

// If using a router add the public url to the base path.
// const publicUrl = process.env.BASE_URL || '';

const queryClient = new QueryClient();

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const [showDetailPane, setShowDetailPane] = useState(false);
  return (
    <StacProvider>
      <Sidebar
        isDetailPaneShown={showDetailPane}
        setShowDetailPane={setShowDetailPane}
      />
      <Detail
        isDetailPaneShown={showDetailPane}
        setShowDetailPane={setShowDetailPane}
      />
      <MapComponent />
    </StacProvider>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
