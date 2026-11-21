import './App.css'
import Page from './components/layout/Page'
import PageSignIn from './components/account/PageSignIn'
import PageMap from './components/map/PageMap'
import PageOutdoor from './components/outdoors/PageOutdoor'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AuthSessionGuard from './components/auth/AuthSessionGuard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PageIndoors from './components/indoors/PageIndoors'
import PageDashboard from './components/dashboard/PageDashboard'
import DashboardMain from './components/dashboard/DashboardMain'
import DashboardVenue from './components/dashboard/venue/DashboardVenue'
import DashboardBuilding from './components/dashboard/building/DashboardBuilding'
import DashboardAddress from './components/dashboard/address/DashboardAddress'
import DashboardCategory from './components/dashboard/categoryItems/DashboardCategory'
import DashboardTopology from './components/dashboard/topology/DashboardTopology'

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
                <Route path="dashboard" element={<PageDashboard />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<DashboardMain />} />

                  <Route path="space/venue" element={<DashboardVenue />} />
                  <Route path="space/building" element={<DashboardBuilding />} />
                  <Route path="space/address" element={<DashboardAddress />} />

                  <Route path="route/indoor" element={<DashboardTopology />} />

                  <Route
                    path="category"
                    element={<Navigate to="/dashboard/category/venue" replace />}
                  />
                  <Route path="category/:tab" element={<DashboardCategory />} />
                </Route>
              </Route>

              {/* <Route path="account" element={<PageAccount />} /> */}
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
