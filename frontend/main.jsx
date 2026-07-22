import React, { useState, useEffect, useCallback } from 'react';
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
  X,
  Check,
  Eye,
  EyeOff,
  Search,
  RefreshCw
} from 'lucide-react';
import './styles.css';

const API = 'http://localhost:8000';

const tabs = [
  { id: 'dashboard', label: 'แผงควบคุม', icon: BarChart3, title: 'แผงควบคุมหลัก (Dashboard)', subtitle: 'ระบบวิเคราะห์สถิติภาพรวมและการพยากรณ์โรคหลอดเลือดสมอง' },
  { id: 'about', label: 'เกี่ยวกับโรค', icon: Info, title: 'เกี่ยวกับโรคหลอดเลือดสมอง', subtitle: 'รู้จักอาการ สาเหตุ และสัญญาณเตือนภัยเงียบที่ควรรีบพบแพทย์' },
  { id: 'predict', label: 'พยากรณ์โรค', icon: ClipboardCheck, title: 'การพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง', subtitle: 'กรอกข้อมูลผู้ป่วยและข้อมูลสุขภาพเพื่อประเมินความเสี่ยงด้วย AI' },
  { id: 'users', label: 'จัดการผู้ใช้', icon: UsersRound, title: 'การจัดการผู้ใช้ (User Management)', subtitle: 'จัดการบัญชีผู้ใช้ สิทธิ์ และระดับการเข้าถึงระบบ', adminOnly: true },
  { id: 'dataset', label: 'จัดการข้อมูล', icon: Database, title: 'การจัดการชุดข้อมูล (Dataset Management)', subtitle: 'ดูและจัดการชุดข้อมูลที่ใช้ฝึกฝนโมเดล AI', adminOnly: true },
  { id: 'comparison', label: 'เปรียบเทียบโมเดล', icon: Activity, title: 'เปรียบเทียบประสิทธิภาพโมเดล', subtitle: 'เปรียบเทียบผลการทดสอบของ Decision Tree C4.5, Random Forest และ XGBoost', adminOnly: true },
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
    const pct = d.value / total;
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

function BarChart({ data, height = 160 }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(40, 260 / data.length - 10);
  const chartW = data.length * (barW + 12) + 20;
  return (
    <svg viewBox={`0 0 ${chartW} ${height + 40}`} style={{ width: '100%', height: height + 40 }}>
      {data.map((d, i) => {
        const bh = (d.value / maxVal) * height;
        const x = i * (barW + 12) + 10;
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={d.color || '#134e5e'} rx="4" opacity="0.85" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#134e5e">{d.value}</text>
            <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="#7a9aac">{d.label}</text>
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
function Topbar({ session, onLogout, activeTabLabel }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-logo">
          <Brain size={26} color="#fff" />
        </div>
        <div>
          <h1>Stroke Prediction</h1>
          <p>{session?.role === 'admin' ? 'ระบบผู้ดูแลระบบ (Admin Panel)' : 'ระบบเจ้าหน้าที่ (Staff Panel)'}</p>
        </div>
      </div>
      <div className="topbar-right">
        {/* <button className="notif-btn"><Bell size={18} /></button> */}
        <div className="profile-chip">
          <UserRound size={16} />
          <span>{session?.name || session?.username} ({session?.role === 'admin' ? 'Admin' : 'Staff'})</span>
        </div>
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={15} /> ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function DashboardView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/dashboard-stats/`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#7a9aac' }}><Spinner /></div>;

  const strokeTypes = stats?.stroke_type_distribution || {};
  const donutData = [
    { label: 'No Stroke', value: strokeTypes['No_Stroke'] || 0, color: '#27ae60' },
    { label: 'Ischemic', value: strokeTypes['Ischemic'] || 0, color: '#0B3D91' },
    { label: 'Hemorrhagic', value: strokeTypes['Hemorrhagic'] || 0, color: '#e74c3c' },
  ];
  const barData = [
    { label: 'No Stroke', value: strokeTypes['No_Stroke'] || 0, color: '#27ae60' },
    { label: 'Ischemic Stroke', value: strokeTypes['Ischemic'] || 0, color: '#0B3D91' },
    { label: 'Hemorrhagic Stroke', value: strokeTypes['Hemorrhagic'] || 0, color: '#e74c3c' },
  ];

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">BLUE HEALTH DASHBOARD</span>
          <h2>แผงควบคุมหลัก (Dashboard)</h2>
          <p>ระบบวิเคราะห์สถิติภาพรวมและการพยากรณ์โรคหลอดเลือดสมอง</p>
        </div>
        <div className="hero-illustration">
          <Activity size={48} />
          <Brain size={48} />
          <BarChart3 size={48} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f4f8' }}>
            <ClipboardCheck size={26} color="#0B3D91" />
          </div>
          <div className="stat-info">
            <h3>จำนวนครั้งที่พยากรณ์</h3>
            <strong style={{ color: '#0B3D91' }}>{stats?.total_predictions ?? 0}</strong>
            <small> ครั้ง</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fde8e8' }}>
            <AlertTriangle size={26} color="#e74c3c" />
          </div>
          <div className="stat-info">
            <h3>จำนวนครั้งที่พบความเสี่ยงสูง</h3>
            <strong style={{ color: '#e74c3c' }}>{stats?.high_risk_count ?? 0}</strong>
            <small> เคส</small>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="feature-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong style={{ fontSize: 14, color: '#0B3D91', fontWeight: 800 }}>ภาพรวมประเภทโรคหลอดเลือดสมอง</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <DonutChart data={donutData} size={140} />
            <div style={{ flex: 1 }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#445a65' }}>{d.label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="feature-card">
          <strong style={{ fontSize: 14, color: '#0B3D91', fontWeight: 800, display: 'block', marginBottom: 12 }}>จำนวนผู้ป่วยตามประเภทโรคหลอดเลือดสมอง</strong>
          <BarChart data={barData} height={120} />
        </div>
      </div>
    </div>
  );
}

/* ===================== ABOUT ===================== */
function AboutView() {
  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">MEDICAL KNOWLEDGE</span>
          <h2>เกี่ยวกับโรคหลอดเลือดสมอง</h2>
          <p>ข้อมูลสำคัญเกี่ยวกับโรคหลอดเลือดสมองที่ควรรู้เพื่อการป้องกัน</p>
        </div>
        <div className="hero-illustration">
          <Brain size={60} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="feature-card">
          <h3 style={{ fontSize: 15, color: '#0B3D91', fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>ประเภทโรค</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'No Stroke', desc: 'ปกติ ไม่มีภาวะโรคหลอดเลือดสมอง', color: '#27ae60' },
              { name: 'Ischemic Stroke', desc: 'โรคหลอดเลือดสมองตีบ/อุดตัน (พบบ่อยที่สุด ~85%)', color: '#0B3D91' },
              { name: 'Hemorrhagic Stroke', desc: 'โรคหลอดเลือดสมองแตก (รุนแรง มีอัตราเสียชีวิตสูง)', color: '#e74c3c' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', borderLeft: `4px solid ${t.color}` }}>
                <div style={{ fontWeight: 800, color: t.color, fontSize: 13, marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#445A65' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="feature-card">
          <h3 style={{ fontSize: 15, color: '#0B3D91', fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>สัญญาณเตือน F.A.S.T.</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { letter: 'F', word: 'Face', desc: 'ใบหน้าเบี้ยว หรือชา' },
              { letter: 'A', word: 'Arms', desc: 'แขนหรือขาอ่อนแรงข้างเดียว' },
              { letter: 'S', word: 'Speech', desc: 'พูดไม่ชัด ฟังไม่เข้าใจ' },
              { letter: 'T', word: 'Time', desc: 'รีบโทร 1669 ทันที!' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#f0f6f9', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0B3D91', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{f.letter}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0B3D91' }}>{f.word}</div>
                  <div style={{ fontSize: 11, color: '#445A65' }}>{f.desc}</div>
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
          { title: 'การป้องกัน', icon: CheckCircle2, color: '#27ae60', items: ['ควบคุมความดันโลหิต', 'รับประทานอาหารลดเค็มลดหวาน', 'ออกกำลังกายสม่ำเสมอ', 'ควบคุมน้ำตาลในเลือด', 'ตรวจสุขภาพประจำปี', 'งดสูบบุหรี่และแอลกอฮอล์'] },
        ].map((sec, i) => (
          <div key={i} className="feature-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: sec.color + '22', display: 'grid', placeItems: 'center' }}>
                <sec.icon size={18} color={sec.color} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B3D91' }}>{sec.title}</h3>
            </div>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sec.items.map((item, j) => <li key={j} style={{ fontSize: 13, color: '#445A65', lineHeight: 1.6 }}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== PREDICTION WIZARD  ===================== */
function PredictView() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...blankForm });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto compute BMI
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
          <span className="eyebrow">Stroke Risk Prediction </span>
          <h2>การพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง</h2>
          <p>กรอกข้อมูลผู้ป่วย 3 ขั้นตอนเพื่อรับผลการพยากรณ์</p>
        </div>
        <div className="hero-illustration"><Brain size={60} /></div>
      </div>

      {/* Stepper */}
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
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0B3D91', marginBottom: 20 }}>ขั้นที่ 1: ข้อมูลผู้ป่วย</h3>
            <div className="grid-2">
              <div className="field"><span>ชื่อผู้ป่วย</span><input placeholder="ชื่อ-สกุล" value={form.patient_name} onChange={e => set('patient_id', e.target.value)} /></div>
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
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0B3D91', marginBottom: 20 }}>ขั้นที่ 2: ข้อมูลสุขภาพและอาการ</h3>
            <div className="grid-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0B3D91', marginBottom: 10 }}>ข้อมูลการตรวจสุขภาพ</p>
                <div className="field"><span>ความดันโลหิตตัวบน Systolic BP (mmHg)</span><input type="number" placeholder="140" value={form.systolic_bp} onChange={e => set('systolic_bp', e.target.value)} /></div>
                <div className="field"><span>ความดันโลหิตตัวล่าง Diastolic BP (mmHg)</span><input type="number" placeholder="90" value={form.diastolic_bp} onChange={e => set('diastolic_bp', e.target.value)} /></div>
                <div className="field"><span>น้ำตาลในเลือด Blood Sugar (mg/dL)</span><input type="number" placeholder="100" value={form.blood_sugar} onChange={e => set('blood_sugar', e.target.value)} /></div>
                <div className="field"><span>ไขมันในเลือด Cholesterol (mg/dL)</span><input type="number" placeholder="200" value={form.cholesterol} onChange={e => set('cholesterol', e.target.value)} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#0B3D91', marginBottom: 4 }}>ประวัติโรค</p>
                  {[
                    { key: 'has_diabetes', label: 'เบาหวาน (Diabetes)' },
                    { key: 'has_hypertension', label: 'ความดันโลหิตสูง (Hypertension)' },
                    { key: 'has_dyslipidemia', label: 'ไขมันในเลือดสูง (Dyslipidemia)' },
                    { key: 'ekg_result', label: 'EKG Result ผิดปกติ' },
                  ].map(({ key, label }) => (
                    <label key={key} className="check-row">
                      <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0B3D91', marginBottom: 10 }}>อาการที่พบ</p>
                {[
                  { key: 'weakness_half_body', label: 'แขน/ขาอ่อนแรงครึ่งซีก' },
                  { key: 'speech_difficulty', label: 'พูดไม่ชัด/สื่อสารไม่ได้' },
                  { key: 'blurred_vision', label: 'ตามัว/มองไม่เห็น' },
                  { key: 'sudden_headache', label: 'ปวดศีรษะรุนแรงเฉียบพลัน' },
                  { key: 'dizziness_vertigo', label: 'วิงเวียน/เสียการทรงตัว' },
                ].map(({ key, label }) => (
                  <label key={key} className="check-row" style={{ marginBottom: 8 }}>
                    <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0B3D91', marginBottom: 20 }}>ขั้นที่ 3: ตรวจสอบข้อมูลก่อนพยากรณ์</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              {[
                ['ชื่อผู้ป่วย', form.patient_name],
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
                  <span style={{ fontWeight: 800, color: '#0B3D91' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 700, color: '#0B3D91', fontSize: 13, marginBottom: 8 }}>อาการที่พบ:</p>
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
              ← ย้อนกลับ
            </button>
          ) : <div />}
          {step < 3 ? (
            <button className="primary-button" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setStep(s => s + 1)}>
              ถัดไป →
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
  const colorMap = { 'No_Stroke': '#27ae60', 'Ischemic': '#0B3D91', 'Hemorrhagic': '#e74c3c' };
  const barColors = { 'No_Stroke': '#27ae60', 'Ischemic': '#0B3D91', 'Hemorrhagic': '#e74c3c' };

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
            <div style={{ fontSize: 26, fontWeight: 900, color: colorMap[pred] || '#0B3D91', marginBottom: 6 }}>
              {labelMap[pred] || pred}
            </div>
            <div style={{ fontSize: 13, color: '#7a9aac' }}>ผลการพยากรณ์จาก Random Forest Model</div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#0B3D91', marginBottom: 10 }}>ความน่าจะเป็นแยกตามประเภท:</p>
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
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B3D91', marginBottom: 14 }}>AI อธิบายผล</h3>
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
                <span style={{ fontWeight: 800, color: '#0B3D91' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="feature-card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B3D91', marginBottom: 14 }}>คำแนะนำ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {(recommendations[pred] || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <CheckCircle2 size={14} color="#27ae60" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#445a65', lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 11, color: '#7a9aac', fontStyle: 'italic' }}>
          ⚠️ หมายเหตุ: ผลลัพธ์นี้เป็นเพียงการประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์ กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญ
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
                  <td><Badge type={u.role === 'admin' ? 'admin' : 'user'} label={u.role === 'admin' ? 'Admin' : 'User'} /></td>
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
                  <option value="user">User (เจ้าหน้าที่)</option>
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

/* ===================== DATASET VIEW ===================== */
function DatasetView() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ patient_id: '', systolic_bp: '', diastolic_bp: '', blood_sugar: '', cholesterol: '', bmi: '', has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, stroke_type: 'No_Stroke' });
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

  async function handleAdd() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/dataset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) { setAddModal(false); loadRows(); }
      else setMsg(data.error || 'เกิดข้อผิดพลาด');
    } catch { setMsg('ไม่สามารถเชื่อมต่อได้'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันการลบข้อมูลแถวนี้?')) return;
    await fetch(`${API}/api/dataset/?id=${id}`, { method: 'DELETE', credentials: 'include' });
    loadRows();
  }

  const setF = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

  const strokeTypeBadge = (s) => {
    const map = { 'No_Stroke': { type: 'no-stroke', label: 'No Stroke' }, 'Ischemic': { type: 'ischemic', label: 'Ischemic' }, 'Hemorrhagic': { type: 'hemorrhagic', label: 'Hemorrhagic' } };
    const m = map[s] || { type: 'no-stroke', label: s };
    return <Badge type={m.type} label={m.label} />;
  };

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">DATASET MANAGEMENT (ADMIN)</span>
          <h2>จัดการชุดข้อมูล</h2>
          <p>จัดการข้อมูลของผู้ป่วย - เพิ่ม ลบ แก้ไขข้อมูลใน Dataset</p>
        </div>
        <div className="hero-illustration"><Database size={60} /></div>
      </div>

      <div className="feature-card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a9aac' }} />
              <input className="search-box" style={{ paddingLeft: 32 }} placeholder="ค้นหา Patient ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <button className="action-btn" onClick={loadRows} title="รีเฟรช"><RefreshCw size={16} /></button>
          </div>
          <button className="primary-button" style={{ width: 'auto', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setAddModal(true)}>
            <Plus size={16} /> เพิ่มข้อมูล
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Patient ID</th><th>อายุ</th><th>Systolic BP</th><th>Diastolic BP</th><th>BMI</th><th>Diabetes</th><th>Hypertension</th><th>Stroke Type</th><th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 40 }}><Spinner /></td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id}>
                  <td style={{ color: '#7a9aac' }}>{(page - 1) * limit + i + 1}</td>
                  <td><strong style={{ color: '#134e5e' }}>{row.patient_id}</strong></td>
                  <td>{row.age || '-'}</td>
                  <td>{row.systolic_bp}</td>
                  <td>{row.diastolic_bp}</td>
                  <td>{row.bmi}</td>
                  <td>{row.has_diabetes ? '✓' : '-'}</td>
                  <td>{row.has_hypertension ? '✓' : '-'}</td>
                  <td>{strokeTypeBadge(row.stroke_type)}</td>
                  <td>
                    <button className="action-btn delete" onClick={() => handleDelete(row.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 30, color: '#7a9aac' }}>ไม่พบข้อมูล</td></tr>
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

      {addModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAddModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>เพิ่มข้อมูลผู้ป่วย</h3>
              <CloseBtn onClick={() => setAddModal(false)} />
            </div>
            {msg && <div className="error-box">{msg}</div>}
            <div className="grid-2">
              <div className="field"><span>Patient ID</span><input value={addForm.patient_id} onChange={e => setF('patient_id', e.target.value)} placeholder="PT00123" /></div>
              <div className="field"><span>ประเภทโรค</span>
                <select value={addForm.stroke_type} onChange={e => setF('stroke_type', e.target.value)}>
                  <option value="No_Stroke">No Stroke</option>
                  <option value="Ischemic">Ischemic</option>
                  <option value="Hemorrhagic">Hemorrhagic</option>
                </select>
              </div>
              <div className="field"><span>Systolic BP (mmHg)</span><input type="number" value={addForm.systolic_bp} onChange={e => setF('systolic_bp', e.target.value)} /></div>
              <div className="field"><span>Diastolic BP (mmHg)</span><input type="number" value={addForm.diastolic_bp} onChange={e => setF('diastolic_bp', e.target.value)} /></div>
              <div className="field"><span>Blood Sugar (mg/dL)</span><input type="number" value={addForm.blood_sugar} onChange={e => setF('blood_sugar', e.target.value)} /></div>
              <div className="field"><span>Cholesterol (mg/dL)</span><input type="number" value={addForm.cholesterol} onChange={e => setF('cholesterol', e.target.value)} /></div>
              <div className="field"><span>BMI</span><input type="number" value={addForm.bmi} onChange={e => setF('bmi', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '10px 0' }}>
              {[['has_diabetes', 'Diabetes'], ['has_hypertension', 'Hypertension'], ['has_dyslipidemia', 'Dyslipidemia']].map(([k, l]) => (
                <label key={k} className="check-row" style={{ flex: '1 1 140px' }}>
                  <input type="checkbox" checked={addForm[k]} onChange={e => setF(k, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={() => setAddModal(false)} style={{ padding: '8px 18px', border: '1.5px solid #d1e0e8', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, color: '#445a65' }}>ยกเลิก</button>
              <button className="primary-button" style={{ width: 'auto', padding: '8px 22px' }} onClick={handleAdd} disabled={saving}>
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
          <p>ผลการเปรียบเทียบ Decision Tree C4.5, Random Forest และ XGBoost</p>
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
                  <th>Confusion Matrix</th>
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
                <CheckCircle2 size={20} color="#2742ae" />
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

  const views = {
    dashboard: <DashboardView />,
    about: <AboutView />,
    predict: <PredictView />,
    users: <UsersView />,
    dataset: <DatasetView />,
    comparison: <ModelComparisonView />,
  };

  const tabTips = {
    dashboard: 'แผงควบคุม',
    about: 'เกี่ยวกับโรค',
    predict: 'พยากรณ์โรค',
    users: 'จัดการผู้ใช้',
    dataset: 'จัดการข้อมูล',
    comparison: 'เปรียบเทียบโมเดล',
  };

  return (
    <div className="app-shell">
      <Topbar session={session} onLogout={handleLogout} activeTabLabel={current?.label} />
      <div className="workspace">
        <nav className="sidebar">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tabTips[tab.id]}
            >
              <tab.icon size={22} />
            </button>
          ))}
        </nav>
        <main className="content">
          {views[activeTab] || views['dashboard']}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
