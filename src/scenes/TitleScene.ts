import Phaser from 'phaser'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height / 2 - 40, 'ClearBox', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 20, 'Zキーを押してスタート', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.input.keyboard?.once('keydown-Z', () => {
      this.add.text(width / 2, height / 2 + 60, '（ゲーム本編は準備中）', {
        fontSize: '14px',
        color: '#555555',
        fontFamily: 'monospace',
      }).setOrigin(0.5)
    })
  }
}
