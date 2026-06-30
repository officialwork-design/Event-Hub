# Event Hub v3 Preparation Hierarchy

## 内容
準備物を一階層 / 二階層の両方に対応しました。

### 一階層
カテゴリなしで準備物を並べます。

### 二階層
例:

景品
・推しマンド メモ
・チェキ メモ

## 反映手順
1. ZIPを解凍
2. 既存リポジトリへ上書き
3. config.js に GAS_WEB_APP_URL を戻す
4. gas/*.gs を Apps Script に反映
5. Apps Script を新バージョンで再デプロイ
6. git add / commit / pull --rebase / push
