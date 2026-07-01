function loginEvent_(params) {
  const code = String(params.code || '').trim();
  if (!code) return { success: false, message: '管理番号またはイベントコードを入力してください。' };

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  if (!sheet) throw new Error('イベント管理シートがありません。setupEventHubを実行してください。');

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    if (String(row.code).trim().toLowerCase() === code.toLowerCase()) {
      if (String(row.isActive).toLowerCase() === 'false') {
        return { success: false, message: 'このイベントは無効です。' };
      }
      return { success: true, code: row.code, eventId: row.eventId, eventName: row.eventName };
    }
  }

  return { success: false, message: '該当するイベントがありません。' };
}

function createEventAuto_(params) {
  const eventName = String(params.eventName || '').trim();
  if (!eventName) return { success: false, message: 'イベント名を入力してください。' };

  const eventDate = String(params.eventDate || '').trim() || '未設定';
  const venue = String(params.venue || '').trim() || '未設定';
  const expectedGuests = String(params.expectedGuests || '').trim() || '未設定';
  const ss = getSpreadsheet_();
  const eventsSheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const dashboardSheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  const blocksSheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  const values = eventsSheet.getDataRange().getValues();
  const headers = values[0];
  let maxCode = 0;

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    const numericCode = Number(row.code);
    if (Number.isFinite(numericCode) && numericCode > maxCode) maxCode = numericCode;
  }

  const nextCode = String(maxCode + 1);
  const eventId = 'OFFMEETING_' + nextCode.padStart(3, '0');
  const now = nowIso_();
  const updatedBy = params.updatedBy || params.lineUserId || 'system';

  eventsSheet.appendRow([nextCode, eventId, eventName, true, 'auto', now]);
  dashboardSheet.appendRow([eventId, eventName, eventDate, venue, '', '', expectedGuests, 'auto', now, updatedBy]);

  const prefix = 'BLOCK_' + eventId + '_';
  const rows = [
    [prefix + 'PREPARATION', eventId, 'preparation', '準備物', JSON.stringify({ mode: 'group', groups: [] }), 0, '未設定', '', 1, false, now, now, updatedBy],
    [prefix + 'EXPENSE', eventId, 'expense', '経費', JSON.stringify([]), 0, '未設定', '', 2, false, now, now, updatedBy],
    [prefix + 'SCHEDULE', eventId, 'schedule', 'スケジュール', JSON.stringify([]), 0, '未設定', '', 3, false, now, now, updatedBy],
    [prefix + 'MEMO', eventId, 'memo', 'メモ', JSON.stringify([]), 0, '未設定', '', 4, false, now, now, updatedBy]
  ];

  blocksSheet.getRange(blocksSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

  return {
    success: true,
    code: nextCode,
    eventId: eventId,
    eventName: eventName,
    eventDate: eventDate,
    venue: venue,
    expectedGuests: expectedGuests,
    message: 'イベントを作成しました。ログインIDは ' + nextCode + ' です。'
  };
}

function getEvents_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const events = [];
  for (let i = 1; i < values.length; i++) events.push(rowToObject_(headers, values[i]));
  return { success: true, events: events };
}
