type SkillDef = {
  name: string
  power: number
  effect: string
  defend?: true
}

const SKILLS: Record<number, SkillDef> = {
  0xB3: { name: '斬撃', power: 10, effect: '斬撃で敵に10のダメージを与える' },
  0x5F: { name: '防御', power: 0, defend: true, effect: '1ターン相手の攻撃を無効化する' },
}

const SKILL_CODES = [0xB3, 0x5F]

export function getSkillCodeByIndex(index: number): number {
  return SKILL_CODES[index] ?? 0
}

export function getSkillName(code: number): string {
  return SKILLS[code]?.name ?? `???（0x${code.toString(16).padStart(2, '0').toUpperCase()}）`
}

export function getSkillPower(code: number): number {
  return SKILLS[code]?.power ?? 0
}

export function getSkillEffect(code: number): string {
  return SKILLS[code]?.effect ?? '不明なスキル'
}

export function isDefendSkill(code: number): boolean {
  return SKILLS[code]?.defend === true
}
