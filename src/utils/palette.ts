// WORLD_DESIGN.md「カラーパレット」と同期させること
export const PALETTE = {
  iron: 0x3a3a40,
  copper: 0x8a5a2b,
  brass: 0xc9a227,
  gaslight: 0xff9a3c,
  engineCyan: 0x3ce0ff,
  chaosRed: 0xff3366,
} as const

export const FLOOR_TINTS: Record<number, number> = {
  1: PALETTE.gaslight,
  2: PALETTE.copper,
  3: PALETTE.copper,
  4: PALETTE.iron,
  5: PALETTE.brass,
  6: PALETTE.engineCyan,
  [-1]: PALETTE.chaosRed,
}
