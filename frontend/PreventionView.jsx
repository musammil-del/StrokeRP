import {
  AlertTriangle,
  Check,
  CigaretteOff,
  Dna,
  Dumbbell,
  Salad,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound,
} from 'lucide-react';
import PreventionMetricIllustration from './PreventionMetricIllustration.jsx';
import './prevention.css';

const foodTips = [
  'เน้นอาหารที่มีเส้นใยสูง และไขมันต่ำ',
  'ลดหวาน มัน เค็ม: โซเดียมไม่เกิน 2,000 มก./วัน',
  'น้ำตาลไม่เกิน 6 ช้อนชาต่อวัน, น้ำมันไม่เกิน 6 ช้อนชาต่อวัน',
  'ใช้น้ำมันไม่อิ่มตัว เช่น น้ำมันมะกอก น้ำมันคาโนล่า น้ำมันรำข้าว ถั่วเมล็ดแห้ง และปลาทะเล',
];

const activityTips = [
  'ออกกำลังกายอย่างน้อยวันละ 30 นาที สม่ำเสมอ',
  'ผ่อนคลายความเครียด และนอนหลับพักผ่อนให้เพียงพอ',
  'งดเครื่องดื่มแอลกอฮอล์',
  <><strong>งดสูบบุหรี่เด็ดขาด</strong> (ผู้สูบบุหรี่มีความเสี่ยงสูงกว่าปกติถึง 2 เท่า)</>,
];

const healthTargets = [
  { title: 'ดัชนีมวลกาย (BMI)', value: '< 25 kg/m²', note: 'ควบคุมน้ำหนักตัวให้อยู่ในเกณฑ์มาตรฐาน', art: 'bmi', color: 'green' },
  { title: 'ความดันโลหิต', value: '≤ 130/80 mmHg', note: 'ตรวจวัดความดันโลหิตสม่ำเสมอ', art: 'pressure', color: 'rose' },
  { title: 'น้ำตาลในเลือด', value: '≤ 140 mg/dL', note: 'HbA1C < 6.5% ในผู้ป่วยเบาหวาน', art: 'sugar', color: 'amber' },
  { title: 'คอเลสเตอรอลรวม', value: '< 200 mg/dL', note: 'ควบคุมไขมันในกระแสเลือด', art: 'cholesterol', color: 'violet' },
  { title: 'ตรวจ EKG (> 50 ปี)', value: 'จังหวะหัวใจปกติ', note: 'คัดกรองภาวะหัวใจเต้นพริ้ว (AF)', art: 'ekg', color: 'sky' },
];

const fixedRisks = [
  { title: 'อายุที่มากขึ้น', icon: UserRound },
  { title: 'เพศ', note: 'พบว่าเพศชายมีความเสี่ยงสูงกว่าเพศหญิง', icon: UsersRound },
  { title: 'พันธุกรรม', icon: Dna },
  { title: 'ประวัติครอบครัว', icon: UsersRound },
];

function CheckList({ items, color }) {
  return <ul className={`prevention-check-list ${color}`}>
    {items.map((item, index) => <li key={index}><span className="prevention-check"><Check size={13} strokeWidth={3} /></span><span>{item}</span></li>)}
  </ul>;
}

export default function PreventionView() {
  return <div className="prevention-page">
    <section className="prevention-hero">
      <div className="prevention-hero-copy">
        <div className="prevention-hero-heading">
          <span className="prevention-hero-icon"><ShieldCheck size={38} strokeWidth={2.4} /></span>
          <div>
            <h3>เคล็ดลับป้องกันโรคหลอดเลือดสมอง (Prevention)</h3>
            <span className="prevention-hero-badge">90% ของโรคหลอดเลือดสมอง สามารถป้องกันได้ด้วยการปรับเปลี่ยนพฤติกรรม</span>
          </div>
        </div>
        <p>ร้อยละ 90 ของโรคหลอดเลือดสมองสามารถป้องกันได้โดยการปรับเปลี่ยนพฤติกรรมการใช้ชีวิต เช่น รับประทานอาหารที่ดีต่อสุขภาพ ออกกำลังกาย ผ่อนคลายความเครียด และควบคุมปัจจัยเสี่ยงต่าง ๆ อย่างเคร่งครัด</p>
      </div>
      <img className="prevention-hero-image" src="/prevention-runner.png" alt="ภาพประกอบการวิ่งออกกำลังกายในสวน" />
    </section>

    <div className="prevention-pillars">
      <article className="prevention-pillar prevention-food">
        <div className="prevention-pillar-heading"><span className="prevention-pillar-icon"><Salad size={25} /></span><h4>รับประทานอาหารที่ดีต่อสุขภาพ</h4></div>
        <div className="prevention-pillar-body">
          <img src="/prevention-healthy-plate.png" alt="อาหารสุขภาพที่มีปลา ผัก ผลไม้ และธัญพืช" />
          <CheckList items={foodTips} color="green" />
        </div>
      </article>
      <article className="prevention-pillar prevention-activity">
        <div className="prevention-pillar-heading"><span className="prevention-pillar-icon"><Dumbbell size={25} /></span><h4>ออกกำลังกายและปรับพฤติกรรม</h4></div>
        <div className="prevention-pillar-body">
          <img src="/prevention-runner.png" alt="ภาพประกอบการออกกำลังกาย" />
          <CheckList items={activityTips} color="blue" />
        </div>
      </article>
    </div>

    <section className="prevention-goals">
      <div className="prevention-section-heading"><Target size={30} /><h4>เป้าหมายการควบคุมปัจจัยเสี่ยงทางการแพทย์</h4><p>ควบคุมปัจจัยเสี่ยงให้อยู่ในเกณฑ์มาตรฐาน เพื่อลดความเสี่ยงการเกิดโรคหลอดเลือดสมอง</p></div>
      <div className="prevention-target-grid">
        {healthTargets.map(({ title, value, note, art, color }) => <div className={`prevention-target ${color}`} key={title}>
          <PreventionMetricIllustration type={art} />
          <div><div className="prevention-target-title">{title}</div><div className="prevention-target-value">{value}</div><p>{note}</p></div>
        </div>)}
      </div>
    </section>

    <section className="prevention-fixed-risks">
      <div className="prevention-risk-copy">
        <AlertTriangle size={37} strokeWidth={2.1} />
        <div>
          <h4>ปัจจัยเสี่ยงที่ไม่สามารถป้องกันได้</h4>
          <p>นอกจากปัจจัยเสี่ยงที่ป้องกันได้ ยังมีปัจจัยเสี่ยงที่ไม่สามารถป้องกันได้ เช่น <strong>อายุที่มากขึ้น</strong> ทำให้หลอดเลือดเสื่อมตามวัย ผนังหลอดเลือดหนาและแข็งตัวจากการเกาะของไขมันและหินปูน, <strong>เพศ</strong> (พบว่าเพศชายมีความเสี่ยงสูงกว่าเพศหญิง), และ <strong>พันธุกรรม/ประวัติครอบครัว</strong> ดังนั้นจึงควรหมั่นสังเกตอาการอย่างสม่ำเสมอ หากสงสัยให้รีบพบแพทย์ทันที</p>
        </div>
      </div>
      <div className="prevention-risk-grid">
        {fixedRisks.map(({ title, note, icon: Icon }) => <div className="prevention-risk-item" key={title}><Icon size={34} strokeWidth={1.8} /><strong>{title}</strong>{note && <span>{note}</span>}</div>)}
      </div>
    </section>
  </div>;
}