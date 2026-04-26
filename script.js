// ============================================
// DATA
// ============================================
const pageTitles = {
  dashboard: { title:'Dashboard Utama', sub:'Ringkasan performa SDM dan keuangan — April 2025' },
  analytics:  { title:'Analytics 3D', sub:'Visualisasi cashflow 3D interaktif' },
  employees:  { title:'Data Karyawan', sub:'Manajemen sumber daya manusia PT Arlie Labora Utama' },
  payroll:    { title:'Payroll & Penggajian', sub:'Hitung dan proses gaji karyawan' },
  attendance: { title:'Absensi & Cuti', sub:'Monitoring kehadiran harian' },
  financial:  { title:'Laporan Keuangan', sub:'Arus kas dan laporan bulanan PT Arlie Labora Utama' },
  budget:     { title:'Manajemen Anggaran', sub:'Monitoring anggaran per departemen' },
  settings:   { title:'Pengaturan Sistem', sub:'Konfigurasi perusahaan' },
};

const employees = [
  { name:'Budi Santoso',      dept:'Teknologi',   title:'Senior Developer',    salary:14500000, status:'active', joined:'Jan 2020' },
  { name:'Siti Rahma',        dept:'Marketing',   title:'Marketing Manager',   salary:11500000, status:'active', joined:'Mar 2019' },
  { name:'Andi Firmansyah',   dept:'Operasional', title:'Ops Supervisor',      salary:9800000,  status:'leave',  joined:'Jun 2021' },
  { name:'Maya Dewi',         dept:'Keuangan',    title:'Finance Analyst',     salary:13000000, status:'active', joined:'Aug 2020' },
  { name:'Rizky Fadhillah',   dept:'Teknologi',   title:'Backend Engineer',    salary:12500000, status:'active', joined:'Feb 2022' },
  { name:'Dewi Kusuma',       dept:'Marketing',   title:'Content Strategist',  salary:9000000,  status:'active', joined:'Apr 2025' },
];

const payrollSummary = [
  { name:'Budi Santoso',    net:12541250, status:'paid' },
  { name:'Siti Rahma',      net:9918750,  status:'paid' },
  { name:'Andi Firmansyah', net:8450000,  status:'paid' },
  { name:'Maya Dewi',       net:11212500, status:'paid' },
  { name:'Rizky Fadhillah', net:10781250, status:'paid' },
];

const empPayrollData = {
  budi:  { base:14500000, allow:1500000, otRate:45000 },
  siti:  { base:11500000, allow:2000000, otRate:40000 },
  andi:  { base:9800000,  allow:800000,  otRate:35000 },
  maya:  { base:13000000, allow:1200000, otRate:40000 },
};

const cashflowData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  income:  [680, 710, 795, 892],
  expense: [421, 447, 493, 551],
  profit:  [259, 263, 302, 341],
};

// ============================================
// NAVIGATION
// ============================================
let charts = {};
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
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.sub;
  }
  // Init charts on navigate
  setTimeout(() => {
    if (page === 'analytics') init3D('cashflow3d-full');
    if (page === 'financial') drawFinancialChart();
    if (page === 'attendance') drawAttendanceChart();
    if (page === 'budget') drawBudgetChart();
  }, 80);
}

// ============================================
// CANVAS CHART ENGINE (no external library)
// ============================================
function drawBarChart(canvasId, labels, datasets, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight || parseInt(canvas.getAttribute('height')) || 200;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pad = { top:20, right:20, bottom:40, left:64 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const allVals = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allVals) * 1.15;

  // Grid lines
  ctx.strokeStyle = '#E8E5DF';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    // Y labels
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.fillStyle = '#9B9186';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((val >= 1000 ? (val/1000).toFixed(1) + 'B' : val + 'M'), pad.left - 8, y + 4);
  }

  const n = labels.length;
  const groupW = chartW / n;
  const barW = Math.min(groupW / (datasets.length + 1), 28);
  const gap = (groupW - barW * datasets.length) / 2;

  datasets.forEach((ds, di) => {
    ds.data.forEach((val, i) => {
      const x = pad.left + i * groupW + gap + di * barW;
      const barH = (val / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      // Bar with rounded top
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // Value on top
      ctx.fillStyle = ds.color;
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      if (barH > 16) ctx.fillText((val >= 1000 ? (val/1000).toFixed(1) + 'T' : val + 'M'), x + barW/2, y - 4);
    });
  });

  // X labels
  labels.forEach((lbl, i) => {
    const x = pad.left + i * groupW + groupW / 2;
    ctx.fillStyle = '#5C5448';
    ctx.font = '12px Plus Jakarta Sans, sans-serif';
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
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pad = { top:20, right:20, bottom:36, left:62 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const allVals = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allVals) * 1.15;

  // Grid
  ctx.strokeStyle = '#E8E5DF';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#9B9186'; ctx.font = '11px Plus Jakarta Sans, sans-serif'; ctx.textAlign = 'right';
    const val = Math.round(maxVal - (maxVal / 5) * i);
    ctx.fillText((val >= 1000 ? (val/1000).toFixed(1) + 'B' : val + 'M'), pad.left - 8, y + 4);
  }

  const n = labels.length;
  datasets.forEach(ds => {
    const pts = ds.data.map((v, i) => [pad.left + (i / (n - 1)) * chartW, pad.top + (1 - v / maxVal) * chartH]);
    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pad.top + chartH);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(pts[pts.length-1][0], pad.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, ds.color + '30');
    grad.addColorStop(1, ds.color + '00');
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
      ctx.strokeStyle = ds.color; ctx.lineWidth = 2; ctx.stroke();
    });
  });

  labels.forEach((lbl, i) => {
    ctx.fillStyle = '#5C5448'; ctx.font = '12px Plus Jakarta Sans, sans-serif'; ctx.textAlign = 'center';
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
    { data: cashflowData.income,  color: '#0F8B5A', label: 'Pendapatan' },
    { data: cashflowData.expense, color: '#C83232', label: 'Pengeluaran' },
    { data: cashflowData.profit,  color: '#1B4FD8', label: 'Profit' },
  ];
  if (chartType === 'bar') {
    drawBarChart('cashflowChart', cashflowData.labels, datasets);
  } else {
    drawLineChart('cashflowChart', cashflowData.labels, datasets);
  }

  // Profit mini chart (always line)
  drawLineChart('profitMiniChart', cashflowData.labels, [
    { data: cashflowData.profit, color: '#1B4FD8' }
  ]);
}

function drawFinancialChart() {
  const datasets = [
    { data: cashflowData.income,  color: '#0F8B5A' },
    { data: cashflowData.expense, color: '#C83232' },
    { data: cashflowData.profit,  color: '#1B4FD8' },
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
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Simple heatmap-style weekly attendance bars
  const weeks = ['M1','M2','M3','M4'];
  const rates = [94, 97, 91, 96];
  const bW = (W - 80) / 4;
  weeks.forEach((w, i) => {
    const x = 60 + i * bW + bW * 0.2;
    const bw = bW * 0.6;
    const maxH = H - 40;
    const bh = (rates[i] / 100) * maxH;
    const y = H - 24 - bh;
    const color = rates[i] >= 95 ? '#0F8B5A' : rates[i] >= 90 ? '#C87400' : '#C83232';
    ctx.fillStyle = color + '25';
    ctx.beginPath(); ctx.roundRect(x, H - 24 - maxH, bw, maxH, 4); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 4); ctx.fill();
    ctx.fillStyle = '#1A1612'; ctx.font = 'bold 11px Plus Jakarta Sans'; ctx.textAlign = 'center';
    ctx.fillText(rates[i] + '%', x + bw/2, y - 4);
    ctx.fillStyle = '#9B9186'; ctx.font = '11px Plus Jakarta Sans';
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
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const depts = ['Teknologi','Marketing','Operasional','Keu & Admin','SDM'];
  const used  = [142, 78, 95, 52, 38];
  const budget = [160, 100, 90, 70, 50];
  const colors = ['#1B4FD8','#0F8B5A','#C83232','#C87400','#6B3FA0'];

  const bH = (H - 20) / depts.length - 4;
  depts.forEach((d, i) => {
    const y = 10 + i * (bH + 4);
    const maxW = W - 20;
    const usedW = (used[i] / budget[i]) * maxW;

    ctx.fillStyle = colors[i] + '20';
    ctx.beginPath(); ctx.roundRect(0, y, maxW, bH, 3); ctx.fill();
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.roundRect(0, y, Math.min(usedW, maxW), bH, 3); ctx.fill();
    ctx.fillStyle = '#1A1612'; ctx.font = '10px Plus Jakarta Sans'; ctx.textAlign = 'left';
    ctx.fillText(d, 4, y + bH - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${used[i]}M`, maxW - 4, y + bH - 4);
  });
}

// ============================================
// THREE.JS 3D BAR CHART
// ============================================
let autoRotate = true;
let threeState = {};

function init3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container || container._initialized) return;
  container._initialized = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(16, 12, 20);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0x5B9EFF, 1, 50);
  pointLight.position.set(-5, 10, 5);
  scene.add(pointLight);

  // Grid floor
  const gridHelper = new THREE.GridHelper(24, 12, 0x333355, 0x222233);
  scene.add(gridHelper);

  // Data: income, expense, profit
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const income  = [680, 710, 795, 892];
  const expense = [421, 447, 493, 551];
  const profit  = [259, 263, 302, 341];
  const maxVal = 892;

  const barColors = [0x2AE890, 0xFF5A6A, 0x5B9EFF];
  const datasets = [income, expense, profit];
  const offsets = [-2, 0, 2]; // x offset per category

  datasets.forEach((ds, di) => {
    const mat = new THREE.MeshPhongMaterial({ color: barColors[di], shininess: 80 });
    ds.forEach((val, i) => {
      const h = (val / maxVal) * 10;
      const geo = new THREE.BoxGeometry(1.4, h, 1.4);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(offsets[di] + i * 7 - 10.5, h / 2, 0);
      mesh.castShadow = true;
      scene.add(mesh);
    });
  });

  // Labels as simple plane helpers
  const group = new THREE.Group();
  scene.add(group);

  // Mouse orbit
  let isDragging = false, prevX = 0, prevY = 0;
  let rotY = 0.3, rotX = 0.2;

  renderer.domElement.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  renderer.domElement.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('touchend', () => isDragging = false);
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * 0.008;
    rotX += (e.clientY - prevY) * 0.005;
    rotX = Math.max(-0.6, Math.min(0.6, rotX));
    prevX = e.clientX; prevY = e.clientY;
    autoRotate = false;
  });
  renderer.domElement.addEventListener('wheel', e => {
    camera.position.multiplyScalar(1 + e.deltaY * 0.001);
  });

  threeState = { rotY, rotX };

  function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) rotY += 0.004;
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    scene.rotation.y = rotY;
    renderer.render(scene, camera);
  }
  animate();
}

function toggleRotate() {
  autoRotate = !autoRotate;
  showToast(autoRotate ? 'Auto-rotate Aktif' : 'Auto-rotate Berhenti — drag untuk putar manual');
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
      <td style="font-size:0.8rem">${e.title}</td>
      <td style="font-size:0.8rem">${e.dept}</td>
      <td class="mono" style="font-size:0.78rem">Rp ${e.salary.toLocaleString('id-ID')}</td>
      <td><span class="badge badge-${e.status}">${e.status === 'active' ? 'Aktif' : 'Cuti'}</span></td>
      <td style="font-size:0.78rem;color:var(--c-text-3)">${e.joined}</td>
      <td><button class="btn btn-ghost" style="padding:4px 9px;font-size:0.72rem" onclick="showToast('Membuka detail karyawan...')">Detail</button></td>
    </tr>
  `).join('');
}

function filterEmployees(q) {
  renderEmployees(employees.filter(e => e.name.toLowerCase().includes(q.toLowerCase()) || e.dept.toLowerCase().includes(q.toLowerCase())));
}

function renderPayrollSummary() {
  const tbody = document.getElementById('payrollSummaryBody');
  if (!tbody) return;
  tbody.innerHTML = payrollSummary.map(p => `
    <tr>
      <td style="font-size:0.8rem;font-weight:600">${p.name}</td>
      <td class="mono" style="font-size:0.78rem;color:var(--c-green)">Rp ${p.net.toLocaleString('id-ID')}</td>
      <td><span class="badge badge-paid">Lunas</span></td>
    </tr>
  `).join('');
}

// ============================================
// PAYROLL CALCULATOR
// ============================================
function prefillEmployee() {
  const key = document.getElementById('payEmp').value;
  if (!empPayrollData[key]) return;
  const d = empPayrollData[key];
  document.getElementById('payBase').value = d.base;
  document.getElementById('payAllow').value = d.allow;
  document.getElementById('payOTRate').value = d.otRate;
  document.getElementById('payOT').value = '';
  document.getElementById('payBonus').value = '';
  calcPayroll();
}

function calcPayroll() {
  const base   = parseFloat(document.getElementById('payBase').value) || 0;
  const allow  = parseFloat(document.getElementById('payAllow').value) || 0;
  const ot     = parseFloat(document.getElementById('payOT').value) || 0;
  const otRate = parseFloat(document.getElementById('payOTRate').value) || 0;
  const bpjs   = parseFloat(document.getElementById('payBPJS').value) || 0;
  const tax    = parseFloat(document.getElementById('payTax').value) || 0;
  const bonus  = parseFloat(document.getElementById('payBonus').value) || 0;

  const otPay   = ot * otRate;
  const gross   = base + allow + otPay + bonus;
  const bpjsCut = gross * (bpjs / 100);
  const taxCut  = gross * (tax / 100);
  const net     = gross - bpjsCut - taxCut;

  const fmt = v => 'Rp ' + Math.round(v).toLocaleString('id-ID');
  document.getElementById('resBase').textContent  = fmt(base);
  document.getElementById('resAllow').textContent = fmt(allow);
  document.getElementById('resOT').textContent    = fmt(otPay);
  document.getElementById('resBonus').textContent = fmt(bonus);
  document.getElementById('resBPJS').textContent  = '— ' + fmt(bpjsCut);
  document.getElementById('resTax').textContent   = '— ' + fmt(taxCut);
  document.getElementById('resNet').textContent   = fmt(net);
}

// ============================================
// CALENDAR
// ============================================
function buildCalendar() {
  const cal = document.getElementById('calendar');
  if (!cal) return;
  // April 2025 starts on Tuesday (day index 2, 0=Sun)
  const absentDays = [7, 14, 21];
  const weekendDays = [6, 7, 12, 13, 19, 20, 26, 27];
  let html = '';
  for (let blank = 0; blank < 2; blank++) html += '<div></div>'; // April 2025 starts on Tue
  for (let d = 1; d <= 30; d++) {
    const classes = ['cal-day'];
    if (d === 26) classes.push('today');
    const dow = (d + 1) % 7; // rough
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
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(110%)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 2700);
}

function openEmailModal()  { document.getElementById('emailModal').classList.remove('hidden'); }
function closeEmailModal() { document.getElementById('emailModal').classList.add('hidden'); }
function simulateSendEmail() {
  showToast('Mengirim laporan...');
  setTimeout(() => { closeEmailModal(); showToast('✓ Laporan berhasil terkirim!'); }, 1500);
}

// ============================================
// INIT
// ============================================
window.addEventListener('load', () => {
  renderEmployees(employees);
  renderPayrollSummary();
  buildCalendar();
  drawDashboardCharts();
  init3D('cashflow3d'); // mini 3d if any
});

window.addEventListener('resize', () => {
  // Redraw active page charts
  const active = document.querySelector('.page.active');
  if (!active) return;
  if (active.id === 'page-dashboard') drawDashboardCharts();
  if (active.id === 'page-financial') drawFinancialChart();
  if (active.id === 'page-attendance') drawAttendanceChart();
  if (active.id === 'page-budget') drawBudgetChart();
});

// Patch roundRect for older browsers
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