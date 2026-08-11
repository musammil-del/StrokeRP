"""
เปรียบเทียบ 3 โมเดล (Decision Tree, Random Forest, XGBoost)
================================================================================
- โหลดโมเดลที่บันทึกไว้ (.pkl) ทั้ง 3 ตัว
- สร้าง train/test split เดิม (random_state=42 เหมือนตอนเทรน) เพื่อให้ผลตรงกัน
- พิมพ์ Per-class Precision / Recall / F1-score ของแต่ละโมเดล
- เปรียบเทียบ Train accuracy vs Test accuracy (เช็ค Overfitting)
- พล็อต Confusion Matrix ของทั้ง 3 โมเดลเทียบกันในภาพเดียว (บันทึกเป็น .png)

หมายเหตุ: ต้องรันสคริปต์เทรนทั้ง 3 ไฟล์ (FS_DT.py, FS_RF.py, FS_XGB.py) ก่อน
เพื่อให้มีไฟล์ .pkl อยู่ในโฟลเดอร์เดียวกันกับสคริปต์นี้
"""

import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)

# -----------------------------------------------------------------------
# 0) ตั้งค่า path
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "featuresdatasetstroke.csv")
TARGET_COL = "Stroke_Type"

# แก้ชื่อไฟล์ .pkl ตรงนี้ให้ตรงกับที่คุณบันทึกไว้จริง
MODEL_FILES = {
    "Decision Tree": "2FSDT_model.pkl",
    "Random Forest": "3FSRF_model.pkl",
    "XGBoost": "3FSxgb_model.pkl",
}

# -----------------------------------------------------------------------
# 1) โหลดข้อมูล และสร้าง train/test split แบบเดิม (ต้องตรงกับตอนเทรนทุกประการ)
# -----------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
X = df.drop(columns=[TARGET_COL])
y_raw = df[TARGET_COL]

# ใช้ label_encoder ที่บันทึกไว้ในแต่ละโมเดล (จะโหลดทีหลังต่อโมเดล)
# แต่การ split ใช้ y แบบ raw ก่อน แล้วค่อย encode ด้วย encoder ของแต่ละโมเดล
X_train_raw, X_test_raw, y_train_raw, y_test_raw = train_test_split(
    X, y_raw,
    test_size=0.30,
    train_size=0.70,
    random_state=42,
    stratify=y_raw,
)

print(f"จำนวนข้อมูล Train: {X_train_raw.shape[0]} แถว")
print(f"จำนวนข้อมูล Test : {X_test_raw.shape[0]} แถว\n")

# -----------------------------------------------------------------------
# 2) โหลดโมเดลทั้ง 3 ตัว + ประเมินผล
# -----------------------------------------------------------------------
all_results = {}   # เก็บผลของแต่ละโมเดลไว้เปรียบเทียบ

for model_name, filename in MODEL_FILES.items():
    model_path = os.path.join(BASE_DIR, filename)

    if not os.path.exists(model_path):
        print(f"⚠️  ไม่พบไฟล์ {filename} ข้ามโมเดล {model_name} ไปก่อน")
        continue

    loaded = joblib.load(model_path)
    model = loaded["model"]
    label_encoder = loaded["label_encoder"]
    feature_columns = loaded["feature_columns"]

    # เข้ารหัส y ด้วย encoder ของโมเดลนี้ (ควรให้ผลเดียวกันทุกโมเดลถ้าใช้ label เดียวกัน)
    y_train = label_encoder.transform(y_train_raw)
    y_test = label_encoder.transform(y_test_raw)

    X_train = X_train_raw[feature_columns]
    X_test = X_test_raw[feature_columns]

    # ทำนายทั้ง train และ test
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    gap = train_acc - test_acc

    print("=" * 70)
    print(f"โมเดล: {model_name}")
    print("=" * 70)
    print(f"Train Accuracy : {train_acc:.4f}")
    print(f"Test Accuracy  : {test_acc:.4f}")
    print(f"Gap (Train-Test): {gap:.4f}", end="  ")
    if gap > 0.10:
        print("⚠️  ห่างเกิน 10% น่าจะ Overfit")
    elif gap > 0.05:
        print("⚠️  ห่างพอสมควร (5-10%) ลองสังเกตเพิ่มเติม")
    else:
        print("✅ ห่างไม่มาก ไม่น่ามีปัญหา Overfit ชัดเจน")

    print("\n--- Per-class metrics (บน Test set) ---")
    report = classification_report(
        y_test, y_test_pred,
        target_names=label_encoder.classes_,
        digits=4,
    )
    print(report)

    all_results[model_name] = {
        "y_test": y_test,
        "y_test_pred": y_test_pred,
        "label_encoder": label_encoder,
        "train_acc": train_acc,
        "test_acc": test_acc,
        "gap": gap,
    }
    print()

if not all_results:
    print("ไม่พบไฟล์โมเดลเลย ตรวจสอบว่าไฟล์ .pkl อยู่โฟลเดอร์เดียวกับสคริปต์นี้หรือยัง")
    raise SystemExit

# -----------------------------------------------------------------------
# 3) สรุปตาราง Train vs Test accuracy ของทุกโมเดล
# -----------------------------------------------------------------------
print("=" * 70)
print("สรุป Train vs Test Accuracy ของทุกโมเดล")
print("=" * 70)
summary_df = pd.DataFrame([
    {
        "Model": name,
        "Train Accuracy": f"{r['train_acc']:.4f}",
        "Test Accuracy": f"{r['test_acc']:.4f}",
        "Gap": f"{r['gap']:.4f}",
    }
    for name, r in all_results.items()
])
print(summary_df.to_string(index=False))

summary_csv_path = os.path.join(BASE_DIR, "train_test_gap_summary.csv")
summary_df.to_csv(summary_csv_path, index=False, encoding="utf-8-sig")
print(f"\nบันทึกตารางสรุปไปที่: {summary_csv_path}")

# -----------------------------------------------------------------------
# 4) พล็อต Confusion Matrix เทียบทั้ง 3 โมเดลในภาพเดียว
# -----------------------------------------------------------------------
n_models = len(all_results)
fig, axes = plt.subplots(1, n_models, figsize=(6 * n_models, 5))
if n_models == 1:
    axes = [axes]

for ax, (model_name, r) in zip(axes, all_results.items()):
    cm = confusion_matrix(r["y_test"], r["y_test_pred"])
    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=r["label_encoder"].classes_,
    )
    disp.plot(ax=ax, cmap="Blues", colorbar=False, xticks_rotation=45)
    ax.set_title(f"{model_name}\nTest Acc: {r['test_acc']:.4f}")

plt.tight_layout()
plot_path = os.path.join(BASE_DIR, "confusion_matrix_comparison.png")
plt.savefig(plot_path, dpi=150, bbox_inches="tight")
print(f"บันทึกรูป Confusion Matrix เปรียบเทียบไปที่: {plot_path}")
plt.close()

print("\nเสร็จสิ้น ✅")