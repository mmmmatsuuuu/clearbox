import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { TitleScene } from './scenes/TitleScene'
import { GameScene } from './scenes/GameScene'
import { BattleScene } from './scenes/BattleScene'
import { GameOverScene } from './scenes/GameOverScene'
import { ClearScene } from './scenes/ClearScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 320,
  height: 320,
  backgroundColor: '#111111',
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene, BattleScene, GameOverScene, ClearScene],
}

new Phaser.Game(config)
