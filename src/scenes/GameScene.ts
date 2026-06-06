import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'

const TILE = 64
const COLS = 6
const ROWS = 6

const HERO_START = { x: 2, y: 5 }
const SOLDIER_POS = { x: 2, y: 1 }

const SOLDIER_DIALOG = [
  '兵士「よく来たな、勇者よ。',
  'セーブボタンを押すと',
  '「save_data.txt」がダウンロードされる。',
  '中身は16進数で書かれておるぞ。',
  'ロードボタンでファイルを選べば',
  '続きから始められる。',
  'ファイルの中身をよく見てみよ！」',
]

export class GameScene extends Phaser.Scene {
  private heroX = HERO_START.x
  private heroY = HERO_START.y
  private heroHp = 10

  private heroContainer!: Phaser.GameObjects.Container
  private hpText!: Phaser.GameObjects.Text
  private dialogBox!: Phaser.GameObjects.Container
  private dialogText!: Phaser.GameObjects.Text
  private dialogVisible = false

  private canMove = true

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.drawField()
    this.createSoldier()
    this.createHero()
    this.createHud()
    this.createDialog()
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

  private createCharacter(gx: number, gy: number, color: number, label: string) {
    const rect = this.add.rectangle(0, 0, TILE - 10, TILE - 10, color)
    const text = this.add.text(0, 0, label, {
      fontSize: '26px',
      color: '#ffffff',
      fontFamily: 'monospace',
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
    const bg = this.add.rectangle(0, 0, 80, 22, 0x000000, 0.7).setOrigin(0)
    this.hpText = this.add.text(6, 3, `HP: ${this.heroHp}`, {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'monospace',
    })
    this.add.container(4, 4, [bg, this.hpText])
  }

  private createDialog() {
    const W = COLS * TILE - 16
    const H = 110
    const X = 8
    const Y = ROWS * TILE - H - 8

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88)
    const border = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setStrokeStyle(2, 0xffffff)
    this.dialogText = this.add.text(8, 8, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: W - 16 },
    })
    const hint = this.add.text(W - 6, H - 6, 'Zで閉じる', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(1, 1)

    this.dialogBox = this.add.container(X, Y, [bg, border, this.dialogText, hint])
    this.dialogBox.setVisible(false)
  }

  private showDialog(lines: string[]) {
    this.dialogText.setText(lines.join('\n'))
    this.dialogBox.setVisible(true)
    this.dialogVisible = true
  }

  private hideDialog() {
    this.dialogBox.setVisible(false)
    this.dialogVisible = false
  }

  private isAdjacentToSoldier() {
    const dx = Math.abs(this.heroX - SOLDIER_POS.x)
    const dy = Math.abs(this.heroY - SOLDIER_POS.y)
    return dx + dy === 1
  }

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.dialogVisible) {
        if (e.code === 'KeyZ') this.hideDialog()
        return
      }

      if (!this.canMove) return

      if (e.code === 'KeyZ') {
        if (this.isAdjacentToSoldier()) this.showDialog(SOLDIER_DIALOG)
        return
      }

      let nx = this.heroX
      let ny = this.heroY
      if (e.code === 'ArrowUp')    ny--
      else if (e.code === 'ArrowDown')  ny++
      else if (e.code === 'ArrowLeft')  nx--
      else if (e.code === 'ArrowRight') nx++
      else return

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return
      if (nx === SOLDIER_POS.x && ny === SOLDIER_POS.y) return

      this.heroX = nx
      this.heroY = ny
      const { x, y } = this.tileCenter(nx, ny)
      this.heroContainer.setPosition(x, y)

      this.canMove = false
      this.time.delayedCall(150, () => { this.canMove = true })
    })
  }

  private setupButtons() {
    const saveBtn = document.getElementById('save-btn')
    const loadBtn = document.getElementById('load-btn')

    const onSave = () => {
      SaveManager.save({ heroX: this.heroX, heroY: this.heroY, heroHp: this.heroHp })
    }

    const onLoad = async () => {
      const data = await SaveManager.load()
      if (!data) return
      if (data.heroX < 0 || data.heroX >= COLS || data.heroY < 0 || data.heroY >= ROWS) return

      this.heroX = data.heroX
      this.heroY = data.heroY
      this.heroHp = data.heroHp

      const { x, y } = this.tileCenter(this.heroX, this.heroY)
      this.heroContainer.setPosition(x, y)
      this.hpText.setText(`HP: ${this.heroHp}`)
    }

    saveBtn?.addEventListener('click', onSave)
    loadBtn?.addEventListener('click', onLoad)

    this.events.once('shutdown', () => {
      saveBtn?.removeEventListener('click', onSave)
      loadBtn?.removeEventListener('click', onLoad)
    })
  }
}
