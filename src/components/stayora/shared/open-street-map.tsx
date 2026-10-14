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

export function OpenStreetMap(props: MapProps) {
  return <MapImpl {...props} />
}
