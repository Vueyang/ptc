'use strict';
const API = 'api/index.php';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US');
const today = () => new Date().toISOString().slice(0, 10);

const STATUS = { in_stock: 'ໃນສາງ', in_use: 'ກຳລັງໃຊ້', repair: 'ສ້ອມແປງ', disposed: 'ຕັດບັນຊີ' };
const STATUS_COLOR = { in_stock: '#1a4f9c', in_use: '#1f7a4d', repair: '#a85f00', disposed: '#999' };
const TX = { assign: 'ມອບໃຫ້ກົມ', return: 'ສົ່ງຄືນສາງ', transfer: 'ໂອນລະຫວ່າງກົມ', repair: 'ສົ່ງສ້ອມແປງ', dispose: 'ຕັດບັນຊີ' };
const DTYPE = { department: 'ກົມ', equivalent: 'ທຽບເທົ່າກົມ' };

let user = null, depts = [], cats = [], view = 'dashboard', filters = {};

/* ---------- API ---------- */
async function api(r, { id, method = 'GET', params = {}, body } = {}) {
  const qs = new URLSearchParams({ r });
  if (id) qs.set('id', id);
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) qs.set(k, v); });
  const res = await fetch(`${API}?${qs}`, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({ error: 'ເຊີບເວີຕອບກັບຜິດປົກກະຕິ' }));
  if (!res.ok) {
    if (res.status === 401 && r !== 'auth') showLogin();
    throw new Error(data.error || 'ເກີດຂໍ້ຜິດພາດ');
  }
  return data;
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- helpers ---------- */
const table = (cols, rows, empty = 'ຍັງບໍ່ມີຂໍ້ມູນ') => !rows.length ? `<div class="empty">${empty}</div>` :
  `<div class="tablewrap"><table><thead><tr>${cols.map(c => `<th class="${c.cls || ''}">${c.h}</th>`).join('')}</tr></thead><tbody>` +
  rows.map(r => `<tr>${cols.map(c => `<td class="${c.cls || ''}">${c.f(r)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';

const btn = (act, id, label, cls = '') => (act === 'del' && user && user.role !== 'admin') ? '' : `<button class="sm ${cls}" data-act="${act}" data-id="${id}">${label}</button>`;
const badge = s => `<span class="badge s-${s}">${STATUS[s]}</span>`;
const deptOpts = () => depts.map(d => [d.id, `${d.seq}. ${d.name}`]);
const catOpts = () => cats.map(c => [c.id, c.name]);
const optHtml = (list, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') +
  list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(sel ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('');

async function loadLookups() { [depts, cats] = await Promise.all([api('departments'), api('categories')]); }

/* ---------- modal form ---------- */
function fieldHtml(f, v) {
  const val = v ?? f.def ?? '';
  let input;
  if (f.type === 'select') input = `<select name="${f.k}" ${f.required ? 'required' : ''}>${optHtml(f.options, val, f.required ? '' : '— ບໍ່ລະບຸ —')}</select>`;
  else if (f.type === 'textarea') input = `<textarea name="${f.k}" rows="2">${esc(val)}</textarea>`;
  else input = `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(val)}" ${f.required ? 'required' : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${f.type === 'number' ? 'step="any" min="0"' : ''}>`;
  return `<label data-k="${f.k}">${f.label}${input}</label>`;
}

function openForm({ title, fields, values = {}, onSave, onChange, saveLabel = 'ບັນທຶກ' }) {
  const dlg = $('#dlg');
  dlg.innerHTML = `<form><h3>${title}</h3>${fields.map(f => fieldHtml(f, values[f.k])).join('')}
    <p class="err" id="ferr"></p><div class="row-end"><button type="button" class="ghost" id="fcancel">ຍົກເລີກ</button><button class="primary">${saveLabel}</button></div></form>`;
  const form = dlg.querySelector('form');
  $('#fcancel').onclick = () => dlg.close();
  if (onChange) { form.addEventListener('change', () => onChange(form)); onChange(form); }
  form.onsubmit = async e => {
    e.preventDefault();
    try { await onSave(Object.fromEntries(new FormData(form))); dlg.close(); }
    catch (err) { $('#ferr').textContent = err.message; }
  };
  dlg.showModal();
}

async function remove(r, id, after) {
  if (!confirm('ຢືນຢັນການລຶບຂໍ້ມູນນີ້?')) return;
  try { await api(r, { id, method: 'DELETE' }); toast('ລຶບແລ້ວ'); await loadLookups(); after(); } catch (e) { toast(e.message); }
}
const save = (r, id, body) => api(r, { id, method: id ? 'PUT' : 'POST', body });

/* ---------- views ---------- */
const views = {
  /* ===== ພາບລວມ ===== */
  async dashboard(el) {
    const d = await api('dashboard');
    const max = Math.max(1, ...d.by_department.map(x => +x.assets));
    const totalSt = d.by_status.reduce((s, x) => s + +x.n, 0) || 1;
    el.innerHTML = `<div class="head"><h2>ພາບລວມ</h2></div>
    <div class="stats">
      <div class="stat"><b>${d.totals.departments}</b><span>ກົມ / ໜ່ວຍງານ</span></div>
      <div class="stat"><b>${d.totals.employees}</b><span>ພະນັກງານ</span></div>
      <div class="stat"><b>${d.totals.assets}</b><span>ອຸປະກອນທີ່ຍັງຢູ່ໃນບັນຊີ</span></div>
      <div class="stat"><b>${fmt(d.totals.asset_value)}</b><span>ມູນຄ່າລວມ (ກີບ)</span></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>ອຸປະກອນແຍກຕາມກົມ</h3><p class="muted" style="margin:.2rem 0 .8rem">ກົດທີ່ກົມເພື່ອເບິ່ງລາຍການອຸປະກອນ</p>
        <div class="bars">${d.by_department.map(x => `<button class="bar" data-act="assets" data-id="${x.id}">
          <span>${x.seq}. ${esc(x.name)}</span><span class="track"><i class="fill" style="width:${x.assets / max * 100}%"></i></span><span class="n">${x.assets}</span></button>`).join('')}</div></div>
      <div style="display:grid;gap:1.25rem;align-content:start">
        <div class="panel"><h3>ສະຖານະອຸປະກອນ</h3>
          <div class="seg">${d.by_status.map(x => `<i style="width:${x.n / totalSt * 100}%;background:${STATUS_COLOR[x.status]}"></i>`).join('')}</div>
          <div class="legend">${d.by_status.map(x => `<span style="--c:${STATUS_COLOR[x.status]}">${STATUS[x.status]} ${x.n}</span>`).join('') || '<span class="muted">ຍັງບໍ່ມີອຸປະກອນ</span>'}</div></div>
        <div class="panel"><h3 style="margin-bottom:.6rem">ລາຍການຫຼ້າສຸດ</h3>
          <ul class="recent">${d.recent.map(r => `<li>${TX[r.tx_type]}: ${esc(r.asset_name)}<small>${r.tx_date}${r.to_department ? ' · ' + esc(r.to_department) : ''}</small></li>`).join('') || '<li class="muted">ຍັງບໍ່ມີລາຍການ</li>'}</ul></div>
      </div></div>`;
    el.onclick = e => { const b = e.target.closest('[data-act="assets"]'); if (b) go('assets', { department_id: b.dataset.id }); };
  },

  /* ===== ກົມ ແລະ ໜ່ວຍງານ ===== */
  async departments(el) {
    const rows = await api('departments');
    const cols = [
      { h: 'ລຳດັບ', f: r => r.seq }, { h: 'ລະຫັດ', f: r => esc(r.code) }, { h: 'ຊື່', f: r => `<b>${esc(r.name)}</b>` },
      { h: 'ພະນັກງານ', cls: 'num', f: r => r.emp_count }, { h: 'ອຸປະກອນ', cls: 'num', f: r => r.asset_count },
      { h: '', cls: 'act', f: r => btn('assets', r.id, 'ອຸປະກອນ') + btn('emps', r.id, 'ພະນັກງານ') + btn('edit', r.id, 'ແກ້ໄຂ') + btn('del', r.id, 'ລຶບ', 'danger') }
    ];
    const grp = t => rows.filter(r => r.dept_type === t);
    el.innerHTML = `<div class="head"><h2>ກົມ ແລະ ໜ່ວຍງານ</h2><button class="primary" data-act="new">+ ເພີ່ມໜ່ວຍງານ</button></div>
      <section class="block"><h3>ກົມ <span class="count">${grp('department').length}</span></h3>${table(cols, grp('department'))}</section>
      <section class="block"><h3>ທຽບເທົ່າກົມ <span class="count">${grp('equivalent').length}</span></h3>${table(cols, grp('equivalent'))}</section>`;
    const fields = [
      { k: 'seq', label: 'ລຳດັບ', type: 'number', required: true }, { k: 'code', label: 'ລະຫັດ', required: true },
      { k: 'name', label: 'ຊື່ກົມ / ໜ່ວຍງານ', required: true },
      { k: 'dept_type', label: 'ປະເພດ', type: 'select', required: true, options: Object.entries(DTYPE) },
      { k: 'phone', label: 'ເບີໂທ' }, { k: 'note', label: 'ໝາຍເຫດ', type: 'textarea' }];
    const edit = (row) => openForm({ title: row ? 'ແກ້ໄຂໜ່ວຍງານ' : 'ເພີ່ມໜ່ວຍງານ', fields, values: row || { seq: rows.length + 1 },
      onSave: async b => { await save('departments', row?.id, b); toast('ບັນທຶກແລ້ວ'); await loadLookups(); go('departments'); } });
    el.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id, row = rows.find(r => r.id == id);
      ({ new: () => edit(), edit: () => edit(row), del: () => remove('departments', id, () => go('departments')),
         assets: () => go('assets', { department_id: id }), emps: () => go('employees', { department_id: id }) })[b.dataset.act]();
    };
  },

  /* ===== ພະນັກງານ ===== */
  async employees(el) {
    const rows = await api('employees', { params: filters });
    el.innerHTML = `<div class="head"><h2>ພະນັກງານ</h2><button class="primary" data-act="new">+ ເພີ່ມພະນັກງານ</button></div>
      <div class="filters"><input id="q" placeholder="ຄົ້ນຫາຊື່ / ລະຫັດ / ຕຳແໜ່ງ" value="${esc(filters.q)}">
      <select id="fd">${optHtml(deptOpts(), filters.department_id, 'ທຸກກົມ')}</select></div>
      ${table([
        { h: 'ລະຫັດ', f: r => esc(r.emp_code) }, { h: 'ຊື່ ແລະ ນາມສະກຸນ', f: r => `<b>${esc(r.full_name)}</b>` },
        { h: 'ຕຳແໜ່ງ', f: r => esc(r.position) }, { h: 'ກົມ / ໜ່ວຍງານ', f: r => esc(r.department_name) }, { h: 'ເບີໂທ', f: r => esc(r.phone) },
        { h: '', cls: 'act', f: r => btn('edit', r.id, 'ແກ້ໄຂ') + btn('del', r.id, 'ລຶບ', 'danger') }], rows)}`;
    bindFilters(el, 'employees');
    const fields = [{ k: 'emp_code', label: 'ລະຫັດພະນັກງານ', required: true }, { k: 'full_name', label: 'ຊື່ ແລະ ນາມສະກຸນ', required: true },
      { k: 'position', label: 'ຕຳແໜ່ງ' }, { k: 'phone', label: 'ເບີໂທ' },
      { k: 'department_id', label: 'ກົມ / ໜ່ວຍງານ', type: 'select', required: true, options: deptOpts() }];
    const edit = row => openForm({ title: row ? 'ແກ້ໄຂພະນັກງານ' : 'ເພີ່ມພະນັກງານ', fields, values: row || { department_id: filters.department_id },
      onSave: async b => { await save('employees', row?.id, b); toast('ບັນທຶກແລ້ວ'); go('employees', filters); } });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      ({ new: () => edit(), edit: () => edit(rows.find(r => r.id == b.dataset.id)), del: () => remove('employees', b.dataset.id, () => go('employees', filters)) })[b.dataset.act]();
    });
  },

  /* ===== ອຸປະກອນ ===== */
  async assets(el) {
    const rows = await api('assets', { params: filters });
    el.innerHTML = `<div class="head"><h2>ອຸປະກອນ <span class="count">${rows.length}</span></h2>
      <span><button data-act="report">ລາຍງານ / PDF</button> <button data-act="labels">ພິມປ້າຍບາໂຄດ</button> <button data-act="csv">ສົ່ງອອກ CSV</button> <button class="primary" data-act="new">+ ເພີ່ມອຸປະກອນ</button></span></div>
      <div class="filters"><input id="q" placeholder="ຄົ້ນຫາຊື່ / ລະຫັດ / Serial" value="${esc(filters.q)}">
      <select id="fd">${optHtml(deptOpts(), filters.department_id, 'ທຸກກົມ')}</select>
      <select id="fc">${optHtml(catOpts(), filters.category_id, 'ທຸກປະເພດ')}</select>
      <select id="fs">${optHtml(Object.entries(STATUS), filters.status, 'ທຸກສະຖານະ')}</select></div>
      ${table([
        { h: 'ລະຫັດ', f: r => esc(r.asset_code) },
        { h: 'ຊື່ອຸປະກອນ', f: r => `<b>${esc(r.name)}</b><br><small class="muted">${esc([r.brand, r.serial_no].filter(Boolean).join(' · '))}</small>` },
        { h: 'ປະເພດ', f: r => esc(r.category_name) }, { h: 'ກົມ / ຜູ້ຖື', f: r => esc(r.department_name || '—') + (r.employee_name ? `<br><small class="muted">${esc(r.employee_name)}</small>` : '') },
        { h: 'ສະຖານະ', f: r => badge(r.status) }, { h: 'ມູນຄ່າ', cls: 'num', f: r => fmt(r.price) },
        { h: '', cls: 'act', f: r => (r.status === 'disposed' ? '' : btn('tx', r.id, 'ມອບ/ໂອນ')) + btn('hist', r.id, 'ປະຫວັດ') + btn('edit', r.id, 'ແກ້ໄຂ') + btn('del', r.id, 'ລຶບ', 'danger') }], rows)}`;
    bindFilters(el, 'assets');
    const fields = isNew => [
      { k: 'name', label: 'ຊື່ອຸປະກອນ', required: true }, { k: 'asset_code', label: 'ລະຫັດອຸປະກອນ', ph: 'ປະໄວ້ຫວ່າງເພື່ອສ້າງອັດຕະໂນມັດ (A-Z 0-9 - .)' },
      { k: 'category_id', label: 'ປະເພດ', type: 'select', options: catOpts() }, { k: 'brand', label: 'ຍີ່ຫໍ້ / ລຸ້ນ' }, { k: 'serial_no', label: 'Serial No.' },
      { k: 'purchase_date', label: 'ວັນທີຈັດຊື້', type: 'date' }, { k: 'price', label: 'ມູນຄ່າ (ກີບ)', type: 'number' },
      ...(isNew ? [{ k: 'department_id', label: 'ເກັບຢູ່ກົມ / ໜ່ວຍງານ', type: 'select', options: deptOpts() }] : []),
      { k: 'location', label: 'ສະຖານທີ່ເກັບ (ຫ້ອງ/ຊັ້ນ)' }, { k: 'note', label: 'ໝາຍເຫດ', type: 'textarea' }];
    const edit = row => openForm({ title: row ? 'ແກ້ໄຂອຸປະກອນ' : 'ເພີ່ມອຸປະກອນ', fields: fields(!row), values: row || { department_id: filters.department_id },
      onSave: async b => { await save('assets', row?.id, b); toast('ບັນທຶກແລ້ວ'); go('assets', filters); } });
    const csv = () => {
      const head = ['ລະຫັດ', 'ຊື່', 'ປະເພດ', 'ຍີ່ຫໍ້', 'Serial', 'ກົມ', 'ຜູ້ຖື', 'ສະຖານະ', 'ມູນຄ່າ', 'ສະຖານທີ່'];
      const lines = rows.map(r => [r.asset_code, r.name, r.category_name, r.brand, r.serial_no, r.department_name, r.employee_name, STATUS[r.status], r.price, r.location]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['\ufeff' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = `assets-${today()}.csv`; a.click();
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id;
      ({ new: () => edit(), csv, report: () => printAssetReport(rows, filters), labels: () => printLabels(rows), edit: () => edit(rows.find(r => r.id == id)), tx: () => txForm(id, () => go('assets', filters)),
         hist: () => history(id), del: () => remove('assets', id, () => go('assets', filters)) })[b.dataset.act]();
    });
  },

  /* ===== ມອບ / ໂອນ / ສ້ອມ ===== */
  async transactions(el) {
    const rows = await api('transactions', { params: filters });
    el.innerHTML = `<div class="head"><h2>ມອບ / ໂອນ / ສ້ອມ</h2><button class="primary" data-act="new">+ ບັນທຶກລາຍການ</button></div>
      <div class="filters"><select id="fd">${optHtml(deptOpts(), filters.department_id, 'ທຸກກົມ')}</select></div>
      ${txTable(rows, true)}`;
    bindFilters(el, 'transactions');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'new') txForm(null, () => go('transactions', filters));
      if (b.dataset.act === 'print') printHandover(rows.find(r => r.id == b.dataset.id));
    });
  },

  /* ===== ປະເພດອຸປະກອນ ===== */
  async categories(el) {
    const rows = await api('categories');
    el.innerHTML = `<div class="head"><h2>ປະເພດອຸປະກອນ</h2><button class="primary" data-act="new">+ ເພີ່ມປະເພດ</button></div>
      ${table([{ h: 'ຊື່ປະເພດ', f: r => `<b>${esc(r.name)}</b>` }, { h: 'ຈຳນວນອຸປະກອນ', cls: 'num', f: r => r.asset_count },
        { h: '', cls: 'act', f: r => btn('edit', r.id, 'ແກ້ໄຂ') + btn('del', r.id, 'ລຶບ', 'danger') }], rows)}`;
    const edit = row => openForm({ title: row ? 'ແກ້ໄຂປະເພດ' : 'ເພີ່ມປະເພດ', fields: [{ k: 'name', label: 'ຊື່ປະເພດ', required: true }], values: row || {},
      onSave: async b => { await save('categories', row?.id, b); toast('ບັນທຶກແລ້ວ'); await loadLookups(); go('categories'); } });
    el.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      ({ new: () => edit(), edit: () => edit(rows.find(r => r.id == b.dataset.id)), del: () => remove('categories', b.dataset.id, () => go('categories')) })[b.dataset.act]();
    };
  }
};

const txTable = (rows, canPrint) => table([
  { h: 'ວັນທີ', f: r => r.tx_date }, { h: 'ອຸປະກອນ', f: r => `<b>${esc(r.asset_name)}</b><br><small class="muted">${esc(r.asset_code)}</small>` },
  { h: 'ລາຍການ', f: r => TX[r.tx_type] }, { h: 'ຈາກກົມ', f: r => esc(r.from_department || '—') },
  { h: 'ໄປກົມ', f: r => esc(r.to_department || '—') }, { h: 'ຜູ້ຮັບ', f: r => esc(r.employee_name || '—') }, { h: 'ໝາຍເຫດ', f: r => esc(r.note) },
  ...(canPrint ? [{ h: '', cls: 'act', f: r => btn('print', r.id, 'ພິມໃບ') }] : [])], rows, 'ຍັງບໍ່ມີລາຍການ');

function bindFilters(el, v) {
  const set = (k, val) => { filters = { ...filters, [k]: val }; go(v, filters); };
  const q = $('#q'); if (q) q.onchange = () => set('q', q.value.trim());
  [['#fd', 'department_id'], ['#fc', 'category_id'], ['#fs', 'status']].forEach(([s, k]) => { const n = $(s); if (n) n.onchange = () => set(k, n.value); });
}

async function history(assetId) {
  const rows = await api('transactions', { params: { asset_id: assetId } });
  const dlg = $('#dlg');
  dlg.innerHTML = `<h3>ປະຫວັດອຸປະກອນ</h3>${txTable(rows)}<div class="row-end"><button id="fcancel" class="primary">ປິດ</button></div>`;
  $('#fcancel').onclick = () => dlg.close(); dlg.showModal();
}

async function txForm(assetId, done) {
  const assets = (await api('assets')).filter(a => a.status !== 'disposed');
  openForm({
    title: 'ບັນທຶກ ມອບ / ໂອນ / ສ້ອມ / ຕັດບັນຊີ', saveLabel: 'ບັນທຶກລາຍການ',
    fields: [
      { k: 'asset_id', label: 'ອຸປະກອນ', type: 'select', required: true, options: assets.map(a => [a.id, `${a.asset_code} — ${a.name}`]) },
      { k: 'tx_type', label: 'ລາຍການ', type: 'select', required: true, options: Object.entries(TX) },
      { k: 'to_department_id', label: 'ກົມປາຍທາງ', type: 'select', options: deptOpts() },
      { k: 'employee_id', label: 'ຜູ້ຮັບຜິດຊອບ (ບໍ່ບັງຄັບ)', type: 'select', options: [] },
      { k: 'tx_date', label: 'ວັນທີ', type: 'date', required: true, def: today() },
      { k: 'note', label: 'ໝາຍເຫດ', type: 'textarea' }],
    values: { asset_id: assetId, tx_type: 'assign', tx_date: today() },
    onChange: async form => {
      const type = form.tx_type.value, needDept = type === 'assign' || type === 'transfer';
      form.querySelector('[data-k=to_department_id]').hidden = !needDept;
      form.querySelector('[data-k=employee_id]').hidden = !needDept;
      form.to_department_id.required = needDept;
      const dep = form.to_department_id.value;
      if (needDept && form.employee_id.dataset.dep !== dep) {          // ໂຫຼດພະນັກງານຕາມກົມທີ່ເລືອກ
        form.employee_id.dataset.dep = dep;
        const emps = dep ? await api('employees', { params: { department_id: dep } }) : [];
        form.employee_id.innerHTML = optHtml(emps.map(e => [e.id, e.full_name]), '', '— ບໍ່ລະບຸ —');
      }
    },
    onSave: async b => { await api('transactions', { method: 'POST', body: b }); toast('ບັນທຶກລາຍການແລ້ວ'); done(); }
  });
}

/* ---------- navigation / boot ---------- */
async function go(v, f = {}) {
  view = v; filters = f;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  const el = $('#main'); el.onclick = null;
  const fresh = el.cloneNode(false); el.replaceWith(fresh);                // ລ້າງ event listener ເກົ່າ
  try { await views[v](fresh); } catch (e) { fresh.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

function showLogin() { user = null; $('#app').hidden = true; $('#login').hidden = false; }
async function showApp() {
  $('#login').hidden = true; $('#app').hidden = false; $('#whoName').textContent = `${user.full_name} (${user.role})`;
  document.querySelectorAll('[data-admin]').forEach(b => { b.hidden = user.role !== 'admin'; });
  await loadLookups(); go('dashboard');
}

$('#nav').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.view); };
$('#logout').onclick = async () => { await api('auth', { params: { a: 'logout' } }); showLogin(); };
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  try { user = await api('auth', { method: 'POST', params: { a: 'login' }, body: Object.fromEntries(new FormData(e.target)) }); $('#loginErr').textContent = ''; showApp(); }
  catch (err) { $('#loginErr').textContent = err.message; }
};
api('auth', { params: { a: 'me' } }).then(u => { user = u; showApp(); }).catch(showLogin);
