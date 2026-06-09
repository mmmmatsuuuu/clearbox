import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { getSkillName, getSkillPower } from '../data/skills'

export type BossConfig = {
  name: string
  maxHp: number
  attack: number
  healThreshold?: number
  cheatHpLimit?: number
  defeatSlot: number
  defeatCode: number
  returnScene: string
}

type Phase = 'player-turn' | 'busy' | 'result'
type MenuItem = { label: string; code: number | null }

const W = 320
const H = 320
const MENU_TOP = 196
const LINE_H = 20

export class BattleScene extends Phaser.Scene {
  private boss!: BossConfig
  private bossHp = 0
  private hasHealed = false
  private phase: Phase = 'player-turn'
  private menuItems: MenuItem[] = []
  private menuCursor = 0

  private bossHpText!: Phaser.GameObjects.Text
  private heroHpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox
  private menuLabel!: Phaser.GameObjects.Text
  private menuTexts: Phaser.GameObjects.Text[] = []
  private menuCursorText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data: BossConfig) {
    this.boss = data
    this.bossHp = data.maxHp
    this.hasHealed = false
    this.phase = 'player-turn'
    this.menuTexts = []
  }

  create() {
    this.drawLayout()
    this.createStatusTexts()
    this.createKeyHint()
    this.dialog = new DialogBox(this, 8, H - 118, W - 16, 100)
    this.createActionMenu()
    this.setupInput()

    if (this.boss.cheatHpLimit !== undefined && SaveManager.state.hp > this.boss.cheatHpLimit) {
      this.showMsg(
        'そなたの生命力…あり得ぬ数値だ。駆け出しの勇者がそれほどの力を持てるはずがない。リセットだ〜',
        () => { SaveManager.reset(); this.scene.start('TitleScene') },
      )
      return
    }

    this.showMsg(`${this.boss.name}が現れた！`, () => this.showMenu())
  }

  private drawLayout() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a0a)
    this.add.rectangle(W / 2, 58, 290, 88, 0x2d1010)
    this.add.rectangle(W / 2, 156, 290, 64, 0x0f1a2d)
  }

  private createStatusTexts() {
    this.add.text(44, 22, this.boss.name, {
      fontSize: '18px', color: '#ff8888', fontFamily: 'monospace',
    })
    this.bossHpText = this.add.text(44, 44, `HP: ${this.bossHp}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    })

    this.add.text(44, 132, '勇者', {
      fontSize: '18px', color: '#88aaff', fontFamily: 'monospace',
    })
    this.heroHpText = this.add.text(44, 154, `HP: ${SaveManager.state.hp}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    })
  }

  private createKeyHint() {
    this.add.text(W - 6, 4, 'Z:決定  X:キャンセル/戻る', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(1, 0)
  }

  private createActionMenu() {
    this.menuLabel = this.add.text(20, MENU_TOP, '行動を選んでください', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setDepth(10).setVisible(false)

    this.menuCursorText = this.add.text(20, MENU_TOP + LINE_H, '▶', {
      fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace',
    }).setDepth(10).setVisible(false)

    for (let i = 0; i < 5; i++) {
      const t = this.add.text(40, MENU_TOP + LINE_H + i * LINE_H, '', {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      }).setDepth(10).setVisible(false)
      this.menuTexts.push(t)
    }
  }

  private buildMenuItems(): MenuItem[] {
    const items: MenuItem[] = SaveManager.state.skills
      .filter(code => code !== 0)
      .map(code => ({ label: `${getSkillName(code)}  威力:${getSkillPower(code)}`, code }))
    items.push({ label: '逃げる', code: null })
    return items
  }

  private showMenu() {
    this.menuItems = this.buildMenuItems()
    this.menuCursor = 0
    this.menuLabel.setVisible(true)
    this.menuTexts.forEach((t, i) => {
      if (i < this.menuItems.length) {
        t.setText(this.menuItems[i].label).setVisible(true)
      } else {
        t.setVisible(false)
      }
    })
    this.updateCursor()
    this.menuCursorText.setVisible(true)
    this.phase = 'player-turn'
  }

  private hideMenu() {
    this.menuLabel.setVisible(false)
    this.menuCursorText.setVisible(false)
    this.menuTexts.forEach(t => t.setVisible(false))
  }

  private updateCursor() {
    this.menuCursorText.setY(MENU_TOP + LINE_H + this.menuCursor * LINE_H)
  }

  private setupInput() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.dialog.isVisible) {
        if (e.code === 'KeyZ') this.dialog.advance()
        return
      }
      if (this.phase !== 'player-turn') return

      if (e.code === 'ArrowUp') {
        this.menuCursor = (this.menuCursor - 1 + this.menuItems.length) % this.menuItems.length
        this.updateCursor()
      } else if (e.code === 'ArrowDown') {
        this.menuCursor = (this.menuCursor + 1) % this.menuItems.length
        this.updateCursor()
      } else if (e.code === 'KeyZ') {
        const item = this.menuItems[this.menuCursor]
        item.code === null ? this.playerRun() : this.playerAttack(item.code)
      } else if (e.code === 'KeyX') {
        this.menuCursor = this.menuItems.length - 1
        this.updateCursor()
      }
    })
  }

  private showMsg(msg: string, onClose?: () => void) {
    this.hideMenu()
    this.phase = 'busy'
    this.dialog.show([msg], onClose)
  }

  private playerAttack(skillCode: number) {
    const dmg = getSkillPower(skillCode)
    this.bossHp = Math.max(0, this.bossHp - dmg)
    this.bossHpText.setText(`HP: ${this.bossHp}`)

    if (this.bossHp <= 0) {
      this.phase = 'result'
      this.showMsg(`${this.boss.name}を倒した！`, () => this.onWin())
      return
    }

    if (
      this.boss.healThreshold !== undefined &&
      this.bossHp <= this.boss.healThreshold &&
      !this.hasHealed
    ) {
      this.hasHealed = true
      this.bossHp = this.boss.maxHp
      this.bossHpText.setText(`HP: ${this.bossHp}`)
      this.hideMenu()
      this.phase = 'busy'
      this.dialog.show(
        [`${dmg}のダメージを与えた！`, `${this.boss.name}はHPを回復した！`],
        () => this.enemyTurn(),
      )
      return
    }

    this.showMsg(`${dmg}のダメージを与えた！`, () => this.enemyTurn())
  }

  private playerRun() {
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

    this.showMsg(`${this.boss.name}の攻撃！${dmg}のダメージ！`, () => this.showMenu())
  }

  private onWin() {
    SaveManager.state.bossDefeats[this.boss.defeatSlot] = this.boss.defeatCode
    this.scene.start(this.boss.returnScene)
  }
}
