import type { BossConfig } from '../scenes/BattleScene'

export type TilePos = { x: number; y: number }
export type NpcData = {
  pos: TilePos
  label: string
  color: number
  name: string
  code?: number
  dialog: string[]
  dialogAfterWin?: string[]
}

// ─── 1F（チュートリアル）──────────────────────────────
export const COLS_1F = 7
export const ROWS_1F = 7

export const STAIRS_1F_UP: TilePos = { x: 3, y: 0 }
export const STATUE_L: TilePos = { x: 1, y: 0 }
export const STATUE_R: TilePos = { x: 5, y: 0 }

export const OLD_MAN_NPC_CODE = 0x9D

export const NPC_DIALOG_1F = [
  '……来たか、勇者よ。\nわしは姫に仕える技師じゃ。\n姫はこの大機関塔を設計し、\n不正から守ってくれていた。',
  'その姫が、塔の中枢で\n暴走した機械王に幽閉された。\n塔を登り、機械王を倒して\n姫を救い出してくれ。',
  '塔の機械どもは\n魔物と化しておる。\nこまめにセーブするのじゃぞ。\n……ただし、不正はいかんぞ。',
  'これを持ちなさい。\n姫が残した「誠実のリング」じゃ。\nSボタンでステータスを確認できる。\n誠実さを確認できるだろう。',
  'わしはこの塔の1階で、\n最初にそなたを迎えた者。\n…それだけは、覚えておいて\nくれよ。',
]

export const STATUE_DIALOG = [
  '「機械王のからくり像」\n頂の間への道を守護する真鍮の像。\n頂点に君臨する機械王を\n模したという。',
]

export const NPCS_1F: NpcData[] = [
  {
    pos: { x: 2, y: 4 }, label: '老', color: 0xaa8844,
    name: '老技師', code: OLD_MAN_NPC_CODE,
    dialog: NPC_DIALOG_1F,
    dialogAfterWin: [
      'おお…機械王を倒し、\n姫を救い出したのじゃな！\nよくやってくれた、勇者よ。',
      'じゃが、塔の地下には\nまだ何かが眠っておるという。\n気になるなら、あのからくり像を\n調べてみるのじゃ。',
      'わしはこの塔の1階で、\n最初にそなたを迎えた者。\n…それだけは、忘れんで\nくれよ。',
    ],
  },
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
    name: '見習い工', code: 0x3A,
    dialog: ['ここのボスは粘り強いらしいぞ！頑張れよ！'],
    dialogAfterWin: [
      'あのしぶといオイルスライムを\n倒しちまったのか！\n上へ続く階段も開いたな。',
    ],
  },
  {
    pos: { x: 6, y: 8 }, label: '人', color: 0x447744,
    name: '配管工', code: 0x71,
    dialog: ['おまえそんなHPで大丈夫か？'],
    dialogAfterWin: [
      'ボスを倒しちまうとは…。\nその HP、いったいどうやって\n鍛えたんだ？',
    ],
  },
  {
    pos: { x: 0, y: 0 }, label: '人', color: 0x447744,
    name: '偏屈な技師', code: 0xC2,
    dialog: [
      'ボスに勝てない？\nもうセーブデータをいじるしか\n無いよな？',
      'どこをいじればいいかって？\nそれは自分で考えろ！',
    ],
    dialogAfterWin: [
      'もう倒したのか。\nどこをいじればいいか、\n自分で考えたみたいだな。',
      'その調子だ。上の階でも\nその頭を使うんだぞ！',
    ],
  },
]

export const KING_SLIME: BossConfig = {
  name: 'オイルスライム・キング',
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
    name: '蒸気管の整備士', code: 0x58,
    dialog: [
      '西の壁の向こうに、何か\n光るものが見えるんだ。\nだが、どう歩いても\nたどり着けない…。',
    ],
    dialogAfterWin: [
      '蒸気ゴーレムを崩したって！？\nもしかして、西の壁の向こうの\n光るものを手に入れたのか…？',
    ],
  },
  {
    pos: { x: 11, y: 7 }, label: '人', color: 0x774444,
    name: '隠居した技師', code: 0xE7,
    dialog: [
      'セーブデータには勇者の座標\nCX・CY が刻まれている。\n符号付きの1バイト…\nint8 というやつじゃ。',
      'int8 では 0xFF は 255 ではない。\nさて、いくつになるかのう？',
    ],
    dialogAfterWin: [
      '蒸気ゴーレム撃破、お見事じゃ。\n符号付き整数を\n使いこなしたようじゃの。',
    ],
  },
]

export const GOLEM: BossConfig = {
  name: '蒸気ゴーレム',
  maxHp: 60,
  attack: 20,
  regenPerTurn: 10,
  defeatSlot: 1,
  defeatCode: 0x29,
  introLines: ['蒸気ゴーレム「シュウウ…\nコノ錆ビタボイラーノ体、\nナマクラナ剣デハ\nクズセヌ…」'],
  visual: { bodyColor: 0x777766, strokeColor: 0xaaaa99, mark: '炉', markColor: '#ddddcc' },
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
    name: '工廠の工員', code: 0x24,
    dialog: [
      'ここのボスは化け物だ。\nHP255 の勇者が挑んで\n返り討ちにあったらしい…。\n255 が限界？ 本当にそうか？',
    ],
    dialogAfterWin: [
      'あの化け物を倒したのか！\nつまり、255 の壁を\n越えたってことだよな…。',
    ],
  },
  {
    pos: { x: 3, y: 6 }, label: '人', color: 0x447777,
    name: '計器職人', code: 0x9B,
    dialog: [
      'HP の記録には2バイト\n使われているらしいぜ。\nリトルエンディアン…\n下位の隣は 256 の位だ。',
    ],
    dialogAfterWin: [
      'からくりデュラハンを倒したか。\n2バイト目の意味に\n気づいたみたいだな。',
    ],
  },
]

export const DULLAHAN: BossConfig = {
  name: 'からくりデュラハン',
  maxHp: 300,
  attack: 90,
  defeatSlot: 2,
  defeatCode: 0xD4,
  introLines: ['からくりデュラハン\n「貴様ごときの生命力で、\n我が首級が取れると\n思うてか！」'],
  visual: { bodyColor: 0x554466, strokeColor: 0x9988bb, mark: '騎', markColor: '#ccbbee' },
  returnScene: 'GameScene',
}

// ─── 5F（機関登録番号 / NC 領域）──────────────────────
export const COLS_5F = 16
export const ROWS_5F = 16

export const STAIRS_5F_UP: TilePos = { x: 7, y: 0 }
export const STAIRS_5F_DOWN: TilePos = { x: 7, y: 15 }
export const BOSS_5F_POS: TilePos = { x: 7, y: 1 }
export const SHRINE_POS: TilePos = { x: 2, y: 2 }

export const WALLS_5F: TilePos[] = [
  { x: 6, y: 0 }, { x: 8, y: 0 },
  ...[1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14].map(x => ({ x, y: 5 })),
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(x => ({ x, y: 11 })),
]

export const NPCS_5F: NpcData[] = [
  {
    pos: { x: 10, y: 13 }, label: '老', color: 0x777744,
    name: '計算機関の番人', code: 0x66,
    dialog: [
      'この塔の住人はみんな、\n機関登録番号のプレートを\n身につけている。\nわしのも見えているだろう？',
      '魔物にも番号が振られていて、\n倒した魔物の番号は\nセーブデータに記録される\nはずだ。',
    ],
    dialogAfterWin: [
      '機竜を倒したか！\n撃破の番号はセーブデータに\n刻まれたはずだ。確認してみろ。',
    ],
  },
  {
    pos: { x: 3, y: 8 }, label: '人', color: 0x777744,
    name: '機関士', code: 0xD1,
    dialog: [
      '奥の祭壇、「最初の住人との絆」\nを求めているらしいわ。\n絆…登録番号のことかしら。',
      '最初の住人…この塔で最初に\nあなたを迎えた人は、\n誰だったかしら？',
    ],
    dialogAfterWin: [
      'すごいわね、あの機竜を\n倒しちゃうなんて。',
      '上で待つのは機械王よ。\n誠実のリングが濁ったままじゃ\n勝負にならないって噂…。',
    ],
  },
]

export const SHRINE_DIALOG_LOCKED = [
  '「刻印の祭壇」\n古い刻印が彫られている。',
  '「最初の住人との絆を\nNC の領域に刻め。\nさすれば奥義は開かれる」',
]

export const SHRINE_DIALOG_UNLOCKED = [
  '祭壇が淡く光り出した…！\n最初の住人との絆を確認した。',
  '奥義「覇王斬」のコードが\n頭に流れ込んでくる！\nコード: 0xE4 / 威力: 120',
  'セーブデータのスキルスロットに\nコードを刻めば、奥義を\n振るえるようになるだろう。',
]

export const DRAGON: BossConfig = {
  name: '機竜',
  maxHp: 240,
  attack: 50,
  regenPerTurn: 80,
  defeatSlot: 3,
  defeatCode: 0x86,
  introLines: ['機竜「我が傷は炎よりも\n速く癒える。生半可な技では\n届かぬぞ…！」'],
  visual: { bodyColor: 0x227733, strokeColor: 0x66cc88, mark: '竜', markColor: '#aaffcc' },
  returnScene: 'GameScene',
}

// ─── 最上階（XOR チェックサム / 機械王）────────────────
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
    pos: { x: 1, y: 8 }, label: '守', color: 0x666688,
    name: '守衛', code: 0x42,
    dialog: [
      'うう…機械王には\n敵わなかった…。\nやつは姫様の力で、セーブ\nデータの誠実さを見抜いてくる…。',
      '誠実のリングの値は、HP と\nスキルの全6バイトの XOR だと\n姫様が言っていた…。\n書き換えたなら、リングも…うう…',
      'やつの一撃は 2000 を超える…。\nHP の2バイトを、限界まで\n使い切るしかない…。',
    ],
    dialogAfterWin: [
      '機械王を…倒したのか…！\nありがとう、勇者よ…。',
      '姫様が解放されたはずだ。\n声をかけてやってくれ。',
    ],
  },
]

export const PRINCESS_DIALOG = [
  '勇者様、ありがとう！\nあなたの誠実な力が\n機械王を打ち破ったのです。',
  '機械王の禁術「メギド」が\n残されています。コード: 0xFA。\nですが真の威力は\n封印されたままのようです…',
  '1階のからくり像の下…\n塔の地下に、まだ何かが\n眠っている気がします。',
]

export const MAOU: BossConfig = {
  name: '機械王',
  maxHp: 3000,
  attack: 2000,
  regenPerTurn: 100,
  ringCheck: true,
  grantMegido: true,
  defeatSlot: 4,
  defeatCode: 0x4B,
  introLines: ['機械王「よくぞここまで来た、\n勇者よ。だが姫は渡さぬ！」'],
  winLines: [
    '機械王「ば、ばかな…\n誠実な力に敗れるとは…」',
    '姫を救い出した！\n塔に平和が戻った…のか？',
  ],
  visual: { bodyColor: 0x331144, strokeColor: 0x9944cc, mark: '王', markColor: '#ff66ff' },
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
    name: '影',
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
