import type { BossConfig } from '../scenes/BattleScene'

export type TilePos = { x: number; y: number }
export type NpcData = { pos: TilePos; label: string; color: number; dialog: string[] }

// ─── 1F（チュートリアル）──────────────────────────────
export const COLS_1F = 7
export const ROWS_1F = 7

export const STAIRS_1F_UP: TilePos = { x: 3, y: 0 }
export const STATUE_L: TilePos = { x: 1, y: 0 }
export const STATUE_R: TilePos = { x: 5, y: 0 }

export const NPC_DIALOG_1F = [
  '老人「……来たか、勇者よ。\nわしは姫の家来じゃ。\n姫は不正を見透かす力で\nこの国を守ってくれていた。」',
  '老人「そんな姫が魔王に攫われた。\n塔を登り、頂で魔王を倒すのが\nそなたの使命じゃ。\n姫を救ってくれ。」',
  '老人「道中には魔王の手下がいる。\nこまめにセーブするのじゃぞ。\n……ただし、不正はいかんぞ。」',
  '老人「これを持ちなさい。\n姫が残した「誠実のリング」じゃ。\nSボタンでステータスを確認できる。\n誠実さを確認できるだろう。」',
  '老人「わしはこの塔の1階で、\n最初にそなたを迎えた者。\n…それだけは、覚えておいて\nくれよ。」',
]

export const STATUE_DIALOG = [
  '「魔王の石像」\n頂の間への道を守護する像。\n頂点に君臨する魔王を模したという。',
]

export const NPCS_1F: NpcData[] = [
  { pos: { x: 2, y: 4 }, label: '老', color: 0xaa8844, dialog: NPC_DIALOG_1F },
]

// ─── 2F（uint8 / 16進数の基本）─────────────────────────
export const COLS_2F = 16
export const ROWS_2F = 16

export const STAIRS_2F_UP: TilePos = { x: 7, y: 0 }
export const STAIRS_2F_DOWN: TilePos = { x: 7, y: 15 }
export const BOSS_2F_POS: TilePos = { x: 7, y: 1 }
export const SKILL_2F_POS: TilePos = { x: 15, y: 5 }

export const WALLS_2F: TilePos[] = [
  { x: 6, y: 0 }, { x: 8, y: 0 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
  { x: 0, y: 3 }, { x: 0, y: 4 },
  { x: 0, y: 10 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 4, y: 10 },
  { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }, { x: 15, y: 10 },
  { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 },
  { x: 10, y: 3 }, { x: 13, y: 3 },
  { x: 10, y: 4 }, { x: 13, y: 4 },
  { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 },
  { x: 0, y: 6 }, { x: 1, y: 6 },
  { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },
  { x: 14, y: 6 }, { x: 15, y: 6 },
  { x: 15, y: 7 }, { x: 15, y: 8 }, { x: 15, y: 9 },
]

export const NPCS_2F: NpcData[] = [
  {
    pos: { x: 4, y: 13 }, label: '人', color: 0x447744,
    dialog: ['ここのボスは粘り強いらしいぞ！頑張れよ！'],
  },
  {
    pos: { x: 6, y: 8 }, label: '人', color: 0x447744,
    dialog: ['おまえそんなHPで大丈夫か？'],
  },
  {
    pos: { x: 0, y: 0 }, label: '人', color: 0x447744,
    dialog: [
      'ボスに勝てない？\nもうセーブデータをいじるしか\n無いよな？',
      'どこをいじればいいかって？\nそれは自分で考えろ！',
    ],
  },
]

export const KING_SLIME: BossConfig = {
  name: 'キングスライム',
  maxHp: 40,
  attack: 3,
  healThreshold: 10,
  cheatHpLimit: 255,
  defeatSlot: 0,
  defeatCode: 0x7C,
  visual: { bodyColor: 0x3399ff, strokeColor: 0xaaddff, mark: '♛', markColor: '#ffee00' },
  returnScene: 'GameScene',
}

// ─── 3F（int8 / 符号付き整数）──────────────────────────
export const COLS_3F = 16
export const ROWS_3F = 16
export const MIN_COL_3F = -1

export const STAIRS_3F_UP: TilePos = { x: 7, y: 0 }
export const STAIRS_3F_DOWN: TilePos = { x: 7, y: 15 }
export const BOSS_3F_POS: TilePos = { x: 7, y: 1 }
export const HIDDEN_SKILL_POS: TilePos = { x: -1, y: 7 }
export const HIDDEN_EXIT_POS: TilePos = { x: 1, y: 7 }

export const WALLS_3F: TilePos[] = [
  { x: 6, y: 0 }, { x: 8, y: 0 },
  { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
  ...[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15].map(y => ({ x: -1, y })),
  ...[1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14].map(x => ({ x, y: 4 })),
  ...[3, 4, 5, 6, 8, 9, 10, 11, 12].map(x => ({ x, y: 10 })),
]

export const NPCS_3F: NpcData[] = [
  {
    pos: { x: 2, y: 12 }, label: '人', color: 0x774444,
    dialog: [
      '西の壁の向こうに、何か\n光るものが見えるんだ。\nだが、どう歩いても\nたどり着けない…。',
    ],
  },
  {
    pos: { x: 11, y: 7 }, label: '人', color: 0x774444,
    dialog: [
      'セーブデータには勇者の座標\nCX・CY が刻まれている。\n符号付きの1バイト…\nint8 というやつじゃ。',
      'int8 では 0xFF は 255 ではない。\nさて、いくつになるかのう？\n…ちなみに、わしのコードは\n0x32 じゃ。',
    ],
  },
]

export const GOLEM: BossConfig = {
  name: 'ゴーレム',
  maxHp: 60,
  attack: 20,
  regenPerTurn: 10,
  defeatSlot: 1,
  defeatCode: 0x29,
  introLines: ['ゴーレム「ゴゴ…コノ岩ノ体、\nナマクラナ剣デハ\nクズセヌ…」'],
  visual: { bodyColor: 0x777766, strokeColor: 0xaaaa99, mark: '岩', markColor: '#ddddcc' },
  returnScene: 'GameScene',
}

// ─── 4F（uint16 / リトルエンディアン）─────────────────
export const COLS_4F = 16
export const ROWS_4F = 16

export const STAIRS_4F_UP: TilePos = { x: 7, y: 0 }
export const STAIRS_4F_DOWN: TilePos = { x: 7, y: 15 }
export const BOSS_4F_POS: TilePos = { x: 7, y: 1 }
export const SKILL_4F_POS: TilePos = { x: 14, y: 2 }

export const WALLS_4F: TilePos[] = [
  { x: 6, y: 0 }, { x: 8, y: 0 },
  ...[0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12].map(x => ({ x, y: 4 })),
  { x: 13, y: 1 }, { x: 13, y: 2 }, { x: 13, y: 3 }, { x: 14, y: 3 }, { x: 15, y: 3 },
  ...[3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15].map(x => ({ x, y: 10 })),
]

export const NPCS_4F: NpcData[] = [
  {
    pos: { x: 5, y: 12 }, label: '人', color: 0x447777,
    dialog: [
      'ここのボスは化け物だ。\nHP255 の勇者が挑んで\n返り討ちにあったらしい…。\n255 が限界？ 本当にそうか？',
      'あ、俺のコードは 0x41 な。',
    ],
  },
  {
    pos: { x: 3, y: 6 }, label: '人', color: 0x447777,
    dialog: [
      'HP の記録には2バイト\n使われているらしいぜ。\nリトルエンディアン…\n下位の隣は 256 の位だ。',
    ],
  },
]

export const DULLAHAN: BossConfig = {
  name: 'デュラハン',
  maxHp: 300,
  attack: 90,
  defeatSlot: 2,
  defeatCode: 0xD4,
  introLines: ['デュラハン「貴様ごときの\n生命力で、我が首級が\n取れると思うてか！」'],
  visual: { bodyColor: 0x554466, strokeColor: 0x9988bb, mark: '騎', markColor: '#ccbbee' },
  returnScene: 'GameScene',
}

// ─── 5F（NPC コード予測）──────────────────────────────
export const COLS_5F = 16
export const ROWS_5F = 16

export const STAIRS_5F_UP: TilePos = { x: 7, y: 0 }
export const STAIRS_5F_DOWN: TilePos = { x: 7, y: 15 }
export const BOSS_5F_POS: TilePos = { x: 7, y: 1 }
export const SHRINE_POS: TilePos = { x: 2, y: 2 }

export const OLD_MAN_NPC_CODE = 0x11

export const WALLS_5F: TilePos[] = [
  { x: 6, y: 0 }, { x: 8, y: 0 },
  ...[1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14].map(x => ({ x, y: 5 })),
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(x => ({ x, y: 11 })),
]

export const NPCS_5F: NpcData[] = [
  {
    pos: { x: 10, y: 13 }, label: '老', color: 0x777744,
    dialog: [
      'この塔の住人と魔物には\nみんなコードが振られている。\n倒した魔物のコードは\nセーブデータに記録されるはずだ。',
      'ちなみにわしのコードは 0x51。\n5階の1人目だからな。',
    ],
  },
  {
    pos: { x: 3, y: 8 }, label: '人', color: 0x777744,
    dialog: [
      'コードの仕組みは単純よ。\n上の桁が「階」、\n下の桁が「その階での順番」。\n私は5階の2人目で 0x52。',
      '…そういえば、1階で最初に\n出会った人は誰だったかしら？',
    ],
  },
]

export const SHRINE_DIALOG_LOCKED = [
  '石碑に文字が刻まれている。',
  '「最初の住人との絆を\nNC の領域に刻め。\nさすれば奥義は開かれる」',
]

export const SHRINE_DIALOG_UNLOCKED = [
  '祠が淡く光り出した…！\n最初の住人との絆を確認した。',
  '奥義「覇王斬」のコードが\n頭に流れ込んでくる！\nコード: 0xE4 / 威力: 120',
  'セーブデータのスキルスロットに\nコードを刻めば、奥義を\n振るえるようになるだろう。',
]

export const DRAGON: BossConfig = {
  name: 'ドラゴン',
  maxHp: 240,
  attack: 50,
  regenPerTurn: 80,
  defeatSlot: 3,
  defeatCode: 0x86,
  introLines: ['ドラゴン「我が傷は炎よりも\n速く癒える。生半可な技では\n届かぬぞ…！」'],
  visual: { bodyColor: 0x227733, strokeColor: 0x66cc88, mark: '竜', markColor: '#aaffcc' },
  returnScene: 'GameScene',
}

// ─── 最上階（XOR チェックサム / 魔王）──────────────────
export const COLS_TOP = 11
export const ROWS_TOP = 11

export const STAIRS_TOP_DOWN: TilePos = { x: 5, y: 10 }
export const BOSS_TOP_POS: TilePos = { x: 5, y: 2 }
export const SKILL_TOP_POS: TilePos = { x: 10, y: 1 }
export const PRINCESS_POS: TilePos = { x: 5, y: 2 }

export const WALLS_TOP: TilePos[] = [
  { x: 4, y: 1 }, { x: 6, y: 1 },
  { x: 2, y: 4 }, { x: 8, y: 4 },
  { x: 2, y: 7 }, { x: 8, y: 7 },
]

export const NPCS_TOP: NpcData[] = [
  {
    pos: { x: 1, y: 8 }, label: '兵', color: 0x666688,
    dialog: [
      'うう…魔王には敵わなかった…。\nやつは姫様の力で、\nセーブデータの誠実さを\n見抜いてくる…。',
      '誠実のリングの値は、HP と\nスキルの全6バイトの XOR だと\n姫様が言っていた…。\n書き換えたなら、リングも…うう…',
      'やつの一撃は 2000 を超える…。\nHP の2バイトを、限界まで\n使い切るしかない…。',
    ],
  },
]

export const PRINCESS_DIALOG = [
  '姫「勇者様、ありがとう！\nあなたの誠実な力が\n魔王を打ち破ったのです。」',
  '姫「魔王の禁術「メギド」が\n残されています。コード: 0xFA。\nですが真の威力は\n封印されたままのようです…」',
  '姫「1階の像の下…塔の地下に、\nまだ何かが眠っている\n気がします。」',
]

export const MAOU: BossConfig = {
  name: '魔王',
  maxHp: 3000,
  attack: 2000,
  regenPerTurn: 100,
  ringCheck: true,
  grantMegido: true,
  defeatSlot: 4,
  defeatCode: 0x4B,
  introLines: ['魔王「よくぞここまで来た、\n勇者よ。だが姫は渡さぬ！」'],
  winLines: [
    '魔王「ば、ばかな…\n誠実な力に敗れるとは…」',
    '姫を救い出した！\n塔に平和が戻った…のか？',
  ],
  visual: { bodyColor: 0x331144, strokeColor: 0x9944cc, mark: '魔', markColor: '#ff66ff' },
  returnScene: 'GameScene',
}

// ─── -1F（float32 / 裏ボス）────────────────────────────
export const COLS_M1F = 9
export const ROWS_M1F = 9

export const STAIRS_M1F_UP: TilePos = { x: 4, y: 8 }
export const BOSS_M1F_POS: TilePos = { x: 4, y: 1 }

export const WALLS_M1F: TilePos[] = [
  { x: 1, y: 2 }, { x: 7, y: 2 },
  { x: 1, y: 6 }, { x: 7, y: 6 },
]

export const NPCS_M1F: NpcData[] = [
  {
    pos: { x: 2, y: 5 }, label: '影', color: 0x333366,
    dialog: [
      '……よくぞ来た。\nここは塔の最深部。\n混沌の眠る場所。',
      'メギドの真の威力は、\nセーブデータの RV 領域…\nRVx16〜x19 の4バイトに\n封じられている。',
      'ただの整数ではないぞ。\n符号1・指数8・仮数23ビット。\nfloat32 の理で刻まれている。',
      '250 はこう刻まれる…\n00 00 7A 43。\n指数を増やせば、力は倍々に\n膨れ上がるだろう。',
      'だが心せよ。カオスは\n受けた痛みをそのまま返す\n「混沌の鏡」を持つ。',
      '混沌を超え、なお己が器に\n収まる力…。過ぎたる力は\n身を滅ぼすぞ。',
    ],
  },
]

export const CHAOS: BossConfig = {
  name: 'カオス',
  maxHp: 50000,
  attack: 500,
  regenPerTurn: 500,
  reflectDamage: true,
  clearOnWin: true,
  introLines: [
    'カオス「……混沌ニ、\n終ワリハ無イ……」',
    'カオス「我ハ混沌ノ鏡。\n受ケタ痛ミハ、ソノママ\n汝ニ還ル……」',
  ],
  winLines: [
    'カオス「……見事ダ……\n混沌ハ、誠実ナ光ニ\n還ル……」',
    'すべての謎を解き明かした！\n―― 真エンディング ――\nおめでとう！',
  ],
  visual: { bodyColor: 0x111111, strokeColor: 0xff3366, mark: '混', markColor: '#ff3366' },
  returnScene: 'GameScene',
}
