import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { StatusScreen } from '../objects/StatusScreen'

const TILE = 64
const COLS = 7
const ROWS = 7
const SPEED = 128
const HERO_HALF = 20

const NPC_POS         = { x: 2, y: 4 }
const STATUE_L_ORIGIN = { x: 1, y: 0 }
const STATUE_R_ORIGIN = { x: 5, y: 0 }
const STAIRS_UP_POS   = { x: 3, y: 0 }

const NPC_DIALOG = [
  '老人「……来たか、勇者よ。わしは姫の家来じゃ。\n姫は不正を見透かす力でわれわれの国の安全を\n守ってくれていた。そんな姫が魔王に攫われた。\n塔を登り、頂で魔王を倒すのがそなたの\n使命じゃ。姫を救ってくれ。」',
  '老人「道中には魔王の手下が潜んでいる。\nやつらは手強い。道中でこまめにセーブするのじゃぞ。\n……ただし、不正はいかんぞ。\n魔王は姫の力でそなたを見透かしている。」',
  '老人「これを持ちなさい。\n姫が残した「誠実のリング」じゃ。\n誠実でいれば、きっとそなたを守ってくれるだろう。\nSボタンでステータスを確認できる。\nそこでそなたの誠実さを確認できるだろう。」',
]

const STATUE_DIALOG = [
  '「魔王の石像」\n頂の間への道を守護する像。\n頂点に君臨する魔王を模したという。',
]

let introCompleted = false

type StatueDef = {
  pos: { x: number; y: number }
  container: Phaser.GameObjects.Container
}

export class GameScene extends Phaser.Scene {
  private heroPixelX = 0
  private heroPixelY = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private transitioning = false
  private movementLocked = false

  private heroContainer!: Phaser.GameObjects.Container
  private hpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox
  private statusScreen!: StatusScreen

  private statues: StatueDef[] = []
  private secretStairsRevealed = false
  private secretStairsContainer!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.transitioning = false
    this.secretStairsRevealed = false
    this.statues = []
    this.movementLocked = !introCompleted

    const s = SaveManager.state
    this.heroPixelX = s.heroX * TILE + TILE / 2
    this.heroPixelY = s.heroY * TILE + TILE / 2

    this.drawField()
    this.createStairs()
    this.createSecretStairs()
    this.createStatues()
    this.createNpc()
    this.createHero()
    this.createHud()
    this.createKeyHint()
    this.dialog = new DialogBox(this, 8, ROWS * TILE - 118, COLS * TILE - 16, 100)
    this.statusScreen = new StatusScreen(this)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.setupInput()
    this.setupButtons()

    if (!introCompleted) {
      this.dialog.show(NPC_DIALOG, () => {
        introCompleted = true
        this.movementLocked = false
      })
    }
  }

  update(_time: number, delta: number) {
    this.handleMovement(delta)
    this.checkTriggers()
  }

  private tileCenter(gx: number, gy: number) {
    return { x: gx * TILE + TILE / 2, y: gy * TILE + TILE / 2 }
  }

  private drawField() {
    const g = this.add.graphics()
    g.fillStyle(0x2d5a1b)
    g.fillRect(0, 0, COLS * TILE, ROWS * TILE)
    g.lineStyle(1, 0x1e3e12)
    for (let c = 0; c <= COLS; c++) g.lineBetween(c * TILE, 0, c * TILE, ROWS * TILE)
    for (let r = 0; r <= ROWS; r++) g.lineBetween(0, r * TILE, COLS * TILE, r * TILE)
  }

  private createStairs() {
    const { x, y } = this.tileCenter(STAIRS_UP_POS.x, STAIRS_UP_POS.y)
    this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x886622).setStrokeStyle(2, 0xffdd88)
    this.add.text(x, y, '▲', {
      fontSize: '28px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private createSecretStairs() {
    const { x, y } = this.tileCenter(STATUE_R_ORIGIN.x, STATUE_R_ORIGIN.y)
    const rect = this.add.rectangle(0, 0, TILE - 4, TILE - 4, 0x224466).setStrokeStyle(2, 0x88ccff)
    const label = this.add.text(0, 0, '▼', {
      fontSize: '28px', color: '#88ccff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.secretStairsContainer = this.add.container(x, y, [rect, label])
    this.secretStairsContainer.setVisible(false)
  }

  private createStatues() {
    for (const origin of [STATUE_L_ORIGIN, STATUE_R_ORIGIN]) {
      const { x, y } = this.tileCenter(origin.x, origin.y)
      const rect = this.add.rectangle(0, 0, TILE - 8, TILE - 8, 0x333344).setStrokeStyle(2, 0x8888bb)
      const text = this.add.text(0, 0, '像', {
        fontSize: '28px', color: '#aaaacc', fontFamily: 'monospace',
      }).setOrigin(0.5)
      const container = this.add.container(x, y, [rect, text])
      this.statues.push({ pos: { x: origin.x, y: origin.y }, container })
    }
  }

  private createNpc() {
    const { x, y } = this.tileCenter(NPC_POS.x, NPC_POS.y)
    const rect = this.add.rectangle(0, 0, TILE - 10, TILE - 10, 0xaa8844)
    const text = this.add.text(0, 0, '老', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.container(x, y, [rect, text])
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
    const bg = this.add.rectangle(0, 0, 90, 22, 0x000000, 0.7).setOrigin(0)
    this.hpText = this.add.text(6, 3, `HP: ${SaveManager.state.hp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })
    this.add.container(4, 4, [bg, this.hpText])
  }

  private createKeyHint() {
    this.add.text(COLS * TILE - 6, 4, 'Z:決定  X:キャンセル  S:ステータス', {
      fontSize: '10px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(1, 0)
  }

  private overlapsTile(px: number, py: number, tx: number, ty: number): boolean {
    return (
      px + HERO_HALF > tx * TILE &&
      px - HERO_HALF < (tx + 1) * TILE &&
      py + HERO_HALF > ty * TILE &&
      py - HERO_HALF < (ty + 1) * TILE
    )
  }

  private getCollidingStatue(px: number, py: number): StatueDef | null {
    return this.statues.find(s => this.overlapsTile(px, py, s.pos.x, s.pos.y)) ?? null
  }

  private isSolidTileForStatue(tx: number, ty: number, exclude: StatueDef): boolean {
    if (tx === NPC_POS.x && ty === NPC_POS.y) return true
    if (tx === STAIRS_UP_POS.x && ty === STAIRS_UP_POS.y) return true
    return this.statues.some(s => s !== exclude && s.pos.x === tx && s.pos.y === ty)
  }

  private tryPushStatue(statue: StatueDef, dx: number, dy: number): boolean {
    const nx = statue.pos.x + dx
    const ny = statue.pos.y + dy
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false
    if (this.isSolidTileForStatue(nx, ny, statue)) return false

    statue.pos.x = nx
    statue.pos.y = ny
    const center = this.tileCenter(nx, ny)
    statue.container.setPosition(center.x, center.y)

    const isRightStatue = statue === this.statues[1]
    if (isRightStatue && !this.secretStairsRevealed &&
        (nx !== STATUE_R_ORIGIN.x || ny !== STATUE_R_ORIGIN.y)) {
      this.secretStairsRevealed = true
      this.secretStairsContainer.setVisible(true)
    }
    return true
  }

  private handleMovement(delta: number) {
    if (this.dialog.isVisible || this.statusScreen.isVisible || this.movementLocked || this.transitioning) return

    const dt = delta / 1000
    let dx = 0
    let dy = 0

    if (this.cursors.left.isDown)  dx -= SPEED * dt
    if (this.cursors.right.isDown) dx += SPEED * dt
    if (this.cursors.up.isDown)    dy -= SPEED * dt
    if (this.cursors.down.isDown)  dy += SPEED * dt

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707
      dy *= 0.707
    }

    const nx = this.heroPixelX + dx
    const ny = this.heroPixelY + dy

    if (nx - HERO_HALF >= 0 && nx + HERO_HALF <= COLS * TILE) {
      const hit = this.getCollidingStatue(nx, this.heroPixelY)
      if (hit === null && !this.overlapsTile(nx, this.heroPixelY, NPC_POS.x, NPC_POS.y)) {
        this.heroPixelX = nx
      } else if (hit !== null && dy === 0) {
        if (this.tryPushStatue(hit, dx > 0 ? 1 : -1, 0)) {
          this.heroPixelX = nx
        }
      }
    }

    if (ny - HERO_HALF >= 0 && ny + HERO_HALF <= ROWS * TILE) {
      const hit = this.getCollidingStatue(this.heroPixelX, ny)
      if (hit === null && !this.overlapsTile(this.heroPixelX, ny, NPC_POS.x, NPC_POS.y)) {
        this.heroPixelY = ny
      } else if (hit !== null && dx === 0) {
        if (this.tryPushStatue(hit, 0, dy > 0 ? 1 : -1)) {
          this.heroPixelY = ny
        }
      }
    }

    this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
  }

  private checkTriggers() {
    if (this.dialog.isVisible || this.statusScreen.isVisible || this.movementLocked || this.transitioning) return

    const tileX = Math.floor(this.heroPixelX / TILE)
    const tileY = Math.floor(this.heroPixelY / TILE)

    if (tileX === STAIRS_UP_POS.x && tileY === STAIRS_UP_POS.y) {
      this.transitioning = true
      SaveManager.state.heroX = 3
      SaveManager.state.heroY = 6
      SaveManager.state.heroZ = 2
      this.scene.restart()
      return
    }

    if (this.secretStairsRevealed &&
        tileX === STATUE_R_ORIGIN.x && tileY === STATUE_R_ORIGIN.y) {
      this.transitioning = true
      SaveManager.state.heroX = 3
      SaveManager.state.heroY = 0
      SaveManager.state.heroZ = -1
      this.scene.restart()
    }
  }

  private isNear(pos: { x: number; y: number }): boolean {
    const { x, y } = this.tileCenter(pos.x, pos.y)
    return Math.hypot(this.heroPixelX - x, this.heroPixelY - y) < TILE * 1.2
  }

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
        if (this.isNear(NPC_POS)) this.dialog.show(NPC_DIALOG)
        const nearStatue = this.statues.find(s => this.isNear(s.pos))
        if (nearStatue) this.dialog.show(STATUE_DIALOG)
      }
    })
  }

  private syncState() {
    const gx = Math.round((this.heroPixelX - TILE / 2) / TILE)
    const gy = Math.round((this.heroPixelY - TILE / 2) / TILE)
    SaveManager.state.heroX = Math.max(0, Math.min(COLS - 1, gx))
    SaveManager.state.heroY = Math.max(0, Math.min(ROWS - 1, gy))
  }

  private setupButtons() {
    const saveBtn = document.getElementById('save-btn')
    const loadBtn = document.getElementById('load-btn')

    const onSave = () => {
      this.syncState()
      SaveManager.save()
    }

    const onLoad = async () => {
      const ok = await SaveManager.load()
      if (!ok) return
      const s = SaveManager.state
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
