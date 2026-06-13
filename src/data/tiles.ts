// steamworks.png（scripts/generate-steamworks.py 生成、8列×3行）のフレーム番号
export const PIPE_BASE = 0           // 0-15: 接続ビットマスク N=1,E=2,S=4,W=8
export const STEAM_FRAMES = {
  stairUp: 16,
  stairDown: 17,
  stairLocked: 18,
  floorA: 19,
  floorB: 20,
  floorC: 21,
  elevator: 22,
} as const

// パイプ接続ビット
export const PIPE_N = 1
export const PIPE_E = 2
export const PIPE_S = 4
export const PIPE_W = 8

export type FloorTheme = {
  bg: number
  floorTint: number
  pipeTint: number
}

// WORLD_DESIGN.md「各階のビジュアルテーマ」参照。
// 下層は錆びた銅、登るほど真鍮〜鋼〜シアンへ。-1F は混沌の赤。
export const FLOOR_THEMES: Record<number, FloorTheme> = {
  1: { bg: 0x1a120c, floorTint: 0xb8895a, pipeTint: 0xc8772e },   // レンガ・ガス灯
  2: { bg: 0x120e0a, floorTint: 0x8a6a4a, pipeTint: 0x9c6a3a },   // 廃油・錆びた銅
  3: { bg: 0x14100a, floorTint: 0xa87a48, pipeTint: 0xc98a3a },   // 銅と錆
  4: { bg: 0x0e1014, floorTint: 0x99a2ae, pipeTint: 0xaab6c4 },   // 鋼
  5: { bg: 0x14120a, floorTint: 0xd8be6a, pipeTint: 0xe6c84a },   // 真鍮
  6: { bg: 0x06141a, floorTint: 0x8ad8e8, pipeTint: 0x3ce0ff },   // 機関シアン
  [-1]: { bg: 0x07060a, floorTint: 0x6a5560, pipeTint: 0xff3366 }, // 混沌の赤
}

export const STAIR_TINTS = {
  up: 0xffe2a8,
  locked: 0x8a8a92,
  down: 0x9be0a8,
  secret: 0x7ec8ff,
} as const

export const STATUE_TINT = 0xddb868
export const ALTAR_TINT = 0x9be0c0

// からくり像・祭壇は Tiny Dungeon 側のフレームを流用
export const DUNGEON_FRAMES = {
  statueFace: 19,
  altarFountain: 32,
} as const

// 床バリエーションを座標から決定的に選ぶ
export function floorFrameAt(gx: number, gy: number): number {
  const r = ((gx * 7 + gy * 13) % 9 + 9) % 9
  if (r === 0) return STEAM_FRAMES.floorB
  if (r === 4) return STEAM_FRAMES.floorC
  return STEAM_FRAMES.floorA
}
