import './App.css'
import Page from './components/layout/Page'
import PageSignIn from './components/account/PageSignIn'
import PageMap from './components/map/PageMap'
import PageOutdoor from './components/outdoors/PageOutdoor'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import PageAccount from './components/account/PageAccount'
import AuthSessionGuard from './components/auth/AuthSessionGuard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PageIndoors from './components/indoors/PageIndoors'

function App() {
  return (
    <BrowserRouter>
      <AuthSessionGuard />
      <div className="min-h-screen">
        <Routes>
          <Route element={<Page />}>
            <Route index element={<Navigate to="/map" replace />} />
            <Route path="map" element={<PageMap />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="indoor" element={<PageOutdoor />} />
                <Route path="route" element={<PageIndoors />} />
              </Route>
              <Route path="account" element={<PageAccount />} />
            </Route>
          </Route>
          <Route path="signin" element={<PageSignIn />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
