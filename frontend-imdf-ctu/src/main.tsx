import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LayerProvider } from './context/LayerContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LayerProvider>
      <App />
    </LayerProvider>
  </StrictMode>
)
