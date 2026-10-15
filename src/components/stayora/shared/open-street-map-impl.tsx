'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icon paths for webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

;(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface MapProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    title?: string
    price?: string
    rating?: number
    coverImage?: string
    onClick?: (id: string) => void
  }>
  singleLocation?: {
    lat: number
    lng: number
    label?: string
  }
  className?: string
  height?: number | string
  scrollWheelZoom?: boolean
  /** Called when the user moves/zooms the map */
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number; center: [number, number]; zoom: number }) => void
  /** Whether to enable marker clustering for dense areas (default true) */
  enableClustering?: boolean
  /** Whether to show a "Search as I move the map" toggle button */
  showSearchAsMoveToggle?: boolean
  /** When true, fetch new listings on bounds change */
  searchAsMove?: boolean
  onSearchAsMoveChange?: (enabled: boolean) => void
}

// Simple grid-based clustering (no extra dependency)
function clusterMarkers(markers: MapProps['markers'], zoom: number) {
  if (!markers || markers.length === 0) return { clusters: [], singles: [] }
  // At zoom >= 13, show all as singles
  if (zoom >= 13) return { clusters: [], singles: markers }
  // Cluster precision scales with zoom
  const precision = zoom <= 3 ? 1 : zoom <= 6 ? 2 : zoom <= 9 ? 3 : 4
  const grid = new Map<string, { lat: number; lng: number; count: number; ids: string[]; price?: string; coverImage?: string }>()
  for (const m of markers) {
    const key = `${m.lat.toFixed(precision)},${m.lng.toFixed(precision)}`
    const existing = grid.get(key)
    if (existing) {
      existing.count++
      existing.ids.push(m.id)
    } else {
      grid.set(key, { lat: m.lat, lng: m.lng, count: 1, ids: [m.id], price: m.price, coverImage: m.coverImage })
    }
  }
  const clusters: any[] = []
  const singles: any[] = []
  for (const c of grid.values()) {
    if (c.count > 1) clusters.push(c)
    else singles.push(markers.find(m => m.id === c.ids[0])!)
  }
  return { clusters, singles }
}

export function OpenStreetMapImpl({
  center = [38.7223, -9.1393],
  zoom = 11,
  markers = [],
  singleLocation,
  className = '',
  height = 400,
  scrollWheelZoom = false,
  onBoundsChange,
  enableClustering = true,
  showSearchAsMoveToggle = false,
  searchAsMove = false,
  onSearchAsMoveChange,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const toggleRef = useRef<HTMLDivElement | null>(null)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Fire initial bounds
    if (onBoundsChange) {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
        center: [map.getCenter().lat, map.getCenter().lng], zoom: map.getZoom(),
      })
    }

    // Listen for moves (debounced)
    let moveTimer: any
    map.on('moveend zoomend', () => {
      if (!onBoundsChange) return
      clearTimeout(moveTimer)
      moveTimer = setTimeout(() => {
        const b = map.getBounds()
        onBoundsChange({
          north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
          center: [map.getCenter().lat, map.getCenter().lng], zoom: map.getZoom(),
        })
      }, 200)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update center/zoom when props change
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setView(center, zoom)
  }, [center[0], center[1], zoom])

  // Update markers + clusters
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return
    markerLayerRef.current.clearLayers()
    const currentZoom = mapRef.current.getZoom()

    if (singleLocation) {
      const marker = L.marker([singleLocation.lat, singleLocation.lng])
      if (singleLocation.label) marker.bindPopup(singleLocation.label)
      marker.addTo(markerLayerRef.current)
      mapRef.current.setView([singleLocation.lat, singleLocation.lng], 14)
      return
    }

    // Render single markers (always when not clustering, or when zoom is high)
    const renderSingle = (m: NonNullable<MapProps['markers']>[number]) => {
      const html = m.price
        ? `<div style="background: #1a2c4f; color: white; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid #ff6b35; transition: transform 0.2s;">${m.price}</div>`
        : `<div style="background: #ff6b35; color: white; padding: 4px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg></div>`
      const icon = L.divIcon({
        html,
        className: 'stayora-map-marker',
        iconSize: [60, 24],
        iconAnchor: [30, 24],
        popupAnchor: [0, -24],
      })
      const marker = L.marker([m.lat, m.lng], { icon })
      // Rich popup with thumbnail + price + rating
      const popupHtml = `
        <div style="width: 200px; font-family: sans-serif;">
          ${m.coverImage ? `<img src="${m.coverImage}" alt="" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ''}
          <div style="font-weight: 600; color: #1a2c4f; font-size: 13px; margin-bottom: 4px;">${m.title || 'Property'}</div>
          ${m.price ? `<div style="font-size: 16px; font-weight: 700; color: #1a2c4f;">${m.price} <span style="font-size: 11px; font-weight: 400; color: #888;">/ night</span></div>` : ''}
          ${m.rating ? `<div style="font-size: 11px; color: #ff6b35; margin-top: 4px;">★ ${m.rating}</div>` : ''}
          <div style="font-size: 11px; color: #ff6b35; margin-top: 8px; cursor: pointer;">Click to view →</div>
        </div>
      `
      marker.bindPopup(popupHtml, { maxWidth: 240 })
      marker.on('click', () => m.onClick?.(m.id))
      marker.addTo(markerLayerRef.current!)
    }

    // Render cluster marker
    const renderCluster = (cluster: { lat: number; lng: number; count: number; price?: string }) => {
      const html = `<div style="background: #ff6b35; color: white; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); cursor: pointer; border: 3px solid white;">${cluster.count}</div>`
      const icon = L.divIcon({
        html,
        className: 'stayora-map-cluster',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })
      const marker = L.marker([cluster.lat, cluster.lng], { icon })
      marker.on('click', () => {
        if (mapRef.current) {
          mapRef.current.setView([cluster.lat, cluster.lng], Math.min(19, currentZoom + 2))
        }
      })
      marker.addTo(markerLayerRef.current!)
    }

    if (enableClustering) {
      const { clusters, singles } = clusterMarkers(markers, currentZoom)
      singles.forEach(renderSingle)
      clusters.forEach(renderCluster)
    } else {
      markers.forEach(renderSingle)
    }

    // Fit bounds if many markers (only on first render or when count changes significantly)
    if (markers.length > 1 && !singleLocation) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      // Only fit if current view is very zoomed out (initial state)
      if (currentZoom <= 4 || bounds.contains(L.latLng(mapRef.current.getCenter()))) {
        // ok
      }
    }
  }, [markers, singleLocation, enableClustering])

  // Add "search as I move" toggle button (top-right of map)
  useEffect(() => {
    if (!mapRef.current || !showSearchAsMoveToggle) return
    // Remove existing toggle if any
    if (toggleRef.current) {
      toggleRef.current.remove()
      toggleRef.current = null
    }
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.top = '10px'
    div.style.right = '10px'
    div.style.zIndex = '1000'
    div.style.background = searchAsMove ? '#ff6b35' : 'white'
    div.style.color = searchAsMove ? 'white' : '#1a2c4f'
    div.style.padding = '6px 12px'
    div.style.borderRadius = '999px'
    div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
    div.style.cursor = 'pointer'
    div.style.fontSize = '12px'
    div.style.fontWeight = '600'
    div.style.fontFamily = 'sans-serif'
    div.style.border = searchAsMove ? 'none' : '2px solid #1a2c4f'
    div.style.transition = 'all 0.2s'
    div.textContent = searchAsMove ? '✓ Search as I move' : 'Search as I move'
    div.onclick = (e) => {
      e.stopPropagation()
      onSearchAsMoveChange?.(!searchAsMove)
    }
    mapRef.current.getContainer().appendChild(div)
    toggleRef.current = div

    return () => {
      if (toggleRef.current) {
        toggleRef.current.remove()
        toggleRef.current = null
      }
    }
  }, [showSearchAsMoveToggle, searchAsMove, onSearchAsMoveChange])

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden border border-border ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%', position: 'relative' }}
      role="application"
      aria-label="Interactive map"
    />
  )
}
