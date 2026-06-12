import Phaser from 'phaser'

const CONCEPTS = [
  'uint8',
  'int8',
  'リトルエンディアン',
  'コード体系',
  'XOR チェックサム',
  'float32',
]

export class ClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClearScene' })
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000)

    this.add.text(width / 2, 48, 'ＣＬＥＡＲ！', {
      fontSize: '30px',
      color: '#ffdd55',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(width / 2, 84, 'すべての謎を解き明かした', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(width / 2, 116, '― 学んだ概念 ―', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(width / 2, 178, CONCEPTS.map(c => `✦ ${c}`).join('\n'), {
      fontSize: '13px',
      color: '#aaddff',
      fontFamily: 'monospace',
      align: 'left',
      lineSpacing: 6,
    }).setOrigin(0.5)

    const hint = this.add.text(width / 2, height - 28, 'Z：タイトルへ', {
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

    this.cameras.main.fadeIn(800, 0, 0, 0)

    this.input.keyboard?.once('keydown-Z', () => {
      this.scene.start('TitleScene')
    })
  }
}
