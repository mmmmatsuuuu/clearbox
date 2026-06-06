import Phaser from 'phaser'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height / 2 - 50, 'ClearBox', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    const hint = this.add.text(width / 2, height / 2 + 20, 'Zキーを押してスタート', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    this.input.keyboard?.once('keydown-Z', () => {
      this.scene.start('GameScene')
    })
  }
}
