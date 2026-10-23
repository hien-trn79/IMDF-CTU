import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LayerProvider } from './context/LayerContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { MapNavigationProvider } from './context/MapNavigationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <LayerProvider>
        <MapNavigationProvider>
          <App />
        </MapNavigationProvider>
      </LayerProvider>
    </UserProvider>
  </StrictMode>
)
