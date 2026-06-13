// steamworks.png（scripts/generate-steamworks.py 生成、32×32 px、5列2行）のフレーム番号
export const STEAM_FRAMES = {
  floorBrick: 0,
  floorRivet: 1,
  wallPipe: 2,
  wallLamp: 3,
  wallMonitor: 4,
  elevatorUp: 5,
  elevatorDown: 6,
  elevatorLocked: 7,
  statue: 8,
  altar: 9,
} as const

export type FloorTheme = {
  bg: number
  tint: number              // 床・壁に掛ける淡い色味（焼き込み色を活かすため白寄り）
  baseFloor: number         // その階の基本床フレーム
}

// WORLD_DESIGN.md「各階のビジュアルテーマ」参照。
// タイルは色を持つので tint は白寄り。背景色と tint で階の雰囲気を出す。
export const FLOOR_THEMES: Record<number, FloorTheme> = {
  1: { bg: 0x1a120c, tint: 0xffffff, baseFloor: STEAM_FRAMES.floorBrick },
  2: { bg: 0x140f0a, tint: 0xe6d4bc, baseFloor: STEAM_FRAMES.floorBrick },
  3: { bg: 0x16100a, tint: 0xffeede, baseFloor: STEAM_FRAMES.floorBrick },
  4: { bg: 0x0e1016, tint: 0xd6deec, baseFloor: STEAM_FRAMES.floorRivet },
  5: { bg: 0x141008, tint: 0xffeec6, baseFloor: STEAM_FRAMES.floorRivet },
  6: { bg: 0x06141a, tint: 0xc6f0ff, baseFloor: STEAM_FRAMES.floorRivet },
  [-1]: { bg: 0x09060a, tint: 0xe0aab4, baseFloor: STEAM_FRAMES.floorRivet },
}

// 階段（エレベーター）には淡い色味のみ付ける
export const STAIR_TINTS = {
  up: 0xffffff,
  locked: 0xffffff,
  down: 0xffffff,
  secret: 0xbfe4ff,
} as const

// 床は各階で統一（レンガ床の階／鉄板床の階で差別化。タイル内の陰影で変化は出る）
export function floorFrameAt(_gx: number, _gy: number, base: number): number {
  return base
}

// 壁は基本パイプ壁、ときどきランプ/モニターをアクセントに
export function wallFrameAt(gx: number, gy: number): number {
  const r = ((gx * 5 + gy * 11) % 13 + 13) % 13
  if (r === 0) return STEAM_FRAMES.wallMonitor
  if (r === 5) return STEAM_FRAMES.wallLamp
  return STEAM_FRAMES.wallPipe
}
