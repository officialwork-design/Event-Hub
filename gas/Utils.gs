function getRequestParams_(e) {
  if (!e) return {};

  const params = e.parameter || {};

  if (e.postData && e.postData.contents) {
    try {
      return Object.assign({}, params, JSON.parse(e.postData.contents));
    } catch (error) {
      return params;
    }
  }

  return params;
}

function getProperty_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value || fallback;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObject_(headers, row) {
  const obj = {};

  headers.forEach(function(header, index) {
    obj[header] = row[index];
  });

  return obj;
}

function appendHistory_(ss, eventId, blockId, action, beforeData, afterData, updatedBy) {
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);

  sheet.appendRow([
    'LOG_' + Utilities.getUuid(),
    eventId,
    blockId,
    action,
    beforeData,
    afterData,
    updatedBy,
    nowIso_()
  ]);
}

function logError_(functionName, error, requestData) {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_NAMES.ERRORS);

    if (!sheet) return;

    sheet.appendRow([
      'ERROR_' + Utilities.getUuid(),
      functionName,
      error.message,
      error.stack,
      nowIso_(),
      requestData && requestData.lineUserId ? requestData.lineUserId : '',
      JSON.stringify(requestData || {})
    ]);
  } catch (logError) {
    console.error(logError);
  }
}

function nowIso_() {
  return new Date().toISOString();
}
