// Kenney Tiny Dungeon（public/assets/tilesets/tiny-dungeon.png、12列×11行）のフレーム番号
export const TILE_FRAMES = {
  floorPlain: 0,
  floorSpeck: 1,
  floorPebble: 12,
  floorRubble: 24,
  wallBrick: 57,
  wallBrickLit: 58,
  gateLocked: 41,
  doorWood: 63,
  doorMetal: 65,
  statueFace: 19,
  altarFountain: 32,
} as const

export type FloorTheme = {
  bg: number
  floorTint: number
  wallTint: number
}

// WORLD_DESIGN.md「各階のビジュアルテーマ」参照
export const FLOOR_THEMES: Record<number, FloorTheme> = {
  1: { bg: 0x241710, floorTint: 0xffffff, wallTint: 0xffaa66 },
  2: { bg: 0x141020, floorTint: 0x9b8fc4, wallTint: 0x8d7fb5 },
  3: { bg: 0x1a1008, floorTint: 0xddaa77, wallTint: 0xcc8855 },
  4: { bg: 0x0e1216, floorTint: 0x99a0aa, wallTint: 0xaab4c0 },
  5: { bg: 0x14130a, floorTint: 0xddc785, wallTint: 0xd8b84a },
  6: { bg: 0x06141a, floorTint: 0x77ccdd, wallTint: 0x55d8ee },
  [-1]: { bg: 0x050508, floorTint: 0x665566, wallTint: 0xff5577 },
}

export const STAIR_TINTS = {
  up: 0xffffff,
  locked: 0x7a7a88,
  down: 0x99ee88,
  secret: 0x66bbff,
} as const

export const STATUE_TINT = 0xddb868
