function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = getRequestParams_(e);
  const action = params.action || 'getDashboard';

  try {
    if (action === 'health') {
      return jsonResponse_({
        success: true,
        appName: 'Event Hub',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getConfig') {
      return jsonResponse_(getConfig_());
    }

    if (action === 'getDashboard') {
      return jsonResponse_(getDashboard_());
    }

    return jsonResponse_({
      success: false,
      message: 'Unknown action: ' + action
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
}

function getRequestParams_(e) {
  if (!e) return {};

  const params = e.parameter || {};

  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      return Object.assign({}, params, body);
    } catch (error) {
      return params;
    }
  }

  return params;
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties();

  return {
    success: true,
    appName: 'Event Hub',
    liffId: props.getProperty('LIFF_ID') || '',
    environment: props.getProperty('APP_ENV') || 'production'
  };
}

function getDashboard_() {
  return {
    success: true,
    dashboard: {
      eventName: 'Event Hub',
      eventDate: '未設定',
      venue: '未設定',
      expectedGuests: '未設定',
      lastUpdatedAt: new Date().toISOString()
    },
    summary: {
      preparationCount: 1,
      expenseTotal: 0,
      scheduleCount: 1,
      memoCount: 1
    },
    blocks: [
      {
        blockId: 'MOCK_PREPARATION_001',
        blockType: 'preparation',
        blockTitle: '準備物サンプル',
        blockContent: 'スプレッドシート未接続のため仮データを表示しています。',
        status: '確認中',
        amount: 0
      },
      {
        blockId: 'MOCK_SCHEDULE_001',
        blockType: 'schedule',
        blockTitle: '当日スケジュールサンプル',
        blockContent: '13:00 開始 / 17:00 完全撤収',
        status: '仮設定',
        amount: 0
      },
      {
        blockId: 'MOCK_MEMO_001',
        blockType: 'memo',
        blockTitle: '初期メモ',
        blockContent: 'GAS Web API 接続確認用の仮データです。',
        status: '表示確認',
        amount: 0
      }
    ]
  };
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
