# Event Hub 反映手順

1. ZIPを解凍する
2. `Event-Hub` リポジトリ直下へ上書きする
3. `config.js` の `GAS_WEB_APP_URL` にWebアプリURLを入れる
4. `gas/Code.gs` をApps Scriptへ貼り付ける
5. Webアプリを再デプロイする
6. Git反映する

```bash
git add .
git commit -m "Update dashboard app"
git push origin main
```

確認URL:

```text
https://officialwork-design.github.io/Event-Hub/
```
