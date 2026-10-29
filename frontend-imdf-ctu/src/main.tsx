import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LayerProvider } from './context/LayerContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { MapNavigationProvider } from './context/MapNavigationContext.tsx'
import { LevelProvider } from './context/LevelContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <LayerProvider>
        <LevelProvider>
          <MapNavigationProvider>
            <App />
          </MapNavigationProvider>
        </LevelProvider>
      </LayerProvider>
    </UserProvider>
  </StrictMode>
)
