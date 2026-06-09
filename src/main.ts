import Phaser from 'phaser'
import { TitleScene } from './scenes/TitleScene'
import { GameScene } from './scenes/GameScene'
import { BattleScene } from './scenes/BattleScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 448,
  height: 448,
  backgroundColor: '#111111',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, GameScene, BattleScene],
}

new Phaser.Game(config)
