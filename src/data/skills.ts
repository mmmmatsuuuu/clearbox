type SkillDef = {
  name: string
  power: number
}

const SKILLS: Record<number, SkillDef> = {
  0x05: { name: '斬撃', power: 10 },
}

export function getSkillName(code: number): string {
  return SKILLS[code]?.name ?? `???（0x${code.toString(16).padStart(2, '0').toUpperCase()}）`
}

export function getSkillPower(code: number): number {
  return SKILLS[code]?.power ?? 0
}
