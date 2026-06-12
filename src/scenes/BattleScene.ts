import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { DialogBox } from '../objects/DialogBox'
import { getSkillCodeByIndex, getSkillName, getSkillPower, isDefendSkill, MEGIDO_CODE } from '../data/skills'

export type BossVisual = {
  bodyColor: number
  strokeColor: number
  mark: string
  markColor: string
}

export type BossConfig = {
  name: string
  maxHp: number
  attack: number
  healThreshold?: number
  regenPerTurn?: number
  cheatHpLimit?: number
  reflectDamage?: boolean
  ringCheck?: boolean
  clearOnWin?: boolean
  introLines?: string[]
  winLines?: string[]
  grantMegido?: boolean
  defeatSlot?: number
  defeatCode?: number
  visual?: BossVisual
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
  private enemySprite!: Phaser.GameObjects.Container
  private victoryWindow!: Phaser.GameObjects.Container
  private victoryCallback?: () => void

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
    this.createVictoryWindow()
    this.setupInput()

    if (this.boss.cheatHpLimit !== undefined && SaveManager.state.hp > this.boss.cheatHpLimit) {
      this.gameOver([
        'そなたの生命力…あり得ぬ数値だ。\n駆け出しの勇者がそれほどの力を\n持てるはずがない。リセットだ〜',
      ])
      return
    }

    if (this.boss.ringCheck && !SaveManager.isRingValid()) {
      this.showMsgs(
        [
          '魔王「誠実のリングが濁っておるぞ。\n貴様、不正をしておるな！」',
          '魔王「姫の力で見抜けぬとでも\n思うたか。\n元のステータスに戻してくれる！」',
          '勇者は元のステータスに\n戻されてしまった…！',
        ],
        () => {
          SaveManager.state.hp = 10
          SaveManager.state.skills = [getSkillCodeByIndex(0), 0x00, 0x00, 0x00]
          SaveManager.updateRing()
          this.heroHpText.setText(`HP: ${SaveManager.state.hp}`)
          this.showMsgs([`${this.boss.name}が立ちはだかる！`], () => this.showMenu())
        },
      )
      return
    }

    this.showMsgs(
      [`${this.boss.name}が現れた！`, ...(this.boss.introLines ?? [])],
      () => this.showMenu(),
    )
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
    const visual = this.boss.visual ?? {
      bodyColor: 0x2266cc, strokeColor: 0x88ccff, mark: '♛', markColor: '#ffee00',
    }
    const eg = this.add.graphics()
    eg.fillStyle(visual.bodyColor)
    eg.lineStyle(3, visual.strokeColor)
    eg.fillCircle(0, 29, 38)
    eg.strokeCircle(0, 29, 38)
    const mark = this.add.text(0, 0, visual.mark, {
      fontSize: '18px', color: visual.markColor, fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.enemySprite = this.add.container(76, 63, [eg, mark])

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

  private createVictoryWindow() {
    const vw = 264
    const vh = 92
    const bg = this.add.rectangle(0, 0, vw, vh, 0x221a00, 0.95)
      .setStrokeStyle(3, 0xffcc33)
    const title = this.add.text(0, -26, '勝利！', {
      fontSize: '18px', color: '#ffdd55', fontFamily: 'monospace',
    }).setOrigin(0.5)
    const body = this.add.text(0, 8, '撃破の刻印が\nセーブデータに刻まれた。', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5)
    const hint = this.add.text(vw / 2 - 8, vh / 2 - 4, 'Z で閉じる', {
      fontSize: '10px', color: '#bb9955', fontFamily: 'monospace',
    }).setOrigin(1, 1)
    this.victoryWindow = this.add.container(W / 2, 104, [bg, title, body, hint])
      .setDepth(120)
      .setVisible(false)
  }

  private showVictoryWindow(onClose: () => void) {
    this.victoryCallback = onClose
    this.victoryWindow.setVisible(true)
  }

  private closeVictoryWindow() {
    this.victoryWindow.setVisible(false)
    const cb = this.victoryCallback
    this.victoryCallback = undefined
    cb?.()
  }

  private skillDamage(code: number): number {
    if (code === MEGIDO_CODE) return Math.floor(SaveManager.state.megidoPower)
    return getSkillPower(code)
  }

  private buildMenuItems(): MenuItem[] {
    const items: MenuItem[] = SaveManager.state.skills
      .filter(code => code !== 0)
      .map(code => ({
        label: isDefendSkill(code)
          ? `${getSkillName(code)}  1ターン防御`
          : `${getSkillName(code)}  威力:${this.skillDamage(code)}`,
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
      if (this.victoryWindow.visible) {
        if (e.code === 'KeyZ') this.closeVictoryWindow()
        return
      }
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
    this.showMsgs([msg], onClose)
  }

  private showMsgs(msgs: string[], onClose?: () => void) {
    this.hideMenu()
    this.phase = 'busy'
    this.dialog.show(msgs, onClose)
  }

  private playerAttack(skillCode: number) {
    if (isDefendSkill(skillCode)) {
      this.playerDefend()
      return
    }

    const dmg = this.skillDamage(skillCode)

    if (dmg <= 0) {
      const msg = skillCode === MEGIDO_CODE
        ? 'メギドを放った…\nしかし力は封印されている！'
        : 'しかし何も起こらなかった！'
      this.showMsg(msg, () => this.enemyTurn())
      return
    }

    this.bossHp = Math.max(0, this.bossHp - dmg)
    this.bossHpText.setText(`HP: ${this.bossHp}`)

    const msgs: string[] = [`${dmg}のダメージを与えた！`]

    if (this.boss.reflectDamage) {
      const wasValid = SaveManager.isRingValid()
      SaveManager.state.hp = Math.max(0, SaveManager.state.hp - dmg)
      if (wasValid) SaveManager.updateRing()
      this.heroHpText.setText(`HP: ${SaveManager.state.hp}`)
      msgs.push(`混沌の鏡が輝く…！\n${dmg}のダメージが\nそのまま跳ね返ってきた！`)

      if (SaveManager.state.hp <= 0) {
        this.gameOver([...msgs, '自らの力に飲み込まれた…\n力尽きた...'])
        return
      }
    }

    if (this.bossHp <= 0) {
      this.phase = 'result'
      this.showMsgs(msgs, () => this.playWinSequence())
      return
    }

    this.showMsgs(msgs, () => this.enemyTurn())
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

    const msgs: string[] = []

    if (this.boss.regenPerTurn !== undefined && this.bossHp < this.boss.maxHp) {
      const healed = Math.min(this.boss.regenPerTurn, this.boss.maxHp - this.bossHp)
      this.bossHp += healed
      this.bossHpText.setText(`HP: ${this.bossHp}`)
      msgs.push(`${this.boss.name}の傷が\nみるみる塞がっていく！\nHPが${healed}回復した！`)
    }

    const rawDmg = this.boss.attack
    const dmg = this.playerDefending ? 0 : rawDmg
    this.playerDefending = false

    const wasValid = SaveManager.isRingValid()
    SaveManager.state.hp = Math.max(0, SaveManager.state.hp - dmg)
    if (wasValid) SaveManager.updateRing()
    this.heroHpText.setText(`HP: ${SaveManager.state.hp}`)

    if (SaveManager.state.hp <= 0) {
      this.gameOver([...msgs, '力尽きた...'])
      return
    }

    msgs.push(dmg === 0
      ? `${this.boss.name}の攻撃！ → 防御した！`
      : `${this.boss.name}の攻撃！${dmg}のダメージ！`)
    this.showMsgs(msgs, () => this.showMenu())
  }

  private gameOver(msgs: string[]) {
    this.phase = 'result'
    this.showMsgs(msgs, () => {
      SaveManager.reset()
      this.cameras.main.fadeOut(700, 120, 0, 0)
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('GameOverScene'),
      )
    })
  }

  private playWinSequence() {
    this.cameras.main.flash(200, 255, 255, 255)
    this.tweens.add({
      targets: this.enemySprite,
      alpha: 0,
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.enemySprite.setVisible(false)
        this.showMsgs(
          [`${this.boss.name}を倒した！`, ...(this.boss.winLines ?? [])],
          () => this.onWin(),
        )
      },
    })
  }

  private onWin() {
    if (this.boss.defeatSlot !== undefined && this.boss.defeatCode !== undefined) {
      SaveManager.state.bossDefeats[this.boss.defeatSlot] = this.boss.defeatCode
    }
    if (this.boss.grantMegido) {
      SaveManager.state.megidoPower = 250
    }

    if (this.boss.clearOnWin) {
      this.cameras.main.fadeOut(900, 0, 0, 0)
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('ClearScene'),
      )
      return
    }

    this.showVictoryWindow(() => {
      this.scene.start(this.boss.returnScene, { victorySlot: this.boss.defeatSlot })
    })
  }
}
