import Phaser from 'phaser'

export type DialogSpeaker = {
  name: string
  code?: number
}

export class DialogBox {
  private container: Phaser.GameObjects.Container
  private textObj: Phaser.GameObjects.Text
  private hintObj: Phaser.GameObjects.Text
  private nameText: Phaser.GameObjects.Text
  private plateBg: Phaser.GameObjects.Rectangle
  private plateText: Phaser.GameObjects.Text
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
      maxLines: 5,
    })
    this.hintObj = scene.add
      .text(width - 6, height - 6, '', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 1)

    this.nameText = scene.add.text(10, 7, '', {
      fontSize: '12px',
      color: '#ffdd88',
      fontFamily: 'monospace',
    }).setVisible(false)
    this.plateBg = scene.add.rectangle(width - 8, 7, 52, 16, 0xc9a227)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x8a5a2b)
      .setVisible(false)
    this.plateText = scene.add.text(width - 34, 15, '', {
      fontSize: '11px',
      color: '#3a2a08',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setVisible(false)

    this.container = scene.add.container(x, y, [
      bg, border, this.textObj, this.hintObj,
      this.nameText, this.plateBg, this.plateText,
    ])
    this.container.setDepth(100)
    this.container.setVisible(false)
  }

  get isVisible(): boolean {
    return this.container.visible
  }

  show(messages: string[], onClose?: () => void, speaker?: DialogSpeaker): void {
    this.messages = messages
    this.page = 0
    this.onClose = onClose
    this.setSpeaker(speaker)
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

  setScrollFactor(value: number): void {
    this.container.setScrollFactor(value)
    for (const child of this.container.list) {
      (child as unknown as { setScrollFactor(v: number): void }).setScrollFactor(value)
    }
  }

  private setSpeaker(speaker?: DialogSpeaker): void {
    if (!speaker) {
      this.nameText.setVisible(false)
      this.plateBg.setVisible(false)
      this.plateText.setVisible(false)
      this.textObj.setY(10)
      return
    }
    this.nameText.setText(speaker.name).setVisible(true)
    const hasCode = speaker.code !== undefined
    this.plateBg.setVisible(hasCode)
    this.plateText.setVisible(hasCode)
    if (speaker.code !== undefined) {
      this.plateText.setText(`0x${speaker.code.toString(16).padStart(2, '0').toUpperCase()}`)
    }
    this.textObj.setY(26)
  }

  private renderPage(): void {
    this.textObj.setText(this.messages[this.page])
    this.hintObj.setText(this.page < this.messages.length - 1 ? 'Z で次へ' : 'Z で閉じる')
  }
}
