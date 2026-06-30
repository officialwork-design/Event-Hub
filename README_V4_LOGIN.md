# Event Hub v4 Login

## 追加内容

- 管理番号 / イベントコードログイン
- ログイン後に該当イベントの管理画面を表示
- LocalStorageで自動ログイン
- ログアウト
- イベント管理シート追加

## 初期ログイン

初期データでは以下でログインできます。

```text
1
```

または

```text
SHINJUKU
```

## 反映手順

1. ZIPを解凍して既存リポジトリへ上書き
2. config.js に GAS_WEB_APP_URL を戻す
3. gas/*.gs を Apps Script に反映
4. Apps Scriptで setupEventHub を実行
5. Webアプリを新バージョンで再デプロイ
6. git add / commit / pull --rebase / push
