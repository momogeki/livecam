# 日本のライブカメラ

ボタン（空・空港・河川敷・高速道路・都市・田園風景・海・神社仏閣・動物・店内・森・山・ランダム）を押すと、
YouTubeで配信中の日本のライブカメラを画面いっぱいに表示するサイト。

- 画面数は 1 / 2 / 4 / 6 / 9 / 12 から選べる（次回も覚えている）
- メニューはふだん隠れている。マウスを画面のいちばん上に持っていくと出る（スマホは上の「▾ メニュー」をタップ）

## ファイル構成

```
live-cam/
├── index.html     画面（ボタン・画面数・映像グリッド・拡大表示）
├── api/live.js    YouTube検索（Vercelのサーバー側で動く）
└── package.json
```

## ローカルで動かす

index.html をダブルクリックで開いても検索は動きません（検索部分はサーバーが必要なため）。

- [ ] 1. このフォルダに `.env` というファイルを作り、1行だけ書く
      `YOUTUBE_API_KEY=あなたのキー`
- [ ] 2. ターミナルでこのフォルダに移動して `node dev-server.mjs`
- [ ] 3. ブラウザで http://localhost:3000 を開く

`.env` は .gitignore に入っているので、GitHubには上がりません（キーが漏れない）。

## 公開までのチェックリスト

- [ ] 1. Google Cloud で YouTube Data API v3 を有効にして、APIキーを作る
- [ ] 2. このフォルダを GitHub の新しいリポジトリに push
- [ ] 3. Vercel で そのリポジトリを Import
- [ ] 4. Vercel → Settings → Environment Variables に追加
      名前：`YOUTUBE_API_KEY`　値：1で作ったキー
- [ ] 5. Deployments から Redeploy（環境変数は再デプロイ後に反映）
- [ ] 6. 公開URLを開いて、ボタンを全部押して確認

## APIの使用量

- ボタン1回の検索 ≒ 101ユニット（無料枠は1日10,000ユニット）
- 公開後（Vercel）は検索結果を3時間キャッシュするので、同じボタンを何回押しても消費しない
- 12ボタン × 1日8回更新 ≒ 9,700ユニット → 無料枠に収まる
- ⚠ ローカル（dev-server）はキャッシュしないので、押すたびに101ユニット（1日 約99回まで）
- 「↻ 並べ直す」と「画面数」の変更はAPIを使わない（手元の結果を使うだけ）

## 調整したいとき

- 検索語を変える：`api/live.js` の `CATEGORIES`
- 混ざってほしくないもの：`api/live.js` の `EXCLUDE`
- 画面数の選択肢：`index.html` の `COUNTS` と `<select id="count">`
- ボタンを増やす：`api/live.js` の `CATEGORIES` と `index.html` の `CATS` の両方に追加
