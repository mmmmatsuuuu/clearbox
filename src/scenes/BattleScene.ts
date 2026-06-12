import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { getSkillName, getSkillPower, isDefendSkill } from '../data/skills'

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
const ACTION_Y = 204

// 敵ステータス枠（右上）
const ES_X = 166
const ES_Y = 12
const ES_W = 146
const ES_H = 54

// 味方ステータス枠（左下）
const HS_X = 8
const HS_Y = 146
const HS_W = 148
const HS_H = 50

// 行動メニュー（下エリア右半分）
const MENU_ITEM_X = 182
const MENU_CURSOR_X = 166
const MENU_TOP = ACTION_Y + 8
const LINE_H = 22

export class BattleScene extends Phaser.Scene {
  private boss!: BossConfig
  private bossHp = 0
  private hasHealed = false
  private playerDefending = false
  private phase: Phase = 'player-turn'
  private menuItems: MenuItem[] = []
  private menuCursor = 0

  private bossHpText!: Phaser.GameObjects.Text
  private heroHpText!: Phaser.GameObjects.Text
  private dialog!: DialogBox
  private menuLabel!: Phaser.GameObjects.Text
  private menuTexts: Phaser.GameObjects.Text[] = []
  private menuCursorText!: Phaser.GameObjects.Text
  private menuDivider!: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data: BossConfig) {
    this.boss = data
    this.bossHp = data.maxHp
    this.hasHealed = false
    this.playerDefending = false
    this.phase = 'player-turn'
    this.menuTexts = []
  }

  create() {
    this.drawLayout()
    this.createStatusTexts()
    this.dialog = new DialogBox(this, 4, ACTION_Y, W - 8, H - ACTION_Y)
    this.createActionMenu()
    this.setupInput()

    if (this.boss.cheatHpLimit !== undefined && SaveManager.state.hp > this.boss.cheatHpLimit) {
      this.showMsg(
        'そなたの生命力…あり得ぬ数値だ。\n駆け出しの勇者がそれほどの力を\n持てるはずがない。リセットだ〜',
        () => { SaveManager.reset(); this.scene.start('TitleScene') },
      )
      return
    }

    this.showMsg(`${this.boss.name}が現れた！`, () => this.showMenu())
  }

  private drawLayout() {
    // フィールド背景
    this.add.rectangle(W / 2, ACTION_Y / 2, W, ACTION_Y, 0x1a1a2a)
    // 行動エリア背景
    this.add.rectangle(W / 2, ACTION_Y + (H - ACTION_Y) / 2, W, H - ACTION_Y, 0x0a0a16)
    // 区切り線
    this.add.rectangle(W / 2, ACTION_Y, W, 2, 0x3333aa)

    // 敵ステータス枠（右上）
    this.add.rectangle(ES_X + ES_W / 2, ES_Y + ES_H / 2, ES_W, ES_H, 0x1e0808)
      .setStrokeStyle(1, 0x664444)
    // 味方ステータス枠（左下）
    this.add.rectangle(HS_X + HS_W / 2, HS_Y + HS_H / 2, HS_W, HS_H, 0x08101e)
      .setStrokeStyle(1, 0x334466)

    // 敵ビジュアル（左上エリア）
    const eg = this.add.graphics()
    eg.fillStyle(0x2a3a4d)
    eg.lineStyle(3, 0x6688aa)
    eg.fillCircle(76, 92, 38)
    eg.strokeCircle(76, 92, 38)
    eg.fillStyle(0x55708c, 0.6)
    eg.fillCircle(63, 80, 11)
    this.add.text(76, 63, '♛', {
      fontSize: '18px', color: '#c9a227', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // 味方ビジュアル（右下エリア）
    const pg = this.add.graphics()
    const hc = 0x88aaff
    pg.fillStyle(hc)
    pg.lineStyle(2, hc)
    pg.fillCircle(240, 126, 10)
    pg.lineBetween(240, 136, 240, 158)
    pg.lineBetween(225, 146, 255, 146)
    pg.lineBetween(240, 158, 229, 178)
    pg.lineBetween(240, 158, 251, 178)
  }

  private createStatusTexts() {
    this.add.text(ES_X + 8, ES_Y + 7, this.boss.name, {
      fontSize: '14px', color: '#ff8888', fontFamily: 'monospace',
    })
    this.bossHpText = this.add.text(ES_X + 8, ES_Y + 28, `HP: ${this.bossHp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })

    this.add.text(HS_X + 10, HS_Y + 7, '勇者', {
      fontSize: '14px', color: '#88aaff', fontFamily: 'monospace',
    })
    this.heroHpText = this.add.text(HS_X + 10, HS_Y + 28, `HP: ${SaveManager.state.hp}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })
  }

  private createActionMenu() {
    // 左半分：「なにをする？」ラベル
    this.menuLabel = this.add.text(W / 4, ACTION_Y + (H - ACTION_Y) / 2, 'なにをする？', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10).setVisible(false)

    // 縦区切り線
    this.menuDivider = this.add.rectangle(
      W / 2, ACTION_Y + (H - ACTION_Y) / 2, 2, H - ACTION_Y, 0x444466,
    ).setDepth(10).setVisible(false)

    // カーソル（右半分）
    this.menuCursorText = this.add.text(MENU_CURSOR_X, MENU_TOP, '▶', {
      fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace',
    }).setDepth(10).setVisible(false)

    // メニュー項目（右半分）
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(MENU_ITEM_X, MENU_TOP + i * LINE_H, '', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
      }).setDepth(10).setVisible(false)
      this.menuTexts.push(t)
    }
  }

  private buildMenuItems(): MenuItem[] {
    const items: MenuItem[] = SaveManager.state.skills
      .filter(code => code !== 0)
      .map(code => ({
        label: isDefendSkill(code)
          ? `${getSkillName(code)}  1ターン防御`
          : `${getSkillName(code)}  威力:${getSkillPower(code)}`,
        code,
      }))
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
    this.menuDivider.setVisible(true)
    this.phase = 'player-turn'
  }

  private hideMenu() {
    this.menuLabel.setVisible(false)
    this.menuCursorText.setVisible(false)
    this.menuDivider.setVisible(false)
    this.menuTexts.forEach(t => t.setVisible(false))
  }

  private updateCursor() {
    this.menuCursorText.setY(MENU_TOP + this.menuCursor * LINE_H)
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
    if (isDefendSkill(skillCode)) {
      this.playerDefend()
      return
    }

    const dmg = getSkillPower(skillCode)
    this.bossHp = Math.max(0, this.bossHp - dmg)
    this.bossHpText.setText(`HP: ${this.bossHp}`)

    if (this.bossHp <= 0) {
      this.phase = 'result'
      this.showMsg(`${this.boss.name}を倒した！`, () => this.onWin())
      return
    }

    this.showMsg(`${dmg}のダメージを与えた！`, () => this.enemyTurn())
  }

  private playerDefend() {
    this.playerDefending = true
    this.showMsg('防御の構えをとった！', () => this.enemyTurn())
  }

  private playerRun() {
    this.phase = 'result'
    this.showMsg('逃げ出した！', () => this.scene.start(this.boss.returnScene))
  }

  private enemyTurn() {
    if (
      this.boss.healThreshold !== undefined &&
      this.bossHp <= this.boss.healThreshold &&
      !this.hasHealed
    ) {
      this.hasHealed = true
      this.bossHp = this.boss.maxHp
      this.bossHpText.setText(`HP: ${this.bossHp}`)
      this.showMsg(`${this.boss.name}はHPを全回復した！`, () => this.showMenu())
      return
    }

    const rawDmg = this.boss.attack
    const dmg = this.playerDefending ? 0 : rawDmg
    this.playerDefending = false

    const wasValid = SaveManager.isRingValid()
    SaveManager.state.hp = Math.max(0, SaveManager.state.hp - dmg)
    if (wasValid) SaveManager.updateRing()
    this.heroHpText.setText(`HP: ${SaveManager.state.hp}`)

    if (SaveManager.state.hp <= 0) {
      this.phase = 'result'
      this.showMsg('力尽きた...', () => {
        SaveManager.reset()
        this.scene.start('TitleScene')
      })
      return
    }

    const msg = dmg === 0
      ? `${this.boss.name}の攻撃！ → 防御した！`
      : `${this.boss.name}の攻撃！${dmg}のダメージ！`
    this.showMsg(msg, () => this.showMenu())
  }

  private onWin() {
    SaveManager.state.bossDefeats[this.boss.defeatSlot] = this.boss.defeatCode
    this.scene.start(this.boss.returnScene)
  }
}
