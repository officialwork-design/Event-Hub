# Event Hub Phase 2

## 内容

このZIPは、Event HubのPhase 2実装です。

追加内容:

- スプレッドシート自動作成
- シート初期化
- Script PropertiesへSPREADSHEET_ID自動保存
- ダッシュボード実データ取得
- 一覧取得
- 作成
- 更新
- 削除フラグ
- 変更履歴保存

## 反映ファイル

```text
app.js
config.js
index.html
style.css

gas/
├── Code.gs
├── ConfigService.gs
├── DashboardService.gs
├── SpreadsheetService.gs
├── BlockService.gs
└── Utils.gs
```

## 反映手順

1. ZIPを解凍
2. 既存のEvent-Hubリポジトリに上書き
3. `config.js` の `GAS_WEB_APP_URL` を確認
4. `gas/*.gs` をApps Scriptに同名ファイルで追加
5. Apps Scriptを新しいバージョンとしてデプロイ
6. Git commit / push

```bash
git add .
git commit -m "Add spreadsheet-backed dashboard"
git push origin main
```

## Apps Scriptで先に実行する関数

初回だけApps Scriptエディタから以下を実行してください。

```text
setupEventHub
```

この関数がスプレッドシートを作成し、`SPREADSHEET_ID` をスクリプトプロパティへ保存します。

## 確認URL

```text
https://officialwork-design.github.io/Event-Hub/
```
