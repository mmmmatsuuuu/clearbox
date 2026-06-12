type SkillDef = {
  name: string
  power: number
  effect: string
  defend?: true
}

export const MEGIDO_CODE = 0xFA

const SKILLS: Record<number, SkillDef> = {
  0xB3: { name: '斬撃', power: 10, effect: '斬撃で敵に10のダメージを与える' },
  0x5F: { name: '防御', power: 0, defend: true, effect: '1ターン相手の攻撃を無効化する' },
  0xA3: { name: 'ファイア', power: 40, effect: '炎で敵に40のダメージを与える' },
  0xC7: { name: 'サンダー', power: 75, effect: '雷で敵に75のダメージを与える' },
  0xE4: { name: '覇王斬', power: 120, effect: '奥義の斬撃で敵に120のダメージを与える' },
  0xD9: { name: 'ホーリー', power: 200, effect: '聖なる光で敵に200のダメージを与える' },
  [MEGIDO_CODE]: { name: 'メギド', power: 0, effect: '機械王の禁術。真の威力はセーブデータの奥に眠る' },
}

const SKILL_CODES = [0xB3, 0x5F, 0xA3, 0xC7, 0xE4, 0xD9, MEGIDO_CODE]

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
