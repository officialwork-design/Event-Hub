# Event Hub v2 Batch Editor

全カテゴリを「カテゴリ全体一括編集」に変更。

対象:
- 準備物
- 経費
- スケジュール
- メモ

保存仕様:
- 行の追加・削除・修正は画面上だけ
- 「〇〇を更新」ボタンを押した時だけスプレッドシートへ保存
- キャンセル時は変更破棄

反映手順:
1. ZIPを解凍
2. 既存の Event-Hub リポジトリへ上書き
3. config.js に GAS_WEB_APP_URL を入れる
4. gas/*.gs を Apps Script に反映
5. Apps Script を新バージョンで再デプロイ
6. GitHubへPush
