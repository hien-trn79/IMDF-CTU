import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LayerProvider } from './context/LayerContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { LevelProvider } from './context/LevelContext.tsx'
import { NavigateProvider } from './context/NavigateContext.tsx'
import { DashboardContextProvider } from './context/DashboardContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <LayerProvider>
        <LevelProvider>
          <NavigateProvider>
            <DashboardContextProvider>
              <App />
            </DashboardContextProvider>
          </NavigateProvider>
        </LevelProvider>
      </LayerProvider>
    </UserProvider>
  </StrictMode>
)
