import BaseMap from './BaseMap'
import IndoorRouteManagement from '../indoor-route/IndoorRouteManagement'
import GridLineManagement from '../grid-line/GridLineManagement'
import NetworkNodeManagement from '../network-node/NetworkNodeManagement'
import { useNavigation } from '../../context/NavigationContext'

export default function Content() {
  const { activeView } = useNavigation()

  return (
    <div className="main-content min-h-0 overflow-hidden rounded-2xl border border-sky-500 bg-white flex flex-col shadow-sm">
      {activeView === 'indoor-routes' && <IndoorRouteManagement />}
      {activeView === 'grid-lines' && <GridLineManagement />}
      {activeView === 'map' && <BaseMap />}
      {activeView === 'network' && <NetworkNodeManagement />}
    </div>
  )
}

