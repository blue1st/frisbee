# 🥏 Frisbee (フリスビー) - 非同期情報探索エージェント

Frisbee（フリスビー）は、バックグラウンドで自律的に情報を収集・要約し、成果を持ち帰ってくれる**トレイ常駐型の「RunCat」風 非同期情報探索デスクトップアプリケーション**です。

ユーザーが投げたフリスビー（検索クエリ）を、愛犬（AIエージェント）がWebの海へ追いかけて行き、複数の視点から情報を集め、統合・要約した状態で持ち帰ってくれます。

---

## 🐕 主な機能

### 1. 🥏 フリスビー投擲 (非同期Web探索)
- 探索したいテーマやクエリを入力して「フリスビーを投げる」と、バックグラウンドで探索タスクがキューに積まれます。
- LLMがクエリを自動的に多角的なサブクエリに分解し、複数のWebソースから並行して情報を収集します。

### 2. 🏃‍♂️ RunCat風 トレイアニメーション & バッジ
- **探索中**：システムトレイの犬がトコトコと走り出します（アニメーション表示）。
- **探索完了**：探索が完了して未チェックの成果がある場合、トレイアイコンの横にバッジ（例: `🥏3`）が表示されます。

### 3. ⚡ クイックランチャー (Spotlight風 入力バー)
- トレイアイコンをクリックするか、特定の操作でSpotlightやRaycastのようなコンパクトな入力バーが起動します。
- 閃いたその瞬間に、すばやくクエリを入力してフリスビーを投げることができます。

### 4. 📥 成果チェック (Review) & 知識ストック (Archive)
- **成果チェック**：エージェントが持ち帰った「要約」「キーテイクアウェイ（重要なポイント）」「参照したソース元」を確認できます。
- **知識ストック**：確認して有益だった情報はストックし、後からいつでも参照・コピー・タグ検索が可能です。

---

## 🛠 テックスタック

- **デスクトップフレームワーク**: [Tauri v2](https://tauri.app/) (Rust)
- **フロントエンド**: React 18, TypeScript, Tailwind CSS, Zustand
- **アイコン**: Lucide React
- **フォント**: Plus Jakarta Sans, DotGothic16 (Tauri UI内)

---

## 🚀 開発環境のセットアップ

### 前提条件
- [Rust](https://www.rust-lang.org/ja) (rustc / cargo ツールチェーン)
- [Node.js](https://nodejs.org/) (npm または pnpm / yarn)

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd frisbee
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **開発サーバーの起動 (Vite + Tauri)**
   ```bash
   # フロントエンドのViteデブサーバーとTauriアプリを同時に起動
   npm run tauri dev
   ```

4. **ビルド (リリース用)**
   ```bash
   npm run tauri build
   ```

---

## 📦 インストール

### Homebrew (macOS)

`blue1st/taps` から Homebrew Cask 経由で簡単にインストールできます。

```bash
brew tap blue1st/taps
brew install --cask frisbee
```

※ Homebrew Cask からインストールした場合、`xattr` による隔離属性 (Quarantine) の自動解除処理が含まれているため、そのまま起動可能です。

#### DMGファイルを直接ダウンロードして使用する場合
GitHub Releases から DMG を直接ダウンロードして `/Applications` に配置した場合、初回起動時に macOS 開発者署名警告が表示されることがあります。その場合は端末で以下のコマンドを実行して隔離属性を解除してください：

```bash
xattr -dr com.apple.quarantine /Applications/Frisbee.app
```

---

## 🚀 リリース手順 (開発者向け)

新しいバージョンをリリースする際は、`release-it` を使用して自動化されています。

```bash
# インタラクティブにバージョンを選択してタグ・GitHub Releaseを発行
npm run release
```

GitHub Actions (`.github/workflows/release.yml`) が `v*` タグのフックを検知してマルチプラットフォームビルドを行い、成果物 (.dmg 等) を GitHub Release に添付した上で Homebrew Cask を自動更新します。

---

## ⚙️ 各種設定

アプリ内の「設定」タブから以下を設定することで、フル機能を利用できるようになります。

1. **AIモデル設定**
   - Gemini APIなどを利用してクエリの分解や情報の要約を行います。
2. **Web検索設定**
   - Google Custom Search API または SearXNG などのWeb検索プロバイダーを設定して、リアルタイムのWeb情報をフェッチします。
