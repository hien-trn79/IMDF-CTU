import { createContext, useContext, useState, type ReactNode } from 'react'

export type ActiveView = 'map' | 'indoor-routes' | 'grid-lines'

interface NavigationContextType {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>('indoor-routes')

  return (
    <NavigationContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
