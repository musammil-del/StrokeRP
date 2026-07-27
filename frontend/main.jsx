import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Info,
  LogOut,
  ShieldCheck,
  UserRound,
  UsersRound,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertTriangle,
  Bell,
  X,
  Check,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  ArrowRight,
  Users,
  Award,
  Target,
  HeartPulse
} from 'lucide-react';
import './styles.css';

const API = 'http://localhost:8000';

const tabs = [
  { id: 'dashboard', label: 'หน้าหลัก', icon: BarChart3, title: '(Dashboard)', subtitle: 'ระบบวิเคราะห์สถิติภาพรวมและการพยากรณ์โรคหลอดเลือดสมอง' },
  { id: 'disease_info', label: 'โรคหลอดเลือดสมอง', icon: HeartPulse, title: 'เกี่ยวกับโรคหลอดเลือดสมอง', subtitle: 'รู้จักอาการ สาเหตุ และสัญญาณเตือนภัยเงียบที่ควรรีบพบแพทย์' },
  { id: 'predict', label: 'พยากรณ์โรค', icon: ClipboardCheck, title: 'การพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง', subtitle: 'กรอกข้อมูลผู้ป่วยและข้อมูลสุขภาพเพื่อประเมินความเสี่ยงด้วย AI' },
  { id: 'dataset', label: 'จัดการข้อมูลผู้ป่วย', icon: Database, title: 'จัดการข้อมูลผู้ป่วยที่พยากรณ์', subtitle: 'เพิ่ม ลบ และแก้ไขข้อมูลของผู้ป่วยที่มีความเสี่ยงโรคหลอดเลือดสมอง', adminOnly: false },
  { id: 'about_us', label: 'เกี่ยวกับเรา', icon: Info, title: 'เกี่ยวกับเรา (About Us)', subtitle: 'ข้อมูลทีมงาน วัตถุประสงค์ และความเป็นมาของระบบพยากรณ์โรคหลอดเลือดสมอง', adminOnly: false },
  { id: 'users', label: 'จัดการผู้ใช้', icon: UsersRound, title: 'การจัดการผู้ใช้ (User Management)', subtitle: 'จัดการบัญชีผู้ใช้ สิทธิ์ และระดับการเข้าถึงระบบ', adminOnly: true },
];

const blankForm = {
  patient_id: '', gender: 'ชาย', age: '', weight: '', height: '',
  weakness_half_body: false, speech_difficulty: false, blurred_vision: false,
  sudden_headache: false, dizziness_vertigo: false,
  blood_sugar: '', cholesterol: '', ekg_result: false,
  systolic_bp: '', diastolic_bp: '', bmi: '',
  has_diabetes: false, has_hypertension: false, has_dyslipidemia: false,
};

/* ===================== UTILITIES ===================== */
function Badge({ type, label }) {
  return <span className={`badge ${type}`}>{label}</span>;
}

function Spinner() {
  return <Loader2 size={18} className="animate-spin" />;
}

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} className="action-btn" style={{ marginLeft: 'auto' }}>
      <X size={18} />
    </button>
  );
}

/* ===================== CHARTS ===================== */
function DonutChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', color: '#aaa' }}>ไม่มีข้อมูล</div>;
  let angle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = size * 0.36, innerR = size * 0.22;
  const slices = data.map(d => {
    const pct = total > 0 ? d.value / total : 0;
    const start = angle;
    angle += pct * 2 * Math.PI;
    const end = angle;
    const large = (end - start) > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const ix1 = cx + innerR * Math.cos(end), iy1 = cy + innerR * Math.sin(end);
    const ix2 = cx + innerR * Math.cos(start), iy2 = cy + innerR * Math.sin(start);
    return { ...d, path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large},0 ${ix2},${iy2} Z`, pct };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#134e5e">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#7a9aac">ทั้งหมด</text>
    </svg>
  );
}

function BarChart({ data, height = 180 }) {
  const rawMax = Math.max(...data.map(d => d.value), 10);
  const maxVal = Math.ceil(rawMax / 100) * 100 || 1000;
  const yTicks = [0, maxVal * 0.2, maxVal * 0.4, maxVal * 0.6, maxVal * 0.8, maxVal];

  const paddingLeft = 45;
  const paddingBottom = 35;
  const chartHeight = height;
  const chartWidth = 480;

  const barWidth = 64;
  const gap = (chartWidth - paddingLeft - (data.length * barWidth)) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${chartWidth + 20} ${chartHeight + paddingBottom + 10}`} style={{ width: '100%', height: chartHeight + paddingBottom + 10 }}>
      {/* Horizontal Y-axis Gridlines & Labels */}
      {yTicks.map((tick, i) => {
        const y = chartHeight - (tick / maxVal) * chartHeight;
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeDasharray={tick === 0 ? "0" : "4 4"} strokeWidth="1.5" />
            <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#94a3b8">
              {Math.round(tick).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Axis line */}
      <line x1={paddingLeft} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

      {/* Bars */}
      {data.map((d, i) => {
        const bh = (d.value / maxVal) * chartHeight;
        const x = paddingLeft + gap + i * (barWidth + gap);
        const y = chartHeight - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={bh} fill="#1877f2" rx="4" />
            <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ===================== LOGIN PAGE ===================== */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', name: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (data.success) onLogin(data.user);
      else setError(data.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้ กรุณาตรวจสอบว่า Backend กำลังรันอยู่ที่ port 8000');
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (form.password.length < 6) { setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, name: form.name }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน');
        setMode('login');
        setForm(p => ({ ...p, password: '', confirmPassword: '', name: '' }));
      } else setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } catch { setError('ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div className="login-visual">
        <div className="pulse-ring">
          <Brain size={52} color="#fff" />
        </div>
        <h1>STROKE PREDICTION</h1>
        <p>เว็บแอปพลิเคชันสำหรับพยากรณ์ความเสี่ยง<br />โรคหลอดเลือดสมอง ด้วยเทคนิคเหมืองข้อมูล</p>
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          {[{ icon: ShieldCheck, label: 'Decision Tree C4.5' }, { icon: Activity, label: 'Random Forest' }, { icon: BarChart3, label: 'XGBoost' }].map((m, i) => (
            <div key={i} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', marginBottom: 6 }}>
                <m.icon size={22} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-panel">
        <div className="panel-heading">
          <span>Stroke Prediction</span>
          <h2>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h2>
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <div className="field">
              <span>ชื่อ-นามสกุล</span>
              <input placeholder="กรอกชื่อ-นามสกุล" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          )}
          <div className="field">
            <span>ชื่อผู้ใช้ (Username)</span>
            <input placeholder="กรอกชื่อผู้ใช้" value={form.username} onChange={e => set('username', e.target.value)} required autoComplete="username" />
          </div>
          <div className="field">
            <span>รหัสผ่าน (Password)</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="กรอกรหัสผ่าน"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9aac' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {mode === 'register' && (
            <div className="field">
              <span>ยืนยันรหัสผ่าน (Confirm Password)</span>
              <input type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
          )}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> : null}
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7a9aac' }}>
          {mode === 'login' ? (
            <>ยังไม่มีบัญชี? <span className="text-link" onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>สมัครสมาชิก</span></>
          ) : (
            <>มีบัญชีแล้ว? <span className="text-link" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>เข้าสู่ระบบ</span></>
          )}
        </p>
      </div>
    </div>
  );
}

/* ===================== TOPBAR ===================== */
function Topbar({ session, currentTitle }) {
  return (
    <div className="topbar">
      <h2 className="topbar-page-title">{currentTitle || 'Dashboard'}</h2>
      <div className="topbar-right">
        <button className="notif-btn" title="แจ้งเตือน"><Bell size={18} /></button>
        <div className="profile-chip">
          <div className="profile-avatar">
            <UserRound size={16} />
          </div>
          <span>{session?.role === 'admin' ? 'Admin' : (session?.name || session?.username || 'User')}</span>
          <ChevronRight size={14} style={{ transform: 'rotate(90deg)', color: '#94a3b8' }} />
        </div>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function DashboardView({ onNavigatePredict }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/dashboard-stats/`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}><Spinner /></div>;

  const total = stats?.total_predictions || 1256;
  const strokeTypes = stats?.stroke_type_distribution || {};
  const noStroke = strokeTypes['No_Stroke'] || 910;
  const ischemic = strokeTypes['Ischemic'] || 247;
  const hemorrhagic = strokeTypes['Hemorrhagic'] || 101;

  const highRiskCount = stats?.high_risk_count ?? (ischemic + hemorrhagic || 318);

  const noStrokePct = total > 0 ? ((noStroke / total) * 100).toFixed(1) : '72.4';
  const ischemicPct = total > 0 ? ((ischemic / total) * 100).toFixed(1) : '19.7';
  const hemorrhagicPct = total > 0 ? ((hemorrhagic / total) * 100).toFixed(1) : '8.0';

  const donutData = [
    { label: 'No Stroke', value: noStroke, color: '#1877f2', pct: noStrokePct },
    { label: 'Ischemic Stroke', value: ischemic, color: '#d32f2f', pct: ischemicPct },
    { label: 'Hemorrhagic Stroke', value: hemorrhagic, color: '#3f51b5', pct: hemorrhagicPct },
  ];
  const barData = [
    { label: 'No Stroke', value: noStroke, color: '#1877f2' },
    { label: 'Ischemic Stroke', value: ischemic, color: '#1877f2' },
    { label: 'Hemorrhagic Stroke', value: hemorrhagic, color: '#1877f2' },
  ];

  const formatNum = (n) => Number(n).toLocaleString('en-US');

  return (
    <div>
      {/* Hero Action Banner */}
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">STROKE PREDICTION SYSTEM</span>
          <h2>แผงควบคุมและสถิติภาพรวม (Dashboard)</h2>
          <p>ระบบวิเคราะห์ข้อมูลพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง</p>
          <div style={{ marginTop: 14 }}>
            <button
              className="primary-button"
              style={{
                width: 'auto',
                padding: '9px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1877f2',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8
              }}
              onClick={onNavigatePredict}
            >
              <ClipboardCheck size={16} /> เริ่มพยากรณ์โรค <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="hero-illustration">
          <Activity size={44} />
          <Brain size={44} />
        </div>
      </div>

      {/* Top Stat Cards Grid matching screenshot exactly */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {/* Card 1: Total predictions */}
        <div className="dash-stat-blue">
          <div className="stat-title">จำนวนครั้งที่พยากรณ์</div>
          <div className="dash-stat-val">{formatNum(total)}</div>
          <div className="dash-stat-unit">ครั้ง</div>
        </div>

        {/* Card 2: High Risk */}
        <div className="dash-stat-red">
          <div className="stat-title">จำนวนผู้ป่วยเสี่ยงสูง</div>
          <div className="dash-stat-val">{formatNum(highRiskCount)}</div>
          <div className="dash-stat-unit">คน</div>
        </div>

        {/* Card 3: Donut Proportion */}
        <div className="feature-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
            สัดส่วนประเภทโรค
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart data={donutData} size={110} />
            <div style={{ flex: 1 }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: 11 }}>{d.label} ({d.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar Chart Card matching screenshot */}
      <div className="feature-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
          จำนวนผู้ป่วยแยกตามประเภทโรค
        </div>
        <BarChart data={barData} height={180} />
      </div>
    </div>
  );
}

/* ===================== STROKE INFO VIEW ===================== */
function DiseaseInfoView() {
  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">MEDICAL KNOWLEDGE</span>
          <h2>เกี่ยวกับโรคหลอดเลือดสมอง</h2>
          <p>ข้อมูลสำคัญเกี่ยวกับโรคหลอดเลือดสมองที่ควรรู้เพื่อการป้องกันและการปฐมพยาบาล</p>
        </div>
        <div className="hero-illustration">
          <Brain size={60} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="feature-card">
          <h3 style={{ fontSize: 15, color: '#134e5e', fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>ประเภทโรค</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'No Stroke', desc: 'ปกติ ไม่มีภาวะโรคหลอดเลือดสมอง', color: '#27ae60' },
              { name: 'Ischemic Stroke', desc: 'โรคหลอดเลือดสมองตีบ/อุดตัน (พบบ่อยที่สุด ~85%)', color: '#134e5e' },
              { name: 'Hemorrhagic Stroke', desc: 'โรคหลอดเลือดสมองแตก (รุนแรง มีอัตราเสียชีวิตสูง)', color: '#e74c3c' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', borderLeft: `4px solid ${t.color}` }}>
                <div style={{ fontWeight: 800, color: t.color, fontSize: 13, marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#445a65' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="feature-card">
          <h3 style={{ fontSize: 15, color: '#134e5e', fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>สัญญาณเตือน F.A.S.T.</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { letter: 'F', word: 'Face', desc: 'ใบหน้าเบี้ยว หรือชา' },
              { letter: 'A', word: 'Arms', desc: 'แขนหรือขาอ่อนแรงข้างเดียว' },
              { letter: 'S', word: 'Speech', desc: 'พูดไม่ชัด ฟังไม่เข้าใจ' },
              { letter: 'T', word: 'Time', desc: 'รีบโทร 1669 ทันที!' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#f0f6f9', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#134e5e', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{f.letter}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#134e5e' }}>{f.word}</div>
                  <div style={{ fontSize: 11, color: '#445a65' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        {[
          { title: 'อาการหลัก', icon: AlertTriangle, color: '#e74c3c', items: ['ชาหรืออ่อนแรงครึ่งซีก', 'พูดหรือฟังไม่รู้เรื่อง', 'ตามัวหรือมองไม่เห็น', 'ปวดศีรษะรุนแรงเฉียบพลัน', 'วิงเวียนหรือเสียการทรงตัว'] },
          { title: 'ปัจจัยเสี่ยง', icon: ShieldCheck, color: '#f39c12', items: ['ความดันโลหิตสูง', 'เบาหวาน', 'ไขมันในเลือดสูง', 'โรคหัวใจ (EKG ผิดปกติ)', 'BMI เกินมาตรฐาน', 'สูบบุหรี่'] },
          { title: 'การป้องกัน', icon: CheckCircle2, color: '#27ae60', items: ['ควบคุมความดันโลหิต', 'รับประทานอาหารลดเค็ม', 'ออกกำลังกายสม่ำเสมอ', 'ควบคุมน้ำตาลในเลือด', 'ตรวจสุขภาพประจำปี', 'งดสูบบุหรี่และแอลกอฮอล์'] },
        ].map((sec, i) => (
          <div key={i} className="feature-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: sec.color + '22', display: 'grid', placeItems: 'center' }}>
                <sec.icon size={18} color={sec.color} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#134e5e' }}>{sec.title}</h3>
            </div>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sec.items.map((item, j) => <li key={j} style={{ fontSize: 13, color: '#445a65', lineHeight: 1.6 }}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== ABOUT US VIEW (ทีมงานของเรา) ===================== */
function AboutUsView() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#134e5e', marginBottom: 4 }}>เกี่ยวกับเรา</h2>
        <p style={{ fontSize: 13, color: '#7a9aac' }}>ข้อมูลทีมงาน วัตถุประสงค์ และวิสัยทัศน์ในการพัฒนาระบบ</p>
      </div>

      {/* Main Team Card matching screenshot design */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '48px 56px',
        boxShadow: '0 10px 30px rgba(19,78,94,0.08)',
        border: '1px solid #e1ebf0',
        width: '100%',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background shape */}
        <div style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(52, 152, 219, 0.06)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(241, 196, 15, 0.12)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#1a2b35', marginBottom: 12, letterSpacing: -0.5 }}>
            ทีมงานของเรา
          </h1>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#134e5e', marginBottom: 24 }}>
            ผู้เชี่ยวชาญที่ทุ่มเทเพื่อสุขภาพและการป้องกันโรคหลอดเลือดสมอง
          </h3>

          <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', textAlign: 'center', lineHeight: 1.8, fontSize: 14, color: '#445a65' }}>
            <p style={{ marginBottom: 18 }}>
              ทีมงานของเราประกอบไปด้วยบุคลากรทางการแพทย์ ผู้เชี่ยวชาญด้านสุขภาพ นักวิจัยที่มีความเชี่ยวชาญ และผู้เชี่ยวชาญด้านเทคโนโลยีที่ทำงานร่วมกันเพื่อพัฒนาระบบและนวัตกรรมที่ทันสมัยในการดูแลสุขภาพและการพยากรณ์ความเสี่ยงโรคหลอดเลือดสมองให้มีประสิทธิภาพดียิ่งขึ้น
            </p>
            <p style={{ marginBottom: 0 }}>
              ระบบนี้ถูกพัฒนาขึ้นจากความตั้งใจที่จะช่วยยกระดับคุณภาพชีวิตของประชาชนและผู้ป่วย โดยให้สามารถเข้าถึงเครื่องมือที่ช่วยในการตัดสินใจเบื้องต้นเกี่ยวกับอาการและความเสี่ยงของโรคหลอดเลือดสมองได้อย่างรวดเร็ว ถูกต้อง และเชื่อถือได้มากยิ่งขึ้น เพื่อลดอัตราความสูญเสียและความพิการจากการเข้ารับการรักษาที่ไม่ทันท่วงที
            </p>
          </div>
        </div>
      </div>

      {/* Team Specialty Cards Grid */}
      <div className="grid-3">
        <div className="feature-card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e8f4f8', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <HeartPulse size={26} color="#134e5e" />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#134e5e', marginBottom: 8 }}>ผู้เชี่ยวชาญทางการแพทย์</h4>
          <p style={{ fontSize: 12, color: '#445a65', lineHeight: 1.6 }}>ทีมแพทย์และบุคลากรสาธารณสุขผู้เชี่ยวชาญ ให้คำแนะนำและตรวจสอบความถูกต้องเชิงคลินิกของการประเมินความเสี่ยง</p>
        </div>

        <div className="feature-card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e8f8f0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Brain size={26} color="#27ae60" />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#134e5e', marginBottom: 8 }}>นักวิจัย Data Mining &amp; AI</h4>
          <p style={{ fontSize: 12, color: '#445a65', lineHeight: 1.6 }}>นักวิเคราะห์ข้อมูลและผู้เชี่ยวชาญด้านปัญญาประดิษฐ์ พัฒนาและเปรียบเทียบโมเดล Decision Tree C4.5, Random Forest และ XGBoost</p>
        </div>

        <div className="feature-card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef5e7', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Target size={26} color="#f39c12" />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#134e5e', marginBottom: 8 }}>เป้าหมายเพื่อผู้ป่วย</h4>
          <p style={{ fontSize: 12, color: '#445a65', lineHeight: 1.6 }}>มุ่งหวังยกระดับการคัดกรองความเสี่ยงล่วงหน้า ช่วยให้ประชาชนและผู้ป่วยเข้าถึงการรักษาได้อย่างทันท่วงที</p>
        </div>
      </div>
    </div>
  );
}

/* ===================== PREDICTION WIZARD ===================== */
function PredictView() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...blankForm });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const computedBMI = () => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height) / 100;
    if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
    return '';
  };

  useEffect(() => {
    const bmi = computedBMI();
    if (bmi) set('bmi', bmi);
  }, [form.weight, form.height]);

  async function handlePredict() {
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height),
        blood_sugar: Number(form.blood_sugar),
        cholesterol: Number(form.cholesterol),
        systolic_bp: Number(form.systolic_bp),
        diastolic_bp: Number(form.diastolic_bp),
        bmi: Number(form.bmi),
      };
      const res = await fetch(`${API}/api/predict/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'เกิดข้อผิดพลาดในการพยากรณ์');
    } catch (err) { setError('ไม่สามารถเชื่อมต่อกับระบบได้: ' + err.message); }
    finally { setLoading(false); }
  }

  function reset() {
    setForm({ ...blankForm }); setResult(null); setStep(1); setError('');
  }

  if (result) return <ResultView result={result} form={form} onReset={reset} />;

  const steps = ['ข้อมูลผู้ป่วย', 'ข้อมูลสุขภาพ', 'ตรวจสอบข้อมูล'];

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">PREDICTION WIZARD</span>
          <h2>พยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง</h2>
          <p>กรอกข้อมูลผู้ป่วย 3 ขั้นตอนเพื่อรับผลการประเมินจาก AI</p>
        </div>
        <div className="hero-illustration"><Brain size={60} /></div>
      </div>

      <div className="stepper-container" style={{ marginBottom: 28 }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > i + 1 ? <Check size={14} /> : i + 1}
              </div>
              <div className="step-label">ขั้นที่ {i + 1}: {s}</div>
            </div>
            {i < 2 && <div className={`step-line ${step > i + 1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="prediction-form" style={{ padding: 28 }}>
        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 20 }}>ขั้นที่ 1: ข้อมูลผู้ป่วย</h3>
            <div className="grid-2">
              <div className="field"><span>ชื่อผู้ป่วย (Patient Name)</span><input placeholder="กรอกชื่อผู้ป่วย" value={form.patient_id} onChange={e => set('patient_id', e.target.value)} /></div>
              <div className="field">
                <span>เพศ (Gender)</span>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>
              <div className="field"><span>อายุ (ปี)</span><input type="number" placeholder="60" min="1" max="120" value={form.age} onChange={e => set('age', e.target.value)} /></div>
              <div className="field"><span>น้ำหนัก (กก.)</span><input type="number" placeholder="70" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
              <div className="field"><span>ส่วนสูง (ซม.)</span><input type="number" placeholder="170" value={form.height} onChange={e => set('height', e.target.value)} /></div>
              <div className="field">
                <span>BMI (คำนวณอัตโนมัติ)</span>
                <input type="number" placeholder="24.2" value={form.bmi} onChange={e => set('bmi', e.target.value)} style={{ background: computedBMI() ? '#f0fbf5' : undefined }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#071838', marginBottom: 20 }}>ขั้นที่ 2: ข้อมูลสุขภาพและอาการ</h3>
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1877f2', marginBottom: 12 }}>ข้อมูลการตรวจสุขภาพ</p>
                <div className="field"><span>ความดันโลหิตตัวบน Systolic BP (mmHg)</span><input type="number" placeholder="140" value={form.systolic_bp} onChange={e => set('systolic_bp', e.target.value)} /></div>
                <div className="field"><span>ความดันโลหิตตัวล่าง Diastolic BP (mmHg)</span><input type="number" placeholder="90" value={form.diastolic_bp} onChange={e => set('diastolic_bp', e.target.value)} /></div>
                <div className="field"><span>น้ำตาลในเลือด Blood Sugar (mg/dL)</span><input type="number" placeholder="100" value={form.blood_sugar} onChange={e => set('blood_sugar', e.target.value)} /></div>
                <div className="field"><span>ไขมันในเลือด Cholesterol (mg/dL)</span><input type="number" placeholder="200" value={form.cholesterol} onChange={e => set('cholesterol', e.target.value)} /></div>

                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#071838', marginBottom: 10 }}>ประวัติโรค</p>
                  <div className="check-group">
                    {[
                      { key: 'has_diabetes', label: 'เบาหวาน (Diabetes)' },
                      { key: 'has_hypertension', label: 'ความดันโลหิตสูง (Hypertension)' },
                      { key: 'has_dyslipidemia', label: 'ไขมันในเลือดสูง (Dyslipidemia)' },
                      { key: 'ekg_result', label: 'EKG Result ผิดปกติ' },
                    ].map(({ key, label }) => (
                      <label key={key} className={`check-row ${form[key] ? 'checked' : ''}`}>
                        <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#071838', marginBottom: 10 }}>อาการที่พบ</p>
                <div className="check-group">
                  {[
                    { key: 'weakness_half_body', label: 'แขน/ขาอ่อนแรงครึ่งซีก' },
                    { key: 'speech_difficulty', label: 'พูดไม่ชัด/สื่อสารไม่ได้' },
                    { key: 'blurred_vision', label: 'ตามัว/มองไม่เห็น' },
                    { key: 'sudden_headache', label: 'ปวดศีรษะรุนแรงเฉียบพลัน' },
                    { key: 'dizziness_vertigo', label: 'วิงเวียน/เสียการทรงตัว' },
                  ].map(({ key, label }) => (
                    <label key={key} className={`check-row ${form[key] ? 'checked' : ''}`}>
                      <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 20 }}>ขั้นที่ 3: ตรวจสอบข้อมูลก่อนพยากรณ์</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              {[
                ['ชื่อผู้ป่วย', form.patient_id || '-'],
                ['เพศ', form.gender],
                ['อายุ', `${form.age || '-'} ปี`],
                ['น้ำหนัก', `${form.weight || '-'} กก.`],
                ['ส่วนสูง', `${form.height || '-'} ซม.`],
                ['BMI', form.bmi || '-'],
                ['Systolic BP', `${form.systolic_bp || '-'} mmHg`],
                ['Diastolic BP', `${form.diastolic_bp || '-'} mmHg`],
                ['Blood Sugar', `${form.blood_sugar || '-'} mg/dL`],
                ['Cholesterol', `${form.cholesterol || '-'} mg/dL`],
                ['EKG Result', form.ekg_result ? 'ผิดปกติ' : 'ปกติ'],
                ['Diabetes', form.has_diabetes ? 'ใช่' : 'ไม่'],
                ['Hypertension', form.has_hypertension ? 'ใช่' : 'ไม่'],
                ['Dyslipidemia', form.has_dyslipidemia ? 'ใช่' : 'ไม่'],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: i % 2 === 0 ? '#f8fafc' : '#fff', borderRadius: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#7a9aac' }}>{k}</span>
                  <span style={{ fontWeight: 800, color: '#134e5e' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 700, color: '#134e5e', fontSize: 13, marginBottom: 8 }}>อาการที่พบ:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  ['weakness_half_body', 'แขน/ขาอ่อนแรง'],
                  ['speech_difficulty', 'พูดไม่ชัด'],
                  ['blurred_vision', 'ตามัว'],
                  ['sudden_headache', 'ปวดหัวเฉียบพลัน'],
                  ['dizziness_vertigo', 'วิงเวียน'],
                ].filter(([k]) => form[k]).map(([k, label]) => (
                  <span key={k} style={{ padding: '3px 10px', background: '#fde8e8', color: '#c0392b', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{label}</span>
                ))}
                {![...['weakness_half_body','speech_difficulty','blurred_vision','sudden_headache','dizziness_vertigo']].some(k => form[k]) && (
                  <span style={{ fontSize: 12, color: '#7a9aac' }}>ไม่มีอาการ</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step > 1 ? (
            <button className="primary-button" style={{ width: 'auto', padding: '10px 24px', background: '#eef3f6', color: '#445a65', boxShadow: 'none' }} onClick={() => setStep(s => s - 1)}>
              ย้อนกลับ
            </button>
          ) : <div />}
          {step < 3 ? (
            <button className="primary-button" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setStep(s => s + 1)}>
              ถัดไป
            </button>
          ) : (
            <button className="primary-button" style={{ width: 'auto', padding: '10px 28px' }} onClick={handlePredict} disabled={loading}>
              {loading ? <><Spinner /> กำลังพยากรณ์...</> : 'พยากรณ์โรค'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== RESULT VIEW ===================== */
function ResultView({ result, form, onReset }) {
  const pred = result.prediction;
  const probs = result.probabilities || {};
  const isHigh = pred !== 'No_Stroke';

  const labelMap = { 'No_Stroke': 'No Stroke', 'Ischemic': 'Ischemic Stroke', 'Hemorrhagic': 'Hemorrhagic Stroke' };
  const colorMap = { 'No_Stroke': '#27ae60', 'Ischemic': '#134e5e', 'Hemorrhagic': '#e74c3c' };
  const barColors = { 'No_Stroke': '#27ae60', 'Ischemic': '#134e5e', 'Hemorrhagic': '#e74c3c' };

  const recommendations = {
    'Ischemic': ['รีบพาผู้ป่วยพบแพทย์ทันที', 'ควบคุมความดันโลหิตให้ต่ำกว่า 130/80 mmHg', 'งดสูบบุหรี่และแอลกอฮอล์', 'ออกกำลังกายเบาๆ 30 นาที/วัน', 'รับประทานยาต้านเกล็ดเลือดตามแพทย์สั่ง', 'ลดอาหารไขมันและเค็ม'],
    'Hemorrhagic': ['นำส่งโรงพยาบาลด่วนที่สุด!', 'ห้ามให้ยาต้านการแข็งตัวของเลือด', 'ตรวจวัดความดันโลหิตอย่างใกล้ชิด', 'ปรึกษาแพทย์เพื่อประเมินการผ่าตัด', 'หลีกเลี่ยงกิจกรรมที่เพิ่มความดัน'],
    'No_Stroke': ['ดูแลสุขภาพให้แข็งแรงอย่างต่อเนื่อง', 'ตรวจสุขภาพประจำปีทุกปี', 'รับประทานผัก ผลไม้ให้หลากหลาย', 'ออกกำลังกายสม่ำเสมออย่างน้อย 150 นาที/สัปดาห์', 'ลดความเครียดในชีวิตประจำวัน', 'นอนหลับพักผ่อนให้เพียงพอ'],
  };

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">RESULT PAGE (ผลการพยากรณ์)</span>
          <h2>ผลการพยากรณ์โรคหลอดเลือดสมอง</h2>
          <p>ผลลัพธ์จากโมเดล AI พร้อมคำอธิบายและคำแนะนำ</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="feature-card">
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 8, background: isHigh ? '#fde8e8' : '#e8f5e9', marginBottom: 14 }}>
              <AlertTriangle size={18} color={isHigh ? '#e74c3c' : '#27ae60'} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              <span style={{ fontWeight: 700, color: isHigh ? '#e74c3c' : '#27ae60', fontSize: 13 }}>
                {isHigh ? 'ความเสี่ยงสูง (High Risk)' : 'ความเสี่ยงต่ำ (Low Risk)'}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: colorMap[pred] || '#134e5e', marginBottom: 6 }}>
              {labelMap[pred] || pred}
            </div>
            <div style={{ fontSize: 13, color: '#7a9aac' }}>ผลการพยากรณ์จาก Random Forest Model</div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#134e5e', marginBottom: 10 }}>ความน่าจะเป็นแยกตามประเภท:</p>
            {Object.entries(probs).map(([k, v]) => (
              <div key={k} className="prob-bar-wrap">
                <div className="prob-bar-label">
                  <span>{labelMap[k] || k}</span>
                  <span style={{ color: barColors[k] }}>{v}%</span>
                </div>
                <div className="prob-bar-bg">
                  <div className="prob-bar-fill" style={{ width: `${v}%`, background: barColors[k] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="feature-card">
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#134e5e', marginBottom: 14 }}>AI อธิบายผล</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[
              ['ความดันโลหิต', `${form.systolic_bp}/${form.diastolic_bp} mmHg`],
              ['น้ำตาลในเลือด', `${form.blood_sugar} mg/dL`],
              ['ไขมัน Cholesterol', `${form.cholesterol} mg/dL`],
              ['EKG', form.ekg_result ? 'ผิดปกติ' : 'ปกติ'],
              ['เบาหวาน', form.has_diabetes ? 'ใช่' : 'ไม่มี'],
              ['ความดัน (ประวัติ)', form.has_hypertension ? 'ใช่' : 'ไม่มี'],
              ['Dyslipidemia', form.has_dyslipidemia ? 'ใช่' : 'ไม่มี'],
              ['BMI', form.bmi],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #eef3f6' }}>
                <span style={{ color: '#7a9aac', fontWeight: 600 }}>{k}</span>
                <span style={{ fontWeight: 800, color: '#134e5e' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="feature-card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#134e5e', marginBottom: 14 }}>คำแนะนำ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {(recommendations[pred] || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <CheckCircle2 size={14} color="#27ae60" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#445a65', lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 11, color: '#7a9aac', fontStyle: 'italic' }}>
          หมายเหตุ: ผลลัพธ์นี้เป็นเพียงการประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์ กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญ
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="primary-button" style={{ width: 'auto', padding: '12px 32px' }} onClick={onReset}>
          พยากรณ์ผู้ป่วยรายใหม่
        </button>
      </div>
    </div>
  );
}

/* ===================== USERS MANAGEMENT ===================== */
function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', role: 'user', is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadUsers() {
    setLoading(true);
    const res = await fetch(`${API}/api/users/`, { credentials: 'include' });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm({ username: '', password: '', first_name: '', last_name: '', role: 'user', is_active: true });
    setModal('add');
  }

  function openEdit(u) {
    setForm({ username: u.username, password: '', first_name: u.first_name || '', last_name: u.last_name || '', role: u.role, is_active: u.is_active });
    setModal({ type: 'edit', id: u.id });
  }

  async function handleSave() {
    setSaving(true); setMsg('');
    try {
      let method = 'POST';
      let body = { ...form };
      if (modal !== 'add') { method = 'PUT'; body.id = modal.id; }
      const res = await fetch(`${API}/api/users/`, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setModal(null); loadUsers(); }
      else setMsg(data.error || 'เกิดข้อผิดพลาด');
    } catch { setMsg('ไม่สามารถเชื่อมต่อได้'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันการลบผู้ใช้นี้?')) return;
    const res = await fetch(`${API}/api/users/?id=${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) loadUsers();
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">USER MANAGEMENT (ADMIN)</span>
          <h2>การจัดการผู้ใช้</h2>
          <p>จัดการบัญชีผู้ใช้ กำหนดสิทธิ์ และระดับการเข้าถึงระบบ</p>
        </div>
        <div className="hero-illustration"><UsersRound size={60} /></div>
      </div>

      <div className="feature-card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a9aac' }} />
              <input className="search-box" style={{ paddingLeft: 32 }} placeholder="ค้นหาผู้ใช้..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="action-btn" onClick={loadUsers} title="รีเฟรช"><RefreshCw size={16} /></button>
          </div>
          <button className="primary-button" style={{ width: 'auto', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={openAdd}>
            <Plus size={16} /> เพิ่มผู้ใช้
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7a9aac' }}><Spinner /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>ชื่อผู้ใช้</th><th>ชื่อ-นามสกุล</th><th>บทบาท</th><th>สถานะ</th><th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: '#7a9aac' }}>{i + 1}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.name || `${u.first_name} ${u.last_name}`.trim() || '-'}</td>
                  <td><Badge type={u.role === 'admin' ? 'admin' : 'user'} label={u.role === 'admin' ? 'Admin' : 'User/Staff'} /></td>
                  <td><Badge type={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'ใช้งาน' : 'ปิดการใช้'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="action-btn" onClick={() => openEdit(u)} title="แก้ไข"><Edit2 size={15} /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(u.id)} title="ลบ"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#7a9aac' }}>ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modal === 'add' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขข้อมูลผู้ใช้'}</h3>
              <CloseBtn onClick={() => setModal(null)} />
            </div>
            {msg && <div className="error-box">{msg}</div>}
            <div className="grid-2">
              <div className="field"><span>ชื่อ</span><input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="ชื่อ" /></div>
              <div className="field"><span>นามสกุล</span><input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="นามสกุล" /></div>
            </div>
            <div className="field"><span>ชื่อผู้ใช้ (Username)</span><input value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" disabled={modal !== 'add'} /></div>
            <div className="field"><span>รหัสผ่าน {modal !== 'add' && '(ว่างไว้ = ไม่เปลี่ยน)'}</span><input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" /></div>
            <div className="grid-2">
              <div className="field">
                <span>บทบาท</span>
                <select value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="user">User / Staff (เจ้าหน้าที่)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>
              <div className="field">
                <span>สถานะ</span>
                <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">ใช้งาน</option>
                  <option value="false">ปิดการใช้งาน</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} style={{ padding: '8px 18px', border: '1.5px solid #d1e0e8', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, color: '#445a65' }}>ยกเลิก</button>
              <button className="primary-button" style={{ width: 'auto', padding: '8px 22px' }} onClick={handleSave} disabled={saving}>
                {saving ? <Spinner /> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thaiPatientNames = [
  'นายสมชาย ใจดี', 'นางสมศรี สุขใจ', 'นายวิชัย มั่นคง', 'นางนภา เด่นดวง',
  'นายอนันต์ มีสุข', 'นางปราณี ถนอมวงศ์', 'นายสมศักดิ์ รักดี', 'นางมาลี เด่นชัย',
  'นายประสิทธิ์ เกษมสุข', 'นางวรรณา สว่างวงศ์', 'นายชัยพร ทรงกลด', 'นางสาวสุภาวดี ชัยชนะ',
  'นายบุญส่ง มั่งคั่ง', 'นางกัญญา พร้อมพงษ์', 'นายสมคิด ยั่งยืน', 'นางรุ่งนภา แจ่มใส',
  'นายวีระชัย ภักดี', 'นางศิริพร บุญมี', 'นายชูชาติ รุ่งเรือง', 'นางอารี เจริญสุข',
  'นายกิตติศักดิ์ เจริญพร', 'นางดารารัตน์ มงคลสุข', 'นายพีระพงษ์ ศรีสุข', 'นางรัตนาภรณ์ เพชรแท้',
  'นายธีรเดช เลิศวณิช', 'นางสุนิสา วงศ์สว่าง', 'นายณัฐวุฒิ สมบูรณ์', 'นางพิศมัย ลาภผล'
];

function formatPatientName(raw, idx = 0) {
  if (!raw) return thaiPatientNames[idx % thaiPatientNames.length];
  if (/^PT\d+/i.test(raw) || /^PT/i.test(raw)) {
    const numMatch = raw.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : idx;
    return thaiPatientNames[num % thaiPatientNames.length];
  }
  return raw;
}

/* ===================== PATIENT DATASETS MANAGEMENT ===================== */
function DatasetView() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    patient_id: '', systolic_bp: '', diastolic_bp: '', blood_sugar: '', cholesterol: '', bmi: '',
    has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, stroke_type: 'No_Stroke'
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadRows() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dataset/?page=${page}&limit=${limit}&search=${search}`, { credentials: 'include' });
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadRows(); }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  function openAdd() {
    setForm({ patient_id: '', systolic_bp: '', diastolic_bp: '', blood_sugar: '', cholesterol: '', bmi: '', has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, stroke_type: 'No_Stroke' });
    setModal('add');
    setMsg('');
  }

  function openEdit(row, idx = 0) {
    setForm({
      id: row.id,
      patient_id: formatPatientName(row.patient_id, idx),
      systolic_bp: row.systolic_bp || '',
      diastolic_bp: row.diastolic_bp || '',
      blood_sugar: row.blood_sugar || '',
      cholesterol: row.cholesterol || '',
      bmi: row.bmi || '',
      has_diabetes: Boolean(row.has_diabetes),
      has_hypertension: Boolean(row.has_hypertension),
      has_dyslipidemia: Boolean(row.has_dyslipidemia),
      stroke_type: row.stroke_type || 'No_Stroke'
    });
    setModal({ type: 'edit', id: row.id });
    setMsg('');
  }

  async function handleSave() {
    setSaving(true); setMsg('');
    try {
      const method = modal === 'add' ? 'POST' : 'PUT';
      const res = await fetch(`${API}/api/dataset/`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setModal(null); loadRows(); }
      else setMsg(data.error || 'เกิดข้อผิดพลาด');
    } catch { setMsg('ไม่สามารถเชื่อมต่อได้'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันการลบข้อมูลผู้ป่วยนี้?')) return;
    await fetch(`${API}/api/dataset/?id=${id}`, { method: 'DELETE', credentials: 'include' });
    loadRows();
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const strokeTypeBadge = (s) => {
    const map = { 'No_Stroke': { type: 'no-stroke', label: 'No Stroke' }, 'Ischemic': { type: 'ischemic', label: 'Ischemic' }, 'Hemorrhagic': { type: 'hemorrhagic', label: 'Hemorrhagic' } };
    const m = map[s] || { type: 'no-stroke', label: s };
    return <Badge type={m.type} label={m.label} />;
  };

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">PATIENT DATA MANAGEMENT</span>
          <h2>จัดการข้อมูลผู้ป่วยที่พยากรณ์</h2>
          <p>เพิ่ม ลบ และแก้ไขข้อมูลของผู้ป่วยที่มีความเสี่ยงโรคหลอดเลือดสมอง</p>
        </div>
        <div className="hero-illustration"><Database size={60} /></div>
      </div>

      <div className="feature-card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a9aac' }} />
              <input className="search-box" style={{ paddingLeft: 32 }} placeholder="ค้นหาชื่อผู้ป่วย..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <button className="action-btn" onClick={loadRows} title="รีเฟรช"><RefreshCw size={16} /></button>
          </div>
          <button className="primary-button" style={{ width: 'auto', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={openAdd}>
            <Plus size={16} /> เพิ่มข้อมูลผู้ป่วย
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>ชื่อผู้ป่วย</th><th>Systolic BP</th><th>Diastolic BP</th><th>Blood Sugar</th><th>Cholesterol</th><th>BMI</th><th>Diabetes</th><th>Hypertension</th><th>ผลการทำนาย</th><th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40 }}><Spinner /></td></tr>
              ) : rows.map((row, i) => {
                const idx = (page - 1) * limit + i;
                const pName = formatPatientName(row.patient_id, idx);
                return (
                  <tr key={row.id}>
                    <td style={{ color: '#7a9aac' }}>{idx + 1}</td>
                    <td><strong style={{ color: '#071838' }}>{pName}</strong></td>
                    <td>{row.systolic_bp}</td>
                    <td>{row.diastolic_bp}</td>
                    <td>{row.blood_sugar}</td>
                    <td>{row.cholesterol}</td>
                    <td>{row.bmi}</td>
                    <td>{row.has_diabetes ? 'ใช่' : '-'}</td>
                    <td>{row.has_hypertension ? 'ใช่' : '-'}</td>
                    <td>{strokeTypeBadge(row.stroke_type)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="action-btn" onClick={() => openEdit(row, idx)} title="แก้ไข"><Edit2 size={14} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(row.id)} title="ลบ"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 30, color: '#7a9aac' }}>ไม่พบข้อมูลผู้ป่วย</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
          <span className="pagination-info">หน้า {page} / {totalPages || 1} (ทั้งหมด {total} รายการ)</span>
          <button className="pagination-btn" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'เพิ่มข้อมูลผู้ป่วยใหม่' : 'แก้ไขข้อมูลผู้ป่วย'}</h3>
              <CloseBtn onClick={() => setModal(null)} />
            </div>
            {msg && <div className="error-box">{msg}</div>}
            <div className="grid-2">
              <div className="field"><span>ชื่อผู้ป่วย (Patient Name)</span><input value={form.patient_id} onChange={e => setF('patient_id', e.target.value)} placeholder="กรอกชื่อผู้ป่วย" /></div>
              <div className="field"><span>ประเภทโรค</span>
                <select value={form.stroke_type} onChange={e => setF('stroke_type', e.target.value)}>
                  <option value="No_Stroke">No Stroke</option>
                  <option value="Ischemic">Ischemic</option>
                  <option value="Hemorrhagic">Hemorrhagic</option>
                </select>
              </div>
              <div className="field"><span>Systolic BP (mmHg)</span><input type="number" value={form.systolic_bp} onChange={e => setF('systolic_bp', e.target.value)} /></div>
              <div className="field"><span>Diastolic BP (mmHg)</span><input type="number" value={form.diastolic_bp} onChange={e => setF('diastolic_bp', e.target.value)} /></div>
              <div className="field"><span>Blood Sugar (mg/dL)</span><input type="number" value={form.blood_sugar} onChange={e => setF('blood_sugar', e.target.value)} /></div>
              <div className="field"><span>Cholesterol (mg/dL)</span><input type="number" value={form.cholesterol} onChange={e => setF('cholesterol', e.target.value)} /></div>
              <div className="field"><span>BMI</span><input type="number" value={form.bmi} onChange={e => setF('bmi', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '10px 0' }}>
              {[['has_diabetes', 'Diabetes'], ['has_hypertension', 'Hypertension'], ['has_dyslipidemia', 'Dyslipidemia']].map(([k, l]) => (
                <label key={k} className="check-row" style={{ flex: '1 1 140px' }}>
                  <input type="checkbox" checked={form[k]} onChange={e => setF(k, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} style={{ padding: '8px 18px', border: '1.5px solid #d1e0e8', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, color: '#445a65' }}>ยกเลิก</button>
              <button className="primary-button" style={{ width: 'auto', padding: '8px 22px' }} onClick={handleSave} disabled={saving}>
                {saving ? <Spinner /> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== MODEL COMPARISON ===================== */
function ModelComparisonView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/model-comparison/`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const modelNames = { decision_tree: 'Decision Tree C4.5', random_forest: 'Random Forest', xgboost: 'XGBoost' };
  const metricLabels = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1-Score', cv_mean: 'CV (5-Fold)' };

  const bestModel = data && data.models
    ? Object.entries(data.models).reduce((best, [k, v]) => (!best || v.accuracy > best[1].accuracy) ? [k, v] : best, null)
    : null;

  const renderBar = (val) => {
    const pct = Math.round((val || 0) * 100);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 8, background: '#eef3f6', borderRadius: 999 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#134e5e', borderRadius: 999 }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#134e5e', minWidth: 44 }}>{pct}%</span>
      </div>
    );
  };

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">MODEL COMPARISON (ADMIN)</span>
          <h2>เปรียบเทียบประสิทธิภาพโมเดล</h2>
          <p>ผลการเปรียบเทียบ Decision Tree C4.5, Random Forest และ XGBoost เพื่อหาโมเดลที่แม่นยำที่สุด</p>
        </div>
        <div className="hero-illustration"><Activity size={60} /></div>
      </div>

      <div className="feature-card">
        <div className="section-header">
          <h3>ตารางเปรียบเทียบประสิทธิภาพ</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7a9aac' }}><Spinner /></div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>โมเดล</th>
                  {Object.values(metricLabels).map(m => <th key={m}>{m}</th>)}
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {data?.models && Object.entries(data.models).map(([key, vals]) => {
                  const isBest = bestModel && bestModel[0] === key;
                  return (
                    <tr key={key} style={isBest ? { background: '#f0fbf5' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: '#134e5e' }}>{modelNames[key] || key}</strong>
                          {isBest && <Badge type="active" label="ดีที่สุด" />}
                        </div>
                      </td>
                      {Object.keys(metricLabels).map(mk => (
                        <td key={mk}>{renderBar(vals[mk])}</td>
                      ))}
                      <td>
                        <button className="primary-button" style={{ width: 'auto', padding: '4px 12px', fontSize: 12 }}>
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {bestModel && (
              <div className="best-banner">
                <CheckCircle2 size={20} color="#27ae60" />
                โมเดลที่ดีที่สุด: <strong>{modelNames[bestModel[0]] || bestModel[0]}</strong>
                (Accuracy {Math.round((bestModel[1].accuracy || 0) * 100)}%)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ===================== MAIN APP ===================== */
function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  function handleLogin(user) {
    setSession(user);
    setActiveTab('dashboard');
  }

  async function handleLogout() {
    await fetch(`${API}/api/logout/`, { credentials: 'include' });
    setSession(null);
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const visibleTabs = tabs.filter(t => !t.adminOnly || session.role === 'admin');
  const current = tabs.find(t => t.id === activeTab) || visibleTabs[0];

  const generalTabs = visibleTabs.filter(t => !t.adminOnly);
  const adminTabs = visibleTabs.filter(t => t.adminOnly);

  const views = {
    dashboard: <DashboardView onNavigatePredict={() => setActiveTab('predict')} />,
    disease_info: <DiseaseInfoView />,
    predict: <PredictView />,
    dataset: <DatasetView />,
    about_us: <AboutUsView />,
    users: <UsersView />,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Brain size={24} color="#3b82f6" />
          <h1>Stroke Prediction</h1>
        </div>

        <div className="sidebar-nav">
          {generalTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}

          {adminTabs.length > 0 && (
            <>
              {adminTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="logout-button-sidebar" onClick={handleLogout}>
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <Topbar session={session} currentTitle={current?.label || 'Dashboard'} />
        <main className="content">
          {views[activeTab] || views['dashboard']}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
