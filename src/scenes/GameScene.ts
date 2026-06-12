import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { StatusScreen } from '../objects/StatusScreen'
import type { BossConfig, BossVisual } from './BattleScene'
import {
  type NpcData,
  COLS_1F, ROWS_1F, NPCS_1F, NPC_DIALOG_1F, STATUE_DIALOG,
  STAIRS_1F_UP, STATUE_L, STATUE_R,
  COLS_2F, ROWS_2F, WALLS_2F, NPCS_2F, KING_SLIME,
  STAIRS_2F_UP, STAIRS_2F_DOWN, BOSS_2F_POS, SKILL_2F_POS,
  COLS_3F, ROWS_3F, MIN_COL_3F, WALLS_3F, NPCS_3F, GOLEM,
  STAIRS_3F_UP, STAIRS_3F_DOWN, BOSS_3F_POS, HIDDEN_SKILL_POS, HIDDEN_EXIT_POS,
  COLS_4F, ROWS_4F, WALLS_4F, NPCS_4F, DULLAHAN,
  STAIRS_4F_UP, STAIRS_4F_DOWN, BOSS_4F_POS, SKILL_4F_POS,
  COLS_5F, ROWS_5F, WALLS_5F, NPCS_5F, DRAGON,
  STAIRS_5F_UP, STAIRS_5F_DOWN, BOSS_5F_POS, SHRINE_POS,
  OLD_MAN_NPC_CODE, SHRINE_DIALOG_LOCKED, SHRINE_DIALOG_UNLOCKED,
  COLS_TOP, ROWS_TOP, WALLS_TOP, NPCS_TOP, MAOU,
  STAIRS_TOP_DOWN, BOSS_TOP_POS, SKILL_TOP_POS, PRINCESS_POS, PRINCESS_DIALOG,
  COLS_M1F, ROWS_M1F, WALLS_M1F, NPCS_M1F, CHAOS,
  STAIRS_M1F_UP, BOSS_M1F_POS,
} from '../data/floors'

const TILE = 64
const SPEED = 128
const HERO_HALF = 20

// ─── Module state ─────────────────────────────────────
let introCompleted = false

// ─── Types ────────────────────────────────────────────
type StatueDef = { pos: { x: number; y: number }; container: Phaser.GameObjects.Container }
type NpcDef    = { pos: { x: number; y: number }; dialog: string[] | (() => string[]) }
type SkillItem = {
  pos: { x: number; y: number }
  code: number
  messages: string[]
  container: Phaser.GameObjects.Container
  teleportTo?: { x: number; y: number }
  consumed?: boolean
}
type SceneFlowData = { victorySlot?: number; loadedMessage?: boolean }

// ─── Scene ────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  private heroPixelX = 0
  private heroPixelY = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private transitioning = false
  private movementLocked = false
  private mapCols = 7
  private mapRows = 7
  private minCol = 0

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
  private bossConfig: BossConfig | null = null
  private skillItems: SkillItem[] = []
  private lockedStairNotified = false
  private hiddenRoomNotified = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(data?: SceneFlowData) {
    // restart()/start() はデータ未指定だと前回の settings.data を使い回すため、
    // 受け取った時点で消費済みにして再表示を防ぐ
    this.sys.settings.data = {}

    let z = SaveManager.state.heroZ
    if (![1, 2, 3, 4, 5, 6, -1].includes(z)) {
      SaveManager.state.heroZ = 1
      SaveManager.state.heroX = 3
      SaveManager.state.heroY = 4
      z = 1
    }
    this.transitioning = false
    this.secretStairsRevealed = false
    this.statues = []
    this.npcs = []
    this.wallSet = new Set()
    this.bossPos = null
    this.bossConfig = null
    this.skillItems = []
    this.lockedStairNotified = false
    this.hiddenRoomNotified = false
    this.minCol = 0
    this.movementLocked = z === 1 && !introCompleted

    if (z === 1)       this.create1F()
    else if (z === 2)  this.create2F()
    else if (z === 3)  this.create3F()
    else if (z === 4)  this.create4F()
    else if (z === 5)  this.create5F()
    else if (z === 6)  this.createTopFloor()
    else               this.createMinus1F()

    const cx = Math.max(this.minCol, Math.min(this.mapCols - 1, SaveManager.state.heroX))
    const cy = Math.max(0, Math.min(this.mapRows - 1, SaveManager.state.heroY))
    this.heroPixelX = cx * TILE + TILE / 2
    this.heroPixelY = cy * TILE + TILE / 2

    this.createHero()
    this.cameras.main.startFollow(this.heroContainer, true)
    this.cameras.main.setBounds(
      this.minCol * TILE, 0,
      (this.mapCols - this.minCol) * TILE, this.mapRows * TILE,
    )

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
      return
    }

    if (data?.loadedMessage) {
      this.dialog.show(['ロードしました。'])
    } else if (data?.victorySlot !== undefined) {
      this.dialog.show([
        data.victorySlot === 4
          ? '姫に話しかけてみよう。'
          : '上へ続く階段が開いた！',
      ])
    }
  }

  update(_time: number, delta: number) {
    this.handleMovement(delta)
    this.checkTriggers()
  }

  // ── Floor setup ──────────────────────────────────────

  private create1F() {
    this.mapCols = COLS_1F
    this.mapRows = ROWS_1F
    this.drawField(0x2d5a1b, 0x1e3e12)
    this.drawStair(STAIRS_1F_UP, '▲', 0x886622, 0xffdd88, '#ffdd88')
    this.createSecretStairs()
    this.createStatues()
    this.setNpcs(NPCS_1F, this.isBossDefeated(MAOU))
  }

  private create2F() {
    this.mapCols = COLS_2F
    this.mapRows = ROWS_2F
    for (const w of WALLS_2F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x1a1a2a, 0x111122)
    this.drawWalls(WALLS_2F, 0x555566, 0x8888aa)
    this.drawStair(STAIRS_2F_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')
    this.drawLockableStair(STAIRS_2F_UP, this.isBossDefeated(KING_SLIME))

    this.setNpcs(NPCS_2F, this.isBossDefeated(KING_SLIME))
    this.setupBoss(KING_SLIME, BOSS_2F_POS)
    this.addSkillItem(SKILL_2F_POS, 0x5F, [
      '「防御」を覚えた！\n1ターンだけ相手の攻撃を\n無効化する。\nコード: 0x5F',
    ])
  }

  private create3F() {
    this.mapCols = COLS_3F
    this.mapRows = ROWS_3F
    this.minCol = MIN_COL_3F
    for (const w of WALLS_3F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x2a1a0a, 0x1a1008)
    this.drawWalls(WALLS_3F, 0x554433, 0x887755)
    this.drawStair(STAIRS_3F_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')
    this.drawLockableStair(STAIRS_3F_UP, this.isBossDefeated(GOLEM))

    this.setNpcs(NPCS_3F, this.isBossDefeated(GOLEM))
    this.setupBoss(GOLEM, BOSS_3F_POS)
    this.addSkillItem(HIDDEN_SKILL_POS, 0xA3, [
      'スキル「ファイア」を会得した！\nコード: 0xA3 / 威力: 40',
      '不思議な力で、部屋の外へ\n弾き出された！',
    ], HIDDEN_EXIT_POS)
  }

  private create4F() {
    this.mapCols = COLS_4F
    this.mapRows = ROWS_4F
    for (const w of WALLS_4F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x10202a, 0x0a141c)
    this.drawWalls(WALLS_4F, 0x445566, 0x7788aa)
    this.drawStair(STAIRS_4F_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')
    this.drawLockableStair(STAIRS_4F_UP, this.isBossDefeated(DULLAHAN))

    this.setNpcs(NPCS_4F, this.isBossDefeated(DULLAHAN))
    this.setupBoss(DULLAHAN, BOSS_4F_POS)
    this.addSkillItem(SKILL_4F_POS, 0xC7, [
      'スキル「サンダー」を会得した！\nコード: 0xC7 / 威力: 75',
    ])
  }

  private create5F() {
    this.mapCols = COLS_5F
    this.mapRows = ROWS_5F
    for (const w of WALLS_5F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x202a10, 0x141c0a)
    this.drawWalls(WALLS_5F, 0x556644, 0x88aa66)
    this.drawStair(STAIRS_5F_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')
    this.drawLockableStair(STAIRS_5F_UP, this.isBossDefeated(DRAGON))

    this.setNpcs(NPCS_5F, this.isBossDefeated(DRAGON))
    this.drawNpc(SHRINE_POS, '祭', 0x886688)
    this.npcs.push({
      pos: { ...SHRINE_POS },
      dialog: () => SaveManager.state.npcCodes.includes(OLD_MAN_NPC_CODE)
        ? SHRINE_DIALOG_UNLOCKED
        : SHRINE_DIALOG_LOCKED,
    })
    this.setupBoss(DRAGON, BOSS_5F_POS)
  }

  private createTopFloor() {
    this.mapCols = COLS_TOP
    this.mapRows = ROWS_TOP
    for (const w of WALLS_TOP) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x2a1020, 0x1c0a14)
    this.drawWalls(WALLS_TOP, 0x663355, 0x995588)
    this.drawStair(STAIRS_TOP_DOWN, '▼', 0x334422, 0x88dd44, '#88dd44')

    this.setNpcs(NPCS_TOP, this.isBossDefeated(MAOU))
    if (!this.isBossDefeated(MAOU)) {
      this.setupBoss(MAOU, BOSS_TOP_POS)
    } else {
      this.drawNpc(PRINCESS_POS, '姫', 0xdd88aa)
      this.npcs.push({ pos: { ...PRINCESS_POS }, dialog: PRINCESS_DIALOG })
    }
    this.addSkillItem(SKILL_TOP_POS, 0xD9, [
      'スキル「ホーリー」を会得した！\nコード: 0xD9 / 威力: 200',
    ])
  }

  private createMinus1F() {
    this.mapCols = COLS_M1F
    this.mapRows = ROWS_M1F
    for (const w of WALLS_M1F) this.wallSet.add(`${w.x},${w.y}`)

    this.drawField(0x000011, 0x110033)
    this.drawWalls(WALLS_M1F, 0x222244, 0x444477)
    this.drawStair(STAIRS_M1F_UP, '▲', 0x886622, 0xffdd88, '#ffdd88')

    this.setNpcs(NPCS_M1F)
    this.setupBoss(CHAOS, BOSS_M1F_POS)
  }

  private setNpcs(defs: NpcData[], bossDefeated = false) {
    for (const d of defs) this.drawNpc(d.pos, d.label, d.color)
    this.npcs = defs.map(d => ({
      pos: { ...d.pos },
      dialog: bossDefeated && d.dialogAfterWin ? d.dialogAfterWin : d.dialog,
    }))
  }

  private isBossDefeated(boss: BossConfig): boolean {
    return (
      boss.defeatSlot !== undefined &&
      boss.defeatCode !== undefined &&
      SaveManager.state.bossDefeats[boss.defeatSlot] === boss.defeatCode
    )
  }

  private setupBoss(config: BossConfig, pos: { x: number; y: number }) {
    if (this.isBossDefeated(config)) return
    this.bossPos = { ...pos }
    this.bossConfig = config
    if (config.visual) this.drawBossMarker(pos, config.visual)
  }

  // ── Drawing helpers ──────────────────────────────────

  private tileCenter(gx: number, gy: number) {
    return { x: gx * TILE + TILE / 2, y: gy * TILE + TILE / 2 }
  }

  private drawField(fill: number, gridLine: number) {
    const x0 = this.minCol * TILE
    const g = this.add.graphics()
    g.fillStyle(fill)
    g.fillRect(x0, 0, (this.mapCols - this.minCol) * TILE, this.mapRows * TILE)
    g.lineStyle(1, gridLine)
    for (let c = this.minCol; c <= this.mapCols; c++) g.lineBetween(c * TILE, 0, c * TILE, this.mapRows * TILE)
    for (let r = 0; r <= this.mapRows; r++) g.lineBetween(x0, r * TILE, this.mapCols * TILE, r * TILE)
  }

  private drawWalls(walls: { x: number; y: number }[], fill: number, stroke: number) {
    const g = this.add.graphics()
    g.fillStyle(fill)
    g.lineStyle(1, stroke)
    for (const w of walls) {
      g.fillRect(w.x * TILE, w.y * TILE, TILE, TILE)
      g.strokeRect(w.x * TILE, w.y * TILE, TILE, TILE)
    }
  }

  private drawLockableStair(pos: { x: number; y: number }, unlocked: boolean) {
    if (unlocked) {
      this.drawStair(pos, '▲', 0x886622, 0xffdd88, '#ffdd88')
    } else {
      this.drawStair(pos, '▲', 0x444444, 0x666666, '#666666')
    }
  }

  private drawBossMarker(pos: { x: number; y: number }, visual: BossVisual) {
    const { x, y } = this.tileCenter(pos.x, pos.y)
    const g = this.add.graphics()
    g.fillStyle(visual.bodyColor)
    g.lineStyle(3, visual.strokeColor)
    g.fillCircle(0, 2, 24)
    g.strokeCircle(0, 2, 24)
    const mark = this.add.text(0, 0, visual.mark, {
      fontSize: '20px', color: visual.markColor, fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.container(x, y, [g, mark])
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

  private addSkillItem(
    pos: { x: number; y: number },
    code: number,
    messages: string[],
    teleportTo?: { x: number; y: number },
  ) {
    if (SaveManager.state.skills.includes(code)) return
    const { x, y } = this.tileCenter(pos.x, pos.y)
    const glow = this.add.rectangle(0, 0, TILE - 8, TILE - 8, 0x886600, 0.4).setStrokeStyle(2, 0xffdd44)
    const star = this.add.text(0, 0, '★', {
      fontSize: '28px', color: '#ffdd44', fontFamily: 'monospace',
    }).setOrigin(0.5)
    const container = this.add.container(x, y, [glow, star])
    this.skillItems.push({ pos: { ...pos }, code, messages, container, teleportTo })
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
      this.cameras.main.shake(300, 0.008)
      this.dialog.show(['ゴゴゴ…\nどこかで床の開く音がした。'])
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

    if (nx - HERO_HALF >= this.minCol * TILE && nx + HERO_HALF <= this.mapCols * TILE) {
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
    if (SaveManager.state.heroZ === 3 && this.checkHiddenRoomEntry()) return
    if (this.checkBossCollision()) return
    if (this.checkSkillPickups()) return

    const z = SaveManager.state.heroZ
    if (z === 1)       this.checkTriggers1F()
    else if (z === 2)  this.checkTriggers2F()
    else if (z === 3)  this.checkTriggers3F()
    else if (z === 4)  this.checkTriggers4F()
    else if (z === 5)  this.checkTriggers5F()
    else if (z === 6)  this.checkTriggersTopFloor()
    else if (z === -1) this.checkTriggersMinus1F()
  }

  private heroTile(): { tx: number; ty: number } {
    return {
      tx: Math.floor(this.heroPixelX / TILE),
      ty: Math.floor(this.heroPixelY / TILE),
    }
  }

  private checkHiddenRoomEntry(): boolean {
    const { tx } = this.heroTile()
    if (tx > -1) {
      this.hiddenRoomNotified = false
      return false
    }
    if (this.hiddenRoomNotified) return false
    this.hiddenRoomNotified = true
    this.cameras.main.flash(300, 255, 255, 180)
    this.dialog.show(['壁の向こう側に踏み込んだ…！'])
    return true
  }

  private notifyLockedStair(stair: { x: number; y: number }) {
    const { tx, ty } = this.heroTile()
    if (tx !== stair.x || ty !== stair.y) {
      this.lockedStairNotified = false
      return
    }
    if (this.lockedStairNotified) return
    this.lockedStairNotified = true
    this.dialog.show(['階段は固く閉ざされている。\nこの階の主を倒す\n必要がありそうだ。'])
  }

  private stairTo(x: number, y: number, z: number) {
    this.transitioning = true
    SaveManager.state.heroX = x
    SaveManager.state.heroY = y
    SaveManager.state.heroZ = z
    this.scene.restart()
  }

  private checkBossCollision(): boolean {
    if (!this.bossPos || !this.bossConfig) return false
    const bc = this.tileCenter(this.bossPos.x, this.bossPos.y)
    if (Math.hypot(this.heroPixelX - bc.x, this.heroPixelY - bc.y) >= TILE) return false
    this.transitioning = true
    this.syncState()
    this.scene.start('BattleScene', this.bossConfig)
    return true
  }

  private checkSkillPickups(): boolean {
    const { tx, ty } = this.heroTile()
    const item = this.skillItems.find(i => !i.consumed && i.pos.x === tx && i.pos.y === ty)
    if (!item) return false

    item.consumed = true
    const s = SaveManager.state
    if (!s.skills.includes(item.code)) {
      const slot = s.skills.indexOf(0)
      if (slot !== -1) {
        const wasValid = SaveManager.isRingValid()
        s.skills[slot] = item.code
        if (wasValid) SaveManager.updateRing()
      }
    }
    item.container.setVisible(false)

    const messages = [...item.messages]
    if (!s.skills.includes(item.code)) {
      messages.push('だがスキルスロットに空きがない！\nセーブデータのスロットを\n書き換えて装備しよう。')
    }
    this.dialog.show(messages, () => {
      if (item.teleportTo) this.teleportHero(item.teleportTo.x, item.teleportTo.y)
    })
    return true
  }

  private teleportHero(gx: number, gy: number) {
    this.heroPixelX = gx * TILE + TILE / 2
    this.heroPixelY = gy * TILE + TILE / 2
    this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
  }

  private checkTriggers1F() {
    const { tx, ty } = this.heroTile()

    if (tx === STAIRS_1F_UP.x && ty === STAIRS_1F_UP.y) {
      this.stairTo(7, 13, 2)
      return
    }

    if (this.secretStairsRevealed && tx === STATUE_R.x && ty === STATUE_R.y) {
      this.stairTo(STAIRS_M1F_UP.x, STAIRS_M1F_UP.y - 1, -1)
    }
  }

  private checkTriggers2F() {
    const { tx, ty } = this.heroTile()

    const defeated = this.isBossDefeated(KING_SLIME)
    if (defeated && tx === STAIRS_2F_UP.x && ty === STAIRS_2F_UP.y) {
      this.stairTo(STAIRS_3F_DOWN.x, STAIRS_3F_DOWN.y - 1, 3)
      return
    }
    if (!defeated) this.notifyLockedStair(STAIRS_2F_UP)

    if (tx === STAIRS_2F_DOWN.x && ty === STAIRS_2F_DOWN.y) {
      this.stairTo(STAIRS_1F_UP.x, STAIRS_1F_UP.y + 1, 1)
    }
  }

  private checkTriggers3F() {
    const { tx, ty } = this.heroTile()

    const defeated = this.isBossDefeated(GOLEM)
    if (defeated && tx === STAIRS_3F_UP.x && ty === STAIRS_3F_UP.y) {
      this.stairTo(STAIRS_4F_DOWN.x, STAIRS_4F_DOWN.y - 1, 4)
      return
    }
    if (!defeated) this.notifyLockedStair(STAIRS_3F_UP)

    if (tx === STAIRS_3F_DOWN.x && ty === STAIRS_3F_DOWN.y) {
      this.stairTo(STAIRS_2F_UP.x, STAIRS_2F_UP.y + 1, 2)
    }
  }

  private checkTriggers4F() {
    const { tx, ty } = this.heroTile()

    const defeated = this.isBossDefeated(DULLAHAN)
    if (defeated && tx === STAIRS_4F_UP.x && ty === STAIRS_4F_UP.y) {
      this.stairTo(STAIRS_5F_DOWN.x, STAIRS_5F_DOWN.y - 1, 5)
      return
    }
    if (!defeated) this.notifyLockedStair(STAIRS_4F_UP)

    if (tx === STAIRS_4F_DOWN.x && ty === STAIRS_4F_DOWN.y) {
      this.stairTo(STAIRS_3F_UP.x, STAIRS_3F_UP.y + 1, 3)
    }
  }

  private checkTriggers5F() {
    const { tx, ty } = this.heroTile()

    const defeated = this.isBossDefeated(DRAGON)
    if (defeated && tx === STAIRS_5F_UP.x && ty === STAIRS_5F_UP.y) {
      this.stairTo(STAIRS_TOP_DOWN.x, STAIRS_TOP_DOWN.y - 1, 6)
      return
    }
    if (!defeated) this.notifyLockedStair(STAIRS_5F_UP)

    if (tx === STAIRS_5F_DOWN.x && ty === STAIRS_5F_DOWN.y) {
      this.stairTo(STAIRS_4F_UP.x, STAIRS_4F_UP.y + 1, 4)
    }
  }

  private checkTriggersTopFloor() {
    const { tx, ty } = this.heroTile()
    if (tx === STAIRS_TOP_DOWN.x && ty === STAIRS_TOP_DOWN.y) {
      this.stairTo(STAIRS_5F_UP.x, STAIRS_5F_UP.y + 1, 5)
    }
  }

  private checkTriggersMinus1F() {
    const { tx, ty } = this.heroTile()
    if (tx === STAIRS_M1F_UP.x && ty === STAIRS_M1F_UP.y) {
      this.stairTo(STATUE_R.x, STATUE_R.y + 1, 1)
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
        if (nearNpc) {
          const lines = typeof nearNpc.dialog === 'function' ? nearNpc.dialog() : nearNpc.dialog
          this.dialog.show(lines)
          return
        }
        const nearStatue = this.statues.find(s => this.isNear(s.pos))
        if (nearStatue) this.dialog.show(STATUE_DIALOG)
      }
    })
  }

  private syncState() {
    const gx = Math.round((this.heroPixelX - TILE / 2) / TILE)
    const gy = Math.round((this.heroPixelY - TILE / 2) / TILE)
    SaveManager.state.heroX = Math.max(this.minCol, Math.min(this.mapCols - 1, gx))
    SaveManager.state.heroY = Math.max(0, Math.min(this.mapRows - 1, gy))
  }

  private setupButtons() {
    const saveBtn = document.getElementById('save-btn')
    const loadBtn = document.getElementById('load-btn')

    const onSave = () => {
      this.syncState()
      SaveManager.save()
      this.dialog.show(['セーブしました。\nsave_data.txt を保存した。'])
    }

    const onLoad = async () => {
      const prevZ = SaveManager.state.heroZ
      const result = await SaveManager.load()
      if (result === 'cancelled') return
      if (result === 'invalid') {
        this.dialog.show(['セーブデータが\n読み込めなかった。\nファイルの形式を確認しよう。'])
        return
      }
      const s = SaveManager.state
      if (s.heroZ !== prevZ) { this.scene.restart({ loadedMessage: true }); return }
      this.heroPixelX = s.heroX * TILE + TILE / 2
      this.heroPixelY = s.heroY * TILE + TILE / 2
      this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
      this.hpText.setText(`HP: ${s.hp}`)
      this.dialog.show(['ロードしました。'])
    }

    saveBtn?.addEventListener('click', onSave)
    loadBtn?.addEventListener('click', onLoad)
    this.events.once('shutdown', () => {
      saveBtn?.removeEventListener('click', onSave)
      loadBtn?.removeEventListener('click', onLoad)
    })
  }
}
