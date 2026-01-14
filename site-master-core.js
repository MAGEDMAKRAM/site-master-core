// Site Master Core - Telecommunications Site Database
const AUTO_CSV_FILES = [
  'CAIRO-GIZA.csv',
  'Giza-Alex-Classification-2024.csv',
  'SITE-MANAGEMENT.csv',
  'All-Nigh.csv',
  'sites_master_flat.csv',
  'GRD.csv',
  'SOC.csv',
  'sites_master_consolidated.csv'
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length === 1 && cols[0].trim() === '') continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

const state = {
  files: [],
  currentFileId: null,
  scope: 'all',
  mode: 'siteid',
  query: '',
  options: { exact: false, contains: true, case: true },
  theme: 'dark',
  pageSize: 500,
  visibleRows: 500
};

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileListEl = document.getElementById('fileList');
const fileCountEl = document.getElementById('fileCount');
const rowCountEl = document.getElementById('rowCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const scopeToggle = document.getElementById('scopeToggle');
const modeToggle = document.getElementById('modeToggle');
const quickChips = document.getElementById('quickChips');
const themeRow = document.getElementById('themeRow');
const fontSelect = document.getElementById('fontSelect');
const fontSizeRange = document.getElementById('fontSizeRange');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const statusText = document.getElementById('statusText');
const selectionText = document.getElementById('selectionText');

let loadMoreBtn;
setTimeout(() => {
  const statusBar = document.querySelector('.status-bar');
  if (!loadMoreBtn && statusBar) {
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'button';
    loadMoreBtn.textContent = 'Load more';
    loadMoreBtn.style.marginLeft = '8px';
    loadMoreBtn.addEventListener('click', () => {
      state.visibleRows += state.pageSize;
      runSearch();
    });
    statusBar.appendChild(loadMoreBtn);
  }
}, 500);

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  statusText.textContent = 'Loading uploaded files...';
  for (const f of files) {
    const text = await f.text();
    const { headers, rows } = parseCSV(text);
    if (!headers.length) continue;
    pushFile(f.name, headers, rows);
  }
  refreshFileList();
  runSearch();
  fileInput.value = '';
});

async function autoLoadFiles() {
  statusText.textContent = 'Auto-loading CSV files...';
  for (const name of AUTO_CSV_FILES) {
    try {
      const res = await fetch(name);
      if (!res.ok) continue;
      const text = await res.text();
      const { headers, rows } = parseCSV(text);
      if (!headers.length) continue;
      pushFile(name, headers, rows);
    } catch (e) {
      console.warn('Failed to load', name, e);
    }
  }
  refreshFileList();
  runSearch();
}

function pushFile(name, headers, rows) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.files.push({ id, name, headers, rows });
  if (!state.currentFileId) state.currentFileId = id;
}

function refreshFileList() {
  fileListEl.innerHTML = '';
  let totalRows = 0;
  state.files.forEach(f => (totalRows += f.rows.length));
  fileCountEl.textContent = `${state.files.length} files`;
  rowCountEl.textContent = `${totalRows} rows`;
  state.files.forEach(file => {
    const item = document.createElement('div');
    item.className = 'file-item' + (file.id === state.currentFileId ? ' active' : '');
    item.dataset.id = file.id;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = file.name;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${file.rows.length}`;
    item.appendChild(nameSpan);
    item.appendChild(badge);
    item.addEventListener('click', () => {
      state.currentFileId = file.id;
      refreshFileList();
      runSearch();
    });
    fileListEl.appendChild(item);
  });
  if (!state.files.length) statusText.textContent = 'No data loaded.';
  else statusText.textContent = 'Files loaded. Ready for search.';
}

scopeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  state.scope = btn.dataset.scope;
  scopeToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
  state.visibleRows = state.pageSize;
  runSearch();
});

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  state.mode = btn.dataset.mode;
  modeToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
  state.visibleRows = state.pageSize;
  runSearch();
});

quickChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const opt = chip.dataset.chip;
  state.options[opt] = !state.options[opt];
  chip.classList.toggle('active', state.options[opt]);
  state.visibleRows = state.pageSize;
  runSearch();
});

themeRow.addEventListener('click', (e) => {
  const pill = e.target.closest('.theme-pill');
  if (!pill) return;
  state.theme = pill.dataset.theme;
  applyTheme();
});

fontSelect.addEventListener('change', () => {
  state.fontFamily = fontSelect.value;
  applyFont();
});

fontSizeRange.addEventListener('input', () => {
  state.fontSize = parseInt(fontSizeRange.value, 10);
  applyFont();
});

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  themeRow.querySelectorAll('.theme-pill').forEach(p => p.classList.toggle('active', p.dataset.theme === state.theme));
}

function applyFont() {
  document.documentElement.style.setProperty('--app-font-family', state.fontFamily);
  document.documentElement.style.setProperty('--app-font-size', state.fontSize + 'px');
  fontSelect.value = state.fontFamily;
  fontSizeRange.value = state.fontSize;
}

function normalize(s) {
  return (s ?? '').toString();
}

function matchValue(value, query) {
  const v = state.options.case ? normalize(value).toLowerCase() : normalize(value);
  const q = state.options.case ? query.toLowerCase() : query;
  if (state.options.exact) return v === q;
  return v.includes(q);
}

function matchRow(row, query, headers) {
  if (!query) return true;
  if (state.mode === 'siteid') {
    const keys = headers.filter(h => /site\s*id/i.test(h) || /^SiteID$/i.test(h));
    if (keys.length) {
      for (const k of keys) if (matchValue(row[k], query)) return true;
    }
  }
  for (const h of headers) if (matchValue(row[h], query)) return true;
  return false;
}

function currentFiles() {
  return state.scope === 'current' && state.currentFileId ? state.files.filter(f => f.id === state.currentFileId) : state.files;
}

function runSearch() {
  const files = currentFiles();
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';
  if (!files.length) {
    selectionText.textContent = '0 matches.';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }
  let allHeadersSet = new Set();
  files.forEach(f => f.headers.forEach(h => allHeadersSet.add(h)));
  const allHeaders = Array.from(allHeadersSet);
  const headRow = document.createElement('tr');
  allHeaders.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);
  const query = state.query;
  const matches = [];
  files.forEach(file => {
    file.rows.forEach((row, idx) => {
      if (matchRow(row, query, file.headers)) {
        matches.push({ file, row, idx });
      }
    });
  });
  selectionText.textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'}.`;
  const limit = Math.min(matches.length, state.visibleRows);
  if (loadMoreBtn) loadMoreBtn.style.display = matches.length > limit ? 'inline-flex' : 'none';
  let rendered = 0;
  function renderChunk() {
    const chunkSize = 200;
    const end = Math.min(rendered + chunkSize, limit);
    for (let i = rendered; i < end; i++) {
      const { file, row } = matches[i];
      const tr = document.createElement('tr');
      allHeaders.forEach(h => {
        const td = document.createElement('td');
        const raw = normalize(row[h] || '');
        td.textContent = raw;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    }
    rendered = end;
    if (rendered < limit) {
      setTimeout(renderChunk, 0);
    }
  }
  renderChunk();
}

searchBtn.addEventListener('click', () => {
  state.query = searchInput.value.trim();
  state.visibleRows = state.pageSize;
  runSearch();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    state.query = searchInput.value.trim();
    state.visibleRows = state.pageSize;
    runSearch();
  }
});

applyTheme();
applyFont();
runSearch();
autoLoadFiles();
