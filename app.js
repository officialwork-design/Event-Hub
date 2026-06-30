const CATEGORY_META = {
  preparation: { label: "準備物" },
  expense: { label: "経費" },
  schedule: { label: "スケジュール" },
  memo: { label: "メモ" }
};

const ASSET_VERSION = "20260630-prep-hierarchy";
const state = {
  profile: null,
  remoteConfig: { appName: "Event Hub", eventId: "OFFMEETING_001", liffId: "" },
  dashboard: null,
  activeFilter: "preparation",
  editingType: null,
  draftMode: "flat",
  draftRows: [],
  draftGroups: []
};

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await boot();
});

function bindEvents() {
  document.getElementById("reloadButton").addEventListener("click", loadDashboard);
  document.getElementById("editCurrentButton").addEventListener("click", () => openEditor(state.activeFilter));
  document.querySelectorAll(".nav-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.type;
      renderCurrent();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeModal));
  document.getElementById("addRowButton").addEventListener("click", addRow);
  document.getElementById("addGroupButton").addEventListener("click", addGroup);
  document.getElementById("saveCategoryButton").addEventListener("click", saveCurrent);
  document.getElementById("deleteCategoryButton").addEventListener("click", () => deleteCategory(state.editingType));
}

async function boot() {
  try {
    setStatus("起動中", "loading");
    state.remoteConfig = await loadRemoteConfig();
    await initLiffIfPossible();
    await loadDashboard();
  } catch (error) {
    console.error(error);
    setStatus("接続エラー", "error");
    renderError(error.message);
  }
}

async function loadRemoteConfig() {
  if (!CONFIG.GAS_WEB_APP_URL) throw new Error("config.jsにGAS_WEB_APP_URLが設定されていません。");
  const response = await fetch(buildGasUrl("getConfig", { v: ASSET_VERSION }));
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "設定取得に失敗しました。");
  return data;
}

async function initLiffIfPossible() {
  const liffId = state.remoteConfig.liffId || "";
  if (!liffId || typeof liff === "undefined") return;
  await liff.init({ liffId });
  if (liff.isLoggedIn()) state.profile = await liff.getProfile();
}

async function loadDashboard() {
  setStatus("読込中", "loading");
  const response = await fetch(buildGasUrl("getDashboard", {
    eventId: state.remoteConfig.eventId,
    lineUserId: getLineUserId(),
    v: ASSET_VERSION
  }));
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "取得に失敗しました。");
  state.dashboard = data;
  renderDashboard();
  setStatus("接続OK", "success");
}

function buildGasUrl(action, params = {}) {
  const url = new URL(CONFIG.GAS_WEB_APP_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  return url.toString();
}

async function postGas(action, payload) {
  const body = Object.assign({
    action,
    eventId: state.remoteConfig.eventId,
    lineUserId: getLineUserId(),
    updatedBy: getDisplayName()
  }, payload);
  const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "保存に失敗しました。");
  return data;
}

function renderDashboard() {
  const dashboard = state.dashboard.dashboard || {};
  setText("eventName", dashboard.eventName || "-");
  setText("eventDate", dashboard.eventDate || "-");
  setText("venue", dashboard.venue || "-");
  setText("expectedGuests", dashboard.expectedGuests || "-");
  setText("lastUpdated", "最終更新: " + formatDateTime(dashboard.lastUpdatedAt));
  setText("preparationCount", countPreparation() + "件");
  setText("expenseTotal", formatCurrency(sumRows(getRows("expense"))));
  setText("scheduleCount", getRows("schedule").length + "件");
  setText("memoCount", getRows("memo").length + "件");
  renderCurrent();
}

function renderCurrent() {
  const type = state.activeFilter;
  const meta = CATEGORY_META[type];
  document.querySelectorAll(".nav-card").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.type === type);
  });
  setText("panelTitle", meta.label);
  setText("panelDescription", type === "preparation"
    ? "一階層 / 二階層どちらでも管理できます。"
    : meta.label + "をまとめて編集し、更新ボタンで保存します。");
  if (type === "preparation") renderPreparationView();
  else renderSimpleView(type);
}

function renderPreparationView() {
  const container = document.getElementById("blockList");
  const data = getPreparationData();
  if (data.mode === "group") {
    const groups = data.groups || [];
    container.innerHTML = `<article class="category-card">
      <div class="category-card-header"><span class="block-type">準備物</span><span class="block-status">二階層</span></div>
      ${groups.length ? groups.map(renderPreparationGroup).join("") : '<p class="empty-state">準備物がありません。</p>'}
      ${actionButtons("準備物")}
    </article>`;
  } else {
    const rows = data.items || [];
    container.innerHTML = `<article class="category-card">
      <div class="category-card-header"><span class="block-type">準備物</span><span class="block-status">一階層</span></div>
      <div class="item-list">${rows.length ? rows.map(renderPrepRow).join("") : '<p class="empty-state">準備物がありません。</p>'}</div>
      ${actionButtons("準備物")}
    </article>`;
  }
  bindPanelButtons();
}

function renderPreparationGroup(group) {
  const items = group.items || [];
  return `<div class="item-group">
    <h4>${escapeHtml(group.category || "未分類")}</h4>
    ${items.length ? items.map(renderPrepLine).join("") : '<p class="empty-state">項目がありません。</p>'}
  </div>`;
}

function renderPrepRow(row) {
  return `<div class="item-row">
    <strong>${escapeHtml(row.name || "")}</strong>
    <span>${escapeHtml(row.qty || "")}</span>
    <small>${escapeHtml(row.memo || "")}</small>
  </div>`;
}

function renderPrepLine(row) {
  return `<div class="item-line">
    <strong>・${escapeHtml(row.name || "")}</strong>
    <span>${escapeHtml(row.qty || "")}</span>
    <small>${escapeHtml(row.memo || "")}</small>
  </div>`;
}

function renderSimpleView(type) {
  const meta = CATEGORY_META[type];
  const rows = getRows(type);
  const total = type === "expense" ? `<small class="amount">合計 ${formatCurrency(sumRows(rows))}</small>` : "";
  document.getElementById("blockList").innerHTML = `<article class="category-card">
    <div class="category-card-header"><span class="block-type">${meta.label}</span><span class="block-status">一括管理</span></div>
    <div class="item-list">${rows.length ? rows.map((row) => renderSimpleRow(row, type)).join("") : '<p class="empty-state">項目がありません。</p>'}</div>
    ${total}
    ${actionButtons(meta.label)}
  </article>`;
  bindPanelButtons();
}

function renderSimpleRow(row, type) {
  if (type === "expense") {
    return `<div class="item-row"><strong>${escapeHtml(row.item || "")}</strong><span>${formatCurrency(row.amount || 0)}</span><small>${escapeHtml(row.memo || "")}</small></div>`;
  }
  if (type === "schedule") {
    return `<div class="item-row"><strong>${escapeHtml(row.time || "")}</strong><span>${escapeHtml(row.item || "")}</span><small>${escapeHtml(row.memo || "")}</small></div>`;
  }
  return `<div class="item-row"><strong>${escapeHtml(row.item || "")}</strong><span></span><small>${escapeHtml(row.memo || "")}</small></div>`;
}

function actionButtons(label) {
  return `<div class="panel-actions panel-actions-inline">
    <button class="primary-button" id="openEditorButton">${label}を編集</button>
    <button class="danger-button" id="deleteButton">${label}全体を削除</button>
  </div>`;
}

function bindPanelButtons() {
  document.getElementById("openEditorButton").addEventListener("click", () => openEditor(state.activeFilter));
  document.getElementById("deleteButton").addEventListener("click", () => deleteCategory(state.activeFilter));
}

function openEditor(type) {
  state.editingType = type;
  const meta = CATEGORY_META[type];
  setText("modalTitle", meta.label + "編集");
  setText("saveCategoryButton", meta.label + "を更新");
  setText("deleteCategoryButton", meta.label + "全体を削除");

  if (type === "preparation") {
    const data = getPreparationData();
    state.draftMode = data.mode || "flat";
    state.draftRows = (data.items || []).map(clonePrepRow);
    state.draftGroups = (data.groups || []).map((group) => ({
      category: group.category || "",
      items: (group.items || []).map(clonePrepRow)
    }));
  } else {
    state.draftMode = "flat";
    state.draftRows = getRows(type).map((row) => Object.assign({}, row));
  }

  if (!state.draftRows.length && type !== "preparation") state.draftRows = [emptySimpleRow(type)];
  if (type === "preparation" && state.draftMode === "flat" && !state.draftRows.length) state.draftRows = [emptyPrepRow()];
  if (type === "preparation" && state.draftMode === "group" && !state.draftGroups.length) {
    state.draftGroups = [{ category: "", items: [emptyPrepRow()] }];
  }
  renderModeSwitch();
  renderEditorRows();
  openModal();
}

function renderModeSwitch() {
  const area = document.getElementById("modeSwitch");
  if (state.editingType !== "preparation") {
    area.innerHTML = "";
    document.getElementById("addGroupButton").style.display = "none";
    return;
  }

  area.innerHTML = `<span>準備物の構造</span>
    <button class="mode-button ${state.draftMode === "flat" ? "is-active" : ""}" id="flatModeButton" type="button">一階層</button>
    <button class="mode-button ${state.draftMode === "group" ? "is-active" : ""}" id="groupModeButton" type="button">二階層</button>`;
  document.getElementById("flatModeButton").addEventListener("click", () => {
    if (state.draftMode === "flat") return;
    state.draftMode = "flat";
    const flattened = flattenGroups();
    if (flattened.length) state.draftRows = flattened;
    renderModeSwitch();
    renderEditorRows();
  });
  document.getElementById("groupModeButton").addEventListener("click", () => {
    if (state.draftMode === "group") return;
    state.draftMode = "group";
    state.draftGroups = [{ category: state.draftGroups[0]?.category || "", items: state.draftRows.length ? state.draftRows.map(clonePrepRow) : [emptyPrepRow()] }];
    renderModeSwitch();
    renderEditorRows();
  });
}

function renderEditorRows() {
  const type = state.editingType;
  const wrapper = document.getElementById("batchRows");
  document.getElementById("addGroupButton").style.display = type === "preparation" && state.draftMode === "group" ? "inline-flex" : "none";
  document.getElementById("addRowButton").style.display = type === "preparation" && state.draftMode === "group" ? "none" : "inline-flex";

  if (type === "preparation" && state.draftMode === "group") {
    wrapper.innerHTML = state.draftGroups.map((group, groupIndex) => `<div class="group-editor">
      <div class="group-header">
        <input data-group="${groupIndex}" data-field="category" placeholder="カテゴリ名（例：景品）" value="${escapeAttr(group.category || "")}">
        <button class="danger-button" data-delete-group="${groupIndex}" type="button">カテゴリ削除</button>
      </div>
      <div class="group-items">${(group.items || []).map((row, rowIndex) => prepItemEditor(row, groupIndex, rowIndex)).join("")}</div>
      <button class="secondary-button" data-add-item="${groupIndex}" type="button">項目追加</button>
    </div>`).join("");
  } else {
    wrapper.innerHTML = state.draftRows.map((row, index) => rowEditor(row, index, type)).join("");
  }

  bindEditorInputs();
  updateDraftTotal();
}

function prepItemEditor(row, groupIndex, rowIndex) {
  const attrs = `data-group="${groupIndex}" data-row="${rowIndex}"`;
  return `<div class="group-item">
    <input ${attrs} data-field="name" placeholder="項目" value="${escapeAttr(row.name || "")}">
    ${qtyEditor(attrs, row.qty)}
    <textarea ${attrs} data-field="memo" placeholder="メモ">${escapeHtml(row.memo || "")}</textarea>
    <button class="danger-button" data-delete-item="${groupIndex}:${rowIndex}" type="button">削除</button>
  </div>`;
}

function rowEditor(row, index, type) {
  if (type === "preparation") {
    const attrs = `data-index="${index}"`;
    return `<div class="batch-row">
      <input ${attrs} data-field="name" placeholder="項目" value="${escapeAttr(row.name || "")}">
      ${qtyEditor(attrs, row.qty)}
      <textarea ${attrs} data-field="memo" placeholder="メモ">${escapeHtml(row.memo || "")}</textarea>
      <button class="danger-button" data-delete-row="${index}" type="button">削除</button>
    </div>`;
  }
  if (type === "expense") {
    return `<div class="batch-row">
      <input data-index="${index}" data-field="item" placeholder="項目" value="${escapeAttr(row.item || "")}">
      <input data-index="${index}" data-field="amount" type="number" min="0" inputmode="numeric" placeholder="金額" value="${escapeAttr(row.amount || "")}">
      <textarea data-index="${index}" data-field="memo" placeholder="備考">${escapeHtml(row.memo || "")}</textarea>
      <button class="danger-button" data-delete-row="${index}" type="button">削除</button>
    </div>`;
  }
  if (type === "schedule") {
    return `<div class="batch-row">
      <input data-index="${index}" data-field="time" placeholder="時間" value="${escapeAttr(row.time || "")}">
      <input data-index="${index}" data-field="item" placeholder="項目" value="${escapeAttr(row.item || "")}">
      <textarea data-index="${index}" data-field="memo" placeholder="備考">${escapeHtml(row.memo || "")}</textarea>
      <button class="danger-button" data-delete-row="${index}" type="button">削除</button>
    </div>`;
  }
  return `<div class="batch-row memo-row">
    <input data-index="${index}" data-field="item" placeholder="項目" value="${escapeAttr(row.item || "")}">
    <textarea data-index="${index}" data-field="memo" placeholder="備考">${escapeHtml(row.memo || "")}</textarea>
    <button class="danger-button" data-delete-row="${index}" type="button">削除</button>
  </div>`;
}

function qtyEditor(attrs, qty) {
  const value = String(qty || "");
  const isPreset = isPresetQty(value);
  return `<div class="qty-editor">
    <select ${attrs} data-field="qtyMode">
      ${qtyOptions(isPreset ? value : "other")}
    </select>
    <input ${attrs} data-field="qty" class="${isPreset ? "is-hidden" : ""}" placeholder="その他" value="${escapeAttr(isPreset ? "" : value)}">
  </div>`;
}

function qtyOptions(selected) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    html += `<option value="${i}" ${String(selected) === String(i) ? "selected" : ""}>${i}</option>`;
  }
  html += `<option value="other" ${String(selected) === "other" ? "selected" : ""}>その他</option>`;
  return html;
}

function bindEditorInputs() {
  document.querySelectorAll("#batchRows input,#batchRows textarea").forEach((element) => {
    element.addEventListener("input", updateDraftFromInput);
  });
  document.querySelectorAll("#batchRows select").forEach((element) => {
    element.addEventListener("change", updateDraftFromInput);
  });
  document.querySelectorAll("[data-delete-row]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.draftRows.splice(Number(event.target.dataset.deleteRow), 1);
      if (!state.draftRows.length) state.draftRows = [emptySimpleRow(state.editingType)];
      renderEditorRows();
    });
  });
  document.querySelectorAll("[data-delete-group]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.draftGroups.splice(Number(event.target.dataset.deleteGroup), 1);
      if (!state.draftGroups.length) state.draftGroups = [{ category: "", items: [emptyPrepRow()] }];
      renderEditorRows();
    });
  });
  document.querySelectorAll("[data-add-item]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.draftGroups[Number(event.target.dataset.addItem)].items.push(emptyPrepRow());
      renderEditorRows();
    });
  });
  document.querySelectorAll("[data-delete-item]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const [groupIndex, rowIndex] = event.target.dataset.deleteItem.split(":").map(Number);
      state.draftGroups[groupIndex].items.splice(rowIndex, 1);
      if (!state.draftGroups[groupIndex].items.length) state.draftGroups[groupIndex].items = [emptyPrepRow()];
      renderEditorRows();
    });
  });
}

function updateDraftFromInput(event) {
  const element = event.target;
  const field = element.dataset.field;
  const target = getDraftTarget(element);
  if (!target) return;

  if (field === "qtyMode") {
    target.qty = element.value === "other" ? "" : element.value;
    renderEditorRows();
    return;
  }

  target[field] = element.value;
  updateDraftTotal();
}

function getDraftTarget(element) {
  if (element.dataset.group !== undefined && element.dataset.row !== undefined) {
    const group = state.draftGroups[Number(element.dataset.group)];
    return group?.items?.[Number(element.dataset.row)] || null;
  }
  if (element.dataset.group !== undefined) return state.draftGroups[Number(element.dataset.group)] || null;
  if (element.dataset.index !== undefined) return state.draftRows[Number(element.dataset.index)] || null;
  return null;
}

function addRow() {
  state.draftRows.push(emptySimpleRow(state.editingType));
  renderEditorRows();
}

function addGroup() {
  state.draftGroups.push({ category: "", items: [emptyPrepRow()] });
  renderEditorRows();
}

async function saveCurrent() {
  const type = state.editingType;
  const meta = CATEGORY_META[type];
  let content;
  let amount = 0;

  if (type === "preparation") {
    const data = state.draftMode === "group"
      ? { mode: "group", groups: cleanGroups() }
      : { mode: "flat", items: cleanPrepRows(state.draftRows) };
    content = JSON.stringify(data);
  } else {
    const rows = cleanSimpleRows(state.draftRows, type);
    content = JSON.stringify(rows);
    if (type === "expense") amount = sumRows(rows);
  }

  try {
    setStatus(meta.label + "保存中", "loading");
    const block = getBlock(type);
    const payload = {
      blockType: type,
      blockTitle: meta.label,
      blockContent: content,
      amount,
      status: "更新済み",
      sortOrder: getSortOrder(type)
    };
    if (block?.blockId) await postGas("updateBlock", Object.assign({ blockId: block.blockId }, payload));
    else await postGas("createBlock", payload);
    closeModal();
    await loadDashboard();
  } catch (error) {
    alert(error.message);
    setStatus("保存エラー", "error");
  }
}

async function deleteCategory(type) {
  const block = getBlock(type);
  const meta = CATEGORY_META[type];
  if (!block?.blockId) {
    alert("削除できるデータがありません。");
    return;
  }
  if (!confirm(meta.label + "全体を削除しますか？")) return;
  await postGas("deleteBlock", { blockId: block.blockId });
  closeModal();
  await loadDashboard();
}

function getBlock(type) {
  return (state.dashboard?.blocks || []).find((block) => block.blockType === type) || null;
}

function getRows(type) {
  const block = getBlock(type);
  if (!block) return [];
  try {
    const parsed = JSON.parse(block.blockContent || "[]");
    if (Array.isArray(parsed)) return parsed.map((row) => normalizeSimpleRow(row, type));
    if (parsed && Array.isArray(parsed.items)) return parsed.items.map((row) => normalizeSimpleRow(row, type));
  } catch (error) {
    return legacyTextRows(block.blockContent, type);
  }
  return legacyTextRows(block.blockContent, type);
}

function getPreparationData() {
  const block = getBlock("preparation");
  if (!block) return { mode: "flat", items: [] };
  try {
    const parsed = JSON.parse(block.blockContent || "{}");
    if (Array.isArray(parsed)) return { mode: "flat", items: parsed.map(normalizePrepRow) };
    if (parsed.mode === "group") {
      return {
        mode: "group",
        groups: (parsed.groups || []).map((group) => ({
          category: group.category || group.name || "",
          items: (group.items || []).map(normalizePrepRow)
        }))
      };
    }
    if (parsed.mode === "flat" || Array.isArray(parsed.items)) {
      return { mode: "flat", items: (parsed.items || []).map(normalizePrepRow) };
    }
  } catch (error) {
    return { mode: "flat", items: legacyTextRows(block.blockContent, "preparation").map(normalizePrepRow) };
  }
  return { mode: "flat", items: legacyTextRows(block.blockContent, "preparation").map(normalizePrepRow) };
}

function countPreparation() {
  const data = getPreparationData();
  return data.mode === "group"
    ? (data.groups || []).reduce((sum, group) => sum + (group.items || []).length, 0)
    : (data.items || []).length;
}

function normalizePrepRow(row) {
  if (typeof row === "string") return { name: row, qty: "", memo: "" };
  return {
    name: row.name || row.item || row.title || "",
    qty: row.qty || row.quantity || "",
    memo: row.memo || row.note || row.remarks || ""
  };
}

function normalizeSimpleRow(row, type) {
  if (typeof row === "string") return normalizeSimpleTextRow(row, type);
  return {
    time: type === "schedule" ? row.time || "" : "",
    item: row.item || row.title || row.name || "",
    amount: type === "expense" ? Number(row.amount || 0) : 0,
    memo: row.memo || row.note || row.remarks || row.comment || ""
  };
}

function normalizeSimpleTextRow(text, type) {
  if (type === "schedule") {
    const match = String(text).match(/^(\d{1,2}:\d{2})\s+(.+)$/);
    if (match) return { time: match[1], item: match[2], amount: 0, memo: "" };
  }
  return { time: "", item: String(text), amount: 0, memo: "" };
}

function legacyTextRows(text, type) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeSimpleTextRow(line, type));
}

function cleanPrepRows(rows) {
  return rows
    .filter((row) => (row.name || "").trim() || (row.memo || "").trim() || String(row.qty || "").trim())
    .map((row) => ({
      name: (row.name || "").trim(),
      qty: String(row.qty || "").trim(),
      memo: (row.memo || "").trim()
    }));
}

function cleanGroups() {
  return state.draftGroups
    .map((group) => ({ category: (group.category || "").trim(), items: cleanPrepRows(group.items || []) }))
    .filter((group) => group.category || group.items.length);
}

function cleanSimpleRows(rows, type) {
  return rows
    .filter((row) => (row.item || "").trim() || (row.time || "").trim() || (row.memo || "").trim() || Number(row.amount || 0) > 0)
    .map((row) => {
      const cleaned = {
        item: (row.item || "").trim(),
        memo: (row.memo || "").trim()
      };
      if (type === "expense") cleaned.amount = Number(row.amount || 0);
      if (type === "schedule") cleaned.time = (row.time || "").trim();
      return cleaned;
    });
}

function updateDraftTotal() {
  const total = document.getElementById("batchTotal");
  if (!total) return;
  if (state.editingType === "expense") {
    total.textContent = "合計 " + formatCurrency(sumRows(cleanSimpleRows(state.draftRows, "expense")));
    return;
  }
  if (state.editingType === "preparation") {
    const count = state.draftMode === "group"
      ? cleanGroups().reduce((sum, group) => sum + group.items.length, 0)
      : cleanPrepRows(state.draftRows).length;
    total.textContent = count + "件";
    return;
  }
  total.textContent = cleanSimpleRows(state.draftRows, state.editingType).length + "件";
}

function emptyPrepRow() {
  return { name: "", qty: "1", memo: "" };
}

function emptySimpleRow(type) {
  if (type === "expense") return { item: "", amount: "", memo: "" };
  if (type === "schedule") return { time: "", item: "", memo: "" };
  return type === "preparation" ? emptyPrepRow() : { item: "", memo: "" };
}

function clonePrepRow(row) {
  return Object.assign(emptyPrepRow(), normalizePrepRow(row));
}

function flattenGroups() {
  return state.draftGroups.flatMap((group) => (group.items || []).map(clonePrepRow));
}

function isPresetQty(value) {
  return Array.from({ length: 20 }, (_, index) => String(index + 1)).includes(String(value));
}

function sumRows(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function getSortOrder(type) {
  return { preparation: 1, expense: 2, schedule: 3, memo: 4 }[type] || 999;
}

function openModal() {
  document.getElementById("batchModal").classList.add("is-open");
}

function closeModal() {
  document.getElementById("batchModal").classList.remove("is-open");
  state.editingType = null;
  state.draftMode = "flat";
  state.draftRows = [];
  state.draftGroups = [];
}

function renderError(message) {
  document.getElementById("blockList").innerHTML = `<p class="error-state">${escapeHtml(message || "エラー")}</p>`;
}

function getLineUserId() {
  return state.profile?.userId || "";
}

function getDisplayName() {
  return state.profile?.displayName || "unknown";
}

function setStatus(text, type) {
  const element = document.getElementById("connectionStatus");
  element.textContent = text;
  element.className = `status-badge ${type || ""}`;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
