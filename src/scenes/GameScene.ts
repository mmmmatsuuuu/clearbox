import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { BossConfig } from './BattleScene'

const TILE = 64
const COLS = 6
const ROWS = 6

const SOLDIER_POS = { x: 2, y: 1 }
const STAIRS_POS = { x: 5, y: 0 }

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
  private heroX = 0
  private heroY = 0
  private canMove = true

  private heroContainer!: Phaser.GameObjects.Container
  private hpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    const s = SaveManager.state
    this.heroX = s.heroX
    this.heroY = s.heroY

    this.drawField()
    this.createStairs()
    this.createSoldier()
    this.createHero()
    this.createHud()
    this.createKeyHint()
    this.dialog = new DialogBox(this, 8, ROWS * TILE - 118, COLS * TILE - 16, 100)
    this.setupInput()
    this.setupButtons()
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
    const rect = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x886622)
    rect.setStrokeStyle(2, 0xffdd88)
    this.add.text(x, y, '▲', {
      fontSize: '28px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private createCharacter(gx: number, gy: number, color: number, label: string) {
    const rect = this.add.rectangle(0, 0, TILE - 10, TILE - 10, color)
    const text = this.add.text(0, 0, label, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)
    const { x, y } = this.tileCenter(gx, gy)
    return this.add.container(x, y, [rect, text])
  }

  private createHero() {
    this.heroContainer = this.createCharacter(this.heroX, this.heroY, 0x3366cc, '勇')
  }

  private createSoldier() {
    this.createCharacter(SOLDIER_POS.x, SOLDIER_POS.y, 0xcc7722, '兵')
  }

  private createHud() {
    const bg = this.add.rectangle(0, 0, 90, 22, 0x000000, 0.7).setOrigin(0)
    this.hpText = this.add.text(6, 3, `HP: ${SaveManager.state.hp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })
    this.add.container(4, 4, [bg, this.hpText])
  }

  private createKeyHint() {
    this.add.text(COLS * TILE - 6, 4, 'Z:決定  X:キャンセル', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(1, 0)
  }

  private isAdjacent(ax: number, ay: number, bx: number, by: number) {
    return Math.abs(ax - bx) + Math.abs(ay - by) === 1
  }

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.dialog.isVisible) {
        if (e.code === 'KeyZ') this.dialog.advance()
        if (e.code === 'KeyX') this.dialog.dismiss()
        return
      }

      if (!this.canMove) return

      if (e.code === 'KeyZ') {
        if (this.isAdjacent(this.heroX, this.heroY, SOLDIER_POS.x, SOLDIER_POS.y)) {
          this.dialog.show(SOLDIER_DIALOG)
        }
        return
      }

      let nx = this.heroX
      let ny = this.heroY
      if (e.code === 'ArrowUp')         ny--
      else if (e.code === 'ArrowDown')  ny++
      else if (e.code === 'ArrowLeft')  nx--
      else if (e.code === 'ArrowRight') nx++
      else return

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return
      if (nx === SOLDIER_POS.x && ny === SOLDIER_POS.y) return

      if (nx === STAIRS_POS.x && ny === STAIRS_POS.y) {
        this.syncState()
        this.scene.start('BattleScene', TEST_BOSS)
        return
      }

      this.heroX = nx
      this.heroY = ny
      const { x, y } = this.tileCenter(nx, ny)
      this.heroContainer.setPosition(x, y)

      this.canMove = false
      this.time.delayedCall(150, () => { this.canMove = true })
    })
  }

  private syncState() {
    SaveManager.state.heroX = this.heroX
    SaveManager.state.heroY = this.heroY
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
      if (s.heroX < 0 || s.heroX >= COLS || s.heroY < 0 || s.heroY >= ROWS) return

      this.heroX = s.heroX
      this.heroY = s.heroY
      const { x, y } = this.tileCenter(this.heroX, this.heroY)
      this.heroContainer.setPosition(x, y)
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
