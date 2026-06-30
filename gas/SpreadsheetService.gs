const SHEET_NAMES = {
  SETTINGS: "設定",
  DASHBOARD: "ダッシュボード",
  BLOCKS: "ブロック管理",
  HISTORY: "変更履歴",
  ERRORS: "エラーログ"
};

function setupEventHub() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty("SPREADSHEET_ID");

  let ss;
  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } else {
    ss = SpreadsheetApp.create("Event Hub Database");
    spreadsheetId = ss.getId();
    props.setProperty("SPREADSHEET_ID", spreadsheetId);
  }

  setupSheet_(ss, SHEET_NAMES.SETTINGS, ["key", "value", "description", "updatedAt"]);
  setupSheet_(ss, SHEET_NAMES.DASHBOARD, ["eventId", "eventName", "eventDate", "venue", "startTime", "endTime", "expectedGuests", "mainMemo", "lastUpdatedAt", "lastUpdatedBy"]);
  setupSheet_(ss, SHEET_NAMES.BLOCKS, ["blockId", "eventId", "blockType", "blockTitle", "blockContent", "amount", "status", "assignedTo", "sortOrder", "isDeleted", "createdAt", "updatedAt", "updatedBy"]);
  setupSheet_(ss, SHEET_NAMES.HISTORY, ["logId", "eventId", "blockId", "action", "beforeData", "afterData", "updatedBy", "updatedAt"]);
  setupSheet_(ss, SHEET_NAMES.ERRORS, ["errorId", "functionName", "message", "stack", "createdAt", "userId", "requestData"]);

  seedDashboardIfEmpty_(ss);
  seedBlocksIfEmpty_(ss);

  return { success: true, spreadsheetId: spreadsheetId, url: ss.getUrl() };
}

function getSpreadsheet_() {
  const spreadsheetId = getProperty_("SPREADSHEET_ID", "");
  if (!spreadsheetId) throw new Error("SPREADSHEET_ID is not set. Run setupEventHub first.");
  return SpreadsheetApp.openById(spreadsheetId);
}

function setupSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isEmpty = current.every(function(value) { return value === ""; });

  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function seedDashboardIfEmpty_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  if (sheet.getLastRow() >= 2) return;

  sheet.appendRow([
    getProperty_("EVENT_ID", "OFFMEETING_001"),
    getProperty_("APP_NAME", "Event Hub"),
    "未設定",
    "未設定",
    "",
    "",
    "未設定",
    "初期データです。",
    new Date().toISOString(),
    "system"
  ]);
}

function seedBlocksIfEmpty_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BLOCKS);
  if (sheet.getLastRow() >= 2) return;

  const now = new Date().toISOString();
  const eventId = getProperty_("EVENT_ID", "OFFMEETING_001");

  sheet.appendRow(["BLOCK_PREP_001", eventId, "preparation", "準備物", JSON.stringify([
    { title: "レンタル品", amount: 0, memo: "机・椅子・マイク" },
    { title: "印刷物", amount: 0, memo: "チケット・名札" }
  ]), 0, "確認中", "", 1, false, now, now, "system"]);

  sheet.appendRow(["BLOCK_EXP_001", eventId, "expense", "経費", JSON.stringify([
    { title: "会場費", amount: 270000, memo: "会場利用料" },
    { title: "飲食費", amount: 315000, memo: "70名想定" }
  ]), 585000, "確認中", "", 2, false, now, now, "system"]);

  sheet.appendRow(["BLOCK_SCH_001", eventId, "schedule", "スケジュール", JSON.stringify([
    { title: "受付", amount: 0, memo: "12:30 受付開始" },
    { title: "開始", amount: 0, memo: "13:00 オフ会開始" },
    { title: "撤収", amount: 0, memo: "17:00 完全撤収" }
  ]), 0, "仮設定", "", 3, false, now, now, "system"]);

  sheet.appendRow(["BLOCK_MEMO_001", eventId, "memo", "メモ", JSON.stringify([
    { title: "注意事項", amount: 0, memo: "変更事項をここに記録" }
  ]), 0, "確認中", "", 4, false, now, now, "system"]);
}
