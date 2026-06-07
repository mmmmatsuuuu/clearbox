import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'

export type BossConfig = {
  name: string
  maxHp: number
  attack: number
  defeatSlot: number
  defeatCode: number
  returnScene: string
}

type Phase = 'player-turn' | 'busy' | 'result'

const W = 384
const H = 384

export class BattleScene extends Phaser.Scene {
  private boss!: BossConfig
  private bossHp = 0
  private phase: Phase = 'player-turn'

  private bossHpText!: Phaser.GameObjects.Text
  private heroHpText!: Phaser.GameObjects.Text
  private attackBtn!: Phaser.GameObjects.Text
  private runBtn!: Phaser.GameObjects.Text
  private dialog!: DialogBox

  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data: BossConfig) {
    this.boss = data
    this.bossHp = data.maxHp
    this.phase = 'player-turn'
  }

  create() {
    this.drawLayout()
    this.createStatusTexts()
    this.dialog = new DialogBox(this, 8, H - 118, W - 16, 100)
    this.createButtons()
    this.setupInput()

    this.showMsg(`${this.boss.name}が現れた！`)
  }

  private drawLayout() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a0a)
    this.add.rectangle(W / 2, 80, 320, 100, 0x2d1010)
    this.add.rectangle(W / 2, 240, 320, 80, 0x0f1a2d)
  }

  private createStatusTexts() {
    this.add.text(44, 38, this.boss.name, {
      fontSize: '18px', color: '#ff8888', fontFamily: 'monospace',
    })
    this.bossHpText = this.add.text(44, 62, `HP: ${this.bossHp}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    })

    this.add.text(44, 208, '勇者', {
      fontSize: '18px', color: '#88aaff', fontFamily: 'monospace',
    })
    this.heroHpText = this.add.text(44, 232, `HP: ${SaveManager.state.hp}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    })
  }

  private createButtons() {
    this.attackBtn = this.add
      .text(96, 300, '[ Z: 攻撃 ]', {
        fontSize: '15px', color: '#ffffff', fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.playerAttack())

    this.runBtn = this.add
      .text(288, 300, '[ X: 逃げる ]', {
        fontSize: '15px', color: '#aaaaaa', fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.playerRun())
  }

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.dialog.isVisible) {
        if (e.code === 'KeyZ') this.dialog.advance()
        return
      }
      if (this.phase !== 'player-turn') return
      if (e.code === 'KeyZ') this.playerAttack()
      else if (e.code === 'KeyX') this.playerRun()
    })
  }

  private setButtonsVisible(visible: boolean) {
    this.attackBtn.setVisible(visible)
    this.runBtn.setVisible(visible)
  }

  private showMsg(msg: string, onClose?: () => void) {
    this.setButtonsVisible(false)
    this.dialog.show([msg], onClose)
  }

  private playerAttack() {
    if (this.phase !== 'player-turn') return
    this.phase = 'busy'

    const dmg = this.calcPlayerDamage()
    this.bossHp = Math.max(0, this.bossHp - dmg)
    this.bossHpText.setText(`HP: ${this.bossHp}`)

    if (this.bossHp <= 0) {
      this.phase = 'result'
      this.showMsg(`${this.boss.name}を倒した！`, () => this.onWin())
      return
    }

    this.showMsg(`${dmg}のダメージを与えた！`, () => this.enemyTurn())
  }

  private playerRun() {
    if (this.phase !== 'player-turn') return
    this.phase = 'result'
    this.showMsg('逃げ出した！', () => this.scene.start(this.boss.returnScene))
  }

  private enemyTurn() {
    const dmg = this.boss.attack
    SaveManager.state.hp = Math.max(0, SaveManager.state.hp - dmg)
    this.heroHpText.setText(`HP: ${SaveManager.state.hp}`)

    if (SaveManager.state.hp <= 0) {
      this.phase = 'result'
      this.showMsg('力尽きた...', () => {
        SaveManager.reset()
        this.scene.start('TitleScene')
      })
      return
    }

    this.phase = 'player-turn'
    this.showMsg(`${this.boss.name}の攻撃！${dmg}のダメージ！`, () => {
      this.setButtonsVisible(true)
    })
  }

  private onWin() {
    SaveManager.state.bossDefeats[this.boss.defeatSlot] = this.boss.defeatCode
    this.scene.start(this.boss.returnScene)
  }

  private calcPlayerDamage(): number {
    const total = SaveManager.state.skills.reduce((sum, s) => sum + s, 0)
    return total > 0 ? total : 5
  }
}
