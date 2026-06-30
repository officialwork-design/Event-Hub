const SHEET_NAMES = {
  EVENTS: 'イベント管理',
  SETTINGS: '設定',
  DASHBOARD: 'ダッシュボード',
  BLOCKS: 'ブロック管理',
  HISTORY: '変更履歴',
  ERRORS: 'エラーログ'
};

const DEFAULT_EVENT_ID = 'SHINJUKU_OFF_20260720';

function setupEventHub() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('SPREADSHEET_ID');
  let ss;

  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } else {
    ss = SpreadsheetApp.create('Event Hub Database');
    spreadsheetId = ss.getId();
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  setupSheet_(ss, SHEET_NAMES.EVENTS, [
    'code',
    'eventId',
    'eventName',
    'isActive',
    'memo',
    'updatedAt'
  ]);

  setupSheet_(ss, SHEET_NAMES.SETTINGS, [
    'key',
    'value',
    'description',
    'updatedAt'
  ]);

  setupSheet_(ss, SHEET_NAMES.DASHBOARD, [
    'eventId',
    'eventName',
    'eventDate',
    'venue',
    'startTime',
    'endTime',
    'expectedGuests',
    'mainMemo',
    'lastUpdatedAt',
    'lastUpdatedBy'
  ]);

  setupSheet_(ss, SHEET_NAMES.BLOCKS, [
    'blockId',
    'eventId',
    'blockType',
    'blockTitle',
    'blockContent',
    'amount',
    'status',
    'assignedTo',
    'sortOrder',
    'isDeleted',
    'createdAt',
    'updatedAt',
    'updatedBy'
  ]);

  setupSheet_(ss, SHEET_NAMES.HISTORY, [
    'logId',
    'eventId',
    'blockId',
    'action',
    'beforeData',
    'afterData',
    'updatedBy',
    'updatedAt'
  ]);

  setupSheet_(ss, SHEET_NAMES.ERRORS, [
    'errorId',
    'functionName',
    'message',
    'stack',
    'createdAt',
    'userId',
    'requestData'
  ]);

  seedEventsIfEmpty_(ss);
  seedDashboardIfEmpty_(ss);
  seedBlocksIfEmpty_(ss);

  return {
    success: true,
    spreadsheetId: spreadsheetId,
    url: ss.getUrl()
  };
}

function getSpreadsheet_() {
  const spreadsheetId = getProperty_('SPREADSHEET_ID', '');

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not set. Run setupEventHub first.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function setupSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, headers.length)
    .getValues()[0];

  const shouldWriteHeaders = currentHeaders.every(function(value) {
    return value === '';
  });

  if (shouldWriteHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function seedEventsIfEmpty_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);

  if (sheet.getLastRow() >= 2) return;

  const now = nowIso_();

  sheet.appendRow([
    '1',
    DEFAULT_EVENT_ID,
    '新宿オフ会',
    true,
    '管理番号ログイン',
    now
  ]);

  sheet.appendRow([
    'SHINJUKU',
    DEFAULT_EVENT_ID,
    '新宿オフ会',
    true,
    'イベントコードログイン',
    now
  ]);
}

function seedDashboardIfEmpty_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);

  if (sheet.getLastRow() >= 2) return;

  sheet.appendRow([
    DEFAULT_EVENT_ID,
    '新宿オフ会',
    '2026-07-19T15:00:00.000Z',
    '未設定',
    '',
    '',
    '未設定',
    '初期データです。',
    nowIso_(),
    'system'
  ]);
}

function seedBlocksIfEmpty_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);

  if (sheet.getLastRow() >= 2) return;

  const now = nowIso_();

  sheet.appendRow([
    'BLOCK_PREPARATION_001',
    DEFAULT_EVENT_ID,
    'preparation',
    '準備物',
    JSON.stringify({
      mode: 'group',
      groups: [
        {
          category: '景品',
          items: [
            { name: '推しマンド', qty: '20', memo: 'メモ' },
            { name: 'チェキ', qty: '50', memo: 'メモ' }
          ]
        },
        {
          category: 'レンタル',
          items: [
            { name: '長机', qty: '5', memo: '' },
            { name: '椅子', qty: '20', memo: '' }
          ]
        }
      ]
    }),
    0,
    '確認中',
    '',
    1,
    false,
    now,
    now,
    'system'
  ]);

  sheet.appendRow([
    'BLOCK_EXPENSE_001',
    DEFAULT_EVENT_ID,
    'expense',
    '経費',
    JSON.stringify([
      { item: '会場費', amount: 270000, memo: '会場利用料' },
      { item: '飲食費', amount: 315000, memo: '70名想定' }
    ]),
    585000,
    '確認中',
    '',
    2,
    false,
    now,
    now,
    'system'
  ]);

  sheet.appendRow([
    'BLOCK_SCHEDULE_001',
    DEFAULT_EVENT_ID,
    'schedule',
    'スケジュール',
    JSON.stringify([
      { time: '12:30', item: '受付', memo: '開始' },
      { time: '13:00', item: '開始', memo: '司会' }
    ]),
    0,
    '仮設定',
    '',
    3,
    false,
    now,
    now,
    'system'
  ]);

  sheet.appendRow([
    'BLOCK_MEMO_001',
    DEFAULT_EVENT_ID,
    'memo',
    'メモ',
    JSON.stringify([
      { item: '注意事項', memo: '変更事項をここに記録' }
    ]),
    0,
    '確認中',
    '',
    4,
    false,
    now,
    now,
    'system'
  ]);
}
