function getDashboard_(params) {
  const ss = getSpreadsheet_();
  const eventId = params.eventId;

  if (!eventId) {
    throw new Error('eventId is required.');
  }

  const dashboard = getDashboardRow_(ss, eventId);
  const blocks = getBlockRows_(ss, eventId, '');

  return {
    success: true,
    dashboard: dashboard,
    summary: buildSummary_(blocks),
    blocks: blocks
  };
}

function getDashboardRow_(ss, eventId) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);

    if (row.eventId === eventId) {
      return row;
    }
  }

  return {
    eventId: eventId,
    eventName: eventId,
    eventDate: '未設定',
    venue: '未設定',
    expectedGuests: '未設定',
    mainMemo: '',
    lastUpdatedAt: nowIso_(),
    lastUpdatedBy: 'system'
  };
}

function touchDashboard_(ss, eventId, updatedBy) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const updatedAtIndex = headers.indexOf('lastUpdatedAt');
  const updatedByIndex = headers.indexOf('lastUpdatedBy');

  if (updatedAtIndex === -1 || updatedByIndex === -1) return;

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);

    if (row.eventId === eventId) {
      sheet.getRange(i + 1, updatedAtIndex + 1).setValue(nowIso_());
      sheet.getRange(i + 1, updatedByIndex + 1).setValue(updatedBy || 'unknown');
      return;
    }
  }
}

function buildSummary_(blocks) {
  return {
    preparationCount: countPreparationItems_(blocks),
    expenseTotal: getExpenseTotal_(blocks),
    scheduleCount: countRowsByType_(blocks, 'schedule'),
    memoCount: countRowsByType_(blocks, 'memo')
  };
}

function countPreparationItems_(blocks) {
  const block = blocks.find(function(item) {
    return item.blockType === 'preparation';
  });

  if (!block) return 0;

  try {
    const data = JSON.parse(block.blockContent || '{}');

    if (data.mode === 'group') {
      return (data.groups || []).reduce(function(total, group) {
        return total + ((group.items || []).length);
      }, 0);
    }

    return (data.items || []).length;
  } catch (error) {
    return block.blockContent ? 1 : 0;
  }
}

function countRowsByType_(blocks, type) {
  const block = blocks.find(function(item) {
    return item.blockType === type;
  });

  if (!block) return 0;

  try {
    const rows = JSON.parse(block.blockContent || '[]');
    return Array.isArray(rows) ? rows.length : 0;
  } catch (error) {
    return block.blockContent ? 1 : 0;
  }
}

function getExpenseTotal_(blocks) {
  const block = blocks.find(function(item) {
    return item.blockType === 'expense';
  });

  return block ? Number(block.amount || 0) : 0;
}
