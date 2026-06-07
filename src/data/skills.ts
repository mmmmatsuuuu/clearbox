const SKILL_NAMES: Record<number, string> = {
  0x05: '斬撃',
}

export function getSkillName(code: number): string {
  return SKILL_NAMES[code] ?? `???（0x${code.toString(16).padStart(2, '0').toUpperCase()}）`
}
