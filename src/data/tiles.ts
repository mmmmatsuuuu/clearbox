// steamworks.png（scripts/generate-steamworks.py 生成、32×32 px、5列3行）のフレーム番号
export const STEAM_FRAMES = {
  floorBrick: 0,
  floorRivet: 1,
  wallBrick: 2,    // 外壁
  wallBrass: 3,    // 外壁
  wallPipeA: 4,    // 内壁（装飾）
  wallPipeB: 5,
  wallPipeC: 6,
  wallLamp: 7,
  wallMonitor: 8,
  stairUp: 9,
  stairDown: 10,
  stairLocked: 11,
  statue: 12,
  altar: 13,
} as const

export type FloorTheme = {
  bg: number
  tint: number              // 床・壁に掛ける淡い色味（焼き込み色を活かすため白寄り）
  baseFloor: number         // その階の基本床フレーム
  perimeter: number         // 外周の壁フレーム（レンガ or 真鍮）
}

// WORLD_DESIGN.md「各階のビジュアルテーマ」参照。
// 下層はレンガ床＋レンガ外壁、上層は鉄板床＋真鍮外壁。tint は焼き込み色を活かすため白寄り。
export const FLOOR_THEMES: Record<number, FloorTheme> = {
  1: { bg: 0x1a120c, tint: 0xffffff, baseFloor: STEAM_FRAMES.floorBrick, perimeter: STEAM_FRAMES.wallBrick },
  2: { bg: 0x140f0a, tint: 0xe6d4bc, baseFloor: STEAM_FRAMES.floorBrick, perimeter: STEAM_FRAMES.wallBrick },
  3: { bg: 0x16100a, tint: 0xffeede, baseFloor: STEAM_FRAMES.floorBrick, perimeter: STEAM_FRAMES.wallBrick },
  4: { bg: 0x0e1016, tint: 0xd6deec, baseFloor: STEAM_FRAMES.floorRivet, perimeter: STEAM_FRAMES.wallBrass },
  5: { bg: 0x141008, tint: 0xffeec6, baseFloor: STEAM_FRAMES.floorRivet, perimeter: STEAM_FRAMES.wallBrass },
  6: { bg: 0x06141a, tint: 0xc6f0ff, baseFloor: STEAM_FRAMES.floorRivet, perimeter: STEAM_FRAMES.wallBrass },
  [-1]: { bg: 0x09060a, tint: 0xe0aab4, baseFloor: STEAM_FRAMES.floorRivet, perimeter: STEAM_FRAMES.wallBrick },
}

export const STAIR_TINTS = {
  up: 0xffffff,
  locked: 0xffffff,
  down: 0xffffff,
  secret: 0xbfe4ff,
} as const

// 床は各階で統一（タイル内の陰影で変化は出る）
export function floorFrameAt(_gx: number, _gy: number, base: number): number {
  return base
}

// 内壁は装飾壁（パイプ3種＋ランプ＋モニター）を決定的に振り分ける
const PIPE_VARIANTS = [STEAM_FRAMES.wallPipeA, STEAM_FRAMES.wallPipeB, STEAM_FRAMES.wallPipeC]
export function wallFrameAt(gx: number, gy: number): number {
  const r = ((gx * 5 + gy * 11) % 17 + 17) % 17
  if (r === 0) return STEAM_FRAMES.wallMonitor
  if (r === 7) return STEAM_FRAMES.wallLamp
  return PIPE_VARIANTS[(((gx * 3 + gy * 7) % 3) + 3) % 3]
}
