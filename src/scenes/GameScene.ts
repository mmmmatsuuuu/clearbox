import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { StatusScreen } from '../objects/StatusScreen'
import { getSkillCodeByIndex } from '../data/skills'
import type { BossConfig } from './BattleScene'

const TILE = 64
const SPEED = 128
const HERO_HALF = 20

// ─── 1F ───────────────────────────────────────────────
const NPC_1F          = { x: 2, y: 4 }
const STATUE_L        = { x: 1, y: 0 }
const STATUE_R        = { x: 5, y: 0 }
const STAIRS_1F_UP    = { x: 3, y: 0 }

const NPC_DIALOG_1F = [
  '老技師「……来たか、勇者よ。\nわしは姫に仕える技師じゃ。\n姫は不正を見抜く力で\nこの大機関塔を守ってくれていた。」',
  '老技師「そんな姫が機械王に攫われた。\n塔を登り、頂で機械王を倒すのが\nそなたの使命じゃ。\n姫を救ってくれ。」',
  '老技師「道中には機械の魔物がおる。\nこまめにセーブするのじゃぞ。\n……ただし、不正はいかんぞ。」',
  '老技師「これを持ちなさい。\n姫が残した「誠実のリング」じゃ。\nSボタンでステータスを確認できる。\n誠実さを確認できるだろう。」',
]

const STATUE_DIALOG = [
  '「機械王のからくり像」\n頂の間への道を守護する真鍮の像。\n頂点に君臨する機械王を模したという。',
]

// ─── 2F ───────────────────────────────────────────────
const COLS_2F = 16
const ROWS_2F = 16

const NPC_2F_DEFS: Array<{ pos: { x: number; y: number }; dialog: string[] }> = [
  { pos: { x: 4, y: 13 }, dialog: ['ここのボスは油まみれで\n粘り強いらしいぞ！頑張れよ！'] },
  { pos: { x: 6, y: 8  }, dialog: ['おまえそんなHPで大丈夫か？'] },
  { pos: { x: 0, y: 0  }, dialog: [
    'ボスに勝てない？\nもうセーブデータをいじるしか\n無いよな？',
    'どこをいじればいいかって？\nそれは自分で考えろ！',
  ]},
]

const BOSS_2F_POS    = { x: 7, y: 1 }
const SKILL_POS      = { x: 15, y: 5 }
const SKILL_CODE     = getSkillCodeByIndex(1)
const STAIRS_2F_UP   = { x: 7, y: 0 }
const STAIRS_2F_DOWN = { x: 7, y: 15 }

const WALLS_2F: { x: number; y: number }[] = [
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

const OIL_SLIME_KING: BossConfig = {
  name: 'オイルスライム・キング',
  maxHp: 40,
  attack: 3,
  healThreshold: 10,
  cheatHpLimit: 255,
  defeatSlot: 0,
  defeatCode: 0x01,
  returnScene: 'GameScene',
}

// ─── Module state ─────────────────────────────────────
let introCompleted = false

// ─── Types ────────────────────────────────────────────
type StatueDef = { pos: { x: number; y: number }; container: Phaser.GameObjects.Container }
type NpcDef    = { pos: { x: number; y: number }; dialog: string[] }

// ─── Scene ────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  private heroPixelX = 0
  private heroPixelY = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private transitioning = false
  private movementLocked = false
  private mapCols = 7
  private mapRows = 7

  private heroContainer!: Phaser.GameObjects.Container
  private hpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox
  private statusScreen!: StatusScreen

  private npcs: NpcDef[] = []
  private statues: StatueDef[] = []
  private wallSet = new Set<string>()
  private secretStairsRevealed = false
  private secretStairsContainer?: Phaser.GameObjects.Container
  private bossPos: { x: number; y: number } | null = null
  private skillItemContainer?: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    const z = SaveManager.state.heroZ
    this.transitioning = false
    this.secretStairsRevealed = false
    this.statues = []
    this.npcs = []
    this.wallSet = new Set()
    this.bossPos = null
    this.skillItemContainer = undefined
    this.movementLocked = z === 1 && !introCompleted

    this.heroPixelX = SaveManager.state.heroX * TILE + TILE / 2
    this.heroPixelY = SaveManager.state.heroY * TILE + TILE / 2

    if (z === 1)       this.create1F()
    else if (z === 2)  this.create2F()
    else if (z === 3)  this.create3F()
    else if (z === -1) this.createMinus1F()

    this.createHero()
    this.cameras.main.startFollow(this.heroContainer, true)
    this.cameras.main.setBounds(0, 0, this.mapCols * TILE, this.mapRows * TILE)

    this.createHud()
    this.dialog = new DialogBox(this, 8, 202, 304, 100)
    this.dialog.setScrollFactor(0)
    this.statusScreen = new StatusScreen(this)
    this.statusScreen.setScrollFactor(0)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.setupInput()
    this.setupButtons()

    if (z === 1 && !introCompleted) {
      this.dialog.show(NPC_DIALOG_1F, () => {
        introCompleted = true
        this.movementLocked = false
      })
    }
  }

  update(_time: number, delta: number) {
    this.handleMovement(delta)
    this.checkTriggers()
  }

  // ── Floor setup ──────────────────────────────────────

  private create1F() {
    this.mapCols = 7
    this.mapRows = 7
    this.drawField(0x2d5a1b, 0x1e3e12)
    this.drawStair(STAIRS_1F_UP, '▲', 0x886622, 0xffdd88, '#ffdd88')
    this.createSecretStairs()
    this.createStatues()
    this.drawNpc(NPC_1F, '老', 0xaa8844)
    this.npcs = [{ pos: NPC_1F, dialog: NPC_DIALOG_1F }]
  }

  private create2F() {
    this.mapCols = COLS_2F
    this.mapRows = ROWS_2F
    for (const w of WALLS_2F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x1a1a2a, 0x111122)
    this.drawWalls2F()
    this.drawStair(STAIRS_2F_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')

    const bossDefeated = SaveManager.state.bossDefeats[0] !== 0
    if (bossDefeated) {
      this.drawStair(STAIRS_2F_UP, '▲', 0x886622, 0xffdd88, '#ffdd88')
    } else {
      this.drawStair(STAIRS_2F_UP, '▲', 0x444444, 0x666666, '#666666')
    }

    for (const def of NPC_2F_DEFS) this.drawNpc(def.pos, '人', 0x447744)
    this.npcs = NPC_2F_DEFS.map(d => ({ pos: { ...d.pos }, dialog: d.dialog }))

    if (!bossDefeated) {
      this.bossPos = { ...BOSS_2F_POS }
      this.drawOilSlimeKing()
    }

    if (!SaveManager.state.skills.includes(SKILL_CODE)) {
      this.drawSkillItem()
    }
  }

  private create3F() {
    this.mapCols = 7
    this.mapRows = 7
    this.drawField(0x2a1a0a, 0x1a1008)
    this.drawStair({ x: 3, y: 6 }, '▼', 0x334422, 0x88dd44, '#88dd44')
    this.drawNpc({ x: 3, y: 3 }, '？', 0x888888)
    this.npcs = [{ pos: { x: 3, y: 3 }, dialog: ['（この先はまだ暗い。しかし道は必ずある。）'] }]
  }

  private createMinus1F() {
    this.mapCols = 7
    this.mapRows = 7
    this.drawField(0x000011, 0x110033)
    this.drawStair({ x: 3, y: 6 }, '▲', 0x334422, 0x88dd44, '#88dd44')
    this.drawNpc({ x: 3, y: 3 }, '？', 0x333366)
    this.npcs = [{ pos: { x: 3, y: 3 }, dialog: ['（暗くて何も見えない。）'] }]
  }

  // ── Drawing helpers ──────────────────────────────────

  private tileCenter(gx: number, gy: number) {
    return { x: gx * TILE + TILE / 2, y: gy * TILE + TILE / 2 }
  }

  private drawField(fill: number, gridLine: number) {
    const g = this.add.graphics()
    g.fillStyle(fill)
    g.fillRect(0, 0, this.mapCols * TILE, this.mapRows * TILE)
    g.lineStyle(1, gridLine)
    for (let c = 0; c <= this.mapCols; c++) g.lineBetween(c * TILE, 0, c * TILE, this.mapRows * TILE)
    for (let r = 0; r <= this.mapRows; r++) g.lineBetween(0, r * TILE, this.mapCols * TILE, r * TILE)
  }

  private drawWalls2F() {
    const g = this.add.graphics()
    g.fillStyle(0x555566)
    g.lineStyle(1, 0x8888aa)
    for (const w of WALLS_2F) {
      g.fillRect(w.x * TILE, w.y * TILE, TILE, TILE)
      g.strokeRect(w.x * TILE, w.y * TILE, TILE, TILE)
    }
  }

  private drawStair(
    pos: { x: number; y: number },
    symbol: string,
    bg: number,
    border: number,
    textColor: string,
  ) {
    const { x, y } = this.tileCenter(pos.x, pos.y)
    this.add.rectangle(x, y, TILE - 4, TILE - 4, bg).setStrokeStyle(2, border)
    this.add.text(x, y, symbol, { fontSize: '28px', color: textColor, fontFamily: 'monospace' }).setOrigin(0.5)
  }

  private createSecretStairs() {
    const { x, y } = this.tileCenter(STATUE_R.x, STATUE_R.y)
    const rect = this.add.rectangle(0, 0, TILE - 4, TILE - 4, 0x224466).setStrokeStyle(2, 0x88ccff)
    const label = this.add.text(0, 0, '▼', {
      fontSize: '28px', color: '#88ccff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.secretStairsContainer = this.add.container(x, y, [rect, label]).setVisible(false)
  }

  private createStatues() {
    for (const origin of [STATUE_L, STATUE_R]) {
      const { x, y } = this.tileCenter(origin.x, origin.y)
      const rect = this.add.rectangle(0, 0, TILE - 8, TILE - 8, 0x333344).setStrokeStyle(2, 0x8888bb)
      const text = this.add.text(0, 0, '像', {
        fontSize: '28px', color: '#aaaacc', fontFamily: 'monospace',
      }).setOrigin(0.5)
      const c = this.add.container(x, y, [rect, text])
      this.statues.push({ pos: { x: origin.x, y: origin.y }, container: c })
    }
  }

  private drawNpc(pos: { x: number; y: number }, label: string, color: number) {
    const { x, y } = this.tileCenter(pos.x, pos.y)
    const rect = this.add.rectangle(0, 0, TILE - 10, TILE - 10, color)
    const text = this.add.text(0, 0, label, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.container(x, y, [rect, text])
  }

  private drawOilSlimeKing() {
    if (!this.bossPos) return
    const { x, y } = this.tileCenter(this.bossPos.x, this.bossPos.y)
    const g = this.add.graphics()
    g.fillStyle(0x2a3a4d)
    g.lineStyle(3, 0x6688aa)
    g.fillCircle(0, 2, 24)
    g.strokeCircle(0, 2, 24)
    g.fillStyle(0x55708c, 0.6)
    g.fillCircle(-8, -6, 7)
    const crown = this.add.text(0, -14, '♛', {
      fontSize: '14px', color: '#c9a227', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.container(x, y, [g, crown])
  }

  private drawSkillItem() {
    const { x, y } = this.tileCenter(SKILL_POS.x, SKILL_POS.y)
    const glow = this.add.rectangle(0, 0, TILE - 8, TILE - 8, 0x886600, 0.4).setStrokeStyle(2, 0xffdd44)
    const star = this.add.text(0, 0, '★', {
      fontSize: '28px', color: '#ffdd44', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.skillItemContainer = this.add.container(x, y, [glow, star])
  }

  private createHero() {
    const g = this.add.graphics()
    const c = 0x88aaff
    g.fillStyle(c, 1)
    g.lineStyle(2, c, 1)
    g.fillCircle(0, -14, 7)
    g.lineBetween(0, -7, 0, 8)
    g.lineBetween(-11, -1, 11, -1)
    g.lineBetween(0, 8, -9, 20)
    g.lineBetween(0, 8, 9, 20)
    this.heroContainer = this.add.container(this.heroPixelX, this.heroPixelY, [g])
  }

  private createHud() {
    const bg = this.add.rectangle(0, 0, 90, 22, 0x000000, 0.7).setOrigin(0).setScrollFactor(0)
    this.hpText = this.add.text(6, 3, `HP: ${SaveManager.state.hp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    }).setScrollFactor(0)
    this.add.container(4, 4, [bg, this.hpText]).setScrollFactor(0)
  }

  // ── Collision ────────────────────────────────────────

  private overlapsTile(px: number, py: number, tx: number, ty: number): boolean {
    return (
      px + HERO_HALF > tx * TILE &&
      px - HERO_HALF < (tx + 1) * TILE &&
      py + HERO_HALF > ty * TILE &&
      py - HERO_HALF < (ty + 1) * TILE
    )
  }

  private collidesWithWalls(px: number, py: number): boolean {
    const x0 = Math.floor((px - HERO_HALF) / TILE)
    const x1 = Math.floor((px + HERO_HALF - 1) / TILE)
    const y0 = Math.floor((py - HERO_HALF) / TILE)
    const y1 = Math.floor((py + HERO_HALF - 1) / TILE)
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        if (this.wallSet.has(`${tx},${ty}`)) return true
      }
    }
    return false
  }

  private collidesWithNpcs(px: number, py: number): boolean {
    return this.npcs.some(n => this.overlapsTile(px, py, n.pos.x, n.pos.y))
  }

  private collidesWithBoss(px: number, py: number): boolean {
    if (!this.bossPos) return false
    return this.overlapsTile(px, py, this.bossPos.x, this.bossPos.y)
  }

  private getCollidingStatue(px: number, py: number): StatueDef | null {
    return this.statues.find(s => this.overlapsTile(px, py, s.pos.x, s.pos.y)) ?? null
  }

  private isSolidTileForStatue(tx: number, ty: number, exclude: StatueDef): boolean {
    if (this.npcs.some(n => n.pos.x === tx && n.pos.y === ty)) return true
    if (tx === STAIRS_1F_UP.x && ty === STAIRS_1F_UP.y) return true
    return this.statues.some(s => s !== exclude && s.pos.x === tx && s.pos.y === ty)
  }

  private tryPushStatue(statue: StatueDef, dx: number, dy: number): boolean {
    const nx = statue.pos.x + dx
    const ny = statue.pos.y + dy
    if (nx < 0 || nx >= this.mapCols || ny < 0 || ny >= this.mapRows) return false
    if (this.isSolidTileForStatue(nx, ny, statue)) return false

    statue.pos.x = nx
    statue.pos.y = ny
    const center = this.tileCenter(nx, ny)
    statue.container.setPosition(center.x, center.y)

    const isRightStatue = statue === this.statues[1]
    if (isRightStatue && !this.secretStairsRevealed &&
        (nx !== STATUE_R.x || ny !== STATUE_R.y)) {
      this.secretStairsRevealed = true
      this.secretStairsContainer?.setVisible(true)
    }
    return true
  }

  // ── Movement & triggers ──────────────────────────────

  private handleMovement(delta: number) {
    if (this.dialog.isVisible || this.statusScreen.isVisible || this.movementLocked || this.transitioning) return

    const dt = delta / 1000
    let dx = 0
    let dy = 0
    if (this.cursors.left.isDown)  dx -= SPEED * dt
    if (this.cursors.right.isDown) dx += SPEED * dt
    if (this.cursors.up.isDown)    dy -= SPEED * dt
    if (this.cursors.down.isDown)  dy += SPEED * dt
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

    const nx = this.heroPixelX + dx
    const ny = this.heroPixelY + dy

    if (nx - HERO_HALF >= 0 && nx + HERO_HALF <= this.mapCols * TILE) {
      const hit = this.getCollidingStatue(nx, this.heroPixelY)
      if (hit === null &&
          !this.collidesWithWalls(nx, this.heroPixelY) &&
          !this.collidesWithNpcs(nx, this.heroPixelY) &&
          !this.collidesWithBoss(nx, this.heroPixelY)) {
        this.heroPixelX = nx
      } else if (hit !== null && dy === 0) {
        if (this.tryPushStatue(hit, dx > 0 ? 1 : -1, 0)) this.heroPixelX = nx
      }
    }

    if (ny - HERO_HALF >= 0 && ny + HERO_HALF <= this.mapRows * TILE) {
      const hit = this.getCollidingStatue(this.heroPixelX, ny)
      if (hit === null &&
          !this.collidesWithWalls(this.heroPixelX, ny) &&
          !this.collidesWithNpcs(this.heroPixelX, ny) &&
          !this.collidesWithBoss(this.heroPixelX, ny)) {
        this.heroPixelY = ny
      } else if (hit !== null && dx === 0) {
        if (this.tryPushStatue(hit, 0, dy > 0 ? 1 : -1)) this.heroPixelY = ny
      }
    }

    this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
  }

  private checkTriggers() {
    if (this.dialog.isVisible || this.statusScreen.isVisible || this.movementLocked || this.transitioning) return
    const z = SaveManager.state.heroZ
    if (z === 1)       this.checkTriggers1F()
    else if (z === 2)  this.checkTriggers2F()
    else if (z === 3)  this.checkTriggers3F()
    else if (z === -1) this.checkTriggersMinus1F()
  }

  private checkTriggers1F() {
    const tx = Math.floor(this.heroPixelX / TILE)
    const ty = Math.floor(this.heroPixelY / TILE)

    if (tx === STAIRS_1F_UP.x && ty === STAIRS_1F_UP.y) {
      this.transitioning = true
      SaveManager.state.heroX = 7
      SaveManager.state.heroY = 13
      SaveManager.state.heroZ = 2
      this.scene.restart()
      return
    }

    if (this.secretStairsRevealed && tx === STATUE_R.x && ty === STATUE_R.y) {
      this.transitioning = true
      SaveManager.state.heroX = 3
      SaveManager.state.heroY = 0
      SaveManager.state.heroZ = -1
      this.scene.restart()
    }
  }

  private checkTriggers2F() {
    const tx = Math.floor(this.heroPixelX / TILE)
    const ty = Math.floor(this.heroPixelY / TILE)

    if (this.bossPos) {
      const bc = this.tileCenter(this.bossPos.x, this.bossPos.y)
      if (Math.hypot(this.heroPixelX - bc.x, this.heroPixelY - bc.y) < TILE) {
        this.transitioning = true
        this.syncState()
        this.scene.start('BattleScene', OIL_SLIME_KING)
        return
      }
    }

    const bossDefeated = SaveManager.state.bossDefeats[0] !== 0

    if (bossDefeated && tx === STAIRS_2F_UP.x && ty === STAIRS_2F_UP.y) {
      this.transitioning = true
      SaveManager.state.heroX = 3
      SaveManager.state.heroY = 6
      SaveManager.state.heroZ = 3
      this.scene.restart()
      return
    }

    if (tx === STAIRS_2F_DOWN.x && ty === STAIRS_2F_DOWN.y) {
      this.transitioning = true
      SaveManager.state.heroX = STAIRS_1F_UP.x
      SaveManager.state.heroY = STAIRS_1F_UP.y + 1
      SaveManager.state.heroZ = 1
      this.scene.restart()
      return
    }

    if (!SaveManager.state.skills.includes(SKILL_CODE) &&
        tx === SKILL_POS.x && ty === SKILL_POS.y) {
      const slot = SaveManager.state.skills.indexOf(0)
      if (slot !== -1) {
        const wasValid = SaveManager.isRingValid()
        SaveManager.state.skills[slot] = SKILL_CODE
        if (wasValid) SaveManager.updateRing()
        this.skillItemContainer?.setVisible(false)
        this.dialog.show(['「防御」を覚えた！\n1ターンだけ相手の攻撃を無効化する。'])
      }
    }
  }

  private checkTriggers3F() {
    const tx = Math.floor(this.heroPixelX / TILE)
    const ty = Math.floor(this.heroPixelY / TILE)
    if (tx === 3 && ty === 6) {
      this.transitioning = true
      SaveManager.state.heroX = STAIRS_2F_UP.x
      SaveManager.state.heroY = STAIRS_2F_UP.y + 1
      SaveManager.state.heroZ = 2
      this.scene.restart()
    }
  }

  private checkTriggersMinus1F() {
    const tx = Math.floor(this.heroPixelX / TILE)
    const ty = Math.floor(this.heroPixelY / TILE)
    if (tx === 3 && ty === 6) {
      this.transitioning = true
      SaveManager.state.heroX = STATUE_R.x
      SaveManager.state.heroY = STATUE_R.y + 1
      SaveManager.state.heroZ = 1
      this.scene.restart()
    }
  }

  private isNear(pos: { x: number; y: number }): boolean {
    const { x, y } = this.tileCenter(pos.x, pos.y)
    return Math.hypot(this.heroPixelX - x, this.heroPixelY - y) < TILE * 1.2
  }

  // ── Input & buttons ──────────────────────────────────

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.statusScreen.isVisible) {
        if (e.code === 'ArrowUp')        this.statusScreen.moveUp()
        else if (e.code === 'ArrowDown') this.statusScreen.moveDown()
        else if (e.code === 'KeyX')      this.statusScreen.hide()
        return
      }

      if (this.dialog.isVisible) {
        if (e.code === 'KeyZ') this.dialog.advance()
        if (e.code === 'KeyX') this.dialog.dismiss()
        return
      }

      if (this.movementLocked) return

      if (e.code === 'KeyS') {
        this.statusScreen.show()
        return
      }

      if (e.code === 'KeyZ') {
        const nearNpc = this.npcs.find(n => this.isNear(n.pos))
        if (nearNpc) { this.dialog.show(nearNpc.dialog); return }
        const nearStatue = this.statues.find(s => this.isNear(s.pos))
        if (nearStatue) this.dialog.show(STATUE_DIALOG)
      }
    })
  }

  private syncState() {
    const gx = Math.round((this.heroPixelX - TILE / 2) / TILE)
    const gy = Math.round((this.heroPixelY - TILE / 2) / TILE)
    SaveManager.state.heroX = Math.max(0, Math.min(this.mapCols - 1, gx))
    SaveManager.state.heroY = Math.max(0, Math.min(this.mapRows - 1, gy))
  }

  private setupButtons() {
    const saveBtn = document.getElementById('save-btn')
    const loadBtn = document.getElementById('load-btn')

    const onSave = () => {
      this.syncState()
      SaveManager.save()
    }

    const onLoad = async () => {
      const prevZ = SaveManager.state.heroZ
      const ok = await SaveManager.load()
      if (!ok) return
      const s = SaveManager.state
      if (s.heroZ !== prevZ) { this.scene.restart(); return }
      this.heroPixelX = s.heroX * TILE + TILE / 2
      this.heroPixelY = s.heroY * TILE + TILE / 2
      this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
      this.hpText.setText(`HP: ${s.hp}`)
    }

    saveBtn?.addEventListener('click', onSave)
    loadBtn?.addEventListener('click', onLoad)
    this.events.once('shutdown', () => {
      saveBtn?.removeEventListener('click', onSave)
      loadBtn?.removeEventListener('click', onLoad)
    })
  }
}
