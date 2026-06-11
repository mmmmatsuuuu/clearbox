import Phaser from 'phaser'
import { SaveManager } from '../save/SaveManager'
import { getSkillName, getSkillEffect } from '../data/skills'

const PW = 296
const PH = 276
const PX = (320 - PW) / 2
const PY = (320 - PH) / 2
const ITEMS_Y = 46
const LINE_H = 26

type Item = {
  label: string
  getValue: () => string
  getDesc: () => string
}

export class StatusScreen {
  private container: Phaser.GameObjects.Container
  private cursorSprite!: Phaser.GameObjects.Text
  private valueTexts: Phaser.GameObjects.Text[] = []
  private descText!: Phaser.GameObjects.Text
  private items!: Item[]
  private cursor = 0

  constructor(private scene: Phaser.Scene) {
    this.items = this.buildItems()
    this.container = this.buildUI()
    this.container.setDepth(200)
    this.container.setVisible(false)
  }

  get isVisible(): boolean {
    return this.container.visible
  }

  show(): void {
    this.items = this.buildItems()
    this.cursor = 0
    this.refreshValues()
    this.moveCursor()
    this.container.setVisible(true)
  }

  hide(): void {
    this.container.setVisible(false)
  }

  moveUp(): void {
    this.cursor = (this.cursor - 1 + this.items.length) % this.items.length
    this.moveCursor()
  }

  moveDown(): void {
    this.cursor = (this.cursor + 1) % this.items.length
    this.moveCursor()
  }

  private buildItems(): Item[] {
    return [
      {
        label: 'HP',
        getValue: () => String(SaveManager.state.hp),
        getDesc: () => '体力の残量。0になると力尽きる。\nセーブデータで確認・変更できる。',
      },
      {
        label: 'リング',
        getValue: () => (SaveManager.isRingValid() ? '✦ 光っている' : '◆ くすんでいる'),
        getDesc: () => '姫が残した誠実のリング。\n✦は誠実の証。◆は狂いのサイン。',
      },
      ...[0, 1, 2, 3].map(i => ({
        label: `スキル ${i + 1}`,
        getValue: () => {
          const code = SaveManager.state.skills[i]
          return code === 0 ? '---' : getSkillName(code)
        },
        getDesc: () => {
          const code = SaveManager.state.skills[i]
          if (code === 0) return 'スキルが装備されていない。'
          const hex = `0x${code.toString(16).padStart(2, '0').toUpperCase()}`
          return `コード: ${hex}\n効果: ${getSkillEffect(code)}`
        },
      })),
    ]
  }

  private buildUI(): Phaser.GameObjects.Container {
    const bg = this.scene.add.rectangle(PW / 2, PH / 2, PW, PH, 0x000000, 0.93)
    const border = this.scene.add.rectangle(PW / 2, PH / 2, PW, PH, 0x000000, 0).setStrokeStyle(2, 0xffffff)

    const title = this.scene.add.text(PW / 2, 12, 'ステータス', {
      fontSize: '16px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    this.cursorSprite = this.scene.add.text(14, ITEMS_Y, '▶', {
      fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace',
    })

    const labelTexts: Phaser.GameObjects.Text[] = []
    this.valueTexts = []
    this.items.forEach((item, i) => {
      labelTexts.push(
        this.scene.add.text(32, ITEMS_Y + i * LINE_H, item.label, {
          fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
        }),
      )
      this.valueTexts.push(
        this.scene.add.text(130, ITEMS_Y + i * LINE_H, item.getValue(), {
          fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
        }),
      )
    })

    const divY = ITEMS_Y + this.items.length * LINE_H + 8
    const divider = this.scene.add.rectangle(PW / 2, divY, PW - 24, 1, 0x444444).setOrigin(0.5, 0)

    this.descText = this.scene.add.text(16, divY + 12, '', {
      fontSize: '12px', color: '#cccccc', fontFamily: 'monospace',
      wordWrap: { width: PW - 32, useAdvancedWrap: true },
      maxLines: 3,
    })

    const hint = this.scene.add.text(PW - 8, PH - 8, 'X:閉じる', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(1, 1)

    return this.scene.add.container(PX, PY, [
      bg, border, title, this.cursorSprite,
      ...labelTexts, ...this.valueTexts,
      divider, this.descText, hint,
    ])
  }

  setScrollFactor(value: number): void {
    this.container.setScrollFactor(value)
    for (const child of this.container.list) {
      (child as unknown as { setScrollFactor(v: number): void }).setScrollFactor(value)
    }
  }

  private refreshValues(): void {
    this.valueTexts.forEach((t, i) => t.setText(this.items[i].getValue()))
  }

  private moveCursor(): void {
    this.cursorSprite.setY(ITEMS_Y + this.cursor * LINE_H)
    this.descText.setText(this.items[this.cursor].getDesc())
  }
}
