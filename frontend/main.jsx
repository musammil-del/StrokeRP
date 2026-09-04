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
  Lock,
  User,
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
  HeartPulse,
  Mail,
  Phone,
  MapPin,
  Code2,
  Cpu,
  Workflow,
  GraduationCap,
  Clock,
  FileText,
  Send
} from 'lucide-react';
import './styles.css';

const API = 'http://localhost:8000';

const tabs = [
  { id: 'dashboard', label: 'หน้าหลัก', icon: BarChart3, title: '(Dashboard)', subtitle: 'ระบบวิเคราะห์สถิติภาพรวมและการพยากรณ์โรคหลอดเลือดสมอง' },
  { id: 'disease_info', label: 'โรคหลอดเลือดสมอง', icon: HeartPulse, title: 'เกี่ยวกับโรคหลอดเลือดสมอง', subtitle: 'รู้จักอาการ สาเหตุ และสัญญาณเตือนภัยเงียบที่ควรรีบพบแพทย์' },
  { id: 'predict', label: 'พยากรณ์โรค', icon: ClipboardCheck, title: 'การพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง', subtitle: 'กรอกข้อมูลผู้ป่วยและข้อมูลสุขภาพเพื่อประเมินความเสี่ยงด้วย AI' },
  { id: 'dataset', label: 'จัดการข้อมูลผู้ป่วย', icon: Database, title: 'จัดการข้อมูลผู้ป่วยที่พยากรณ์', subtitle: 'เพิ่ม ลบ และแก้ไขข้อมูลของผู้ป่วยที่มีความเสี่ยงโรคหลอดเลือดสมอง', adminOnly: false },
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
  const paddingBottom = 55;
  const chartHeight = height;
  const chartWidth = 520;

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
        const parts = d.label.includes('(') ? d.label.split(' (') : [d.label];
        const mainText = parts[0];
        const subText = parts[1] ? `(${parts[1]}` : '';

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={bh} fill={d.color || "#1877f2"} rx="4" />
            <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
              <tspan x={x + barWidth / 2} dy="0">{mainText}</tspan>
              {subText && <tspan x={x + barWidth / 2} dy="15" fontSize="10" fontWeight="600" fill="#64748b">{subText}</tspan>}
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
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(150deg, #071838 0%, #0c2b5e 50%, #1877f2 100%)', 
      padding: '20px' 
    }}>
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '24px', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)', 
        padding: '40px 32px', 
        maxWidth: '420px', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Header Avatar and Titles */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ 
            width: 84, 
            height: 84, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
            border: '1.5px solid #bfdbfe',
            boxShadow: '0 6px 16px rgba(24, 119, 242, 0.1)',
            display: 'grid', 
            placeItems: 'center', 
            marginBottom: 14 
          }}>
            <Brain size={44} color="#1877f2" />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1877f2', margin: 0, letterSpacing: '0.5px' }}>
            StrokeRP
          </h1>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 2, letterSpacing: '0.2px' }}>
            Stroke Risk Prediction Using Data Mining
          </div>

          <div style={{ width: '100%', height: 1, background: '#f1f5f9', margin: '18px 0 14px' }} />

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </h2>
        </div>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>ชื่อ-นามสกุล</span>
              <input 
                placeholder="กรอกชื่อ-นามสกุล" 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  border: '1px solid #d0e1fd', 
                  outline: 'none', 
                  fontSize: 14, 
                  background: '#eff6ff',
                  color: '#0f172a'
                }}
              />
            </div>
          )}

          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>ชื่อผู้ใช้ (Username)</span>
            <input 
              placeholder="Username" 
              value={form.username} 
              onChange={e => set('username', e.target.value)} 
              required 
              autoComplete="username" 
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: 8, 
                border: '1px solid #d0e1fd', 
                outline: 'none', 
                fontSize: 14, 
                background: '#eff6ff',
                color: '#0f172a'
              }}
            />
          </div>

          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>รหัสผ่าน (Password)</span>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPwd ? 'text' : 'password'}
                placeholder="password" 
                value={form.password} 
                onChange={e => set('password', e.target.value)} 
                required 
                autoComplete="current-password" 
                style={{ 
                  width: '100%', 
                  padding: '10px 40px 10px 14px', 
                  borderRadius: 8, 
                  border: '1px solid #d0e1fd', 
                  outline: 'none', 
                  fontSize: 14, 
                  background: '#eff6ff',
                  color: '#0f172a'
                }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9aac' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>ยืนยันรหัสผ่าน (Confirm Password)</span>
              <input 
                type="password"
                placeholder="กรอกรหัสผ่านอีกครั้ง" 
                value={form.confirmPassword} 
                onChange={e => set('confirmPassword', e.target.value)} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  border: '1px solid #d0e1fd', 
                  outline: 'none', 
                  fontSize: 14, 
                  background: '#eff6ff',
                  color: '#0f172a'
                }}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="primary-button" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#1877f2', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 15, 
              fontWeight: 800, 
              cursor: 'pointer', 
              marginTop: 10,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(24, 119, 242, 0.25)'
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />}
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
          {mode === 'login' ? (
            <>ยังไม่มีบัญชี? <span className="text-link" style={{ color: '#1877f2', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>สมัครสมาชิก</span></>
          ) : (
            <>มีบัญชีแล้ว? <span className="text-link" style={{ color: '#1877f2', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>เข้าสู่ระบบ</span></>
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
        {/* <button className="notif-btn" title="แจ้งเตือน"><Bell size={18} /></button> */}
        <div className="profile-chip">
          <div className="profile-avatar">
            <UserRound size={16} />
          </div>
          <span>{session?.role === 'admin' ? 'Admin' : (session?.name || session?.username || 'User')}</span>
          {/* <ChevronRight size={14} style={{ transform: 'rotate(90deg)', color: '#94a3b8' }} /> */}
        </div>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function DashboardView({ onNavigatePredict }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

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
    { label: 'ปกติ (No Stroke)', value: noStroke, color: '#27ae60', pct: noStrokePct },
    { label: 'หลอดเลือดสมองตีบ (Ischemic Stroke)', value: ischemic, color: '#ff9800', pct: ischemicPct },
    { label: 'หลอดเลือดสมองแตก (Hemorrhagic Stroke)', value: hemorrhagic, color: '#e74c3c', pct: hemorrhagicPct },
  ];
  const barData = [
    { label: 'ปกติ (No Stroke)', value: noStroke, color: '#27ae60' },
    { label: 'หลอดเลือดสมองตีบ (Ischemic Stroke)', value: ischemic, color: '#ff9800' },
    { label: 'หลอดเลือดสมองแตก (Hemorrhagic Stroke)', value: hemorrhagic, color: '#e74c3c' },
  ];

  const formatNum = (n) => Number(n).toLocaleString('en-US');

  return (
    <div>
      {/* Hero Action Banner */}
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">StrokeRP SYSTEM</span>
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

      {/* Recent Predictions Activity Section */}
      <div className="feature-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#1877f2" /> ประวัติการพยากรณ์ล่าสุด 5 รายการ
          </h3>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            ล่าสุด
          </span>
        </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>วันที่/เวลา</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>รหัสผู้ป่วย</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>ผลลัพธ์</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_predictions || [
                  { id: 1, date_short: '24 ส.ค.', time_str: '14:20 น.', patient_id: 'HN-001', result_label: 'ปกติ', is_high_risk: false, gender: 'หญิง', age: 45, systolic_bp: 120, diastolic_bp: 80, blood_sugar: 95, cholesterol: 175, bmi: 21.5, confidence: 92.4, has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, ekg_result: false, symptoms: [], stroke_type_full: 'ปกติ (No Stroke)' },
                  { id: 2, date_short: '24 ส.ค.', time_str: '11:05 น.', patient_id: 'HN-002', result_label: 'เสี่ยงสูง', is_high_risk: true, gender: 'ชาย', age: 68, systolic_bp: 165, diastolic_bp: 98, blood_sugar: 180, cholesterol: 240, bmi: 28.4, confidence: 88.6, has_diabetes: true, has_hypertension: true, has_dyslipidemia: true, ekg_result: true, symptoms: ['แขนขาอ่อนแรง', 'พูดไม่ชัด'], stroke_type_full: 'โรคหลอดเลือดสมองตีบ (Ischemic Stroke)' },
                  { id: 3, date_short: '23 ส.ค.', time_str: '16:45 น.', patient_id: 'HN-003', result_label: 'ปกติ', is_high_risk: false, gender: 'หญิง', age: 52, systolic_bp: 128, diastolic_bp: 82, blood_sugar: 105, cholesterol: 190, bmi: 23.1, confidence: 90.1, has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, ekg_result: false, symptoms: [], stroke_type_full: 'ปกติ (No Stroke)' },
                  { id: 4, date_short: '23 ส.ค.', time_str: '09:15 น.', patient_id: 'HN-004', result_label: 'เสี่ยงสูง', is_high_risk: true, gender: 'ชาย', age: 72, systolic_bp: 185, diastolic_bp: 110, blood_sugar: 145, cholesterol: 220, bmi: 26.8, confidence: 84.5, has_diabetes: false, has_hypertension: true, has_dyslipidemia: false, ekg_result: false, symptoms: ['ปวดศีรษะเฉียบพลัน', 'วิงเวียน/เสียการทรงตัว'], stroke_type_full: 'โรคหลอดเลือดสมองแตก (Hemorrhagic Stroke)' },
                  { id: 5, date_short: '22 ส.ค.', time_str: '13:30 น.', patient_id: 'HN-005', result_label: 'ปกติ', is_high_risk: false, gender: 'ชาย', age: 38, systolic_bp: 118, diastolic_bp: 78, blood_sugar: 90, cholesterol: 160, bmi: 22.0, confidence: 96.0, has_diabetes: false, has_hypertension: false, has_dyslipidemia: false, ekg_result: false, symptoms: [], stroke_type_full: 'ปกติ (No Stroke)' },
                ]).slice(0, 5).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.date_short}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.time_str}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#1877f2' }}>
                      {row.patient_id}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: 12,
                        background: row.is_high_risk ? '#fef2f2' : '#f0fdf4',
                        color: row.is_high_risk ? '#dc2626' : '#16a34a',
                        border: `1px solid ${row.is_high_risk ? '#fecaca' : '#bbf7d0'}`
                      }}>
                        {row.result_label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedPatient(row)}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Eye size={12} /> ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'grid', placeItems: 'center' }}>
                  <UserRound size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    รายละเอียดผลการพยากรณ์: {selectedPatient.patient_id}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    บันทึกเมื่อ {selectedPatient.datetime_full || `${selectedPatient.date_short} ${selectedPatient.time_str}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Prediction Result Badge */}
            <div style={{
              background: selectedPatient.is_high_risk ? '#fef2f2' : '#f0fdf4',
              border: `1.5px solid ${selectedPatient.is_high_risk ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedPatient.is_high_risk ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#16a34a" />}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>ผลการวินิจฉัยจาก AI</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: selectedPatient.is_high_risk ? '#dc2626' : '#16a34a' }}>
                    {selectedPatient.stroke_type_full}
                  </div>
                </div>
              </div>
              {selectedPatient.confidence && (
                <span style={{ fontSize: 13, fontWeight: 800, background: '#ffffff', padding: '4px 10px', borderRadius: 8, border: `1px solid ${selectedPatient.is_high_risk ? '#fecaca' : '#bbf7d0'}`, color: selectedPatient.is_high_risk ? '#dc2626' : '#16a34a' }}>
                  ความมั่นใจ {selectedPatient.confidence}%
                </span>
              )}
            </div>

            {/* Health Info Grid */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#134e5e', marginBottom: 8 }}>ข้อมูลสุขภาพของผู้ป่วย:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                {[
                  ['เพศ / อายุ', `${selectedPatient.gender} / ${selectedPatient.age} ปี`],
                  ['BMI', selectedPatient.bmi || '-'],
                  ['ความดันโลหิต', `${selectedPatient.systolic_bp}/${selectedPatient.diastolic_bp} mmHg`],
                  ['น้ำตาลในเลือด', `${selectedPatient.blood_sugar} mg/dL`],
                  ['ไขมัน Cholesterol', `${selectedPatient.cholesterol} mg/dL`],
                  ['EKG', selectedPatient.ekg_result ? 'ผิดปกติ' : 'ปกติ'],
                  ['เบาหวาน', selectedPatient.has_diabetes ? 'มี' : 'ไม่มี'],
                  ['ความดัน (ประวัติ)', selectedPatient.has_hypertension ? 'มี' : 'ไม่มี'],
                  ['ไขมันในเลือดสูง', selectedPatient.has_dyslipidemia ? 'มี' : 'ไม่มี'],
                ].map(([k, v], i) => (
                  <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>{k}</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Symptoms list */}
            {selectedPatient.symptoms && selectedPatient.symptoms.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#134e5e', marginBottom: 8 }}>อาการที่พบ:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPatient.symptoms.map((s, idx) => (
                    <span key={idx} style={{ background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid #fecaca' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{
                  background: '#1877f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 24px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart Card */}
      <div className="feature-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
          จำนวนผู้ป่วยแยกตามประเภทโรค
        </div>
        <BarChart data={barData} height={180} />
      </div>
    </div>
  );
}

/* ===================== STROKE INFO VIEW (เกี่ยวกับโรคหลอดเลือดสมอง) ===================== */
function DiseaseInfoView() {
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const subTabs = [
    { id: 'overview', label: '1. โรคหลอดเลือดสมอง', icon: Brain },
    { id: 'symptoms', label: '2. อาการเตือน (BEFAST)', icon: AlertTriangle },
    { id: 'prevention', label: '3. เคล็ดลับการป้องกัน', icon: ShieldCheck },
    { id: 'treatment', label: '4. แนวทางการรักษา (Treatment)', icon: HeartPulse },
  ];

  return (
    <div>
      {/* Header Band */}
      <div className="hero-band" style={{ marginBottom: 20 }}>
        <div>
          <span className="eyebrow">MEDICAL KNOWLEDGE</span>
          <h2>เกี่ยวกับโรคหลอดเลือดสมอง (Stroke)</h2>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#1877f2', marginBottom: 4 }}>คู่มือความรู้และการดูแลรักษาทางการแพทย์</p>
          <p style={{ maxWidth: 820, lineHeight: 1.6 }}>
            รวบรวมข้อมูลสำคัญเกี่ยวกับโรคหลอดเลือดสมอง ชนิดของโรค อาการเตือน BEFAST เคล็ดลับการป้องกัน และแนวทางการรักษาแบบครบวงจร
          </p>
        </div>
        <div className="hero-illustration">
          <Brain size={60} />
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 24,
        background: '#ffffff',
        padding: '10px 14px',
        borderRadius: 14,
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0'
      }}>
        {subTabs.map(t => {
          const active = activeSubTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: active ? '#1877f2' : 'transparent',
                color: active ? '#ffffff' : '#475569',
                fontWeight: active ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
            >
              <Icon size={16} color={active ? '#ffffff' : '#64748b'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT: หน้าที่ 1 (โรคหลอดเลือดสมอง) */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Definition Card */}
          <div className="feature-card" style={{ padding: '28px 34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'grid', placeItems: 'center' }}>
                <Brain size={26} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  โรคหลอดเลือดสมอง หรือ Stroke คืออะไร?
                </h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>ภาวะฉุกเฉินทางการแพทย์ที่ต้องได้รับการรักษาอย่างเร่งด่วน</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '18px 22px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, lineHeight: 1.8, fontSize: 14, color: '#334155' }}>
              <strong>โรคหลอดเลือดสมอง หรือ Stroke</strong> คือ ภาวะสมองขาดเลือดที่เกิดจากหลอดเลือดสมองตีบ/อุดตันหรือมีเลือดออกในสมอง หรืออาการเส้นเลือดในสมองตีบ ทำให้เลือดไม่สามารถไปเลี้ยงสมองได้ ทำให้เซลล์สมองขาดออกซิเจน ส่งผลให้สมองตาย ผู้ป่วยจำเป็นต้องพบแพทย์ทันที การรักษาอย่างรีบด่วนเป็นสิ่งสำคัญมาก เพราะช่วยลดความรุนแรงจากภาวะสมองตาย และรวมถึงลดภาวะแทรกซ้อนอื่นๆ และยังป้องกันความพิการและทุพพลภาพที่จะเกิดขึ้น
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>
              โรคหลอดเลือดสมอง แบ่งได้เป็น 2 ชนิด คือ
            </h4>

            <div className="grid-2" style={{ gap: 16 }}>
              {/* Type 1: ตีบ/อุดตัน */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 22, border: '1.5px solid #fed7aa', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, background: '#fff7ed', color: '#ea580c', padding: '4px 10px', borderRadius: 6, border: '1px solid #fed7aa' }}>
                    พบมากที่สุด ~80-90%
                  </span>
                  <Activity size={20} color="#ea580c" />
                </div>
                <h5 style={{ fontSize: 16, fontWeight: 900, color: '#9a3412', margin: '0 0 10px' }}>
                  1. โรคหลอดเลือดสมองตีบหรืออุดตันเฉียบพลัน (Ischemic Stroke)
                </h5>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  พบประมาณ 80-90% ของผู้ป่วยอัมพฤกษ์อัมพาต เกิดจากความผิดปกติของหลอดเลือดแดงที่ไปเลี้ยงสมองตีบหรืออุดตัน ซึ่งเป็นผลจากการที่ผู้ป่วยมีปัจจัยเสี่ยงต่างๆ เช่น <strong>โรคความดันโลหิตสูง, โรคเบาหวาน, การบริโภคอาหารที่มีไขมันสูง, การสูบบุหรี่, การขาดการออกกำลังกายอย่างสม่ำเสมอ</strong> ผู้ป่วยที่มีปัจจัยเสี่ยงดังกล่าวอยู่เป็นเวลานานจะเป็นผลให้ผนังหลอดเลือดหนาและแข็งตัว เกิดการตีบหรืออุดตัน ทำให้สมองขาดเลือดเกิดอัมพาตตามมาในที่สุด โดยผู้ป่วยเหล่านี้อาจมีโรคหลอดเลือดหัวใจหรือหลอดเลือดส่วนปลายแขนขาตีบร่วมด้วย นอกจากนี้ ยังอาจพบสาเหตุของการเกิดเส้นเลือดสมองอุดตันได้จากเหตุอื่นๆอีก เช่น <strong>ภาวะหัวใจเต้นผิดจังหวะบางชนิด, โรคเลือดบางชนิด เช่น ภาวะเลือดข้นผิดปกติ</strong>
                </p>
              </div>

              {/* Type 2: แตก */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 22, border: '1.5px solid #fecaca', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca' }}>
                    ความรุนแรงสูง / อัตราเสียชีวิตสูง
                  </span>
                  <AlertTriangle size={20} color="#dc2626" />
                </div>
                <h5 style={{ fontSize: 16, fontWeight: 900, color: '#991b1b', margin: '0 0 10px' }}>
                  2. โรคหลอดเลือดสมองแตก (Hemorrhagic Stroke)
                </h5>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  ภาวะนี้มักสัมพันธ์กับ <strong>โรคความดันโลหิตสูง</strong> ที่ไม่ได้รับการรักษาอยู่เป็นเวลานาน นอกจากนี้ยังอาจสัมพันธ์กับปัจจัยอื่นๆ เช่น <strong>การดื่มแอลกอฮอล์ รวมทั้งยาบางชนิด</strong> โดยการแตกของหลอดเลือดจะทำให้เกิดก้อนเลือดไปกดทับเนื้อสมอง ส่งผลให้เนื้อสมองตายและทำงานผิดปกติเฉียบพลัน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: หน้าที่ 2 (อาการของโรคหลอดเลือดสมอง B.E.F.A.S.T.) */}
      {activeSubTab === 'symptoms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="feature-card" style={{ padding: '28px 34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef3c7', display: 'grid', placeItems: 'center' }}>
                <AlertTriangle size={26} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  อาการของโรคหลอดเลือดสมอง (สัญญาณเตือนภัย B.E.F.A.S.T.)
                </h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>มักเกิดขึ้นเฉียบพลัน อาการแสดงขึ้นกับบริเวณที่สมองได้รับความเสียหาย</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 20 }}>
              อาการของโรคหลอดเลือดสมองมักเกิดขึ้นอย่างเฉียบพลัน ซึ่งสามารถสังเกตอาการเตือนและจดจำได้ง่ายตามหลักการ <strong>B.E.F.A.S.T.</strong> ดังนี้:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 22 }}>
              {[
                { letter: 'B', word: 'Balance (การทรงตัว)', desc: 'การทรงตัวของร่างกายผิดปกติ ไม่สามารถทรงตัวได้ เดินเซ วิงเวียนศีรษะเฉียบพลัน', color: '#0284c7', bg: '#f0f9ff' },
                { letter: 'E', word: 'Eye (การมองเห็น)', desc: 'ตามัวหรือมองไม่เห็นอย่างเฉียบพลัน ลานสายตาผิดปกติ มองเห็นภาพซ้อน', color: '#0369a1', bg: '#e0f2fe' },
                { letter: 'F', word: 'Face (ใบหน้า)', desc: 'เกิดภาวะหน้าเบี้ยว ปากเบี้ยว มุมปากตก ยิ้มแล้วมุมปากไม่เท่ากัน ชาครึ่งหน้า', color: '#0d9488', bg: '#f0fdfa' },
                { letter: 'A', word: 'Arm (แขนขาอ่อนแรง)', desc: 'แขนขาอ่อนแรงครึ่งซีก ไม่มีแรงหรือชาอย่างเฉียบพลันที่แขนหรือขาซีกใดซีกหนึ่งของร่างกาย ยกแขนไม่ขึ้น', color: '#ea580c', bg: '#fff7ed' },
                { letter: 'S', word: 'Speech (การพูด)', desc: 'การพูด การสื่อสารผิดปกติเฉียบพลัน เช่น การพูดไม่รู้เรื่อง พูดไม่ชัด ลิ้นแข็ง ฟังไม่เข้าใจ', color: '#7c3aed', bg: '#faf5ff' },
                { letter: 'T', word: 'Time (เวลาเร่งด่วน)', desc: 'เวลาที่เริ่มมีอาการผิดปกติ เมื่อสงสัยภาวะโรคหลอดเลือดสมองเฉียบพลัน ให้รีบพาผู้ป่วยไปโรงพยาบาลให้เร็วที่สุด หรือโทร. 1669 ทันที!', color: '#dc2626', bg: '#fef2f2' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: item.bg,
                    border: `1.5px solid ${item.color}44`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: item.color,
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 900,
                    fontSize: 22,
                    flexShrink: 0
                  }}>
                    {item.letter}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: item.color, marginBottom: 4 }}>
                      {item.word}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Crucial Notice Banner */}
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Bell size={24} color="#dc2626" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
                <strong>ข้อควรระวังสำคัญ:</strong> แม้ว่าอาการเหล่านั้นจะเกิดขึ้นชั่วขณะแล้วดีขึ้นเอง (TIA - ภาวะสมองขาดเลือดชั่วคราว) ก็ต้องรีบไปพบแพทย์ทันที เพื่อให้แพทย์ได้ประเมินอาการและให้การรักษาอย่างทันท่วงที จะช่วยลดความเสี่ยงต่อความรุนแรงของภาวะทุพพลภาพและป้องกันอัมพาตถาวรได้มากที่สุด
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: หน้าที่ 3 (เคล็ดลับป้องกันโรคหลอดเลือดสมอง) */}
      {activeSubTab === 'prevention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="feature-card" style={{ padding: '28px 34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0fdf4', display: 'grid', placeItems: 'center' }}>
                <ShieldCheck size={26} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  เคล็ดลับป้องกันโรคหลอดเลือดสมอง (Prevention)
                </h3>
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                  90% ของโรคหลอดเลือดสมอง สามารถป้องกันได้ด้วยการปรับเปลี่ยนพฤติกรรม
                </div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 20 }}>
              ร้อยละ 90 ของโรคหลอดเลือดสมองสามารถป้องกันได้โดยการปรับเปลี่ยนพฤติกรรมการใช้ชีวิต เช่น รับประทานอาหารที่ดีต่อสุขภาพ ออกกำลังกาย ผ่อนคลายความเครียด และควบคุมปัจจัยเสี่ยงต่าง ๆ อย่างเคร่งครัด
            </p>

            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
              {/* 1. โภชนาการ */}
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#15803d', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  รับประทานอาหารที่ดีต่อสุขภาพ
                </h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  <li>เน้นอาหารที่มีเส้นใยสูง และไขมันต่ำ</li>
                  <li>ลดหวาน มัน เค็ม: โซเดียมไม่เกิน 2,000 มก./วัน</li>
                  <li>น้ำตาลไม่เกิน 6 ช้อนชาต่อวัน, น้ำมันไม่เกิน 6 ช้อนชาต่อวัน</li>
                  <li>ใช้น้ำมันไม่อิ่มตัว เช่น น้ำมันมะกอก น้ำมันคาโนล่า น้ำมันรำข้าว ถั่วเมล็ดแห้ง และปลาทะเล</li>
                </ul>
              </div>

              {/* 2. ออกกำลังกาย & งดบุหรี่/แอลกอฮอล์ */}
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0369a1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ออกกำลังกายและปรับพฤติกรรม
                </h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  <li>ออกกำลังกายอย่างน้อยวันละ 30 นาที สม่ำเสมอ</li>
                  <li>ผ่อนคลายความเครียด และนอนหลับพักผ่อนให้เพียงพอ</li>
                  <li>งดเครื่องดื่มแอลกอฮอล์</li>
                  <li><strong>งดสูบบุหรี่เด็ดขาด</strong> (ผู้สูบบุหรี่มีความเสี่ยงสูงกว่าปกติถึง 2 เท่า)</li>
                </ul>
              </div>
            </div>

            {/* 3. เป้าหมายการควบคุมปัจจัยเสี่ยง */}
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>
              เป้าหมายการควบคุมปัจจัยเสี่ยงทางการแพทย์
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { title: 'ดัชนีมวลกาย (BMI)', target: '< 25 kg/m²', note: 'ควบคุมน้ำหนักตัวให้อยู่ในเกณฑ์มาตรฐาน', color: '#16a34a' },
                { title: 'ความดันโลหิต', target: '≤ 130/80 mmHg', note: 'ตรวจวัดความดันสม่ำเสมอ', color: '#0284c7' },
                { title: 'น้ำตาลในเลือด', target: '≤ 140 mg/dL', note: 'HbA1C < 6.5% ในผู้ป่วยเบาหวาน', color: '#d97706' },
                { title: 'คอเลสเตอรอลรวม', target: '< 200 mg/dL', note: 'ควบคุมไขมันในกระแสเลือด', color: '#ea580c' },
                { title: 'ตรวจ EKG (> 50 ปี)', target: 'จังหวะหัวใจปกติ', note: 'คัดกรองภาวะหัวใจเต้นพริ้ว (AF)', color: '#7c3aed' },
              ].map((m, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: m.color, marginBottom: 4 }}>{m.target}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{m.note}</div>
                </div>
              ))}
            </div>

            {/* 4. ปัจจัยเสี่ยงที่ป้องกันไม่ได้ */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fef08a', borderRadius: 12, padding: '18px 22px' }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#b45309', margin: '0 0 8px' }}>
                ปัจจัยเสี่ยงที่ไม่สามารถป้องกันได้
              </h4>
              <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7, margin: 0 }}>
                นอกจากปัจจัยเสี่ยงที่ป้องกันได้ ยังมีปัจจัยเสี่ยงที่ไม่สามารถป้องกันได้ เช่น <strong>อายุที่มากขึ้น</strong> ทำให้หลอดเลือดเสื่อมตามวัย ผนังหลอดเลือดหนาและแข็งตัวจากการเกาะของไขมันและหินปูน, <strong>เพศ</strong> (พบว่าเพศชายมีความเสี่ยงสูงกว่าเพศหญิง), และ <strong>พันธุกรรม/ประวัติครอบครัว</strong> ดังนั้นจึงควรหมั่นสังเกตอาการอย่างสม่ำเสมอ หากสงสัยให้รีบพบแพทย์ทันที
              </p>
            </div>
          </div>

          {/* Clinical Risk Assessment Criteria Table */}
          <div className="feature-card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', margin: 0 }}>
                เกณฑ์ระดับความเสี่ยงและคำแนะนำทางการแพทย์ (Clinical Interpretation)
              </h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>
                มาตรฐานการประเมิน
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#334155' }}>ระดับความเสี่ยง (Risk Category)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#334155' }}>เปอร์เซ็นต์ความเสี่ยง</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#334155' }}>คำแนะนำทางการแพทย์ (Clinical Interpretation)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#334155', textAlign: 'center' }}>การแสดงผลสี</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'ความเสี่ยงต่ำ (Low Risk)',
                      range: 'น้อยกว่า 5%',
                      advice: 'เน้นการดูแลสุขภาพพื้นฐาน ป้องกันไม่ให้เกิดปัจจัยเสี่ยง',
                      colorName: 'สีเขียว',
                      color: '#16a34a',
                      bg: '#f0fdf4',
                      border: '#bbf7d0',
                    },
                    {
                      name: 'ความเสี่ยงคาบเกี่ยว (Borderline)',
                      range: '5% - 7.4%',
                      advice: 'เริ่มมีความเสี่ยง ควรเริ่มปรับเปลี่ยนพฤติกรรมการใช้ชีวิต',
                      colorName: 'สีเหลืองอ่อน',
                      color: '#ca8a04',
                      bg: '#fefce8',
                      border: '#fef08a',
                    },
                    {
                      name: 'ความเสี่ยงปานกลาง (Intermediate)',
                      range: '7.5% - 19.9%',
                      advice: 'ควรพบแพทย์เพื่อพิจารณาควบคุมความดันและปัจจัยเสี่ยงอื่นๆ',
                      colorName: 'สีเหลือง / ส้ม',
                      color: '#ea580c',
                      bg: '#fff7ed',
                      border: '#fed7aa',
                    },
                    {
                      name: 'ความเสี่ยงสูง (High Risk)',
                      range: '20% ขึ้นไป',
                      advice: 'มีความเสี่ยงอันตราย ต้องอยู่ในการดูแลของแพทย์และพิจารณาให้ยา',
                      colorName: 'สีแดง',
                      color: '#dc2626',
                      bg: '#fef2f2',
                      border: '#fecaca',
                    }
                  ].map((tier, idx) => (
                    <tr 
                      key={idx} 
                      style={{ 
                        background: '#ffffff',
                        borderBottom: '1px solid #eef3f6',
                        borderLeft: `5px solid ${tier.color}`,
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: tier.color }}>
                        {tier.name}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>
                        {tier.range}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                        {tier.advice}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px', 
                          borderRadius: 6, 
                          background: tier.bg, 
                          color: tier.color, 
                          fontWeight: 800, 
                          fontSize: 12,
                          border: `1px solid ${tier.border}`
                        }}>
                          {tier.colorName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: หน้าที่ 4 (แนวทางการรักษาโรคหลอดเลือดสมอง Treatment) */}
      {activeSubTab === 'treatment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="feature-card" style={{ padding: '28px 34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'grid', placeItems: 'center' }}>
                <HeartPulse size={26} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  แนวทางการรักษาโรคหลอดเลือดสมอง (Treatment of Stroke)
                </h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>การวินิจฉัยและการรักษาฉุกเฉินเพื่อช่วยชีวิตและลดความพิการ</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 18 }}>
              <strong>โรคหลอดเลือดสมอง (Stroke)</strong> คือ โรคที่มีอาการผิดปกติทางระบบประสาทอย่างเฉียบพลันที่เกิดจากหลอดเลือดสมอง ได้แก่ แขนขาอ่อนแรงครึ่งซีก ปากเบี้ยว พูดไม่ชัด วิงเวียนศีรษะหรือเดินเซ หมดสติ
            </p>

            {/* การตรวจวินิจฉัย */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                การตรวจวินิจฉัยยืนยันโรค
              </h4>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                ผู้ป่วยจะได้รับการตรวจวินิจฉัยยืนยันโรคอย่างเร่งด่วน ด้วยเครื่อง <strong>เอกซเรย์คอมพิวเตอร์สมอง (CT brain)</strong> หรือ <strong>เอกซเรย์คลื่นแม่เหล็กสมอง (MRI brain)</strong> เพื่อแยกชนิดของโรคว่าเกิดจากการตีบตันหรือเลือดออกในสมอง
              </p>
            </div>

            {/* แนวทางการรักษา 2 กรณี */}
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #d1e0e8' }}>
              แนวทางการรักษาแบ่งตามชนิดของโรค
            </h4>

            {/* วิธีที่ 1: ยาสลายลิ่มเลือด rt-PA */}
            <div style={{ background: '#ffffff', borderRadius: 14, padding: 22, border: '1.5px solid #e2e8f0', marginBottom: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h5 style={{ fontSize: 16, fontWeight: 900, color: '#1e40af', margin: 0 }}>
                  วิธีที่ 1: การให้ “ยาสลายลิ่มเลือด” (rt-PA) ทางหลอดเลือดดำ
                </h5>
                <span style={{ fontSize: 12, fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6 }}>
                  ภายใน 4.5 ชม.
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 14 }}>
                เป็นวิธีการรักษาผู้ป่วยโรคหลอดเลือดสมองตีบหรืออุดตันเฉียบพลันที่มีอาการไม่เกิน 4.5 ชั่วโมง และไม่มีข้อห้ามในการให้ยา โดยแพทย์จะให้ยาสลายลิ่มเลือดเพื่อเปิดหลอดเลือดทางหลอดเลือดดำ ทำให้เลือดสามารถไปเลี้ยงสมองส่วนที่ขาดออกซิเจนได้ทันเวลา
              </p>

              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#1e3a8a' }}>ข้อดี / ประสิทธิภาพและการประเมิน</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#15803d' }}>ได้รับยา rt-PA</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>ไม่ได้รับยา</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eef3f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>ความพิการน้อยลงจนแทบไม่มี</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: '#15803d', background: '#f0fdf4' }}>43 %</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>26 %</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eef3f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>มีความพิการและต้องมีคนดูแล</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#15803d', background: '#f0fdf4' }}>40 %</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>53 %</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eef3f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>โอกาสเลือดออกในสมอง</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#ca8a04', background: '#fefce8' }}>7 %</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>0.6 %</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>โอกาสเสียชีวิต</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#15803d', background: '#f0fdf4' }}>17 %</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>21 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: 8, fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
                <strong>ข้อเสีย / ภาวะแทรกซ้อนที่อาจพบ:</strong> เลือดออกง่ายผิดปกติ (เช่น ตามไรฟัน ในทางเดินอาหาร), ผู้ป่วย 1 ใน 100 รายมีโอกาสแพ้ยารุนแรง, และผู้ป่วย 7 ใน 100 รายมีโอกาสเลือดออกในสมอง
              </div>
            </div>

            {/* วิธีที่ 2: Mechanical Thrombectomy */}
            <div style={{ background: '#ffffff', borderRadius: 14, padding: 22, border: '1.5px solid #e2e8f0', marginBottom: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h5 style={{ fontSize: 16, fontWeight: 900, color: '#0f766e', margin: '0 0 10px' }}>
                วิธีที่ 2: การใส่สายสวนเพื่อเปิดหลอดเลือด (Mechanical Thrombectomy)
              </h5>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 14 }}>
                เมื่อมีอาการหลอดเลือดแดงสมองขนาดใหญ่ตีบหรืออุดตัน แพทย์จะใส่สายสวนทางหลอดเลือดแดงบริเวณขาหนีบไปตามหลอดเลือดจนถึงหลอดเลือดสมองบริเวณที่มีการอุดตันของลิ่มเลือด และทำการลากหรือดูดลิ่มเลือดออกเพื่อเปิดหลอดเลือดสมอง ทำให้เลือดไปเลี้ยงสมองได้ (และ/หรือให้ร่วมกับยาสลายลิ่มเลือดตามข้อบ่งชี้)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: '#f0fdfa', border: '1.5px solid #ccfbf1', padding: '14px 16px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e' }}>โอกาสเปิดหลอดเลือดสำเร็จ</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0d9488', marginTop: 4 }}>80 %</div>
                </div>
                <div style={{ background: '#f0fdfa', border: '1.5px solid #ccfbf1', padding: '14px 16px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e' }}>กลับมาใช้ชีวิตได้ปกติ</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>50 - 60 %</div>
                </div>
              </div>

              <div style={{ background: '#fffbeb', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                <strong>ภาวะแทรกซ้อนที่อาจพบ:</strong> หลอดเลือดฉีกขาดหรือมีเลือดออกจากสมองน้อยกว่า 5%
              </div>
            </div>

            {/* กรณีโรคหลอดเลือดสมองแตก หรือ ไม่เลือกรับ 2 วิธีแรก */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '16px 18px', borderRadius: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                  กรณีโรคหลอดเลือดสมองแตก
                </h5>
                <p style={{ fontSize: 12, color: '#450a0a', lineHeight: 1.6, margin: 0 }}>
                  ปรึกษาแพทย์ศัลยกรรมระบบประสาทเพื่อวางแผนการรักษาอย่างเร่งด่วน โดยพิจารณาว่าจำเป็นต้องได้รับการผ่าตัดเพื่อระบายก้อนเลือดหรือลดความดันในกะโหลกศีรษะหรือไม่
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '16px 18px', borderRadius: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 800, color: '#334155', margin: '0 0 6px' }}>
                  การรักษาตามอาการและการฟื้นฟู
                </h5>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  หากไม่สามารถรับการรักษา 2 วิธีแรกได้ ผู้ป่วยจะได้รับการรักษาตามอาการ เฝ้าระวังภาวะแทรกซ้อน ได้รับยาต้านเกล็ดเลือด และการทำกายภาพบำบัดฟื้นฟูอย่างต่อเนื่อง
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
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

  function validateStep(currentStep) {
    if (currentStep === 1) {
      if (!form.patient_id || !form.patient_id.trim()) {
        return 'กรุณากรอกชื่อผู้ป่วย (Patient Name)';
      }
      if (!form.age || Number(form.age) <= 0 || Number(form.age) > 120) {
        return 'กรุณากรอกอายุผู้ป่วยให้ถูกต้อง (1-120 ปี)';
      }
      if (!form.weight || Number(form.weight) <= 0) {
        return 'กรุณากรอกน้ำหนักผู้ป่วยให้ถูกต้อง';
      }
      if (!form.height || Number(form.height) <= 0) {
        return 'กรุณากรอกส่วนสูงผู้ป่วยให้ถูกต้อง';
      }
    } else if (currentStep === 2) {
      if (!form.systolic_bp || Number(form.systolic_bp) <= 0) {
        return 'กรุณากรอกความดันโลหิตตัวบน Systolic BP (mmHg)';
      }
      if (!form.diastolic_bp || Number(form.diastolic_bp) <= 0) {
        return 'กรุณากรอกความดันโลหิตตัวล่าง Diastolic BP (mmHg)';
      }
      if (!form.blood_sugar || Number(form.blood_sugar) <= 0) {
        return 'กรุณากรอกระดับน้ำตาลในเลือด Blood Sugar (mg/dL)';
      }
      if (!form.cholesterol || Number(form.cholesterol) <= 0) {
        return 'กรุณากรอกระดับไขมันในเลือด Cholesterol (mg/dL)';
      }
    }
    return null;
  }

  function handleNextStep() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(s => s + 1);
  }

  async function handlePredict() {
    const err1 = validateStep(1);
    if (err1) { setError(err1); setStep(1); return; }
    const err2 = validateStep(2);
    if (err2) { setError(err2); setStep(2); return; }

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
          <p>กรอกข้อมูลผู้ป่วย 3 ขั้นตอนเพื่อรับผลการประเมินความเสี่ยง</p>
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
        {error && (
          <div className="error-box" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 20 }}>ขั้นที่ 1: ข้อมูลผู้ป่วย</h3>
            <div className="grid-2">
              <div className="field"><span>ชื่อผู้ป่วย (Patient Name)</span><input placeholder="กรอกชื่อผู้ป่วย" value={form.patient_id} onChange={e => { setError(''); set('patient_id', e.target.value); }} /></div>
              <div className="field">
                <span>เพศ (Gender)</span>
                <select value={form.gender} onChange={e => { setError(''); set('gender', e.target.value); }}>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>
              <div className="field"><span>อายุ (ปี)</span><input type="number" placeholder="เช่น 60" min="1" max="120" value={form.age} onChange={e => { setError(''); set('age', e.target.value); }} /></div>
              <div className="field"><span>น้ำหนัก (กก.)</span><input type="number" placeholder="เช่น 70" value={form.weight} onChange={e => { setError(''); set('weight', e.target.value); }} /></div>
              <div className="field"><span>ส่วนสูง (ซม.)</span><input type="number" placeholder="เช่น 170" value={form.height} onChange={e => { setError(''); set('height', e.target.value); }} /></div>
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
                <div className="field"><span>ความดันโลหิตตัวบน Systolic BP (mmHg)</span><input type="number" placeholder="เช่น 140" value={form.systolic_bp} onChange={e => { setError(''); set('systolic_bp', e.target.value); }} /></div>
                <div className="field"><span>ความดันโลหิตตัวล่าง Diastolic BP (mmHg)</span><input type="number" placeholder="เช่น 90" value={form.diastolic_bp} onChange={e => { setError(''); set('diastolic_bp', e.target.value); }} /></div>
                <div className="field"><span>น้ำตาลในเลือด Blood Sugar (mg/dL)</span><input type="number" placeholder="เช่น 100" value={form.blood_sugar} onChange={e => { setError(''); set('blood_sugar', e.target.value); }} /></div>
                <div className="field"><span>ไขมันในเลือด Cholesterol (mg/dL)</span><input type="number" placeholder="เช่น 200" value={form.cholesterol} onChange={e => { setError(''); set('cholesterol', e.target.value); }} /></div>

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
            <button className="primary-button" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleNextStep}>
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

  const labelMap = { 
    'No_Stroke': 'ปกติ (No Stroke)', 
    'Ischemic': 'โรคหลอดเลือดสมองตีบ (Ischemic Stroke)', 
    'Hemorrhagic': 'โรคหลอดเลือดสมองแตก (Hemorrhagic Stroke)' 
  };
  const colorMap = { 'No_Stroke': '#16a34a', 'Ischemic': '#ea580c', 'Hemorrhagic': '#dc2626' };
  const barColors = { 'No_Stroke': '#16a34a', 'Ischemic': '#ea580c', 'Hemorrhagic': '#dc2626' };

  // Calculate total Stroke Risk Percentage (Ischemic + Hemorrhagic or 100 - No_Stroke)
  const strokeRiskPct = result.stroke_risk_pct !== undefined 
    ? Number(result.stroke_risk_pct) 
    : roundNum(Number(probs['Ischemic'] || 0) + Number(probs['Hemorrhagic'] || 0));

  // Determine 4-level clinical risk tier according to Image 2
  const riskTiers = [
    {
      key: 'low',
      name: 'ความเสี่ยงต่ำ (Low Risk)',
      range: 'น้อยกว่า 5%',
      advice: 'เน้นการดูแลสุขภาพพื้นฐาน ป้องกันไม่ให้เกิดปัจจัยเสี่ยง',
      colorName: 'สีเขียว',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      match: strokeRiskPct < 5.0
    },
    {
      key: 'borderline',
      name: 'ความเสี่ยงคาบเกี่ยว (Borderline)',
      range: '5% - 7.4%',
      advice: 'เริ่มมีความเสี่ยง ควรเริ่มปรับเปลี่ยนพฤติกรรมการใช้ชีวิต',
      colorName: 'สีเหลืองอ่อน',
      color: '#ca8a04',
      bg: '#fefce8',
      border: '#fef08a',
      match: strokeRiskPct >= 5.0 && strokeRiskPct < 7.5
    },
    {
      key: 'intermediate',
      name: 'ความเสี่ยงปานกลาง (Intermediate)',
      range: '7.5% - 19.9%',
      advice: 'ควรพบแพทย์เพื่อพิจารณาควบคุมความดันและปัจจัยเสี่ยงอื่นๆ',
      colorName: 'สีเหลือง / ส้ม',
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
      match: strokeRiskPct >= 7.5 && strokeRiskPct < 20.0
    },
    {
      key: 'high',
      name: 'ความเสี่ยงสูง (High Risk)',
      range: '20% ขึ้นไป',
      advice: 'มีความเสี่ยงอันตราย ต้องอยู่ในการดูแลของแพทย์และพิจารณาให้ยา',
      colorName: 'สีแดง',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      match: strokeRiskPct >= 20.0
    }
  ];

  const currentTier = riskTiers.find(t => t.match) || riskTiers[3];

  function roundNum(n) {
    return Math.round(n * 10) / 10;
  }

  const recommendations = {
    'Ischemic': ['รีบพาผู้ป่วยพบแพทย์ทันที', 'ควบคุมความดันโลหิตให้ต่ำกว่า 130/80 mmHg', 'งดสูบบุหรี่และแอลกอฮอล์', 'ออกกำลังกายเบาๆ 30 นาที/วัน', 'รับประทานยาต้านเกล็ดเลือดตามแพทย์สั่ง', 'ลดอาหารไขมันและเค็ม'],
    'Hemorrhagic': ['นำส่งโรงพยาบาลด่วนที่สุด!', 'ห้ามให้ยาต้านการแข็งตัวของเลือด', 'ตรวจวัดความดันโลหิตอย่างใกล้ชิด', 'ปรึกษาแพทย์เพื่อประเมินการผ่าตัด', 'หลีกเลี่ยงกิจกรรมที่เพิ่มความดัน'],
    'No_Stroke': ['ดูแลสุขภาพให้แข็งแรงอย่างต่อเนื่อง', 'ตรวจสุขภาพประจำปีทุกปี', 'รับประทานผัก ผลไม้ให้หลากหลาย', 'ออกกำลังกายสม่ำเสมออย่างน้อย 150 นาที/สัปดาห์', 'ลดความเครียดในชีวิตประจำวัน', 'นอนหลับพักผ่อนให้เพียงพอ'],
  };

  // Helper to get color dynamically based on percentage according to the clinical table in Image 2
  function getTierColorByPercent(key, value) {
    const pct = Number(value) || 0;
    if (key === 'No_Stroke') {
      return '#16a34a'; // ปกติ (No Stroke) เป็นสีเขียวเสมอ
    } else {
      if (pct < 5.0) return '#16a34a';   // Low Risk (< 5%) -> Green
      if (pct < 7.5) return '#ca8a04';   // Borderline (5 - 7.4%) -> Light Yellow
      if (pct < 20.0) return '#ea580c';  // Intermediate (7.5 - 19.9%) -> Orange
      return '#dc2626';                  // High Risk (>= 20%) -> Red
    }
  }

  return (
    <div>
      <div className="hero-band" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">RESULT PAGE (ผลการพยากรณ์)</span>
          <h2>ผลการพยากรณ์โรคหลอดเลือดสมอง</h2>
          <p>ผลการพยากรณ์โรคหลอดเลือดสมอง</p>
        </div>
      </div>

      {/* 1. Main Prediction Result Card */}
      <div className="feature-card" style={{ marginBottom: 20, padding: '28px 36px' }}>
        <div style={{ textAlign: 'center', padding: '10px 0 24px', borderBottom: '1px solid #eef3f6', marginBottom: 20 }}>
          
          {/* Disease Title (ตรงกลาง - แสดงเปอร์เซ็นต์ของผลพยากรณ์หลัก) */}
          <div style={{ fontSize: 34, fontWeight: 900, color: getTierColorByPercent(pred, probs[pred]), marginBottom: 8, letterSpacing: '-0.5px' }}>
            {labelMap[pred] || pred} {probs[pred] !== undefined ? `(${Number(probs[pred]).toFixed(1)}%)` : ''}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>ผลการพยากรณ์จาก Random Forest Model</div>
        </div>

        {/* Probability Bars (ด้านล่าง - สีหลอดตรงกับระดับเปอร์เซ็นต์ โค้งมนเสมอกันทุกบรรทัด) */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#134e5e', marginBottom: 14 }}>ระดับความเสี่ยงและความน่าจะเป็นรายประเภท:</p>
          {Object.entries(probs).map(([k, v]) => {
            const barColor = getTierColorByPercent(k, v);
            const formattedPct = Number(v).toFixed(1);
            return (
              <div key={k} className="prob-bar-wrap">
                <div className="prob-bar-label">
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{labelMap[k] || k}</span>
                  <span style={{ color: barColor, fontSize: 15, fontWeight: 800 }}>{formattedPct}%</span>
                </div>
                <div className="prob-bar-bg" style={{ borderRadius: 999 }}>
                  <div 
                    className="prob-bar-fill" 
                    style={{ 
                      width: `${formattedPct}%`, 
                      background: barColor,
                      borderRadius: 999
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. AI Explanation Card */}
      <div className="feature-card" style={{ marginBottom: 20, padding: '24px 32px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
          รายละเอียดข้อมูลผู้ป่วย
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
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
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #eef3f6' }}>
              <span style={{ color: '#7a9aac', fontWeight: 600 }}>{k}</span>
              <span style={{ fontWeight: 800, color: '#134e5e' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recommendation Card */}
      <div className="feature-card" style={{ marginBottom: 24, padding: '24px 32px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e5e', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #d1e0e8' }}>
          คำแนะนำและแนวทางปฏิบัติเบื้องต้น
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
          {(recommendations[pred] || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #eef3f6' }}>
              <CheckCircle2 size={16} color="#27ae60" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#445a65', lineHeight: 1.5, fontWeight: 500 }}>{r}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#7a9aac', fontStyle: 'italic' }}>
          หมายเหตุ: ผลลัพธ์นี้เป็นเพียงการประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์ กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญ
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="primary-button" style={{ width: 'auto', padding: '12px 36px', fontSize: 15 }} onClick={onReset}>
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
    const map = { 
      'No_Stroke': { type: 'no-stroke', label: 'ปกติ (No Stroke)' }, 
      'Ischemic': { type: 'ischemic', label: 'หลอดเลือดสมองตีบ (Ischemic Stroke)' }, 
      'Hemorrhagic': { type: 'hemorrhagic', label: 'หลอดเลือดสมองแตก (Hemorrhagic Stroke)' } 
    };
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
    users: <UsersView />,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Brain size={24} color="#3b82f6" />
          <h1>StrokeRP</h1>
          <p className="sidebar-subtitle">
            Stroke Risk Prediction<br />
            Using Data Mining
          </p>
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
