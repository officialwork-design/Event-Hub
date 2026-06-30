function getConfig_() {
  return {
    success: true,
    appName: getProperty_('APP_NAME', 'Event Hub'),
    eventId: getProperty_('EVENT_ID', ''),
    liffId: getProperty_('LIFF_ID', ''),
    environment: getProperty_('APP_ENV', 'production'),
    spreadsheetId: getProperty_('SPREADSHEET_ID', '')
  };
}

function healthCheck_() {
  return {
    success: true,
    appName: getProperty_('APP_NAME', 'Event Hub'),
    status: 'ok',
    spreadsheetId: getProperty_('SPREADSHEET_ID', ''),
    timestamp: nowIso_()
  };
}
