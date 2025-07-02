import '@hotosm/ui/dist/components/header/header.js';
import { allDefined } from '@awesome.me/webawesome/dist/webawesome.js';

import Detail from '$components/detail';
import {
  // useQuery,
  // useMutation,
  // useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import MapComponent from './components/map';
import Sidebar from './components/sidebar';
import { StacProvider } from './context/StacContext';

// If using a router add the public url to the base path.
// const publicUrl = process.env.BASE_URL || '';

// Ensure all WebAwesome components are loaded before rendering
await allDefined();

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
      <hot-header
        title="OpenAerialMap"
        logo="https://data.humdata.org/image/2018-05-02-135324.187483Hot_logo_with_text_300x125.png"
        showLogin
        osm-oauth-client-id="9qmECyRwBNFyqNl9LszwHX1WOxKFKeBsA5ofAS1GJGY"
        osm-oauth-redirect-uri="https://hotosm.github.io/openaerialmap/"
      ></hot-header>
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
