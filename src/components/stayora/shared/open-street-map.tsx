'use client'

import dynamic from 'next/dynamic'

// Lazy-load the actual Leaflet map only on the client (Leaflet breaks SSR)
const MapImpl = dynamic(() => import('./open-street-map-impl').then(m => m.OpenStreetMapImpl), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border bg-peach-light/40 grid place-items-center" style={{ height: 400 }}>
      <div className="text-sm text-muted-foreground">Loading map…</div>
    </div>
  ),
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
  /** Called when user clicks on the map (for interactive pin placement) */
  onMapClick?: (lat: number, lng: number) => void
  /** Whether the map is clickable for pin placement (default false) */
  clickable?: boolean
}

export function OpenStreetMap(props: MapProps) {
  return <MapImpl {...props} />
}
