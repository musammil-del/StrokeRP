import pandas as pd

# 1. โหลดไฟล์ข้อมูลของคุณ (เปลี่ยน path ไฟล์ให้ตรงกับของคุณ)
df = pd.read_csv('stroke_patients_dataset_832v1.csv')

# 2. ลบ Patient_ID ที่ไม่ใช้งานออก
df = df.drop(columns=['Patient_ID'])

# 4. ดูผลลัพธ์ข้อมูลที่แปลงแล้ว
print("ข้อมูลหลังแปลงเรียบร้อยแล้ว:")
print(df.head())

# 5. บันทึกข้อมูลที่แปลงแล้วนำไปใช้เทรนโมเดลต่อ
df.to_csv('datasetstroke.csv', index=False)