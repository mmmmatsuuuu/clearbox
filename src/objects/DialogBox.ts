import Phaser from 'phaser'

export class DialogBox {
  private container: Phaser.GameObjects.Container
  private textObj: Phaser.GameObjects.Text
  private hintObj: Phaser.GameObjects.Text
  private messages: string[] = []
  private page = 0
  private onClose?: () => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88)
    const border = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setStrokeStyle(2, 0xffffff)
    this.textObj = scene.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: width - 20 },
    })
    this.hintObj = scene.add
      .text(width - 6, height - 6, '', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 1)

    this.container = scene.add.container(x, y, [bg, border, this.textObj, this.hintObj])
    this.container.setDepth(100)
    this.container.setVisible(false)
  }

  get isVisible(): boolean {
    return this.container.visible
  }

  show(messages: string[], onClose?: () => void): void {
    this.messages = messages
    this.page = 0
    this.onClose = onClose
    this.renderPage()
    this.container.setVisible(true)
  }

  advance(): void {
    if (!this.container.visible) return
    this.page++
    if (this.page >= this.messages.length) {
      this.container.setVisible(false)
      this.onClose?.()
    } else {
      this.renderPage()
    }
  }

  dismiss(): void {
    this.container.setVisible(false)
    this.onClose?.()
  }

  hide(): void {
    this.container.setVisible(false)
  }

  private renderPage(): void {
    this.textObj.setText(this.messages[this.page])
    this.hintObj.setText(this.page < this.messages.length - 1 ? 'Z で次へ' : 'Z で閉じる')
  }
}
