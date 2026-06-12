import { getSkillCodeByIndex } from '../data/skills'

export type GameState = {
  hp: number
  ring: number
  skills: [number, number, number, number]
  heroX: number
  heroY: number
  heroZ: number
  npcCodes: [number, number, number]
  bossDefeats: [number, number, number, number, number]
  megidoPower: number
}

const MAGIC_0 = 0x43
const MAGIC_1 = 0x42
const VERSION = 0x01
const BYTE_COUNT = 32

const LABELS = [
  'MG', 'MG', 'VS', 'HP', 'HP', 'CS',
  'SK', 'SK', 'SK', 'SK',
  'CX', 'CY', 'CZ',
  'NC', 'NC', 'NC',
  'BD', 'BD', 'BD', 'BD', 'BD',
  'RV', 'RV', 'RV', 'RV', 'RV', 'RV', 'RV', 'RV', 'RV', 'RV', 'RV',
]

function cloneDefault(): GameState {
  const skills: [number, number, number, number] = [
    getSkillCodeByIndex(0), 0x00, 0x00, 0x00,
  ]
  const hp = 10
  const ring = (hp & 0xFF) ^ ((hp >> 8) & 0xFF) ^ skills[0] ^ skills[1] ^ skills[2] ^ skills[3]
  return {
    hp,
    ring,
    skills,
    heroX: 3,
    heroY: 4,
    heroZ: 1,
    npcCodes: [0x00, 0x00, 0x00],
    bossDefeats: [0x00, 0x00, 0x00, 0x00, 0x00],
    megidoPower: 0,
  }
}

function encodeFloat32LE(value: number): [number, number, number, number] {
  const view = new DataView(new ArrayBuffer(4))
  view.setFloat32(0, value, true)
  return [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)]
}

function decodeFloat32LE(b0: number, b1: number, b2: number, b3: number): number {
  const view = new DataView(new ArrayBuffer(4))
  view.setUint8(0, b0)
  view.setUint8(1, b1)
  view.setUint8(2, b2)
  view.setUint8(3, b3)
  const value = view.getFloat32(0, true)
  return Number.isFinite(value) ? value : 0
}

function serialize(s: GameState): number[] {
  const b = new Array<number>(BYTE_COUNT).fill(0)
  b[0x00] = MAGIC_0
  b[0x01] = MAGIC_1
  b[0x02] = VERSION
  b[0x03] = s.hp & 0xFF
  b[0x04] = (s.hp >> 8) & 0xFF
  b[0x05] = s.ring & 0xFF
  b[0x06] = s.skills[0]
  b[0x07] = s.skills[1]
  b[0x08] = s.skills[2]
  b[0x09] = s.skills[3]
  b[0x0A] = s.heroX & 0xFF
  b[0x0B] = s.heroY & 0xFF
  b[0x0C] = s.heroZ & 0xFF
  b[0x0D] = s.npcCodes[0]
  b[0x0E] = s.npcCodes[1]
  b[0x0F] = s.npcCodes[2]
  b[0x10] = s.bossDefeats[0]
  b[0x11] = s.bossDefeats[1]
  b[0x12] = s.bossDefeats[2]
  b[0x13] = s.bossDefeats[3]
  b[0x14] = s.bossDefeats[4]
  const mp = encodeFloat32LE(s.megidoPower)
  b[0x15] = mp[0]
  b[0x16] = mp[1]
  b[0x17] = mp[2]
  b[0x18] = mp[3]
  return b
}

function deserialize(b: number[]): GameState | null {
  if (b.length !== BYTE_COUNT) return null
  if (b[0x00] !== MAGIC_0 || b[0x01] !== MAGIC_1) return null
  const signed = (v: number) => (v >= 0x80 ? v - 0x100 : v)
  return {
    hp: b[0x03] | (b[0x04] << 8),
    ring: b[0x05],
    skills: [b[0x06], b[0x07], b[0x08], b[0x09]],
    heroX: signed(b[0x0A]),
    heroY: signed(b[0x0B]),
    heroZ: signed(b[0x0C]),
    npcCodes: [b[0x0D], b[0x0E], b[0x0F]],
    bossDefeats: [b[0x10], b[0x11], b[0x12], b[0x13], b[0x14]],
    megidoPower: decodeFloat32LE(b[0x15], b[0x16], b[0x17], b[0x18]),
  }
}

function toHexText(bytes: number[]): string {
  return bytes.map((b, i) => {
    const addr = (i + 1).toString(16).padStart(2, '0').toUpperCase()
    const data = b.toString(16).padStart(2, '0').toUpperCase()
    return `${LABELS[i]}x${addr} ${data}`
  }).join('\n') + '\n'
}

function parseHexText(text: string): number[] | null {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length !== BYTE_COUNT) return null
  const bytes = new Array<number>(BYTE_COUNT).fill(0)
  for (const line of lines) {
    const m = line.match(/^[A-Z]{2}x([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})$/i)
    if (!m) return null
    const offset = parseInt(m[1], 16) - 1
    if (offset < 0 || offset >= BYTE_COUNT) return null
    bytes[offset] = parseInt(m[2], 16)
  }
  return bytes
}

export type LoadResult = 'loaded' | 'cancelled' | 'invalid'

export const SaveManager = {
  state: cloneDefault(),

  reset(): void {
    this.state = cloneDefault()
  },

  save(): void {
    const blob = new Blob([toHexText(serialize(this.state))], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'save_data.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  load(): Promise<LoadResult> {
    return new Promise(resolve => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt'
      input.oncancel = () => resolve('cancelled')
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) { resolve('cancelled'); return }
        try {
          const bytes = parseHexText(await file.text())
          if (!bytes) { resolve('invalid'); return }
          const state = deserialize(bytes)
          if (!state) { resolve('invalid'); return }
          this.state = state
          resolve('loaded')
        } catch {
          resolve('invalid')
        }
      }
      input.click()
    })
  },

  calcRing(): number {
    const s = this.state
    return [
      s.hp & 0xFF, (s.hp >> 8) & 0xFF,
      s.skills[0], s.skills[1], s.skills[2], s.skills[3],
    ].reduce((xor, b) => xor ^ b, 0)
  },

  isRingValid(): boolean {
    return this.state.ring === this.calcRing()
  },

  updateRing(): void {
    this.state.ring = this.calcRing()
  },
}
