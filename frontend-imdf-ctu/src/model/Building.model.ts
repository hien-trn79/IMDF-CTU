export interface BuildingType {
  id: string
  geometry: {
    type: string
    coordinates: any[]
  }
  properties: {
    id: string
    building: string
    name: string
    'name:vi': string
  }
}
