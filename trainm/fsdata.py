import pandas as pd
import os

# โหลดข้อมูล
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "datasetstroke.csv")
df = pd.read_csv(DATA_PATH)

# กำหนด 14 attribute ที่ต้องการเก็บไว้
selected_columns = [
    "Weakness_Half_Body",
    "Sudden_Headache",
    "Systolic_BP",
    "Blood_Sugar",
    "BMI",
    "Speech_Difficulty",
    "Blurred_Vision",
    "Dizziness_Vertigo",
    "Cholesterol",
    "EKG_Result",
    "Diastolic_BP",
    "Has_Diabetes",
    "Has_Hypertension",
    "Stroke_Type"
]

# ตรวจสอบว่ามีคอลัมน์ไหนหายไปจาก dataset บ้าง (กันเหนียว)
missing_cols = [col for col in selected_columns if col not in df.columns]
if missing_cols:
    print("คอลัมน์เหล่านี้ไม่พบในไฟล์:", missing_cols)

# ตัดเหลือเฉพาะ 14 attribute
df_reduced = df[selected_columns]

print("จำนวนคอลัมน์หลังตัด:", df_reduced.shape[1])
print(df_reduced.head())

# บันทึกไฟล์ใหม่ (ถ้าต้องการ)
output_path = os.path.join(BASE_DIR, "featuresdatasetstroke.csv")
df_reduced.to_csv(output_path, index=False)
print("บันทึกไฟล์ที่:", output_path)