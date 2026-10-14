'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud, X, Star, GripVertical, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'

export interface UploadedImage {
  url: string
  originalName?: string
  caption?: string
}

interface ImageUploaderProps {
  value: UploadedImage[]
  onChange: (next: UploadedImage[]) => void
  coverUrl?: string
  onCoverChange?: (url: string) => void
  max?: number
  min?: number
  helpText?: string
  /** Whether to allow drag-reorder */
  allowReorder?: boolean
  /** Whether to show caption input per image */
  allowCaptions?: boolean
}

export function ImageUploader({
  value,
  onChange,
  coverUrl,
  onCoverChange,
  max = 12,
  min = 1,
  helpText,
  allowReorder = true,
  allowCaptions = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (files: FileList | File[]) => {
    setError('')
    if (value.length + files.length > max) {
      setError(`You can upload at most ${max} images`)
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      for (const file of Array.from(files)) formData.append('files', file)
      const r = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Upload failed')
      const newImages: UploadedImage[] = (data.uploaded || []).map((u: any) => ({
        url: u.url,
        originalName: u.originalName,
      }))
      const next = [...value, ...newImages]
      onChange(next)
      // Auto-select first image as cover if no cover yet
      if (onCoverChange && !coverUrl && next.length > 0) {
        onCoverChange(next[0].url)
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [value, max, onChange, onCoverChange, coverUrl])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) upload(e.target.files)
    e.target.value = '' // allow same file to be selected again
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
  }

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
    if (coverUrl === value[idx]?.url) {
      onCoverChange?.(next[0]?.url || '')
    }
  }

  const setCaption = (idx: number, caption: string) => {
    const next = [...value]
    next[idx] = { ...next[idx], caption }
    onChange(next)
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
    if (coverUrl === value[from]?.url) onCoverChange?.(value[to]?.url || '')
    else if (coverUrl === value[to]?.url) onCoverChange?.(value[from]?.url || '')
  }

  const onDragStart = (idx: number) => setDragIndex(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (allowReorder) setDropIndex(idx)
  }
  const onDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      move(dragIndex, dropIndex)
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  const remaining = max - value.length

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-peach-light/20 p-8 text-center transition hover:border-orange hover:bg-peach-light/40"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-10 w-10 text-navy/60" />
            <p className="text-sm font-medium text-navy">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, GIF, or AVIF · max 8MB each · up to {remaining} more
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {helpText && value.length === 0 && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}

      {/* Thumbnail grid with drag-reorder + cover + caption */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((img, idx) => {
            const isCover = coverUrl === img.url
            return (
              <div
                key={img.url + idx}
                draggable={allowReorder}
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={`group relative overflow-hidden rounded-xl border-2 bg-muted transition ${
                  dropIndex === idx ? 'border-orange border-dashed' : isCover ? 'border-orange' : 'border-border'
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={img.url} alt={img.caption || img.originalName || `Photo ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
                {/* Top-left: position / cover badge */}
                <div className="absolute left-1 top-1 flex items-center gap-1">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy text-xs font-bold text-white">{idx + 1}</span>
                  {isCover && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      <Star className="h-2.5 w-2.5 fill-white" /> Cover
                    </span>
                  )}
                </div>
                {/* Top-right: actions */}
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  {!isCover && onCoverChange && (
                    <button
                      type="button"
                      onClick={() => onCoverChange(img.url)}
                      title="Set as cover"
                      className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-navy shadow hover:bg-white"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    title="Remove"
                    className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-destructive shadow hover:bg-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* Drag handle (bottom-left) */}
                {allowReorder && (
                  <div className="absolute bottom-1 left-1 grid h-6 w-6 cursor-move place-items-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                    <GripVertical className="h-3 w-3" />
                  </div>
                )}
                {/* Caption input */}
                {allowCaptions && (
                  <Input
                    value={img.caption || ''}
                    onChange={(e) => setCaption(idx, e.target.value)}
                    placeholder="Add caption…"
                    className="rounded-none border-0 border-t border-border bg-white/90 text-xs"
                  />
                )}
              </div>
            )
          })}

          {/* Add-more tile */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-border bg-peach-light/20 text-navy/60 transition hover:border-orange hover:bg-peach-light/40"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="mt-1 text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Validation hint */}
      {value.length < min && (
        <p className="text-xs text-muted-foreground">At least {min} photo{min === 1 ? '' : 's'} required to publish</p>
      )}
    </div>
  )
}
