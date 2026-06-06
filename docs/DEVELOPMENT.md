# 開発ガイド

## ブランチ戦略：GitHub Flow

このプロジェクトは **GitHub Flow**（最もシンプルな GitHub 運用）を採用します。

```
main ブランチ = 常にデプロイ可能な状態
  └── feature/xxx  作業ブランチ（機能・修正ごとに切る）
```

### 基本的な流れ

```bash
# 1. main から作業ブランチを切る
git checkout -b feature/バトルシーン

# 2. 実装・コミット
git add src/scenes/BattleScene.ts
git commit -m "feat: バトルシーンの初期実装"

# 3. GitHub にプッシュ
git push origin feature/バトルシーン

# 4. GitHub CLI で PR を作成
gh pr create --title "feat: バトルシーンの初期実装" --body "## 概要
- バトルシーンの初期実装

## テスト
- [ ] ブラウザで動作確認済み"

# 5. PR をマージ（レビュー後）
gh pr merge --squash --delete-branch
```

### ブランチ名の規則

ブランチ名は英語（kebab-case）を使う：

```
feature/battle-scene
feature/save-load
fix/hp-overflow
docs/update-readme
```

### PR テンプレート

`gh pr create` の `--body` には以下の形式を使う：

```
## 概要
- 変更内容を箇条書き

## テスト
- [ ] ブラウザで動作確認済み
- [ ] 型チェック通過（npm run typecheck）

## 関連 Issue
Closes #<issue番号>（該当する場合）
```

### よく使う gh コマンド

```bash
gh pr list                      # PR 一覧
gh pr view                      # 現在のブランチの PR を表示
gh pr checks                    # CI ステータスを確認
gh issue create --title "..."   # Issue 起票
gh issue list                   # Issue 一覧
```

### コミットメッセージの規則

```
<type>: <概要（日本語）>
```

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `refactor` | 機能変更なしのコード整理 |
| `test` | テスト |

例：`feat: セーブ・ロード UI の追加`, `fix: レベルアップ時の HP オーバーフロー修正`

## 開発環境セットアップ

```bash
# リポジトリをクローン
git clone <repo-url>
cd clearbox

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
# → http://localhost:5173 でブラウザ確認
```

## デプロイ（GitHub Pages）

`main` ブランチへのプッシュ（またはマージ）で自動デプロイします。

```
main にマージ
  → GitHub Actions が npm run build を実行
  → dist/ の内容を gh-pages ブランチに公開
```

ワークフローファイル：`.github/workflows/deploy.yml`（フェーズ 2 で作成）

## Issue 管理

- バグ・タスク・質問は GitHub Issues に起票する
- ラベル例：`bug`, `enhancement`, `phase-2`, `phase-3` など
- 大きな機能は Issue → PR で追跡する

## フェーズと作業の目安

| フェーズ | ブランチ名の例 | 内容 |
|---|---|---|
| 2 | `feature/stage1`, `feature/save-load` | 最初のステージ・セーブロード |
| 3 | — | テストプレイ・設計見直し（ブランチ不要） |
| 4 | `feature/boss2`, `feature/boss3` | 各ボス実装 |
| 5 | `fix/balance-boss1` | 難易度調整 |
| 6 | `release/1.0.0` | リリース準備 |
