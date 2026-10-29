import { useEffect, useState } from 'react'
import { WMSTileLayer, GeoJSON } from 'react-leaflet'
import type { ActiveLayerConfig } from './PublishedLayersManager'

interface GeoServerLayersRendererProps {
  activeLayers: Record<number, ActiveLayerConfig>
  selectedLevelId?: number
}

export default function GeoServerLayersRenderer({
  activeLayers,
  selectedLevelId,
}: GeoServerLayersRendererProps) {
  const [wfsData, setWfsData] = useState<Record<number, any>>({})

  // Fetch WFS GeoJSON cho các layers đang chọn chế độ WFS và visible
  useEffect(() => {
    let cancelled = false
    const visibleWfsLayers = Object.values(activeLayers).filter(
      (cfg) => cfg.visible && cfg.renderMode === 'WFS'
    )

    setWfsData((current) => {
      const visibleIds = new Set(visibleWfsLayers.map((cfg) => String(cfg.layer.layerId)))
      const entries = Object.entries(current).filter(([layerId]) => visibleIds.has(layerId))
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries)
    })

    visibleWfsLayers.forEach(async (cfg) => {
      if (!wfsData[cfg.layer.layerId]) {
        try {
          const workspace = cfg.layer.workspace || 'imdf_ctu'
          const layerName = cfg.layer.layerName
          const cqlFilter = selectedLevelId ? `&cql_filter=level_id=${selectedLevelId}` : ''
          const url = `/geoserver/${workspace}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${layerName}&outputFormat=application/json${cqlFilter}`

          const res = await fetch(url)
          if (res.ok) {
            const json = await res.json()
            if (!cancelled) {
              setWfsData((prev) => ({ ...prev, [cfg.layer.layerId]: json }))
            }
          }
        } catch (err) {
          console.warn('Không thể load WFS layer:', cfg.layer.layerName, err)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeLayers, selectedLevelId, wfsData])

  return (
    <>
      {Object.values(activeLayers).map((cfg) => {
        if (!cfg.visible) return null

        const { layer, renderMode, opacity } = cfg
        const workspace = layer.workspace || 'imdf_ctu'
        const fullLayerName = `${workspace}:${layer.layerName}`

        // 1. RENDER WMS
        if (renderMode === 'WMS') {
          const wmsUrl = layer.wmsUrl || `/geoserver/${workspace}/wms`
          const cqlFilter = selectedLevelId ? `level_id=${selectedLevelId}` : undefined

          return (
            <WMSTileLayer
              key={`wms-${layer.layerId}-${selectedLevelId}`}
              url={wmsUrl}
              opacity={opacity}
              params={
                {
                  layers: fullLayerName,
                  format: 'image/png',
                  transparent: true,
                  version: '1.1.1',
                  cql_filter: cqlFilter,
                  styles: layer.styleName || '',
                } as any
              }
            />
          )
        }

        // 2. RENDER WFS (Vector GeoJSON)
        if (renderMode === 'WFS') {
          const data = wfsData[layer.layerId]
          if (!data) return null

          return (
            <GeoJSON
              key={`wfs-${layer.layerId}-${selectedLevelId}`}
              data={data}
              style={{
                color: '#2563eb',
                weight: 2,
                opacity: opacity,
                fillColor: '#3b82f6',
                fillOpacity: opacity * 0.35,
              }}
              onEachFeature={(feature, leafletLayer) => {
                const name =
                  feature.properties?.name ||
                  feature.properties?.unit_name ||
                  feature.id ||
                  'Đối tượng'
                leafletLayer.bindTooltip(`[WFS] ${name}`, {
                  sticky: true,
                  className: 'bg-slate-900 text-white text-xs px-2 py-0.5 rounded shadow',
                })
              }}
            />
          )
        }

        // 3. RENDER MVT (Vector Tile URL)
        if (renderMode === 'MVT') {
          // Với Leaflet chuẩn, có thể hiển thị dưới dạng Grid/Tile WMS có format pbf hoặc proxy fallback
          return (
            <WMSTileLayer
              key={`mvt-${layer.layerId}`}
              url={`/geoserver/${workspace}/wms`}
              opacity={opacity}
              params={
                {
                  layers: fullLayerName,
                  format: 'image/png',
                  transparent: true,
                  opacity: opacity,
                } as any
              }
            />
          )
        }

        return null
      })}
    </>
  )
}
