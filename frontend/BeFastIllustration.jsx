function Head({ children }) {
  return <>
    <path d="M34 91c3-14 12-19 26-19s23 5 26 19" fill="#ffd7bb" />
    <path d="M51 68v12c5 5 13 5 18 0V68" fill="#ffc39e" />
    <ellipse cx="60" cy="45" rx="24" ry="30" fill="#ffd7bb" />
    <path d="M37 39c0-16 9-27 23-27 15 0 24 10 24 27-7-3-12-10-13-15-7 8-19 13-34 15Z" fill="#efad85" />
    <ellipse cx="36" cy="48" rx="4" ry="7" fill="#ffd7bb" />
    <ellipse cx="84" cy="48" rx="4" ry="7" fill="#ffd7bb" />
    <path d="M49 46h2m18 0h2" stroke="#944f52" strokeWidth="2.5" strokeLinecap="round" />
    {children}
  </>;
}

export default function BeFastIllustration({ type }) {
  const drawings = {
    B: <>
      <Head><path d="M54 62q6 5 12 0" fill="none" stroke="#bd726a" strokeWidth="2" strokeLinecap="round" /></Head>
      <ellipse cx="60" cy="12" rx="36" ry="8" fill="none" stroke="#1775d0" strokeWidth="3" transform="rotate(-9 60 12)" />
      <path d="m24 7 2-5 2 5 5 2-5 2-2 5-2-5-5-2Zm71 1 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#155bd5" />
    </>,
    E: <>
      <text x="60" y="17" textAnchor="middle" fontSize="16" fontWeight="800" fill="#ef9c8d">T O Z</text>
      <text x="60" y="36" textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="4" fill="#ef9c8d">L P E D</text>
      <path d="M20 53q40-35 80 0-40 35-80 0Z" fill="#fff7ef" stroke="#eda28c" strokeWidth="4" />
      <circle cx="60" cy="53" r="17" fill="#79c9ed" />
      <circle cx="60" cy="53" r="10" fill="#1856a8" />
      <circle cx="60" cy="53" r="5" fill="#182d5a" />
      <circle cx="65" cy="48" r="3" fill="white" />
      <text x="60" y="91" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="3" fill="#ef9c8d">F E L O P Z D</text>
    </>,
    F: <>
      <Head>
        <path d="M60 41v11" stroke="#2367c9" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m56 51 4 5 4-5" fill="none" stroke="#2367c9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M51 64q9 1 17-5" fill="none" stroke="#be6464" strokeWidth="2.5" strokeLinecap="round" />
      </Head>
    </>,
    A: <>
      <path d="M48 92c-4-8-8-17-9-26l-5-23c-.7-4 5-6 7-2l7 16V23c0-5 7-5 7 0v27-37c0-5 7-5 7 0v36-34c0-5 7-5 7 0v36-27c0-5 7-5 7 0v38l6-11c3-5 9-2 7 3-4 11-9 19-13 26l-2 12Z" fill="#ffd2ad" stroke="#edab87" strokeWidth="2" strokeLinejoin="round" />
      <path d="m23 42-9-4m13-6-4-8m73 12 9-4m-5 14 9 1" stroke="#1564ce" strokeWidth="3" strokeLinecap="round" />
    </>,
    S: <>
      <Head>
        <path d="m55 58 10 10m0-10L55 68" stroke="#1458c9" strokeWidth="3.5" strokeLinecap="round" />
      </Head>
      <path d="M94 22h14m-12 9h10" stroke="#287cc9" strokeWidth="3" strokeLinecap="round" />
    </>,
    T: <>
      <path d="M64 7c-15 0-27 10-27 23 0 8 5 15 12 19l-3 12 14-8h4c15 0 27-10 27-23S79 7 64 7Z" fill="#1559c6" />
      <text x="64" y="35" textAnchor="middle" fontSize="17" fontWeight="800" fill="white">1669</text>
      <path d="M29 53c-5-5-10-4-13 1-5 9 5 25 19 36 13 11 26 16 33 10 4-3 4-8-1-12l-11-9c-3-2-6-1-9 2-4 0-12-7-16-12 1-3 4-5 3-8Z" fill="#ffd0ac" stroke="#eba788" strokeWidth="2" />
      <path d="m22 54 11 9m24 17 10 9" stroke="#f4a687" strokeWidth="5" strokeLinecap="round" />
    </>,
  };

  return <svg viewBox="0 0 120 108" role="img" aria-label={{ B: 'ภาพการทรงตัว', E: 'ภาพการมองเห็น', F: 'ภาพใบหน้า', A: 'ภาพแขน', S: 'ภาพการพูด', T: 'ภาพโทรแจ้งเหตุ 1669' }[type]}>
    {drawings[type]}
  </svg>;
}
