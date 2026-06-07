import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { BossConfig } from './BattleScene'

const TILE = 64
const COLS = 6
const ROWS = 6
const SPEED = 128   // px/sec
const HERO_HALF = 20  // 衝突判定の半径 (40×40 box)

const SOLDIER_POS = { x: 2, y: 1 }
const STAIRS_POS  = { x: 5, y: 0 }

const SOLDIER_DIALOG = [
  '兵士「よく来たな、勇者よ。\nセーブボタンで「save_data.txt」が\nダウンロードされるぞ。',
  '兵士「ファイルの中身は16進数で\n書かれておる。よく見てみよ！\nロードボタンで続きから始められる。',
  '兵士「この塔を登り、最上階の\n魔王を倒すのが使命だ。\n行って参れ！」',
]

// Step 2 で 2F ボスに差し替える
const TEST_BOSS: BossConfig = {
  name: 'スライム',
  maxHp: 20,
  attack: 3,
  defeatSlot: 0,
  defeatCode: 0x01,
  returnScene: 'GameScene',
}

export class GameScene extends Phaser.Scene {
  private heroPixelX = 0
  private heroPixelY = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private stairsTriggered = false

  private heroContainer!: Phaser.GameObjects.Container
  private hpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.stairsTriggered = false
    const s = SaveManager.state
    this.heroPixelX = s.heroX * TILE + TILE / 2
    this.heroPixelY = s.heroY * TILE + TILE / 2

    this.drawField()
    this.createStairs()
    this.createSoldier()
    this.createHero()
    this.createHud()
    this.createKeyHint()
    this.dialog = new DialogBox(this, 8, ROWS * TILE - 118, COLS * TILE - 16, 100)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.setupInput()
    this.setupButtons()
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
    const { x, y } = this.tileCenter(STAIRS_POS.x, STAIRS_POS.y)
    this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x886622).setStrokeStyle(2, 0xffdd88)
    this.add.text(x, y, '▲', {
      fontSize: '28px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private createCharacter(px: number, py: number, color: number, label: string) {
    const rect = this.add.rectangle(0, 0, TILE - 10, TILE - 10, color)
    const text = this.add.text(0, 0, label, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    return this.add.container(px, py, [rect, text])
  }

  private createHero() {
    this.heroContainer = this.createCharacter(this.heroPixelX, this.heroPixelY, 0x3366cc, '勇')
  }

  private createSoldier() {
    const { x, y } = this.tileCenter(SOLDIER_POS.x, SOLDIER_POS.y)
    this.createCharacter(x, y, 0xcc7722, '兵')
  }

  private createHud() {
    const bg = this.add.rectangle(0, 0, 90, 22, 0x000000, 0.7).setOrigin(0)
    this.hpText = this.add.text(6, 3, `HP: ${SaveManager.state.hp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })
    this.add.container(4, 4, [bg, this.hpText])
  }

  private createKeyHint() {
    this.add.text(COLS * TILE - 6, 4, 'Z:決定  X:キャンセル/戻る', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(1, 0)
  }

  private collidesWithSolid(px: number, py: number): boolean {
    const tx = SOLDIER_POS.x * TILE
    const ty = SOLDIER_POS.y * TILE
    return (
      px + HERO_HALF > tx &&
      px - HERO_HALF < tx + TILE &&
      py + HERO_HALF > ty &&
      py - HERO_HALF < ty + TILE
    )
  }

  private handleMovement(delta: number) {
    if (this.dialog.isVisible || this.stairsTriggered) return

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

    if (nx - HERO_HALF >= 0 && nx + HERO_HALF <= COLS * TILE && !this.collidesWithSolid(nx, this.heroPixelY)) {
      this.heroPixelX = nx
    }
    if (ny - HERO_HALF >= 0 && ny + HERO_HALF <= ROWS * TILE && !this.collidesWithSolid(this.heroPixelX, ny)) {
      this.heroPixelY = ny
    }

    this.heroContainer.setPosition(this.heroPixelX, this.heroPixelY)
  }

  private checkTriggers() {
    if (this.dialog.isVisible || this.stairsTriggered) return

    const tileX = Math.floor(this.heroPixelX / TILE)
    const tileY = Math.floor(this.heroPixelY / TILE)

    if (tileX === STAIRS_POS.x && tileY === STAIRS_POS.y) {
      this.stairsTriggered = true
      // 帰還後は階段の一歩手前から再開させる
      SaveManager.state.heroX = STAIRS_POS.x
      SaveManager.state.heroY = STAIRS_POS.y + 1
      SaveManager.state.heroZ = 1
      this.scene.start('BattleScene', TEST_BOSS)
    }
  }

  private isNearNpc(): boolean {
    const { x, y } = this.tileCenter(SOLDIER_POS.x, SOLDIER_POS.y)
    return Math.hypot(this.heroPixelX - x, this.heroPixelY - y) < TILE * 1.2
  }

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.dialog.isVisible) {
        if (e.code === 'KeyZ') this.dialog.advance()
        if (e.code === 'KeyX') this.dialog.dismiss()
        return
      }

      if (e.code === 'KeyZ' && this.isNearNpc()) {
        this.dialog.show(SOLDIER_DIALOG)
      }
    })
  }

  private syncState() {
    const gx = Math.round((this.heroPixelX - TILE / 2) / TILE)
    const gy = Math.round((this.heroPixelY - TILE / 2) / TILE)
    SaveManager.state.heroX = Math.max(0, Math.min(COLS - 1, gx))
    SaveManager.state.heroY = Math.max(0, Math.min(ROWS - 1, gy))
    SaveManager.state.heroZ = 1
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
