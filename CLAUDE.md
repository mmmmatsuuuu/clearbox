# CLAUDE.md

Claude Code がこのプロジェクトで作業する際のガイドラインです。

## プロジェクト概要

**ClearBox** — セーブデータ（16進数テキストファイル）の改ざんで攻略する教育用 2D ドット絵 RPG。

- 対象ユーザー：Chromebook ユーザー（ブラウザのみ、インストール不要）
- 教育目的：16進数・ビットフラグ・エンディアン・チェックサムの体験的理解

## 技術スタック

- **Phaser.js 3** — ゲームエンジン
- **TypeScript** — 言語
- **Vite** — バンドラー / 開発サーバー
- **GitHub Pages** — ホスティング

## ディレクトリ構成

```
clearbox/
├── src/
│   ├── main.ts           # エントリーポイント・Phaserゲーム初期化
│   ├── scenes/           # Phaserシーン（BootScene, GameScene, BattleScene...）
│   ├── objects/          # ゲームオブジェクト（Player, Enemy, NPC...）
│   ├── save/             # セーブ・ロード処理
│   └── utils/            # 汎用ユーティリティ
├── public/
│   └── assets/           # 画像・音声・タイルマップ
├── docs/                 # 設計ドキュメント
├── .github/workflows/    # GitHub Actions（自動デプロイ）
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 開発コマンド

```bash
npm install       # 依存関係インストール
npm run dev       # 開発サーバー（http://localhost:5173）
npm run build     # 本番ビルド（dist/）
npm run preview   # ビルド確認
npm run typecheck # 型チェックのみ
```

## コーディング規約

- **コメントは原則書かない**。理由が自明でない場合のみ記述する
- 変数・関数名は英語、ユーザー向けテキスト（UI・ストーリー）は日本語
- `any` 型は使わない。型が不明な場合は `unknown` を使う
- Phaser のシーンライフサイクル（`preload`, `create`, `update`）を正しく使う
- セーブデータの読み書きロジックは `src/save/` に集約する

## セーブデータ

- フォーマット：16進数テキスト（`.txt`）
- I/O：ブラウザの File API（ダウンロード / `<input type="file">`）
- 詳細仕様：[docs/SAVE_FORMAT.md](docs/SAVE_FORMAT.md)

## 実装フェーズ

現在のフェーズを確認してから作業すること。

| フェーズ | 内容 |
|---|---|
| 1 | ドキュメント整備（完了） |
| 2 | 最初のステージ + セーブロード実装 → テストプレイ |
| 3 | テストプレイ結果をもとにゲーム内容・セーブ構造決定 |
| 4 | 全ボス実装 |
| 5 | 難易度調整 |
| 6 | リリース |

## 重要な制約

- **Chromebook（ブラウザ）での動作を常に意識する**。Node.js API（`fs` 等）は使えない
- ユーザーにインストールを要求する実装はしない
- セーブデータのフォーマットは教育目的のため、難読化・暗号化は行わない
- ゲームの「答え」（セーブデータ改ざん方法）をソースコードのコメントに書かない

## GitHub 運用

GitHub CLI（`gh`）がインストール済みのため、ブランチ作成からマージまで CLI で完結できる。  
コミットメッセージ・PR タイトル・PR 本文はすべて**日本語**で書く。  
ブランチ名のみ英語（kebab-case）を使う。  
ブランチ戦略・コミット規則・PR テンプレートは [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照。
