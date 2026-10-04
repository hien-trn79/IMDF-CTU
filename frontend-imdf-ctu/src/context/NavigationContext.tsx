import { createContext, useContext, useState, type ReactNode } from 'react'

export type ActiveView = 'Map' | 'Indoors' | 'Outdoors'

interface NavigationContextType {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>('Map')

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
