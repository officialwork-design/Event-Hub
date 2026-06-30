function getDashboard_(params) {
  const ss = getSpreadsheet_();
  const eventId = params.eventId || getProperty_("EVENT_ID", "OFFMEETING_001");

  const dashboard = getDashboardRow_(ss, eventId);
  const blocks = getBlockRows_(ss, eventId, "");

  const summary = {
    preparationCount: blocks.filter(function(b) { return b.blockType === "preparation"; }).length,
    expenseTotal: blocks.filter(function(b) { return b.blockType === "expense"; }).reduce(function(sum, b) { return sum + Number(b.amount || 0); }, 0),
    scheduleCount: blocks.filter(function(b) { return b.blockType === "schedule"; }).length,
    memoCount: blocks.filter(function(b) { return b.blockType === "memo"; }).length
  };

  return {
    success: true,
    dashboard: dashboard,
    summary: summary,
    blocks: blocks
  };
}

function getDashboardRow_(ss, eventId) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = rowToObject_(headers, values[i]);
    if (row.eventId === eventId) return row;
  }

  return {
    eventId: eventId,
    eventName: getProperty_("APP_NAME", "Event Hub"),
    eventDate: "未設定",
    venue: "未設定",
    expectedGuests: "未設定",
    mainMemo: "",
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: "system"
  };
}
