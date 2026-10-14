'use client'

import { useAppStore } from '@/store/useAppStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function Toast() {
  const { toast, clearToast } = useAppStore()
  if (!toast) return null

  const Icon = toast.variant === 'success' ? CheckCircle2 : toast.variant === 'error' ? AlertCircle : Info
  const color = toast.variant === 'success' ? 'bg-green-600' : toast.variant === 'error' ? 'bg-destructive' : 'bg-navy'

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50">
      <div className={`pointer-events-auto flex items-start gap-3 rounded-xl ${color} px-4 py-3 text-white shadow-lg`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex flex-col">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && <p className="text-xs text-white/90">{toast.description}</p>}
        </div>
        <button onClick={clearToast} className="ml-2 text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
