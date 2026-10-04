import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import { wkbHexToPoint } from '../../utils/wkbParser'
import { wkbHexToLineString } from '../../utils/wkbParser'

interface NetworkOverlayProps {
  nodes: NetworkNodeResponse[]
  edges: NetworkEdgeResponse[]
  selectedNodeId: number | null
  selectedEdgeId: number | null
  onNodeClick: (node: NetworkNodeResponse) => void
  onEdgeClick: (edge: NetworkEdgeResponse) => void
  visible: boolean
}

export default function NetworkOverlay({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onNodeClick,
  onEdgeClick,
  visible,
}: NetworkOverlayProps) {
  const map = useMap()
  const nodeLayerRef = useRef<L.LayerGroup | null>(null)
  const edgeLayerRef = useRef<L.LayerGroup | null>(null)

  // Init layer groups once
  useEffect(() => {
    nodeLayerRef.current = L.layerGroup().addTo(map)
    edgeLayerRef.current = L.layerGroup().addTo(map)
    return () => {
      nodeLayerRef.current?.remove()
      edgeLayerRef.current?.remove()
    }
  }, [map])

  // Render edges
  useEffect(() => {
    const group = edgeLayerRef.current
    if (!group) return
    group.clearLayers()
    if (!visible) return

    edges.forEach((edge) => {
      const coords = wkbHexToLineString(edge.geometry)
      if (coords.length < 2) return

      // Leaflet dùng [lat, lng]
      const latlngs = coords.map(([lng, lat]) => [lat, lng] as [number, number])
      const isSelected = edge.id === selectedEdgeId

      const polyline = L.polyline(latlngs, {
        color: isSelected ? '#f97316' : '#6366f1',
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 1 : 0.75,
        dashArray: isSelected ? undefined : '6 3',
        interactive: true,
      })

      polyline.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        onEdgeClick(edge)
      })

      polyline.on('mouseover', () => {
        polyline.setStyle({ weight: 5, opacity: 1, dashArray: undefined })
      })
      polyline.on('mouseout', () => {
        if (edge.id !== selectedEdgeId) {
          polyline.setStyle({ weight: 3, opacity: 0.75, dashArray: '6 3' })
        }
      })

      polyline.bindTooltip(
        `Edge #${edge.id} | ${edge.source}→${edge.target} | cost: ${edge.cost}`,
        { sticky: true, className: 'text-xs' }
      )

      group.addLayer(polyline)
    })
  }, [edges, selectedEdgeId, visible, onEdgeClick])

  // Render nodes
  useEffect(() => {
    const group = nodeLayerRef.current
    if (!group) return
    group.clearLayers()
    if (!visible) return

    nodes.forEach((node) => {
      const coords = wkbHexToPoint(node.geom)
      if (!coords) return

      const [lng, lat] = coords
      const isSelected = node.id === selectedNodeId

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 10 : 6,
        color: isSelected ? '#f97316' : node.isConnector ? '#2563eb' : '#10b981',
        fillColor: isSelected ? '#fed7aa' : node.isConnector ? '#bfdbfe' : '#a7f3d0',
        fillOpacity: isSelected ? 1 : 0.85,
        weight: isSelected ? 3 : 2,
        interactive: true,
      })

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        onNodeClick(node)
      })

      marker.on('mouseover', () => {
        marker.setStyle({ radius: 10, weight: 3 })
      })
      marker.on('mouseout', () => {
        if (node.id !== selectedNodeId) {
          marker.setStyle({ radius: 6, weight: 2 })
        }
      })

      marker.bindTooltip(
        `Node #${node.id} | ${node.isConnector ? 'Connector' : 'Thường'} | Route: ${node.indoorRouteName}`,
        { sticky: true, className: 'text-xs' }
      )

      group.addLayer(marker)
    })
  }, [nodes, selectedNodeId, visible, onNodeClick])

  return null
}
