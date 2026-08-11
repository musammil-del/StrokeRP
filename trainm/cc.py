import os
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Randomforestmodel1.pkl")
DATA_PATH = os.path.join(BASE_DIR, "featuresdatasetstroke.csv")

# โหลดโมเดล
loaded = joblib.load(MODEL_PATH)
model = loaded["model"]
label_encoder = loaded["label_encoder"]
feature_columns = loaded["feature_columns"]

print("โหลดโมเดลสำเร็จ ✅")
print("Feature columns:", feature_columns)

# โหลดข้อมูลมาลองทำนายดู (ใช้ข้อมูลเดิม 5 แถวแรกเป็นตัวอย่าง)
df = pd.read_csv(DATA_PATH)
X_sample = df[feature_columns].iloc[:5]

# ทำนาย
predictions = model.predict(X_sample)
probabilities = model.predict_proba(X_sample)
predicted_labels = label_encoder.inverse_transform(predictions)

print("\n--- ผลการทำนาย 5 แถวแรก ---")
for i, (label, probs) in enumerate(zip(predicted_labels, probabilities)):
    max_prob = probs.max()
    print(f"แถวที่ {i+1}: ทำนายเป็น '{label}'  (มั่นใจ {max_prob:.1%})")