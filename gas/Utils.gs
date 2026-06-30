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
    "LOG_" + Utilities.getUuid(),
    eventId,
    blockId,
    action,
    beforeData,
    afterData,
    updatedBy,
    new Date().toISOString()
  ]);
}
