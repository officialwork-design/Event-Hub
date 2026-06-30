# Event Hub v5 GAS Clean

## 目的

GASとスプレッドシート構成のみ整理した版です。

フロント側の `index.html / style.css / app.js / config.js` は含めていません。
既存のフロントはそのまま使い、Apps Script 側だけを整理する用途です。

## 正とするGAS配置

今後は以下のみをApps Scriptへ反映してください。

```text
gas/Code.gs
gas/ConfigService.gs
gas/SpreadsheetService.gs
gas/EventService.gs
gas/DashboardService.gs
gas/BlockService.gs
gas/Utils.gs
```

Event-Hub直下の `.gs` ファイルは使いません。

## スプレッドシート構成

`setupEventHub()` 実行時に以下のシートを作成・整備します。

```text
イベント管理
設定
ダッシュボード
ブロック管理
変更履歴
エラーログ
```

## 初期ログイン

初期データでは以下のどちらでもログインできます。

```text
1
```

```text
SHINJUKU
```

## 反映手順

1. このZIPを解凍
2. `gas/*.gs` をApps Scriptへ反映
3. Apps Scriptで `setupEventHub()` を実行
4. Webアプリを新バージョンで再デプロイ
5. GitHub側へ必要に応じて `gas/` フォルダをコミット

## 注意

既存のスプレッドシートIDを使う場合は、Apps Scriptのスクリプトプロパティに以下を設定してください。

```text
SPREADSHEET_ID
```

未設定の場合、`setupEventHub()` 実行時に新しいスプレッドシートを作成します。
