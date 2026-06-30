const state = {
  liffReady: false,
  profile: null,
  config: null,
  dashboard: null
};

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  await boot();
});

function bindEvents() {
  const reloadButton = document.getElementById('reloadButton');
  if (reloadButton) {
    reloadButton.addEventListener('click', async () => {
      await loadDashboard();
    });
  }

  document.querySelectorAll('.nav-card').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.type;
      filterBlocks(type);
    });
  });
}

async function boot() {
  setStatus('起動中', 'loading');

  try {
    state.config = await loadRemoteConfig();
    await initLiffIfPossible();
    await loadDashboard();
    setStatus('接続OK', 'success');
  } catch (error) {
    console.error(error);
    setStatus('接続エラー', 'error');
    renderError(error.message || '初期化に失敗しました。');
    renderMockDashboard();
  }
}

async function loadRemoteConfig() {
  if (!CONFIG.GAS_WEB_APP_URL) {
    return {
      success: true,
      appName: CONFIG.APP_NAME,
      liffId: CONFIG.LIFF_ID_FALLBACK || ''
    };
  }

  const url = buildGasUrl('getConfig');
  const response = await fetch(url);
  return await response.json();
}

async function initLiffIfPossible() {
  const liffId = state.config?.liffId || CONFIG.LIFF_ID_FALLBACK;

  if (!liffId || typeof liff === 'undefined') {
    console.log('LIFF is skipped. LIFF ID is not configured yet.');
    return;
  }

  await liff.init({ liffId });
  state.liffReady = true;

  if (liff.isLoggedIn()) {
    state.profile = await liff.getProfile();
  }
}

async function loadDashboard() {
  setStatus('読込中', 'loading');

  let data;
  if (CONFIG.GAS_WEB_APP_URL) {
    const url = buildGasUrl('getDashboard', {
      eventId: CONFIG.EVENT_ID,
      lineUserId: state.profile?.userId || ''
    });
    const response = await fetch(url);
    data = await response.json();
  } else {
    data = getLocalMockDashboard();
  }

  if (!data.success) {
    throw new Error(data.message || 'ダッシュボード取得に失敗しました。');
  }

  state.dashboard = data;
  renderDashboard(data);
  setStatus('接続OK', 'success');
}

function buildGasUrl(action, params = {}) {
  const url = new URL(CONFIG.GAS_WEB_APP_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function renderDashboard(data) {
  const dashboard = data.dashboard || {};
  const summary = data.summary || {};

  setText('eventName', dashboard.eventName || '-');
  setText('eventDate', dashboard.eventDate || '-');
  setText('venue', dashboard.venue || '-');
  setText('expectedGuests', dashboard.expectedGuests || '-');
  setText('lastUpdated', '最終更新: ' + formatDateTime(dashboard.lastUpdatedAt));

  setText('preparationCount', `${summary.preparationCount || 0}件`);
  setText('expenseTotal', formatCurrency(summary.expenseTotal || 0));
  setText('scheduleCount', `${summary.scheduleCount || 0}件`);
  setText('memoCount', `${summary.memoCount || 0}件`);

  renderBlocks(data.blocks || []);
}

function renderBlocks(blocks) {
  const container = document.getElementById('blockList');
  if (!container) return;

  if (!blocks.length) {
    container.innerHTML = '<p class="empty-state">表示できるブロックがありません。</p>';
    return;
  }

  container.innerHTML = blocks.map((block) => `
    <article class="block-card" data-block-type="${escapeHtml(block.blockType || '')}">
      <div class="block-card-header">
        <span class="block-type">${labelBlockType(block.blockType)}</span>
        <span class="block-status">${escapeHtml(block.status || '未設定')}</span>
      </div>
      <h3>${escapeHtml(block.blockTitle || '無題')}</h3>
      <p>${escapeHtml(block.blockContent || '').replace(/\n/g, '<br>')}</p>
      ${block.amount ? `<small class="amount">${formatCurrency(block.amount)}</small>` : ''}
    </article>
  `).join('');
}

function filterBlocks(type) {
  if (!state.dashboard) return;
  const blocks = state.dashboard.blocks || [];
  const filtered = blocks.filter((block) => block.blockType === type);
  renderBlocks(filtered.length ? filtered : blocks);
}

function renderError(message) {
  const container = document.getElementById('blockList');
  if (!container) return;
  container.innerHTML = `<p class="error-state">${escapeHtml(message)}</p>`;
}

function renderMockDashboard() {
  renderDashboard(getLocalMockDashboard());
}

function getLocalMockDashboard() {
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
        blockType: 'preparation',
        blockTitle: '準備物サンプル',
        blockContent: 'GitHub Pages 表示確認用の仮データです。',
        status: '仮設定',
        amount: 0
      },
      {
        blockType: 'schedule',
        blockTitle: 'スケジュールサンプル',
        blockContent: '13:00 開始 / 17:00 完全撤収',
        status: '仮設定',
        amount: 0
      },
      {
        blockType: 'memo',
        blockTitle: 'メモサンプル',
        blockContent: 'GAS Web API URL設定後、スクリプトプロパティからLIFF IDを取得します。',
        status: '確認中',
        amount: 0
      }
    ]
  };
}

function setStatus(text, type) {
  const element = document.getElementById('connectionStatus');
  if (!element) return;
  element.textContent = text;
  element.className = `status-badge ${type || ''}`;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function labelBlockType(type) {
  const labels = {
    preparation: '準備物',
    expense: '経費',
    schedule: 'スケジュール',
    memo: 'メモ',
    task: 'タスク',
    link: 'リンク',
    other: 'その他'
  };
  return labels[type] || 'その他';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
