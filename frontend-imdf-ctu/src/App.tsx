import './App.css'
import Page from './components/layout/Page'
import PageSignIn from './components/account/PageSignIn'
import PageIndoors from './components/indoors/PageIndoors'
import PageMap from './components/map/PageMap'
import PageOutdoor from './components/outdoors/PageOutdoor'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AccountDetail from './components/account/AccountDetail'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route element={<Page />}>
            <Route index element={<Navigate to="/indoors" replace />} />
            <Route path="indoors" element={<PageOutdoor />} />
            <Route path="route" element={<PageIndoors />} />
            <Route path="map" element={<PageMap />} />
            <Route path="me" element={<AccountDetail />} />
          </Route>
          <Route path="signin" element={<PageSignIn />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
