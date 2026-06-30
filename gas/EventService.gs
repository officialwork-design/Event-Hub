function loginEvent_(params) {
  const code = String(params.code || '').trim();

  if (!code) {
    return {
      success: false,
      message: '管理番号またはイベントコードを入力してください。'
    };
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);

  if (!sheet) {
    throw new Error('イベント管理シートがありません。setupEventHubを実行してください。');
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);

    if (String(row.code).trim().toLowerCase() === code.toLowerCase()) {
      if (String(row.isActive).toLowerCase() === 'false') {
        return {
          success: false,
          message: 'このイベントは無効です。'
        };
      }

      return {
        success: true,
        code: row.code,
        eventId: row.eventId,
        eventName: row.eventName
      };
    }
  }

  return {
    success: false,
    message: '該当するイベントがありません。'
  };
}

function getEvents_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const events = [];

  for (let i = 1; i < values.length; i++) {
    events.push(rowToObject_(headers, values[i]));
  }

  return {
    success: true,
    events: events
  };
}
