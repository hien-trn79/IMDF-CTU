import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import { parseWKBHexToCoords } from '../../utils/wkbUtils'
import { wkbHexToPoint } from '../../utils/wkbParser'

interface TopologyLayersProps {
  edges: NetworkEdgeResponse[]
  nodes: NetworkNodeResponse[]
  showNodes?: boolean
  showEdges?: boolean
  onSelectNode?: (node: NetworkNodeResponse) => void
  onSelectEdge?: (edge: NetworkEdgeResponse) => void
}

export default function TopologyLayers({
  edges,
  nodes,
  showNodes = true,
  showEdges = true,
  onSelectNode,
  onSelectEdge,
}: TopologyLayersProps) {
  const map = useMap()

  useEffect(() => {
    const layerGroup = L.layerGroup().addTo(map)

    if (showEdges) {
      edges.forEach((edge) => {
        const coords = parseWKBHexToCoords(edge.geometry)
        if (coords.length < 2) return
        const polyline = L.polyline(
          coords.map(([lng, lat]) => [lat, lng] as L.LatLngExpression),
          { color: '#7c3aed', weight: 2, opacity: 0.8, interactive: !!onSelectEdge }
        ).bindTooltip(
          `Edge ${edge.id}: ${edge.source} → ${edge.target} | Route: ${edge.indoorRouteName ?? edge.indoorRouteId}`
        )
        if (onSelectEdge) {
          polyline.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e)
            onSelectEdge(edge)
          })
        }
        polyline.addTo(layerGroup)
      })
    }

    if (showNodes) {
      nodes.forEach((node) => {
        const point = wkbHexToPoint(node.geom)
        if (!point) return
        const marker = L.circleMarker([point[1], point[0]], {
          radius: 5,
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 1,
          weight: 1.5,
          interactive: !!onSelectNode,
        }).bindTooltip(
          `Node ${node.id} | Connector: ${node.isConnector ? 'Có' : 'Không'} | Route: ${node.indoorRouteName ?? node.indoorRouteId}`
        )
        if (onSelectNode) {
          marker.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e)
            onSelectNode(node)
          })
        }
        marker.addTo(layerGroup)
      })
    }

    return () => {
      layerGroup.remove()
    }
  }, [edges, map, nodes, showNodes, showEdges, onSelectNode, onSelectEdge])

  return null
}

