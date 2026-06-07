export type GameState = {
  hp: number
  amulet: number
  skills: [number, number, number, number]
  heroX: number
  heroY: number
  heroZ: number
  npcCodes: [number, number, number]
  bossDefeats: [number, number, number, number, number]
}

const MAGIC_0 = 0x43
const MAGIC_1 = 0x42
const VERSION = 0x01
const BYTE_COUNT = 32

export const DEFAULT_STATE: Readonly<GameState> = {
  hp: 10,
  amulet: 0x09,
  skills: [0x05, 0x00, 0x00, 0x00],
  heroX: 2,
  heroY: 5,
  heroZ: 1,
  npcCodes: [0x00, 0x00, 0x00],
  bossDefeats: [0x00, 0x00, 0x00, 0x00, 0x00],
}

function cloneDefault(): GameState {
  return {
    ...DEFAULT_STATE,
    skills: [...DEFAULT_STATE.skills] as [number, number, number, number],
    npcCodes: [...DEFAULT_STATE.npcCodes] as [number, number, number],
    bossDefeats: [...DEFAULT_STATE.bossDefeats] as [number, number, number, number, number],
  }
}

function serialize(s: GameState): number[] {
  const b = new Array<number>(BYTE_COUNT).fill(0)
  b[0x00] = MAGIC_0
  b[0x01] = MAGIC_1
  b[0x02] = VERSION
  b[0x03] = s.hp & 0xFF
  b[0x04] = (s.hp >> 8) & 0xFF
  b[0x05] = s.amulet & 0xFF
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
  return b
}

function deserialize(b: number[]): GameState | null {
  if (b.length !== BYTE_COUNT) return null
  if (b[0x00] !== MAGIC_0 || b[0x01] !== MAGIC_1) return null
  const signed = (v: number) => (v >= 0x80 ? v - 0x100 : v)
  return {
    hp: b[0x03] | (b[0x04] << 8),
    amulet: b[0x05],
    skills: [b[0x06], b[0x07], b[0x08], b[0x09]],
    heroX: signed(b[0x0A]),
    heroY: signed(b[0x0B]),
    heroZ: signed(b[0x0C]),
    npcCodes: [b[0x0D], b[0x0E], b[0x0F]],
    bossDefeats: [b[0x10], b[0x11], b[0x12], b[0x13], b[0x14]],
  }
}

function toHexText(bytes: number[]): string {
  const row = (s: number[]) =>
    s.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  return row(bytes.slice(0, 16)) + '\n' + row(bytes.slice(16)) + '\n'
}

function parseHexText(text: string): number[] | null {
  const tokens = text.trim().split(/\s+/)
  if (tokens.length !== BYTE_COUNT) return null
  const bytes = tokens.map(t => parseInt(t, 16))
  if (bytes.some(isNaN)) return null
  return bytes
}

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

  load(): Promise<boolean> {
    return new Promise(resolve => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) { resolve(false); return }
        try {
          const bytes = parseHexText(await file.text())
          if (!bytes) { resolve(false); return }
          const state = deserialize(bytes)
          if (!state) { resolve(false); return }
          this.state = state
          resolve(true)
        } catch {
          resolve(false)
        }
      }
      input.click()
    })
  },

  calcAmulet(): number {
    const s = this.state
    return [
      s.hp & 0xFF, (s.hp >> 8) & 0xFF,
      s.skills[0], s.skills[1], s.skills[2], s.skills[3],
      s.heroX & 0xFF, s.heroY & 0xFF, s.heroZ & 0xFF,
      s.npcCodes[0], s.npcCodes[1], s.npcCodes[2],
      s.bossDefeats[0], s.bossDefeats[1], s.bossDefeats[2], s.bossDefeats[3], s.bossDefeats[4],
    ].reduce((xor, b) => xor ^ b, 0)
  },

  isAmuletValid(): boolean {
    return this.state.amulet === this.calcAmulet()
  },
}
