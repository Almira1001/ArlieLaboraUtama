// ============================================
// DATA
// ============================================
const pageTitles = {
  dashboard: { title:'Dashboard Utama',      sub:'Ringkasan performa SDM dan keuangan — April 2025' },
  employees:  { title:'Data Karyawan',        sub:'Manajemen sumber daya manusia PT Arlie Labora Utama' },
  payroll:    { title:'Payroll & Penggajian', sub:'Hitung dan proses gaji karyawan' },
  attendance: { title:'Absensi & Cuti',       sub:'Monitoring kehadiran harian' },
  financial:  { title:'Laporan Keuangan',     sub:'Arus kas dan laporan bulanan PT Arlie Labora Utama' },
  budget:     { title:'Manajemen Anggaran',   sub:'Monitoring anggaran per departemen' },
  settings:   { title:'Pengaturan Sistem',    sub:'Konfigurasi perusahaan' },
};

const employees = [
  { name:'Budi Santoso',     dept:'Teknologi',   title:'Senior Developer',   salary:14500000, status:'active', joined:'Jan 2020' },
  { name:'Siti Rahma',       dept:'Marketing',   title:'Marketing Manager',  salary:11500000, status:'active', joined:'Mar 2019' },
  { name:'Andi Firmansyah',  dept:'Operasional', title:'Ops Supervisor',     salary:9800000,  status:'leave',  joined:'Jun 2021' },
  { name:'Maya Dewi',        dept:'Keuangan',    title:'Finance Analyst',    salary:13000000, status:'active', joined:'Aug 2020' },
  { name:'Rizky Fadhillah',  dept:'Teknologi',   title:'Backend Engineer',   salary:12500000, status:'active', joined:'Feb 2022' },
  { name:'Dewi Kusuma',      dept:'Marketing',   title:'Content Strategist', salary:9000000,  status:'active', joined:'Apr 2025' },
];

const payrollSummary = [
  { name:'Budi Santoso',    net:12541250, status:'paid' },
  { name:'Siti Rahma',      net:9918750,  status:'paid' },
  { name:'Andi Firmansyah', net:8450000,  status:'paid' },
  { name:'Maya Dewi',       net:11212500, status:'paid' },
  { name:'Rizky Fadhillah', net:10781250, status:'paid' },
];

const empPayrollData = {
  budi: { base:14500000, allow:1500000, otRate:45000 },
  siti: { base:11500000, allow:2000000, otRate:40000 },
  andi: { base:9800000,  allow:800000,  otRate:35000 },
  maya: { base:13000000, allow:1200000, otRate:40000 },
};

const cashflowData = {
  labels:  ['Jan','Feb','Mar','Apr'],
  income:  [680, 710, 795, 892],
  expense: [421, 447, 493, 551],
  profit:  [259, 263, 302, 341],
};

// ============================================
// NAVIGATION
// ============================================
let chartType = 'bar';

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.getAttribute('onclick')?.includes(`'${page}'`)) el.classList.add('active');
  });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  const meta = pageTitles[page];
  if (meta) {
    document.getElementById('pageTitle').textContent  = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.sub;
  }
  setTimeout(() => {
    if (page === 'financial')  drawFinancialChart();
    if (page === 'attendance') drawAttendanceChart();
    if (page === 'budget')     drawBudgetChart();
    if (page === 'dashboard')  drawDashboardCharts();
  }, 80);
}

// ============================================
// CHART ENGINE (canvas, no external lib)
// ============================================
function drawBarChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight || parseInt(canvas.getAttribute('height')) || 200;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top:24, right:20, bottom:38, left:58 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const allVals = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allVals) * 1.18;

  // Grid
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = pad.top + (chartH / gridCount) * i;
    ctx.strokeStyle = 'rgba(59,31,110,0.07)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.setLineDash([]);
    const val = Math.round(maxVal - (maxVal / gridCount) * i);
    ctx.fillStyle = '#8873AA';
    ctx.font = '10px Sora, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((val >= 1000 ? (val/1000).toFixed(1)+'B' : val+'M'), pad.left - 8, y + 4);
  }

  const n = labels.length;
  const groupW = chartW / n;
  const barW = Math.min(groupW / (datasets.length + 1), 26);
  const gap = (groupW - barW * datasets.length) / 2;

  datasets.forEach((ds, di) => {
    ds.data.forEach((val, i) => {
      const x = pad.left + i * groupW + gap + di * barW;
      const bH = (val / maxVal) * chartH;
      const y = pad.top + chartH - bH;
      const r = 3;

      // Shadow
      ctx.shadowColor = ds.color + '30';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + bH);
      ctx.lineTo(x, y + bH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Value label
      if (bH > 18) {
        ctx.fillStyle = ds.color;
        ctx.font = 'bold 9px Sora, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((val >= 1000 ? (val/1000).toFixed(1)+'T' : val+'M'), x + barW/2, y - 5);
      }
    });
  });

  labels.forEach((lbl, i) => {
    const x = pad.left + i * groupW + groupW / 2;
    ctx.fillStyle = '#3E2A66';
    ctx.font = '11px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, x, pad.top + chartH + 22);
  });
}

function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight || parseInt(canvas.getAttribute('height')) || 200;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top:24, right:20, bottom:34, left:58 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const allVals = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allVals) * 1.18;

  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i;
    ctx.strokeStyle = 'rgba(59,31,110,0.07)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#8873AA';
    ctx.font = '10px Sora, sans-serif';
    ctx.textAlign = 'right';
    const val = Math.round(maxVal - (maxVal / 5) * i);
    ctx.fillText((val >= 1000 ? (val/1000).toFixed(1)+'B' : val+'M'), pad.left - 8, y + 4);
  }

  const n = labels.length;
  datasets.forEach(ds => {
    const pts = ds.data.map((v, i) => [
      pad.left + (i / (n - 1)) * chartW,
      pad.top + (1 - v / maxVal) * chartH
    ]);

    // Fill area
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, ds.color + '22');
    grad.addColorStop(1, ds.color + '04');
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pad.top + chartH);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(pts[pts.length-1][0], pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white'; ctx.fill();
      ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5; ctx.stroke();
    });
  });

  labels.forEach((lbl, i) => {
    ctx.fillStyle = '#3E2A66';
    ctx.font = '11px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, pad.left + (i / (n - 1)) * chartW, pad.top + chartH + 20);
  });
}

function toggleChartType() {
  chartType = chartType === 'bar' ? 'line' : 'bar';
  drawDashboardCharts();
  showToast(chartType === 'bar' ? 'Tampilan: Bar Chart' : 'Tampilan: Line Chart');
}

function drawDashboardCharts() {
  const datasets = [
    { data: cashflowData.income,  color: '#1A8C5B' },
    { data: cashflowData.expense, color: '#C0392B' },
    { data: cashflowData.profit,  color: '#5C2FA0' },
  ];
  if (chartType === 'bar') {
    drawBarChart('cashflowChart', cashflowData.labels, datasets);
  } else {
    drawLineChart('cashflowChart', cashflowData.labels, datasets);
  }
  drawLineChart('profitMiniChart', cashflowData.labels, [
    { data: cashflowData.profit, color: '#5C2FA0' }
  ]);
}

function drawFinancialChart() {
  const datasets = [
    { data: cashflowData.income,  color: '#1A8C5B' },
    { data: cashflowData.expense, color: '#C0392B' },
    { data: cashflowData.profit,  color: '#5C2FA0' },
  ];
  drawBarChart('financialChart', cashflowData.labels, datasets);
}

function drawAttendanceChart() {
  const canvas = document.getElementById('attendanceChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = parseInt(canvas.getAttribute('height')) || 130;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const weeks = ['M1','M2','M3','M4'];
  const rates = [94, 97, 91, 96];
  const bW = (W - 80) / 4;
  weeks.forEach((w, i) => {
    const x = 60 + i * bW + bW * 0.18;
    const bw = bW * 0.64;
    const maxH = H - 40;
    const bh = (rates[i] / 100) * maxH;
    const y = H - 24 - bh;
    const color = rates[i] >= 95 ? '#1A8C5B' : rates[i] >= 90 ? '#B87400' : '#C0392B';

    ctx.fillStyle = color + '18';
    ctx.beginPath(); ctx.roundRect(x, H - 24 - maxH, bw, maxH, 4); ctx.fill();

    const grad = ctx.createLinearGradient(0, y, 0, y + bh);
    grad.addColorStop(0, color + 'DD');
    grad.addColorStop(1, color + 'AA');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 4); ctx.fill();

    ctx.fillStyle = '#18093A'; ctx.font = 'bold 11px Sora'; ctx.textAlign = 'center';
    ctx.fillText(rates[i] + '%', x + bw/2, y - 5);
    ctx.fillStyle = '#8873AA'; ctx.font = '11px Sora';
    ctx.fillText(w, x + bw/2, H - 6);
  });
}

function drawBudgetChart() {
  const canvas = document.getElementById('budgetChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = parseInt(canvas.getAttribute('height')) || 150;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const depts  = ['Teknologi','Marketing','Operasional','Keu & Admin','SDM'];
  const used   = [142, 78, 95, 52, 38];
  const budget = [160, 100, 90, 70, 50];
  const colors = ['#3D5AF1','#1A8C5B','#C0392B','#B87400','#5C2FA0'];

  const bH = (H - 20) / depts.length - 5;
  depts.forEach((d, i) => {
    const y = 10 + i * (bH + 5);
    const maxW = W - 20;
    const usedW = (used[i] / budget[i]) * maxW;

    ctx.fillStyle = colors[i] + '16';
    ctx.beginPath(); ctx.roundRect(0, y, maxW, bH, 3); ctx.fill();
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.roundRect(0, y, Math.min(usedW, maxW), bH, 3); ctx.fill();
    ctx.fillStyle = '#18093A'; ctx.font = '10px Sora'; ctx.textAlign = 'left';
    ctx.fillText(d, 5, y + bH - 4);
    ctx.textAlign = 'right';
    ctx.fillText(used[i]+'M', maxW - 4, y + bH - 4);
  });
}

// ============================================
// EMPLOYEES
// ============================================
function renderEmployees(data) {
  const tbody = document.getElementById('employeeBody');
  if (!tbody) return;
  tbody.innerHTML = data.map(e => `
    <tr>
      <td><div class="emp-cell">
        <div class="emp-avatar">${e.name.substring(0,2).toUpperCase()}</div>
        <div><div class="emp-name">${e.name}</div><div class="emp-dept">${e.dept}</div></div>
      </div></td>
      <td style="font-size:0.79rem">${e.title}</td>
      <td style="font-size:0.79rem">${e.dept}</td>
      <td class="mono" style="font-size:0.77rem">Rp ${e.salary.toLocaleString('id-ID')}</td>
      <td><span class="badge badge-${e.status}">${e.status === 'active' ? 'Aktif' : 'Cuti'}</span></td>
      <td style="font-size:0.77rem;color:var(--c-text-3)">${e.joined}</td>
      <td><button class="btn btn-ghost" style="padding:4px 9px;font-size:0.71rem" onclick="showToast('Membuka detail karyawan...')">Detail</button></td>
    </tr>
  `).join('');
}

function filterEmployees(q) {
  renderEmployees(employees.filter(e =>
    e.name.toLowerCase().includes(q.toLowerCase()) ||
    e.dept.toLowerCase().includes(q.toLowerCase())
  ));
}

function renderPayrollSummary() {
  const tbody = document.getElementById('payrollSummaryBody');
  if (!tbody) return;
  tbody.innerHTML = payrollSummary.map(p => `
    <tr>
      <td style="font-size:0.8rem;font-weight:600">${p.name}</td>
      <td class="mono" style="font-size:0.77rem;color:var(--c-green)">Rp ${p.net.toLocaleString('id-ID')}</td>
      <td><span class="badge badge-paid">Lunas</span></td>
    </tr>
  `).join('');
}

// ============================================
// PAYROLL CALCULATOR + OVERTIME LOGIC
// ============================================
function prefillEmployee() {
  const key = document.getElementById('payEmp').value;
  if (!empPayrollData[key]) {
    ['payBase','payAllow','payOTRate','payOT','payBonus'].forEach(id => document.getElementById(id).value = '');
    calcPayroll();
    return;
  }
  const d = empPayrollData[key];
  document.getElementById('payBase').value   = d.base;
  document.getElementById('payAllow').value  = d.allow;
  document.getElementById('payOTRate').value = d.otRate;
  document.getElementById('payOT').value     = '';
  document.getElementById('payBonus').value  = '';
  calcPayroll();
}

function calcPayroll() {
  const base    = parseFloat(document.getElementById('payBase').value)   || 0;
  const allow   = parseFloat(document.getElementById('payAllow').value)  || 0;
  const otHours = parseFloat(document.getElementById('payOT').value)     || 0;
  const otRate  = parseFloat(document.getElementById('payOTRate').value) || 0;
  const bpjsPct = parseFloat(document.getElementById('payBPJS').value)   || 0;
  const taxPct  = parseFloat(document.getElementById('payTax').value)    || 0;
  const bonus   = parseFloat(document.getElementById('payBonus').value)  || 0;

  // Indonesian overtime regulation:
  // First 1 hour = 1.5x, subsequent hours = 2x (simplified: all at multiplier)
  let otPay = 0;
  if (otHours > 0 && otRate > 0) {
    const hourlyBase = base / 173; // standar jam kerja sebulan
    // Jika otRate diisi manual, pakai langsung; fallback ke 1/173 base
    const effectiveRate = otRate > 0 ? otRate : (base / 173);
    if (otHours <= 1) {
      otPay = otHours * effectiveRate * 1.5;
    } else {
      otPay = (1 * effectiveRate * 1.5) + ((otHours - 1) * effectiveRate * 2);
    }
  }

  const gross    = base + allow + otPay + bonus;
  const bpjsCut  = gross * (bpjsPct / 100);
  const taxCut   = gross * (taxPct  / 100);
  const net      = gross - bpjsCut - taxCut;

  const fmt = v => 'Rp ' + Math.round(v).toLocaleString('id-ID');

  document.getElementById('resBase').textContent  = fmt(base);
  document.getElementById('resAllow').textContent = fmt(allow);
  document.getElementById('resOT').textContent    = fmt(otPay);
  document.getElementById('resBonus').textContent = fmt(bonus);
  document.getElementById('resBPJS').textContent  = '— ' + fmt(bpjsCut);
  document.getElementById('resTax').textContent   = '— ' + fmt(taxCut);
  document.getElementById('resNet').textContent   = fmt(net);

  // Simpan state untuk export
  window._lastPayroll = {
    empName: document.getElementById('payEmp').options[document.getElementById('payEmp').selectedIndex]?.text || 'Karyawan',
    period:  document.getElementById('payPeriod')?.value || 'April 2025',
    base, allow, otHours, otPay, bonus, bpjsCut, taxCut, gross, net
  };
}

// ============================================
// PDF EXPORT — jsPDF
// ============================================
function exportPayrollPDF() {
  if (!window.jspdf) {
    showToast('⚠ Library PDF sedang dimuat...');
    loadJsPDF(() => doExportPDF());
    return;
  }
  doExportPDF();
}

function loadJsPDF(cb) {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = () => { showToast('Library PDF siap'); cb(); };
  s.onerror = () => showToast('⚠ Gagal memuat library PDF. Periksa koneksi.');
  document.head.appendChild(s);
}

function doExportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const p = window._lastPayroll || {};
  const fmt = v => 'Rp ' + Math.round(v || 0).toLocaleString('id-ID');
  const W = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(45, 18, 96); // --c-purple-deep
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(15);
  doc.text('PT ARLIE LABORA UTAMA', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('Jl. Sudirman No. 88, Jakarta 12190  |  NPWP: 12.345.678.9-012.000', 14, 22);
  doc.text('SLIP GAJI KARYAWAN', 14, 30);

  // Period & Employee info
  doc.setTextColor(45, 18, 96);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.text('Periode: ' + (p.period || 'April 2025'), 14, 48);
  doc.text('Karyawan: ' + (p.empName || '-').split('—')[0].trim(), 14, 55);

  // Divider
  doc.setDrawColor(200, 190, 220);
  doc.line(14, 59, W - 14, 59);

  // Section: Pendapatan
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(92, 47, 160);
  doc.text('PENDAPATAN', 14, 67);

  const rows = [
    ['Gaji Pokok',     fmt(p.base)],
    ['Tunjangan Jabatan', fmt(p.allow)],
    ['Uang Lembur (' + (p.otHours||0) + ' jam)', fmt(p.otPay)],
    ['Bonus / Insentif', fmt(p.bonus)],
  ];
  doc.setFont('helvetica','normal');
  doc.setTextColor(30, 9, 58);
  doc.setFontSize(9);
  rows.forEach(([label, val], i) => {
    const y = 73 + i * 8;
    doc.text(label, 18, y);
    doc.text(val, W - 14, y, { align:'right' });
  });

  const grossY = 73 + rows.length * 8 + 2;
  doc.setFillColor(240, 236, 252);
  doc.rect(14, grossY - 5, W - 28, 9, 'F');
  doc.setFont('helvetica','bold');
  doc.text('Total Pendapatan Bruto', 18, grossY);
  doc.text(fmt(p.gross), W - 14, grossY, { align:'right' });

  // Section: Potongan
  const secY = grossY + 14;
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(192, 57, 43);
  doc.text('POTONGAN', 14, secY);

  const deducts = [
    ['BPJS Ketenagakerjaan', '— ' + fmt(p.bpjsCut)],
    ['PPh 21',               '— ' + fmt(p.taxCut)],
  ];
  doc.setFont('helvetica','normal');
  doc.setTextColor(30, 9, 58);
  deducts.forEach(([label, val], i) => {
    const y = secY + 6 + i * 8;
    doc.text(label, 18, y);
    doc.setTextColor(192, 57, 43);
    doc.text(val, W - 14, y, { align:'right' });
    doc.setTextColor(30, 9, 58);
  });

  // Net total
  const netY = secY + 6 + deducts.length * 8 + 8;
  doc.setFillColor(45, 18, 96);
  doc.rect(14, netY - 7, W - 28, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('GAJI BERSIH DITERIMA', 18, netY);
  doc.text(fmt(p.net), W - 14, netY, { align:'right' });

  // Footer
  const footY = netY + 20;
  doc.setFillColor(248, 245, 255);
  doc.rect(0, footY, W, 30, 'F');
  doc.setTextColor(92, 47, 160);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.text('Dokumen ini digenerate secara otomatis oleh Sistem HR PT Arlie Labora Utama.', 14, footY + 8);
  doc.text('Dicetak: ' + new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' }), 14, footY + 15);
  doc.text('Tanda tangan digital tersedia pada versi digital resmi.', 14, footY + 22);

  const empKey = document.getElementById('payEmp')?.value || 'slip';
  doc.save('slip-gaji-' + empKey + '-' + (p.period||'april-2025').replace(/\s/g,'-').toLowerCase() + '.pdf');
  showToast('✓ Slip gaji berhasil diekspor ke PDF!');
}

// ============================================
// EMAIL — Skema integrasi (simulasi SMTP/API)
// ============================================
// Arsitektur: Frontend generate PDF (jsPDF) → konversi ke base64 →
// POST ke endpoint backend (Node/PHP) → nodemailer / SendGrid kirim email
// Fallback pada demo: simulasi delay + status badge.

async function simulateSendEmail() {
  const to = document.getElementById('emailTo').value.trim();
  if (!to || !to.includes('@')) {
    showToast('⚠ Masukkan alamat email yang valid');
    return;
  }
  const btn = document.querySelector('#emailModal .btn-primary');
  btn.textContent = 'Mengirim...';
  btn.disabled = true;

  // Payload yang akan dikirim ke backend:
  const payload = {
    to,
    subject: document.getElementById('emailSubject')?.value || 'Laporan Keuangan PT Arlie Labora Utama — April 2025',
    body: 'Terlampir laporan keuangan bulan April 2025.',
    // attachment: base64PDFString  ← akan diisi dari jsPDF .output('datauristring')
  };
  console.log('[EMAIL PAYLOAD]', payload);

  // Simulasi network call (ganti dengan fetch('/api/send-email', { method:'POST', body: JSON.stringify(payload) }))
  await new Promise(r => setTimeout(r, 1600));

  closeEmailModal();
  showToast('✓ Laporan berhasil dikirim ke ' + to);
  btn.textContent = 'Kirim';
  btn.disabled = false;

  // Tampilkan badge sukses jika ada container
  const badge = document.getElementById('emailSuccessBadge');
  if (badge) { badge.classList.remove('hidden'); setTimeout(() => badge.classList.add('hidden'), 4000); }
}

// ============================================
// CALENDAR
// ============================================
function buildCalendar() {
  const cal = document.getElementById('calendar');
  if (!cal) return;
  const absentDays = [7, 14, 21];
  let html = '';
  for (let blank = 0; blank < 2; blank++) html += '<div></div>'; // April 2025 starts Tue
  for (let d = 1; d <= 30; d++) {
    const classes = ['cal-day'];
    if (d === 26) classes.push('today');
    if (absentDays.includes(d)) classes.push('has-absent');
    html += `<div class="${classes.join(' ')}">${d}</div>`;
  }
  cal.innerHTML = html;
}

// ============================================
// UI HELPERS
// ============================================
function showToast(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(110%)';
    t.style.transition = 'all 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 2700);
}

function openEmailModal()  { document.getElementById('emailModal').classList.remove('hidden'); }
function closeEmailModal() { document.getElementById('emailModal').classList.add('hidden'); }

// ============================================
// INIT
// ============================================
window.addEventListener('load', () => {
  renderEmployees(employees);
  renderPayrollSummary();
  buildCalendar();
  drawDashboardCharts();
  // Pre-load jsPDF
  loadJsPDF(() => {});
});

window.addEventListener('resize', () => {
  const active = document.querySelector('.page.active');
  if (!active) return;
  if (active.id === 'page-dashboard')  drawDashboardCharts();
  if (active.id === 'page-financial')  drawFinancialChart();
  if (active.id === 'page-attendance') drawAttendanceChart();
  if (active.id === 'page-budget')     drawBudgetChart();
});

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}
