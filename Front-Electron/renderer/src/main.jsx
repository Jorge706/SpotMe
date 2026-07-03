import React,{ StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import 'leaflet/dist/leaflet.css';

import { LoaderProvider, useLoader } from './context/LoaderContext';
import App from './App.jsx'

function GlobalLoaderRegistrar() {
  const { setLoading } = useLoader();
  React.useEffect(() => {
    window.setGlobalLoader = setLoading;
  }, [setLoading]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoaderProvider>
      <GlobalLoaderRegistrar />
      <App />
    </LoaderProvider>
  </StrictMode>
);
