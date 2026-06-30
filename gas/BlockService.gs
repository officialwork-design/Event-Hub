function getBlocks_(params) {
  const ss = getSpreadsheet_();
  const eventId = params.eventId || getProperty_('EVENT_ID', 'OFFMEETING_001');
  const blockType = params.blockType || '';

  return {
    success: true,
    blocks: getBlockRows_(ss, eventId, blockType)
  };
}

function getBlockRows_(ss, eventId, blockType) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    if (String(row.isDeleted).toLowerCase() === 'true') continue;
    if (row.eventId !== eventId) continue;
    if (blockType && row.blockType !== blockType) continue;
    rows.push(row);
  }

  rows.sort(function(a, b) {
    return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
  });

  return rows;
}

function createBlock_(params) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  const now = new Date().toISOString();
  const blockId = 'BLOCK_' + Utilities.getUuid();
  const eventId = params.eventId || getProperty_('EVENT_ID', 'OFFMEETING_001');
  const updatedBy = params.updatedBy || params.lineUserId || 'unknown';

  const row = [
    blockId,
    eventId,
    params.blockType || 'memo',
    params.blockTitle || '無題',
    params.blockContent || '[]',
    Number(params.amount || 0),
    params.status || '未設定',
    params.assignedTo || '',
    Number(params.sortOrder || 999),
    false,
    now,
    now,
    updatedBy
  ];

  sheet.appendRow(row);
  touchDashboard_(ss, eventId, updatedBy);
  appendHistory_(ss, eventId, blockId, 'create', '', JSON.stringify(row), updatedBy);

  return {
    success: true,
    blockId: blockId
  };
}

function updateBlock_(params) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const blockId = params.blockId;

  if (!blockId) throw new Error('blockId is required.');

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    if (row.blockId === blockId) {
      const before = JSON.stringify(row);
      const updatedBy = params.updatedBy || params.lineUserId || 'unknown';
      const updated = Object.assign(row, {
        blockType: params.blockType !== undefined ? params.blockType : row.blockType,
        blockTitle: params.blockTitle !== undefined ? params.blockTitle : row.blockTitle,
        blockContent: params.blockContent !== undefined ? params.blockContent : row.blockContent,
        amount: params.amount !== undefined ? Number(params.amount) : row.amount,
        status: params.status !== undefined ? params.status : row.status,
        assignedTo: params.assignedTo !== undefined ? params.assignedTo : row.assignedTo,
        sortOrder: params.sortOrder !== undefined ? Number(params.sortOrder) : row.sortOrder,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      });

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([headers.map(function(header) {
        return updated[header];
      })]);
      touchDashboard_(ss, updated.eventId, updatedBy);
      appendHistory_(ss, updated.eventId, blockId, 'update', before, JSON.stringify(updated), updatedBy);

      return {
        success: true,
        blockId: blockId
      };
    }
  }

  throw new Error('Block not found: ' + blockId);
}

function deleteBlock_(params) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const blockId = params.blockId;

  if (!blockId) throw new Error('blockId is required.');

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    if (row.blockId === blockId) {
      const before = JSON.stringify(row);
      const updatedBy = params.updatedBy || params.lineUserId || 'unknown';
      row.isDeleted = true;
      row.updatedAt = new Date().toISOString();
      row.updatedBy = updatedBy;

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([headers.map(function(header) {
        return row[header];
      })]);
      touchDashboard_(ss, row.eventId, updatedBy);
      appendHistory_(ss, row.eventId, blockId, 'delete', before, JSON.stringify(row), updatedBy);

      return {
        success: true,
        blockId: blockId
      };
    }
  }

  throw new Error('Block not found: ' + blockId);
}

function touchDashboard_(ss, eventId, updatedBy) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const eventIndex = headers.indexOf('eventId');
  const updatedAtIndex = headers.indexOf('lastUpdatedAt');
  const updatedByIndex = headers.indexOf('lastUpdatedBy');

  if (eventIndex < 0 || updatedAtIndex < 0) return;

  for (let i = 1; i < values.length; i++) {
    if (values[i][eventIndex] === eventId) {
      sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date().toISOString());
      if (updatedByIndex >= 0) sheet.getRange(i + 1, updatedByIndex + 1).setValue(updatedBy);
      return;
    }
  }
}
