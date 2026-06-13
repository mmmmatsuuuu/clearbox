import Phaser from 'phaser'
import { PALETTE } from '../utils/palette'

// scripts/generate-steamworks.py で生成（レンガ/鉄板床・パイプ/ランプ/モニター壁・エレベーター・像・祭壇）
export const STEAMWORKS = {
  key: 'steamworks',
  path: 'assets/tilesets/steamworks.png',
  frameWidth: 32,
  frameHeight: 32,
} as const

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const { width, height } = this.scale

    this.add.text(width / 2, height / 2 - 24, '読み込み中…', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    const barW = 200
    this.add.rectangle(width / 2, height / 2 + 8, barW, 12, 0x000000)
      .setStrokeStyle(1, PALETTE.brass)
    const bar = this.add.rectangle(width / 2 - barW / 2 + 2, height / 2 + 8, 0, 8, PALETTE.brass)
      .setOrigin(0, 0.5)
    this.load.on('progress', (value: number) => {
      bar.width = (barW - 4) * value
    })

    this.load.spritesheet(STEAMWORKS.key, STEAMWORKS.path, {
      frameWidth: STEAMWORKS.frameWidth,
      frameHeight: STEAMWORKS.frameHeight,
    })
  }

  create() {
    this.scene.start('TitleScene')
  }
}
