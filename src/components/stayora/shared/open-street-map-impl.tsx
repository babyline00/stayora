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
}

export function OpenStreetMapImpl({
  center = [38.7223, -9.1393],
  zoom = 11,
  markers = [],
  singleLocation,
  className = '',
  height = 400,
  scrollWheelZoom = false,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)

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

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return
    markerLayerRef.current.clearLayers()

    if (singleLocation) {
      const marker = L.marker([singleLocation.lat, singleLocation.lng])
      if (singleLocation.label) marker.bindPopup(singleLocation.label)
      marker.addTo(markerLayerRef.current)
      mapRef.current.setView([singleLocation.lat, singleLocation.lng], 14)
      return
    }

    markers.forEach((m) => {
      const html = m.price
        ? `<div style="background: #1a2c4f; color: white; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid #ff6b35;">${m.price}</div>`
        : `<div style="background: #ff6b35; color: white; padding: 4px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg></div>`
      const icon = L.divIcon({
        html,
        className: 'stayora-map-marker',
        iconSize: [60, 24],
        iconAnchor: [30, 24],
        popupAnchor: [0, -24],
      })
      const marker = L.marker([m.lat, m.lng], { icon })
      if (m.title) marker.bindPopup(`<div style="font-weight: 600; padding: 4px;">${m.title}</div>`)
      marker.on('click', () => m.onClick?.(m.id))
      marker.addTo(markerLayerRef.current)
    })

    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [markers, singleLocation])

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden border border-border ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
      role="application"
      aria-label="Interactive map"
    />
  )
}
