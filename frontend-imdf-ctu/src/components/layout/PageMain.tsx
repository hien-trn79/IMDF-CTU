import { useNavigation } from '../../context/NavigationContext'
import PageMap from '../map/PageMap'
import PageOutdoor from '../outdoors/PageOutdoor'

export default function PageMain() {
  // Lay active View hien tai
  const { activeView } = useNavigation()
  return (
    <main className="page-main w-full  p-2 flex flex-col gap-2">
      {/* MAP LAYOUT */}
      {activeView === 'Map' && <PageMap />}

      {/* OUTDOOR LAYOUT  */}
      {activeView === 'Outdoors' && <PageOutdoor />}
    </main>
  )
}