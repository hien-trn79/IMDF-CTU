export interface AddressResponse {
  id: number
  addressId: string
  address: string
  unit: string
  locality: string
  province: string
  country: string
  postalCode: string
  postalCodeExtension: string
  postalCodeVanity: string
  featureId: number
}

export interface AddressRequest {
  address: string
  unit: string
  locality: string
  province: string
  country: string
  postalCode: string
  postalCodeExtension: string
  postalCodeVanity: string
  featureId: number
}
