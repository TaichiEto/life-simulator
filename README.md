# 人生シミュレーター

将来の資産推移を簡単にシミュレーションできるWebアプリケーションです。

## 機能

- **基本情報入力**: 現在の年齢、貯蓄額、月収入・支出、リタイア年齢を設定
- **リアルタイム資産推移グラフ**: Chart.jsを使用した美しいグラフ表示
- **ライフイベント管理**: 結婚、転職、家の購入などのイベントを追加・管理
- **データ永続化**: ブラウザのLocalStorageに保存、プライバシー保護
- **レスポンシブデザイン**: スマートフォン対応

## 使い方

1. 基本情報を入力
2. グラフで将来の資産推移を確認
3. ライフイベントを追加してシミュレーション
4. データは自動的に保存されます

## 技術スタック

- HTML5/CSS3
- Vanilla JavaScript (ES6+)
- Chart.js
- レスポンシブデザイン

## セキュリティ

全てのデータはクライアントサイド（ブラウザ）で処理され、サーバーに送信されることはありません。

## GitHub Pagesでの利用

このアプリケーションは静的サイトとして動作するため、GitHub Pagesで簡単にホストできます。

### セットアップ手順

1. このリポジトリをfork
2. Settings > Pages でSource を `Deploy from a branch` に設定
3. Branch を `main` に設定
4. 数分後に `https://[username].github.io/life-simulation` でアクセス可能

## ローカルでの開発

```bash
# リポジトリをクローン
git clone https://github.com/[username]/life-simulation.git
cd life-simulation

# ローカルサーバーを起動
python3 -m http.server 8000

# ブラウザで http://localhost:8000 を開く
```

## ライセンス

MIT License