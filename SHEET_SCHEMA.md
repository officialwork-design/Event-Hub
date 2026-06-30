# Event Hub Spreadsheet Schema

## イベント管理

|列|内容|
|---|---|
|code|管理番号またはイベントコード|
|eventId|内部イベントID|
|eventName|イベント名|
|isActive|有効/無効|
|memo|メモ|
|updatedAt|更新日時|

## ダッシュボード

|列|内容|
|---|---|
|eventId|イベントID|
|eventName|イベント名|
|eventDate|開催日|
|venue|会場|
|startTime|開始時間|
|endTime|終了時間|
|expectedGuests|予定人数|
|mainMemo|メモ|
|lastUpdatedAt|最終更新日時|
|lastUpdatedBy|最終更新者|

## ブロック管理

|列|内容|
|---|---|
|blockId|ブロックID|
|eventId|イベントID|
|blockType|preparation / expense / schedule / memo|
|blockTitle|表示名|
|blockContent|JSON文字列|
|amount|合計金額|
|status|ステータス|
|assignedTo|担当|
|sortOrder|並び順|
|isDeleted|削除フラグ|
|createdAt|作成日時|
|updatedAt|更新日時|
|updatedBy|更新者|

## blockContent 形式

### 準備物 一階層

```json
{
  "mode": "flat",
  "items": [
    {
      "name": "長机",
      "qty": "5",
      "memo": "レンタル"
    }
  ]
}
```

### 準備物 二階層

```json
{
  "mode": "group",
  "groups": [
    {
      "category": "景品",
      "items": [
        {
          "name": "推しマンド",
          "qty": "20",
          "memo": "メモ"
        }
      ]
    }
  ]
}
```

### 経費

```json
[
  {
    "item": "会場費",
    "amount": 270000,
    "memo": "会場利用料"
  }
]
```

### スケジュール

```json
[
  {
    "time": "12:30",
    "item": "受付",
    "memo": "開始"
  }
]
```

### メモ

```json
[
  {
    "item": "注意事項",
    "memo": "変更事項"
  }
]
```
