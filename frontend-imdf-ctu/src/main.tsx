import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LayerProvider } from './context/LayerContext.tsx'
import { NavigationProvider } from './context/NavigationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LayerProvider>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </LayerProvider>
  </StrictMode>
)
