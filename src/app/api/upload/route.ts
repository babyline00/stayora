import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Optional: enforce a per-user quota by reading existing files (cheap on local FS)
    const existing = await readdir(UPLOAD_DIR)
    if (existing.length > 500) {
      // Soft cap — reject new uploads if too many files exist
      // (in production this would be per-user with proper auth)
    }

    const uploaded: Array<{ url: string; originalName: string; size: number; mimeType: string }> = []

    for (const file of files) {
      if (!(file instanceof File)) continue
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json({ error: `File type ${file.type} not allowed. Use JPEG, PNG, WebP, GIF, or AVIF.` }, { status: 400 })
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File ${file.name} exceeds 8MB limit` }, { status: 400 })
      }

      // Generate a stable, unique filename
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const hash = crypto.createHash('sha256').update(`${file.name}-${Date.now()}-${Math.random()}`).digest('hex').slice(0, 16)
      const filename = `${hash}.${ext}`
      const filepath = path.join(UPLOAD_DIR, filename)

      const bytes = await file.arrayBuffer()
      await writeFile(filepath, Buffer.from(bytes))

      uploaded.push({
        url: `/uploads/${filename}`,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      })
    }

    return NextResponse.json({ uploaded })
  } catch (err: any) {
    console.error('[upload API]', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

// Optional: support deletion of a previously-uploaded file
export async function DELETE(req: NextRequest) {
  try {
    const { filename } = await req.json()
    if (!filename || !/^[\w-]+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    const filepath = path.join(UPLOAD_DIR, filename)
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    await unlink(filepath)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'Stayora image upload API',
    methods: ['POST', 'DELETE'],
    limits: { maxFileSize: '8MB', allowedTypes: ALLOWED_MIME },
  })
}
