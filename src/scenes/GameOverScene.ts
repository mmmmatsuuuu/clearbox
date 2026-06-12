import Phaser from 'phaser'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000)

    this.add.text(width / 2, height / 2 - 70, 'ゲームオーバー', {
      fontSize: '28px',
      color: '#cc3333',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(
      width / 2,
      height / 2 + 4,
      '冒険は振り出しに戻った。\nセーブデータがあるなら、\nロードで再開できる。',
      {
        fontSize: '13px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
        lineSpacing: 6,
      },
    ).setOrigin(0.5)

    const hint = this.add.text(width / 2, height / 2 + 80, 'Z：タイトルへ', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: hint,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    this.cameras.main.fadeIn(500, 0, 0, 0)

    this.input.keyboard?.once('keydown-Z', () => {
      this.scene.start('TitleScene')
    })
  }
}
