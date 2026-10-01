export default function PreventionMetricIllustration({ type }) {
  const art = {
    bmi: <>
      <rect x="14" y="16" width="72" height="72" rx="14" fill="#63bfe6" stroke="#2487b5" strokeWidth="3" />
      <rect x="26" y="23" width="48" height="20" rx="5" fill="#effbff" />
      <path d="M36 38a14 14 0 0 1 28 0" fill="none" stroke="#427d9b" strokeWidth="2" />
      <path d="m50 38 7-9" stroke="#1a5e81" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="36" cy="65" rx="10" ry="15" fill="#ffd2b3" transform="rotate(-12 36 65)" />
      <ellipse cx="64" cy="65" rx="10" ry="15" fill="#ffd2b3" transform="rotate(12 64 65)" />
      <circle cx="31" cy="49" r="2.5" fill="#ffd2b3" /><circle cx="36" cy="47" r="2.5" fill="#ffd2b3" /><circle cx="41" cy="49" r="2.5" fill="#ffd2b3" />
      <circle cx="59" cy="49" r="2.5" fill="#ffd2b3" /><circle cx="64" cy="47" r="2.5" fill="#ffd2b3" /><circle cx="69" cy="49" r="2.5" fill="#ffd2b3" />
    </>,
    pressure: <>
      <path d="M28 56c-15-1-17 21-2 24l9-2" fill="none" stroke="#284b75" strokeWidth="7" strokeLinecap="round" />
      <path d="M19 50c-10-4-14 8-7 15l12 5" fill="#83acd0" stroke="#284b75" strokeWidth="3" />
      <rect x="33" y="12" width="55" height="76" rx="14" fill="#8bbad8" stroke="#2a5678" strokeWidth="3" />
      <rect x="40" y="21" width="41" height="42" rx="7" fill="#eff8fb" />
      <text x="60" y="39" textAnchor="middle" fill="#173857" fontSize="16" fontWeight="800">120</text>
      <text x="60" y="56" textAnchor="middle" fill="#173857" fontSize="16" fontWeight="800">80</text>
      <circle cx="60" cy="74" r="5" fill="#e95762" />
    </>,
    sugar: <>
      <rect x="41" y="7" width="18" height="18" rx="3" fill="#3596c9" stroke="#226183" strokeWidth="2" />
      <rect x="25" y="21" width="50" height="68" rx="13" fill="#57add3" stroke="#226183" strokeWidth="3" />
      <rect x="32" y="31" width="36" height="30" rx="5" fill="#fbf9dd" />
      <text x="50" y="52" textAnchor="middle" fill="#173b50" fontSize="20" fontWeight="800">100</text>
      <circle cx="40" cy="73" r="4" fill="#f5d470" /><circle cx="60" cy="73" r="4" fill="#f5d470" />
      <path d="M76 52c0 7 9 12 9 18a9 9 0 0 1-18 0c0-6 9-11 9-18Z" fill="#ef6464" />
    </>,
    cholesterol: <>
      <path d="M49 7C42 22 17 46 17 67a33 33 0 0 0 66 0C83 46 57 22 49 7Z" fill="#ef5258" stroke="#c32737" strokeWidth="3" />
      <path d="M43 26c-5 15-19 31-19 42a25 25 0 0 0 47 12C54 82 40 70 43 26Z" fill="#ff8790" opacity=".9" />
      <path d="M63 31c5 10 14 23 15 34-6-8-13-8-20-6-5 3-11 9-14 19 0-17 8-35 19-47Z" fill="#f6c64a" />
      <path d="M53 71c6-7 14-10 25-6" fill="none" stroke="#ffd872" strokeWidth="6" strokeLinecap="round" />
    </>,
    ekg: <>
      <path d="M50 85 17 53C-2 32 28 10 50 33c22-23 52-1 33 20L50 85Z" fill="#f15b65" stroke="#d53c53" strokeWidth="3" strokeLinejoin="round" />
      <path d="M13 52h21l7-12 9 25 8-17 5 4h23" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 30c5-5 12-5 18-1" fill="none" stroke="#fff" strokeWidth="3" opacity=".6" strokeLinecap="round" />
    </>,
  };

  const labels = {
    bmi: 'ภาพเครื่องชั่งน้ำหนัก',
    pressure: 'ภาพเครื่องวัดความดันโลหิต',
    sugar: 'ภาพเครื่องวัดน้ำตาลในเลือด',
    cholesterol: 'ภาพหลอดเลือดและไขมัน',
    ekg: 'ภาพหัวใจและคลื่นไฟฟ้าหัวใจ',
  };

  return <svg className="prevention-target-illustration" viewBox="0 0 100 100" role="img" aria-label={labels[type]}>{art[type]}</svg>;
}