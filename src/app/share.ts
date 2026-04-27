import type { Build, Scenario } from "../../product/sections/comparator/types"

interface ShareState {
  builds: Build[]
  scenario: Scenario
  v: number
}

const SHARE_VERSION = 1

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64ToBytes(b64: string): Uint8Array {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/")
  const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function compress(text: string): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(text)
  }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

async function decompress(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes)
  }
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"))
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return new TextDecoder().decode(out)
}

export async function encodeShareState(builds: Build[], scenario: Scenario): Promise<string> {
  // Strip derivedStats — they're recomputed on load
  const trimmedBuilds = builds.map(({ derivedStats: _ds, ...rest }) => rest as unknown as Build)
  const payload: ShareState = { v: SHARE_VERSION, scenario, builds: trimmedBuilds }
  const json = JSON.stringify(payload)
  const compressed = await compress(json)
  return bytesToBase64(compressed)
}

export async function decodeShareState(b64: string): Promise<ShareState | null> {
  try {
    const bytes = base64ToBytes(b64)
    const json = await decompress(bytes)
    const data = JSON.parse(json) as ShareState
    if (data.v !== SHARE_VERSION) return null
    return data
  } catch {
    return null
  }
}

export async function buildShareUrl(builds: Build[], scenario: Scenario): Promise<string> {
  const code = await encodeShareState(builds, scenario)
  const url = new URL(window.location.href)
  url.searchParams.set("s", code)
  return url.toString()
}
