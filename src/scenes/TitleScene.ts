import Phaser from 'phaser'
import { TILESET } from './BootScene'
import { FLOOR_TINTS } from '../utils/palette'

const WALL_FRAME = 0

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const { width, height } = this.scale

    this.drawFloorBand(width, height)

    this.add.text(width / 2, height / 2 - 70, 'メタクエスト', {
      fontSize: '36px',
      color: '#c9a227',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 24, '機械王と技師の姫', {
      fontSize: '18px',
      color: '#aaddff',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    const hint = this.add.text(width / 2, height / 2 + 40, 'Zキーを押してスタート', {
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

  // 塔の各階を1タイルずつ tint で表現した帯（-1F〜最上階）
  private drawFloorBand(width: number, height: number) {
    const floors = [-1, 1, 2, 3, 4, 5, 6]
    const size = 32
    const x0 = width / 2 - (floors.length * size) / 2 + size / 2
    floors.forEach((z, i) => {
      this.add.image(x0 + i * size, height - 40, TILESET.key, WALL_FRAME)
        .setScale(size / TILESET.frameWidth)
        .setTint(FLOOR_TINTS[z])
    })
  }
}
