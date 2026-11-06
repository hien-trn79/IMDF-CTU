import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { NetworkEdgeItem } from '../../model/route models/NetworkEdge.model'
import type { NetworkNodeItem } from '../../model/route models/NetworkNode.model'

interface TopologyLayersProps {
  edges: NetworkEdgeItem[]
  nodes: NetworkNodeItem[]
  showNodes?: boolean
  showEdges?: boolean
  onSelectNode?: (node: NetworkNodeItem) => void
  onSelectEdge?: (edge: NetworkEdgeItem) => void
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
        const polyline = L.geoJSON(edge, {
          style: { color: '#7c3aed', weight: 2, opacity: 0.8 },
          interactive: !!onSelectEdge,
        }).bindTooltip(
          `Edge ${edge.id}: ${edge.properties.sourceNode} → ${edge.properties.targetNode} | Route: ${edge.properties.routeName}`
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
        const [lng, lat] = node.geometry.coordinates
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 1,
          weight: 1.5,
          interactive: !!onSelectNode,
        }).bindTooltip(
          `Node ${node.id} | Connector: ${node.properties.isConnector ? 'Có' : 'Không'} | Route: ${node.properties.routeName}`
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
