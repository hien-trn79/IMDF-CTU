const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character] ?? character
  )

const getTypeName = (layerName: string) => layerName.split(':').pop() ?? layerName

const geometryToGml = (geometry: any) => {
  if (!geometry) return ''
  const coordinates = (points: number[][]) =>
    points.map(([longitude, latitude]) => `${longitude},${latitude}`).join(' ')
  if (geometry.type === 'Point') {
    return `<gml:Point srsName="EPSG:4326"><gml:coordinates>${geometry.coordinates[0]},${geometry.coordinates[1]}</gml:coordinates></gml:Point>`
  }
  if (geometry.type === 'LineString') {
    return `<gml:LineString srsName="EPSG:4326"><gml:coordinates>${coordinates(geometry.coordinates)}</gml:coordinates></gml:LineString>`
  }
  if (geometry.type === 'Polygon') {
    return `<gml:Polygon srsName="EPSG:4326"><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>${coordinates(geometry.coordinates[0])}</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon>`
  }
  throw new Error(`Chưa hỗ trợ hình học ${geometry.type} trong WFS-T`)
}

const transaction = async (body: string, geoServerUrl: string) => {
  const response = await fetch(`${geoServerUrl}/wfs`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
    body,
  })
  if (!response.ok) throw new Error(`GeoServer WFS-T HTTP ${response.status}`)
  const result = await response.text()
  if (/<(?:ows:)?Exception|<ServiceException/i.test(result)) {
    throw new Error('GeoServer từ chối giao dịch WFS-T hoặc dữ liệu không hợp lệ')
  }
}

export const deleteFeature = (layerName: string, featureId: string, geoServerUrl: string) =>
  transaction(
    `<wfs:Transaction service="WFS" version="1.1.0" xmlns:wfs="http://www.opengis.net/wfs"><wfs:Delete typeName="${escapeXml(layerName)}"><ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:FeatureId fid="${escapeXml(featureId)}"/></ogc:Filter></wfs:Delete></wfs:Transaction>`,
    geoServerUrl
  )

export const insertFeature = (
  layerName: string,
  feature: { geometry: any; properties: Record<string, unknown> },
  geoServerUrl: string
) => {
  const typeName = getTypeName(layerName)
  const properties = Object.entries(feature.properties)
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `<imdf:${escapeXml(key)}>${escapeXml(String(value))}</imdf:${escapeXml(key)}>`
    )
    .join('')
  return transaction(
    `<wfs:Transaction service="WFS" version="1.1.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:imdf="http://imdf_ctu"><wfs:Insert><imdf:${escapeXml(typeName)}>${properties}<imdf:the_geom>${geometryToGml(feature.geometry)}</imdf:the_geom></imdf:${escapeXml(typeName)}></wfs:Insert></wfs:Transaction>`,
    geoServerUrl
  )
}

export const updateFeature = (
  layerName: string,
  featureId: string,
  properties: Record<string, unknown>,
  geoServerUrl: string
) => {
  const typeName = getTypeName(layerName)
  const values = Object.entries(properties)
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `<wfs:Property><wfs:Name>${escapeXml(key)}</wfs:Name><wfs:Value>${escapeXml(String(value))}</wfs:Value></wfs:Property>`
    )
    .join('')
  return transaction(
    `<wfs:Transaction service="WFS" version="1.1.0" xmlns:wfs="http://www.opengis.net/wfs"><wfs:Update typeName="${escapeXml(layerName)}">${values}<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:FeatureId fid="${escapeXml(featureId)}"/></ogc:Filter></wfs:Update></wfs:Transaction>`,
    geoServerUrl
  )
}
