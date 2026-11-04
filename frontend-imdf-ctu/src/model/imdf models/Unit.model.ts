export interface UnitRequestPayload {
  unitName: string
  geometry: GeoJSON.Geometry
  displayPoint: GeoJSON.Geometry
  featureId: number | null
  levelId: number
  unitCategoryId: number
  restrictionCategoryId: number
}

export interface UnitCategoriesResponse {
  id: number
  unitCategoryName: string
  unitCategoryVietnameseName: string
}
