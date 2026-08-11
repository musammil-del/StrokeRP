"""
Decision Tree Classifier - Train/Test Split (70/30) + Manual Grid Search (10-fold CV)
================================================================================
- โหลดข้อมูลที่ผ่าน Feature Selection แล้วจาก featuresdatasetstroke.csv
- แบ่งข้อมูล Train 70% / Test 30%
- วนทดสอบทุกชุดพารามิเตอร์เอง (ParameterGrid) พร้อม cross-validation (cv=10)
  พิมพ์ผลแต่ละชุดแบบ "Set N: {params}" + F1-score (macro) + Precision (macro)
  + Recall (macro) + Accuracy (train)
- เลือกชุดที่ดีที่สุดจาก F1-macro (CV) มาเป็นโมเดลสุดท้าย
- ประเมินผลด้วย Accuracy, Recall, F1-score บน Test set
- บันทึกโมเดลที่ดีที่สุดด้วย joblib เป็นไฟล์ .pkl
"""

import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# -----------------------------------------------------------------------
# 1) โหลดข้อมูล (ไฟล์นี้ผ่านการทำ Feature Selection มาแล้ว)
# -----------------------------------------------------------------------
# ใช้โฟลเดอร์เดียวกับไฟล์ .py นี้เสมอ ไม่ว่าจะรันจาก working directory ไหน
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "featuresdatasetstroke.csv")
MODEL_PATH = os.path.join(BASE_DIR, "2FSDT_model.pkl")
TARGET_COL = "Stroke_Type"

df = pd.read_csv(DATA_PATH)

# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล (X, y)
# -----------------------------------------------------------------------
# ไฟล์นี้มีเฉพาะฟีเจอร์ที่ผ่านการคัดเลือกแล้ว (feature selection)
# จึงใช้ทุกคอลัมน์ยกเว้นคอลัมน์ target ได้เลย ไม่ต้อง drop คอลัมน์อื่นเพิ่ม
X = df.drop(columns=[TARGET_COL])
y_raw = df[TARGET_COL]

print("Selected features:", list(X.columns))

# เข้ารหัส label (Stroke_Type เป็นข้อความ -> ตัวเลข)
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)
print("Class mapping:", dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))))

# -----------------------------------------------------------------------
# 3) แบ่งข้อมูล Train 70% / Test 30%
# -----------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.30,
    train_size=0.70,
    random_state=42,
    stratify=y,          # รักษาสัดส่วนของแต่ละคลาสให้ใกล้เคียงกันทั้ง train/test
)

print(f"\nจำนวนข้อมูล Train: {X_train.shape[0]} แถว")
print(f"จำนวนข้อมูล Test : {X_test.shape[0]} แถว")

# -----------------------------------------------------------------------
# 4) วน Grid Search เองทีละชุดพารามิเตอร์ + Cross Validation (k=10)
#    พิมพ์ผลแต่ละชุด (Set N) พร้อม F1-score (macro), Precision (macro),
#    Recall (macro), Accuracy (train)
# -----------------------------------------------------------------------
param_grid = {
    "criterion": ["gini", "entropy"],
    "max_depth": [5, 10, 15, 20, None],
    "min_samples_split": [2, 4, 6],
    "min_samples_leaf": [1, 2, 4],
    "class_weight": ["balanced", None],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) ... อาจใช้เวลาสักครู่\n")

results = []

for i, params in enumerate(all_combinations, start=1):
    model = DecisionTreeClassifier(random_state=42, **params)

    # รัน cross-validation (cv=10) รอบเดียว ขอ F1-macro, Precision-macro,
    # และ Recall-macro พร้อมกัน (recall สำคัญเพราะบริบททางการแพทย์
    # การ miss คลาสสำคัญอาจอันตรายกว่า)
    cv_results = cross_validate(
        model, X_train, y_train,
        cv=10,
        scoring=["f1_macro", "precision_macro", "recall_macro"],
        n_jobs=4,
    )
    f1_macro_cv = cv_results["test_f1_macro"].mean()
    precision_macro_cv = cv_results["test_precision_macro"].mean()
    recall_macro_cv = cv_results["test_recall_macro"].mean()

    # เทรนโมเดลด้วย train set ทั้งหมด แล้ววัด accuracy บน train
    model.fit(X_train, y_train)
    train_accuracy = accuracy_score(y_train, model.predict(X_train))

    results.append({
        "set": i,
        "params": params,
        "f1_macro_cv": f1_macro_cv,
        "precision_macro_cv": precision_macro_cv,
        "recall_macro_cv": recall_macro_cv,
        "train_accuracy": train_accuracy,
        "model": model,
    })

    print(f"Set {i}: {params}")
    print(f"  F1-score (macro)  : {f1_macro_cv:.4f}")
    print(f"  Precision (macro) : {precision_macro_cv:.4f}")
    print(f"  Recall (macro)    : {recall_macro_cv:.4f}")
    print(f"  Accuracy (train)  : {train_accuracy:.4f}")
    print("-" * 70)

# หาชุดที่ดีที่สุดจาก F1-macro (CV)
best_result = max(results, key=lambda r: r["f1_macro_cv"])
best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Best CV Score (f1_macro)     :", round(best_result["f1_macro_cv"], 4))
print("Best CV Score (precision_macro) :", round(best_result["precision_macro_cv"], 4))
print("Best CV Score (recall_macro) :", round(best_result["recall_macro_cv"], 4))

# บันทึกผลทุกชุดลงไฟล์ CSV เผื่อไว้เปรียบเทียบ/ทำตาราง
results_df = pd.DataFrame([
    {
        **r["params"],
        "f1_macro_cv": r["f1_macro_cv"],
        "precision_macro_cv": r["precision_macro_cv"],
        "recall_macro_cv": r["recall_macro_cv"],
        "train_accuracy": r["train_accuracy"],
    }
    for r in results
])
results_csv_path = os.path.join(BASE_DIR, "dt_grid_search_results.csv")
results_df.to_csv(results_csv_path, index=False, encoding="utf-8-sig")
print(f"บันทึกผลทุกชุดไปที่: {results_csv_path}")

# -----------------------------------------------------------------------
# 5) ประเมินผลบนชุด Test (30%)
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
recall = recall_score(y_test, y_pred, average="macro")
precision = precision_score(y_test, y_pred, average="macro")
f1 = f1_score(y_test, y_pred, average="macro")

print("\n=== ผลการประเมินโมเดลบน Test set (30%) ===")
print(f"Precision : {precision:.4f}  (macro average)")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Recall    : {recall:.4f}  (macro average)")
print(f"F1-score  : {f1:.4f}  (macro average)")

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

print("=== Confusion Matrix ===")
print(confusion_matrix(y_test, y_pred))

# -----------------------------------------------------------------------
# 5.1) Feature Importance (จุดเด่นของ Decision Tree)
# -----------------------------------------------------------------------
importances = pd.Series(best_model.feature_importances_, index=X.columns)
importances = importances.sort_values(ascending=False)
print("\n=== Feature Importance ===")
print(importances)

# -----------------------------------------------------------------------
# 6) บันทึกโมเดลที่ดีที่สุดด้วย joblib (.pkl)
# -----------------------------------------------------------------------
joblib.dump(
    {
        "model": best_model,
        "label_encoder": label_encoder,
        "feature_columns": list(X.columns),
    },
    MODEL_PATH,
)
print(f"\nบันทึกโมเดลที่ดีที่สุดไปที่: {MODEL_PATH}")

# -----------------------------------------------------------------------
# 7) ตัวอย่างการโหลดโมเดลกลับมาใช้งาน (Inference)
# -----------------------------------------------------------------------
loaded = joblib.load(MODEL_PATH)
loaded_model = loaded["model"]
loaded_encoder = loaded["label_encoder"]
loaded_features = loaded["feature_columns"]

# ทำนายด้วยโมเดลที่โหลดกลับมา (ตรวจสอบว่าทำงานถูกต้อง)
sample_pred = loaded_model.predict(X_test[loaded_features].iloc[:5])
sample_pred_labels = loaded_encoder.inverse_transform(sample_pred)
print("\nตัวอย่างการทำนาย 5 แถวแรกจากโมเดลที่โหลดกลับมา:")
print(sample_pred_labels)