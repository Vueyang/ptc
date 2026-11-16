'use strict';
/* ເຟດ 2 — ໃຊ້ຮ່ວມກັບ app.js (ໂຫຼດຫຼັງ app.js) */

/* ================= Code 39 barcode (ບໍ່ຕ້ອງໃຊ້ library ພາຍນອກ) ================= */
const C39 = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn'
};
function code39(text, h = 46) {
  const s = '*' + String(text).toUpperCase() + '*';
  if (String(text).includes('*')) return null;
  let x = 20, bars = '';
  for (const ch of s) {
    const p = C39[ch]; if (!p) return null;
    for (let j = 0; j < 9; j++) {
      const w = p[j] === 'w' ? 5 : 2;
      if (j % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="${h}"/>`;
      x += w;
    }
    x += 2;                                   // ຊ່ອງວ່າງລະຫວ່າງຕົວອັກສອນ
  }
  const W = x - 2 + 20;                       // quiet zone ສອງຂ້າງ
  return `<svg xmlns="http://www.w3.org/2000/svg" class="bc" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none"><rect width="${W}" height="${h}" fill="#fff"/><g fill="#000">${bars}</g></svg>`;
}

/* ================= ພິມເອກະສານ (ບັນທຶກເປັນ PDF ຈາກໜ້າຕ່າງພິມ) ================= */
const PRINT_CSS = `
@page{size:A4;margin:14mm}
*{box-sizing:border-box}
body{font:13px/1.6 "Noto Sans Lao","Phetsarath OT","Saysettha OT",sans-serif;color:#000;margin:0}
h1,h2,h3{margin:0}
.nat{font-weight:700;text-align:center;line-height:1.5}
.org{text-align:center;margin:10px 0 2px;font-weight:600}
.title{font-size:20px;font-weight:700;text-align:center;margin:12px 0 6px}
.sub{text-align:center;margin-bottom:8px}
.meta{margin:8px 0 10px}.meta div{display:flex;gap:6px;margin:2px 0}.meta b{min-width:130px}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{border:1px solid #000;padding:4px 6px;text-align:left;vertical-align:top}
th{background:#eee}.num{text-align:right}
.grp td{background:#f1f1f1;font-weight:700}.tot td{font-weight:700}
.sign{display:flex;justify-content:space-around;margin-top:30px;text-align:center;break-inside:avoid}
.sign div{min-width:150px}.sign .line{height:70px}
.labels{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
.label{border:1px dashed #666;padding:3mm;text-align:center;break-inside:avoid;overflow:hidden}
.label b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.label small{display:block;font-size:10px}
.label .bc{width:100%;height:13mm;margin:1mm 0}
.label .code{font:600 12px monospace;letter-spacing:1px}
.bar-one{width:60mm;height:12mm}
.foot{margin-top:10px;font-size:11px;color:#444}
.hint{background:#fff3cd;padding:6px 10px;margin-bottom:10px;border-radius:4px}
@media print{.hint{display:none}}`;

function printDoc(title, body) {
  const w = window.open('', '_blank');           // ຕ້ອງເປີດທັນທີທີ່ກົດປຸ່ມ ເພື່ອບໍ່ໃຫ້ຖືກບລັອກ
  if (!w) { toast('ບຣາວເຊີບລັອກໜ້າຕ່າງໃໝ່ ກະລຸນາອະນຸຍາດ pop-up'); return; }
  w.document.open();
  w.document.write(`<!DOCTYPE html><html lang="lo"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style></head><body>
<div class="hint">ໃນໜ້າຕ່າງພິມ ເລືອກ "ບັນທຶກເປັນ PDF" (Save as PDF) ຖ້າຕ້ອງການໄຟລ໌ PDF</div>${body}
<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>`);
  w.document.close();
}

const fmtDate = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : esc(d || ''); };
const nowStr = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const docHead = (title, sub) => `<div class="nat">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ<br>ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</div>
  <div class="org">ຄະນະໂຄສະນາອົບຮົມສູນກາງພັກ</div><div class="title">${title}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
const signBlock = names => `<div class="sign">${names.map(n => `<div><b>${n}</b><div class="line"></div>(ລົງຊື່)</div>`).join('')}</div>`;

/* ----- ໃບມອບ-ຮັບ ----- */
function printHandover(t) {
  const T = {
    assign: ['ໃບມອບ-ຮັບອຸປະກອນ', ['ຜູ້ມອບ', 'ຜູ້ຮັບ', 'ຫົວໜ້າໜ່ວຍງານຮັບ']],
    transfer: ['ໃບໂອນອຸປະກອນລະຫວ່າງກົມ', ['ຜູ້ໂອນ', 'ຜູ້ຮັບ', 'ຫົວໜ້າໜ່ວຍງານຮັບ']],
    return: ['ໃບສົ່ງຄືນອຸປະກອນ', ['ຜູ້ສົ່ງຄືນ', 'ຜູ້ຮັບຄືນ (ສາງ)', 'ຫົວໜ້າໜ່ວຍງານ']],
    repair: ['ໃບສົ່ງສ້ອມແປງອຸປະກອນ', ['ຜູ້ສົ່ງ', 'ຜູ້ຮັບສ້ອມ', 'ຫົວໜ້າໜ່ວຍງານ']],
    dispose: ['ໃບຕັດບັນຊີອຸປະກອນ', ['ຜູ້ສະເໜີ', 'ຄະນະກວດສອບ', 'ຫົວໜ້າໜ່ວຍງານ']]
  }[t.tx_type];
  const svg = code39(t.asset_code, 40);
  printDoc(T[0], `${docHead(T[0], `ເລກທີ: TX-${String(t.id).padStart(5, '0')}`)}
  <div class="meta">
    <div><b>ວັນທີ:</b> ${fmtDate(t.tx_date)}</div>
    <div><b>ຈາກກົມ / ໜ່ວຍງານ:</b> ${esc(t.from_department || '—')}</div>
    <div><b>ໄປກົມ / ໜ່ວຍງານ:</b> ${esc(t.to_department || '—')}</div>
    <div><b>ຜູ້ຮັບຜິດຊອບ:</b> ${esc(t.employee_name || '—')}</div>
  </div>
  <table><thead><tr><th>ລະຫັດ</th><th>ຊື່ອຸປະກອນ</th><th>ຍີ່ຫໍ້ / Serial</th><th class="num">ມູນຄ່າ (ກີບ)</th></tr></thead>
  <tbody><tr><td>${esc(t.asset_code)}</td><td>${esc(t.asset_name)}</td><td>${esc([t.brand, t.serial_no].filter(Boolean).join(' / '))}</td><td class="num">${fmt(t.price)}</td></tr></tbody></table>
  <div class="meta"><div><b>ໝາຍເຫດ / ສະພາບ:</b> ${esc(t.note || '—')}</div><div><b>ຜູ້ບັນທຶກໃນລະບົບ:</b> ${esc(t.created_by_name || '—')}</div></div>
  ${svg ? `<div>${svg.replace('class="bc"', 'class="bc bar-one"')}</div>` : ''}
  ${signBlock(T[1])}<div class="foot">ພິມວັນທີ ${nowStr()}</div>`);
}

/* ----- ລາຍງານອຸປະກອນ ----- */
function printAssetReport(rows, f) {
  if (!rows.length) { toast('ບໍ່ມີຂໍ້ມູນທີ່ຈະພິມ'); return; }
  const parts = [];
  if (f.department_id) parts.push('ກົມ: ' + ((depts.find(d => d.id == f.department_id) || {}).name || ''));
  if (f.category_id) parts.push('ປະເພດ: ' + ((cats.find(c => c.id == f.category_id) || {}).name || ''));
  if (f.status) parts.push('ສະຖານະ: ' + STATUS[f.status]);
  if (f.q) parts.push('ຄົ້ນຫາ: ' + f.q);
  const groups = {};
  rows.forEach(r => (groups[r.department_name || 'ບໍ່ລະບຸກົມ'] = groups[r.department_name || 'ບໍ່ລະບຸກົມ'] || []).push(r));
  const value = list => list.filter(r => r.status !== 'disposed').reduce((s, r) => s + Number(r.price || 0), 0);
  let n = 0, body = '';
  Object.keys(groups).forEach(g => {
    const list = groups[g];
    body += `<tr class="grp"><td colspan="7">${esc(g)} — ${list.length} ລາຍການ</td></tr>` + list.map(r =>
      `<tr><td>${++n}</td><td>${esc(r.asset_code)}</td><td>${esc(r.name)}</td><td>${esc(r.category_name || '')}</td><td>${esc(r.employee_name || '')}</td><td>${STATUS[r.status]}</td><td class="num">${fmt(r.price)}</td></tr>`).join('') +
      `<tr class="tot"><td colspan="6" class="num">ລວມ ${esc(g)} (ບໍ່ນັບທີ່ຕັດບັນຊີ)</td><td class="num">${fmt(value(list))}</td></tr>`;
  });
  printDoc('ລາຍງານອຸປະກອນ', `${docHead('ລາຍງານອຸປະກອນ', parts.length ? esc(parts.join(' | ')) : 'ທຸກກົມ / ທຸກປະເພດ')}
  <table><thead><tr><th>ລ/ດ</th><th>ລະຫັດ</th><th>ຊື່ອຸປະກອນ</th><th>ປະເພດ</th><th>ຜູ້ຖື</th><th>ສະຖານະ</th><th class="num">ມູນຄ່າ (ກີບ)</th></tr></thead>
  <tbody>${body}<tr class="tot"><td colspan="6" class="num">ລວມທັງໝົດ ${rows.length} ລາຍການ</td><td class="num">${fmt(value(rows))}</td></tr></tbody></table>
  ${signBlock(['ຜູ້ສະຫຼຸບ', 'ຫົວໜ້າໜ່ວຍງານ'])}<div class="foot">ພິມວັນທີ ${nowStr()}</div>`);
}

/* ----- ປ້າຍບາໂຄດ ----- */
function printLabels(rows) {
  const list = rows.filter(r => r.status !== 'disposed');
  if (!list.length) { toast('ບໍ່ມີອຸປະກອນທີ່ຈະພິມປ້າຍ'); return; }
  if (list.length > 300 && !confirm(`ຈະພິມ ${list.length} ປ້າຍ ຕ້ອງການດຳເນີນການຕໍ່ບໍ?`)) return;
  const bad = [];
  const html = list.map(r => {
    const svg = code39(r.asset_code);
    if (!svg) bad.push(r.asset_code);
    return `<div class="label"><small>ຄະນະໂຄສະນາອົບຮົມສູນກາງພັກ</small><b>${esc(r.name)}</b>${svg || '<small>ລະຫັດນີ້ບໍ່ຮອງຮັບບາໂຄດ</small>'}<div class="code">${esc(r.asset_code)}</div><small>${esc(r.department_name || '')}</small></div>`;
  }).join('');
  printDoc('ປ້າຍບາໂຄດອຸປະກອນ', `<div class="labels">${html}</div>`);
  if (bad.length) toast(`${bad.length} ລະຫັດບໍ່ຮອງຮັບບາໂຄດ (ໃຊ້ໄດ້ສະເພາະ A-Z 0-9 - . ແລະ ຍະຫວ່າງ)`);
}

/* ================= ປ່ຽນລະຫັດຜ່ານ ================= */
function changePassword() {
  openForm({
    title: 'ປ່ຽນລະຫັດຜ່ານ',
    fields: [
      { k: 'old_password', label: 'ລະຫັດຜ່ານເກົ່າ', type: 'password', required: true },
      { k: 'new_password', label: 'ລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ຕົວ)', type: 'password', required: true },
      { k: 'confirm', label: 'ຢືນຢັນລະຫັດຜ່ານໃໝ່', type: 'password', required: true }],
    onSave: async b => {
      if (b.new_password !== b.confirm) throw new Error('ລະຫັດຜ່ານໃໝ່ທັງສອງຄັ້ງບໍ່ກົງກັນ');
      await api('auth', { method: 'POST', params: { a: 'password' }, body: { old_password: b.old_password, new_password: b.new_password } });
      toast('ປ່ຽນລະຫັດຜ່ານແລ້ວ');
    }
  });
}
$('#chpw').onclick = changePassword;

/* ================= ຜູ້ໃຊ້ລະບົບ ================= */
const ROLE = { admin: 'ຜູ້ດູແລ (admin)', staff: 'ເຈົ້າໜ້າທີ່ (staff)' };
views.users = async function (el) {
  const rows = await api('users');
  el.innerHTML = `<div class="head"><h2>ຜູ້ໃຊ້ລະບົບ</h2><button class="primary" data-act="new">+ ເພີ່ມຜູ້ໃຊ້</button></div>
  ${table([
    { h: 'ຊື່ຜູ້ໃຊ້', f: r => `<b>${esc(r.username)}</b>` }, { h: 'ຊື່ ແລະ ນາມສະກຸນ', f: r => esc(r.full_name) },
    { h: 'ບົດບາດ', f: r => `<span class="badge">${ROLE[r.role]}</span>` }, { h: 'ສ້າງເມື່ອ', f: r => esc(String(r.created_at).slice(0, 10)) },
    { h: '', cls: 'act', f: r => btn('edit', r.id, 'ແກ້ໄຂ / ຕັ້ງລະຫັດໃໝ່') + (r.id == user.id ? '' : btn('del', r.id, 'ລຶບ', 'danger')) }], rows)}`;
  const edit = row => openForm({
    title: row ? `ແກ້ໄຂຜູ້ໃຊ້: ${esc(row.username)}` : 'ເພີ່ມຜູ້ໃຊ້',
    fields: [
      ...(row ? [] : [{ k: 'username', label: 'ຊື່ຜູ້ໃຊ້ (A-Z, 0-9, _ . -)', required: true }]),
      { k: 'full_name', label: 'ຊື່ ແລະ ນາມສະກຸນ', required: true },
      { k: 'role', label: 'ບົດບາດ', type: 'select', required: true, options: Object.entries(ROLE) },
      { k: 'password', label: row ? 'ລະຫັດຜ່ານໃໝ່ (ປະໄວ້ຫວ່າງຖ້າບໍ່ປ່ຽນ)' : 'ລະຫັດຜ່ານ (ຢ່າງໜ້ອຍ 6 ຕົວ)', type: 'password', required: !row }],
    values: row || { role: 'staff' },
    onSave: async b => { await save('users', row && row.id, b); toast('ບັນທຶກແລ້ວ'); go('users'); }
  });
  el.onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    ({ new: () => edit(), edit: () => edit(rows.find(r => r.id == b.dataset.id)), del: () => remove('users', b.dataset.id, () => go('users')) })[b.dataset.act]();
  };
};

/* ================= ປະຫວັດການແກ້ໄຂ (audit log) ================= */
const ACTION = { create: 'ເພີ່ມ', update: 'ແກ້ໄຂ', delete: 'ລຶບ', transaction: 'ມອບ/ໂອນ/ສ້ອມ', login: 'ເຂົ້າລະບົບ', logout: 'ອອກລະບົບ', login_fail: 'ເຂົ້າບໍ່ສຳເລັດ', password_change: 'ປ່ຽນລະຫັດ', backup: 'ສຳຮອງ', backup_download: 'ດາວໂຫຼດສຳຮອງ', backup_delete: 'ລຶບສຳຮອງ', stocktake: 'ກວດນັບ' };
const RES = { departments: 'ກົມ/ໜ່ວຍງານ', employees: 'ພະນັກງານ', assets: 'ອຸປະກອນ', categories: 'ປະເພດອຸປະກອນ', users: 'ຜູ້ໃຊ້', auth: 'ເຂົ້າ-ອອກລະບົບ', backup: 'ສຳຮອງຂໍ້ມູນ' };
const FIELD = { name: 'ຊື່', code: 'ລະຫັດ', seq: 'ລຳດັບ', dept_type: 'ປະເພດໜ່ວຍງານ', phone: 'ເບີໂທ', note: 'ໝາຍເຫດ', emp_code: 'ລະຫັດພະນັກງານ', full_name: 'ຊື່ເຕັມ', position: 'ຕຳແໜ່ງ', department_id: 'ກົມ (id)', employee_id: 'ຜູ້ຖື (id)', asset_code: 'ລະຫັດອຸປະກອນ', category_id: 'ປະເພດ (id)', brand: 'ຍີ່ຫໍ້', serial_no: 'Serial', purchase_date: 'ວັນຈັດຊື້', price: 'ມູນຄ່າ', status: 'ສະຖານະ', location: 'ສະຖານທີ່', role: 'ບົດບາດ', username: 'ຊື່ຜູ້ໃຊ້', tx_type: 'ລາຍການ' };
const parseJ = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

function auditDetail(r) {
  const o = parseJ(r.old_data), n = parseJ(r.new_data);
  const keys = [...new Set([...Object.keys(o || {}), ...Object.keys(n || {})])];
  const show = v => v == null ? '<span class="muted">—</span>' : esc(typeof v === 'object' ? JSON.stringify(v) : v);
  const dlg = $('#dlg');
  dlg.innerHTML = `<h3>${ACTION[r.action] || esc(r.action)} · ${RES[r.resource] || esc(r.resource)} ${r.record_id ? '#' + r.record_id : ''}</h3>
    <p class="muted">${esc(r.created_at)} · ${esc(r.username || 'ລະບົບ')} · IP ${esc(r.ip || '')}</p>
    ${keys.length ? table([{ h: 'ຂໍ້ມູນ', f: k => esc(FIELD[k] || k) }, { h: 'ກ່ອນ', f: k => show(o && o[k]) }, { h: 'ຫຼັງ', f: k => show(n && n[k]) }], keys) : '<p>ບໍ່ມີລາຍລະອຽດເພີ່ມ</p>'}
    <div class="row-end"><button class="primary" id="fcancel">ປິດ</button></div>`;
  $('#fcancel').onclick = () => dlg.close(); dlg.showModal();
}

views.audit = async function (el) {
  const f = { ...filters }; const off = +f.offset || 0; const LIMIT = 100;
  const rows = await api('audit', { params: { ...f, limit: LIMIT, offset: off } });
  el.innerHTML = `<div class="head"><h2>ປະຫວັດການແກ້ໄຂ</h2></div>
  <div class="filters">
    <select data-f="resource">${optHtml(Object.entries(RES), f.resource, 'ທຸກຂໍ້ມູນ')}</select>
    <select data-f="action">${optHtml(Object.entries(ACTION), f.action, 'ທຸກການກະທຳ')}</select>
    <input data-f="username" placeholder="ຊື່ຜູ້ໃຊ້" value="${esc(f.username)}">
    <input data-f="date_from" type="date" value="${esc(f.date_from)}" title="ຕັ້ງແຕ່ວັນທີ">
    <input data-f="date_to" type="date" value="${esc(f.date_to)}" title="ເຖິງວັນທີ"></div>
  ${table([
    { h: 'ເວລາ', f: r => esc(r.created_at) }, { h: 'ຜູ້ໃຊ້', f: r => esc(r.username || 'ລະບົບ') },
    { h: 'ການກະທຳ', f: r => `<span class="badge">${ACTION[r.action] || esc(r.action)}</span>` }, { h: 'ຂໍ້ມູນ', f: r => RES[r.resource] || esc(r.resource) },
    { h: 'ລາຍການ', f: r => esc(r.summary || '') }, { h: '', cls: 'act', f: r => (r.old_data || r.new_data) ? btn('detail', r.id, 'ລາຍລະອຽດ') : '' }], rows, 'ບໍ່ພົບປະຫວັດ')}
  <div class="row-end" style="margin-top:.75rem">${off ? '<button data-act="prev">‹ ກ່ອນ</button>' : ''}${rows.length === LIMIT ? '<button data-act="next">ຕໍ່ໄປ ›</button>' : ''}</div>`;
  const apply = extra => { const nf = { ...extra }; el.querySelectorAll('[data-f]').forEach(i => { if (i.value) nf[i.dataset.f] = i.value; }); go('audit', nf); };
  el.querySelectorAll('[data-f]').forEach(i => { i.onchange = () => apply({}); });
  el.onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'detail') return auditDetail(rows.find(r => r.id == b.dataset.id));
    const keep = {}; el.querySelectorAll('[data-f]').forEach(i => { if (i.value) keep[i.dataset.f] = i.value; });
    go('audit', { ...keep, offset: Math.max(0, off + (b.dataset.act === 'next' ? LIMIT : -LIMIT)) });
  };
};

/* ================= ສຳຮອງຂໍ້ມູນ ================= */
views.backups = async function (el) {
  const rows = await api('backup');
  const kb = n => (n / 1024).toFixed(1) + ' KB';
  el.innerHTML = `<div class="head"><h2>ສຳຮອງຂໍ້ມູນ</h2><button class="primary" data-act="new">ສຳຮອງດຽວນີ້</button></div>
  <div class="panel" style="margin-bottom:1rem"><p style="margin:0">ລະບົບສຳຮອງອັດຕະໂນມັດ 1 ຄັ້ງ/ວັນ ເມື່ອ admin ເຂົ້າລະບົບເທື່ອທຳອິດຂອງມື້, ແລະ ເກັບໄວ້ສູງສຸດ 30 ໄຟລ໌. ຕ້ອງການສຳຮອງທຸກຄືນໂດຍບໍ່ຕ້ອງເຂົ້າລະບົບ ໃຫ້ແລ່ນ <code>schedule_backup.bat</code> (ເບິ່ງ README_PHASE2.txt). ການກູ້ຂໍ້ມູນຄືນ: phpMyAdmin → ເລືອກຖານຂໍ້ມູນ → Import ໄຟລ໌ .sql.</p></div>
  ${table([
    { h: 'ໄຟລ໌', f: r => esc(r.name) }, { h: 'ເວລາ', f: r => esc(r.time) }, { h: 'ຂະໜາດ', cls: 'num', f: r => kb(r.size) },
    { h: '', cls: 'act', f: r => `<a class="linkbtn" href="api/index.php?r=backup&a=download&file=${encodeURIComponent(r.name)}">ດາວໂຫຼດ</a>` + `<button class="sm danger" data-act="del" data-file="${esc(r.name)}">ລຶບ</button>` }], rows, 'ຍັງບໍ່ມີໄຟລ໌ສຳຮອງ')}`;
  el.onclick = async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    try {
      if (b.dataset.act === 'new') { b.disabled = true; await api('backup', { method: 'POST' }); toast('ສຳຮອງແລ້ວ'); go('backups'); }
      if (b.dataset.act === 'del' && confirm('ລຶບໄຟລ໌ສຳຮອງນີ້?')) { await api('backup', { method: 'DELETE', params: { file: b.dataset.file } }); toast('ລຶບແລ້ວ'); go('backups'); }
    } catch (err) { toast(err.message); b.disabled = false; }
  };
};

/* ================= ກວດນັບອຸປະກອນ (ສະແກນບາໂຄດ) ================= */
let stk = null;   // { deptId, found:{CODE:true}, unknown:[CODE] }

async function cameraScan(onCode) {
  if (!window.isSecureContext) return toast('ກ້ອງໃຊ້ໄດ້ສະເພາະ HTTPS ຫຼື localhost (ເບິ່ງ HTTPS ໃນ README_PHASE2.txt)');
  if (!('BarcodeDetector' in window)) return toast('ບຣາວເຊີນີ້ບໍ່ຮອງຮັບສະແກນດ້ວຍກ້ອງ ໃຫ້ໃຊ້ເຄື່ອງສະແກນບາໂຄດ ຫຼື ພິມລະຫັດ');
  let det, stream;
  try { det = new BarcodeDetector({ formats: ['code_39'] }); } catch (e) { return toast('ບຣາວເຊີນີ້ບໍ່ຮອງຮັບບາໂຄດ Code 39'); }
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); } catch (e) { return toast('ເປີດກ້ອງບໍ່ໄດ້ ກະລຸນາອະນຸຍາດການໃຊ້ກ້ອງ'); }
  const dlg = $('#dlg');
  dlg.innerHTML = `<h3>ສະແກນດ້ວຍກ້ອງ</h3><video id="cam" playsinline muted style="width:100%;border-radius:8px;background:#000"></video>
    <p class="muted">ເລັງກ້ອງໃສ່ບາໂຄດ ລະບົບຈະບັນທຶກອັດຕະໂນມັດ</p><div class="row-end"><button class="primary" id="camClose">ປິດ</button></div>`;
  const v = $('#cam'); v.srcObject = stream; await v.play();
  let last = '', lastAt = 0;
  const timer = setInterval(async () => {
    try {
      const r = await det.detect(v);
      if (r.length) { const c = r[0].rawValue; if (c !== last || Date.now() - lastAt > 2500) { last = c; lastAt = Date.now(); onCode(c); } }
    } catch (e) { /* ຂ້າມເຟຣມທີ່ອ່ານບໍ່ໄດ້ */ }
  }, 300);
  dlg.addEventListener('close', () => { clearInterval(timer); stream.getTracks().forEach(t => t.stop()); }, { once: true });
  $('#camClose').onclick = () => dlg.close();
  dlg.showModal();
}

views.stocktake = async function (el) {
  const live = (await api('assets')).filter(a => a.status !== 'disposed');
  const byCode = new Map(live.map(a => [String(a.asset_code).toUpperCase(), a]));
  const deptName = id => id ? ((depts.find(d => d.id == id) || {}).name || '') : 'ທຸກກົມ';
  const expected = () => live.filter(a => !stk.deptId || a.department_id == stk.deptId);
  const calc = () => {
    const exp = expected(), foundCodes = Object.keys(stk.found);
    const foundOk = exp.filter(a => stk.found[String(a.asset_code).toUpperCase()]);
    const missing = exp.filter(a => !stk.found[String(a.asset_code).toUpperCase()]);
    const elsewhere = foundCodes.map(c => byCode.get(c)).filter(a => a && !exp.includes(a));
    return { exp, foundOk, missing, elsewhere, unknown: stk.unknown };
  };

  const paintResult = () => {
    const r = calc(), box = $('#stkResult'); if (!box) return;
    const cols = [{ h: 'ລະຫັດ', f: a => esc(a.asset_code) }, { h: 'ຊື່', f: a => esc(a.name) }, { h: 'ກົມ', f: a => esc(a.department_name || '—') }];
    box.innerHTML = `<div class="stats">
      <div class="stat"><b>${r.foundOk.length} / ${r.exp.length}</b><span>ພົບແລ້ວ</span></div>
      <div class="stat" style="border-left-color:var(--bad)"><b>${r.missing.length}</b><span>ຍັງບໍ່ພົບ</span></div>
      <div class="stat" style="border-left-color:var(--warn)"><b>${r.elsewhere.length + r.unknown.length}</b><span>ເກີນ / ຢູ່ກົມອື່ນ</span></div></div>
    <section class="block"><h3>ຍັງບໍ່ພົບ <span class="count">${r.missing.length}</span></h3>${table(cols, r.missing, r.exp.length ? 'ພົບຄົບແລ້ວ' : 'ກົມນີ້ຍັງບໍ່ມີອຸປະກອນໃນບັນຊີ')}</section>
    <section class="block"><h3>ພົບແຕ່ບໍ່ຢູ່ໃນບັນຊີກົມນີ້ <span class="count">${r.elsewhere.length + r.unknown.length}</span></h3>
      ${table(cols, r.elsewhere, 'ບໍ່ມີ')}${r.unknown.length ? `<p class="err">ລະຫັດທີ່ບໍ່ມີໃນລະບົບ: ${r.unknown.map(esc).join(', ')}</p>` : ''}</section>
    <section class="block"><h3>ພົບແລ້ວ <span class="count">${r.foundOk.length}</span></h3>${table(cols, r.foundOk, 'ຍັງບໍ່ໄດ້ສະແກນ')}</section>`;
  };

  const scan = raw => {
    const code = String(raw).trim().toUpperCase(); if (!code) return;
    const a = byCode.get(code);
    if (stk.found[code] || stk.unknown.includes(code)) return toast('ສະແກນແລ້ວ: ' + code);
    if (a) { stk.found[code] = true; toast('✓ ' + a.name); } else { stk.unknown.push(code); toast('✗ ບໍ່ມີໃນລະບົບ: ' + code); }
    paintResult();
  };

  const paint = () => {
    if (!stk) {
      el.innerHTML = `<div class="head"><h2>ກວດນັບອຸປະກອນ</h2></div>
      <div class="panel" style="max-width:520px"><label>ເລືອກກົມທີ່ຕ້ອງການກວດນັບ<select id="sd">${optHtml(deptOpts(), '', 'ທຸກກົມ')}</select></label>
      <p class="muted">ໃຊ້ເຄື່ອງສະແກນບາໂຄດ (ສ່ວນໃຫຍ່ເຮັດວຽກຄືແປ້ນພິມ) ຫຼື ກ້ອງໂທລະສັບ ສະແກນປ້າຍທີ່ຕິດຢູ່ອຸປະກອນ ແລ້ວລະບົບຈະປຽບທຽບກັບບັນຊີ.</p>
      <button class="primary" id="sgo">ເລີ່ມກວດນັບ</button></div>`;
      $('#sgo').onclick = () => { stk = { deptId: $('#sd').value, found: {}, unknown: [] }; paint(); };
      return;
    }
    el.innerHTML = `<div class="head"><h2>ກວດນັບ: ${esc(deptName(stk.deptId))}</h2>
      <span><button id="sprint">ພິມຜົນ</button> <button id="ssave">ບັນທຶກຜົນ</button> <button id="sreset" class="danger">ເລີ່ມໃໝ່</button></span></div>
    <div class="filters"><input id="scan" autocomplete="off" placeholder="ສະແກນບາໂຄດ ຫຼື ພິມລະຫັດ ແລ້ວກົດ Enter"><button id="scam" style="flex:0 0 auto">ໃຊ້ກ້ອງ</button></div>
    <div id="stkResult"></div>`;
    const inp = $('#scan'); inp.focus();
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); scan(inp.value); inp.value = ''; } };
    $('#scam').onclick = () => cameraScan(scan);
    $('#sreset').onclick = () => { if (confirm('ລ້າງຜົນການສະແກນທັງໝົດ?')) { stk = null; paint(); } };
    $('#ssave').onclick = async () => {
      const r = calc();
      try {
        await api('audit', { method: 'POST', body: {
          summary: `ກວດນັບ ${deptName(stk.deptId)}: ພົບ ${r.foundOk.length}/${r.exp.length}, ຂາດ ${r.missing.length}, ເກີນ ${r.elsewhere.length + r.unknown.length}`,
          data: { department: deptName(stk.deptId), missing: r.missing.map(a => a.asset_code), elsewhere: r.elsewhere.map(a => a.asset_code), unknown: r.unknown } } });
        toast('ບັນທຶກຜົນກວດນັບແລ້ວ (ເບິ່ງໄດ້ໃນປະຫວັດການແກ້ໄຂ)');
      } catch (e) { toast(e.message); }
    };
    $('#sprint').onclick = () => {
      const r = calc(), rowsHtml = list => list.map((a, i) => `<tr><td>${i + 1}</td><td>${esc(a.asset_code)}</td><td>${esc(a.name)}</td><td>${esc(a.department_name || '')}</td></tr>`).join('') || '<tr><td colspan="4">—</td></tr>';
      const tbl = (t, list) => `<h3>${t} (${list.length})</h3><table><thead><tr><th>ລ/ດ</th><th>ລະຫັດ</th><th>ຊື່</th><th>ກົມ</th></tr></thead><tbody>${rowsHtml(list)}</tbody></table>`;
      printDoc('ຜົນກວດນັບອຸປະກອນ', `${docHead('ຜົນກວດນັບອຸປະກອນ', `${esc(deptName(stk.deptId))} — ພົບ ${r.foundOk.length}/${r.exp.length} ລາຍການ`)}
        ${tbl('ຍັງບໍ່ພົບ', r.missing)}${tbl('ພົບແຕ່ບໍ່ຢູ່ໃນບັນຊີກົມນີ້', r.elsewhere)}
        ${r.unknown.length ? `<p>ລະຫັດທີ່ບໍ່ມີໃນລະບົບ: ${r.unknown.map(esc).join(', ')}</p>` : ''}
        ${signBlock(['ຜູ້ກວດນັບ', 'ຜູ້ແທນກົມ', 'ຫົວໜ້າໜ່ວຍງານ'])}<div class="foot">ພິມວັນທີ ${nowStr()}</div>`);
    };
    paintResult();
  };
  paint();
};
