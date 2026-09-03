"""
Decision Tree Classifier + SMOTE - Train/Test Split (70/30) + Manual Grid Search (10-fold CV)
================================================================================
- โหลดข้อมูลที่ผ่าน Feature Selection แล้วจาก featuresdatasetstroke.csv
- แบ่งข้อมูล Train 70% / Test 30%
- ใช้ SMOTE แก้ปัญหา Class Imbalance (ทำเฉพาะ train fold ผ่าน imblearn Pipeline ป้องกัน data leakage)
- วนทดสอบทุกชุดพารามิเตอร์เอง (ParameterGrid) พร้อม cross-validation (cv=10)
  พิมพ์ผลแต่ละชุดแบบ "Set N: {params}" + F1-score (macro) + Precision (macro)
  + Recall (macro) + ROC-AUC (ovr) + Accuracy (train)
- เลือกชุดที่ดีที่สุดจาก F1-macro (CV) มาเป็นโมเดลสุดท้าย
- ประเมินผลด้วย Accuracy, Recall, F1-score บน Test set
- บันทึกโมเดลที่ดีที่สุดด้วย joblib เป็นไฟล์ .pkl

หมายเหตุ: ต้องติดตั้ง imbalanced-learn ก่อนรัน -> pip install imbalanced-learn
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
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

# -----------------------------------------------------------------------
# 1) โหลดข้อมูล (ไฟล์นี้ผ่านการทำ Feature Selection มาแล้ว)
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "featuresDatasetstroke1.csv")
MODEL_PATH = os.path.join(BASE_DIR, "8DT_model.pkl")
TARGET_COL = "Stroke_Type"

df = pd.read_csv(DATA_PATH)

# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล (X, y)
# -----------------------------------------------------------------------
X = df.drop(columns=[TARGET_COL])
y_raw = df[TARGET_COL]

print("Selected features:", list(X.columns))

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)
print("Class mapping:", dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))))
print("จำนวนต่อคลาส (ทั้งชุดข้อมูล):", dict(pd.Series(y_raw).value_counts()))

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
#    param_grid ออกแบบสำหรับ Decision Tree โดยเฉพาะ (จำกัดความลึก/จำนวนตัวอย่าง
#    ต่อการแตกกิ่ง เพื่อลด Overfitting ซึ่งเป็นจุดอ่อนหลักของ Decision Tree เดี่ยว)
#
#    - ccp_alpha: Cost-Complexity Pruning ตัดกิ่งหลังสร้างต้นไม้เสร็จ
#      ช่วยลด overfitting เพิ่มอีกชั้นนอกเหนือจาก max_depth/min_samples_*
#    - class_weight: ปกติไม่ต้องใส่ถ้าใช้ SMOTE แล้ว (จะกลายเป็นถ่วงน้ำหนักซ้ำซ้อน
#      กับการ resample ทำให้ minority class ถูกเน้นมากเกินไปจนอาจกระทบ precision)
#      แต่ใส่ไว้ให้ grid search ทดสอบเทียบเองว่า "balanced" ร่วมกับ SMOTE
#      จะช่วยหรือกลับทำให้แย่ลง -- ดูผลจาก F1-macro/Recall-macro (CV) เป็นตัวตัดสิน
# -----------------------------------------------------------------------
param_grid = {
    "criterion": ["gini", "entropy"],
    "max_depth": [3, 5, 7, 10],
    "min_samples_split": [5, 10, 20],
    "min_samples_leaf": [2, 4, 8],
    "ccp_alpha": [0.0, 0.001, 0.01],
    "class_weight": [None, "balanced"],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... อาจใช้เวลาสักครู่\n")

results = []

for i, params in enumerate(all_combinations, start=1):
    # Pipeline: SMOTE (ทำเฉพาะ train fold) -> DecisionTree
    pipeline = ImbPipeline([
        ("smote", SMOTE(random_state=42)),
        ("model", DecisionTreeClassifier(random_state=42, **params)),
    ])

    # รัน cross-validation (cv=10) รอบเดียว ขอทุก metric พร้อมกัน
    # roc_auc_ovr เก็บไว้ดูเสริม ไม่ใช้เลือกโมเดล (ใช้ f1_macro เป็นหลัก)
    cv_results = cross_validate(
        pipeline, X_train, y_train,
        cv=10,
        scoring=["f1_macro", "precision_macro", "recall_macro", "roc_auc_ovr"],
        n_jobs=4,
    )
    f1_macro_cv = cv_results["test_f1_macro"].mean()
    precision_macro_cv = cv_results["test_precision_macro"].mean()
    recall_macro_cv = cv_results["test_recall_macro"].mean()
    roc_auc_cv = cv_results["test_roc_auc_ovr"].mean()

    # เทรนโมเดลสุดท้ายด้วย train set ทั้งหมด (ผ่าน SMOTE) แล้ววัด accuracy บน train เดิม (ไม่ resample)
    pipeline.fit(X_train, y_train)
    train_accuracy = accuracy_score(y_train, pipeline.predict(X_train))

    results.append({
        "set": i,
        "params": params,
        "f1_macro_cv": f1_macro_cv,
        "precision_macro_cv": precision_macro_cv,
        "recall_macro_cv": recall_macro_cv,
        "roc_auc_cv": roc_auc_cv,
        "train_accuracy": train_accuracy,
        "model": pipeline,
    })

    print(f"Set {i}: {params}")
    print(f"  F1-score (macro)  : {f1_macro_cv:.4f}")
    print(f"  Precision (macro) : {precision_macro_cv:.4f}")
    print(f"  Recall (macro)    : {recall_macro_cv:.4f}")
    print(f"  ROC-AUC (ovr)     : {roc_auc_cv:.4f}")
    print(f"  Accuracy (train)  : {train_accuracy:.4f}")
    print("-" * 70)

# หาชุดที่ดีที่สุดจาก F1-macro (CV) -- ROC-AUC เก็บไว้ดูเสริม ไม่ใช้ตัดสินใจ
best_result = max(results, key=lambda r: r["f1_macro_cv"])
best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Best CV Score (f1_macro)        :", round(best_result["f1_macro_cv"], 4))
print("Best CV Score (precision_macro) :", round(best_result["precision_macro_cv"], 4))
print("Best CV Score (recall_macro)    :", round(best_result["recall_macro_cv"], 4))
print("Best CV Score (roc_auc_ovr)     :", round(best_result["roc_auc_cv"], 4))

# บันทึกผลทุกชุดลงไฟล์ CSV เผื่อไว้เปรียบเทียบ/ทำตาราง
results_df = pd.DataFrame([
    {
        **r["params"],
        "f1_macro_cv": r["f1_macro_cv"],
        "precision_macro_cv": r["precision_macro_cv"],
        "recall_macro_cv": r["recall_macro_cv"],
        "roc_auc_cv": r["roc_auc_cv"],
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
# 5.1) Feature Importance (ดึงจาก step "model" ใน pipeline)
# -----------------------------------------------------------------------
importances = pd.Series(best_model.named_steps["model"].feature_importances_, index=X.columns)
importances = importances.sort_values(ascending=False)
print("\n=== Feature Importance ===")
print(importances)

# -----------------------------------------------------------------------
# 6) บันทึกโมเดลที่ดีที่สุดด้วย joblib (.pkl) -- บันทึกทั้ง pipeline (SMOTE + model)
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

sample_pred = loaded_model.predict(X_test[loaded_features].iloc[:5])
sample_pred_labels = loaded_encoder.inverse_transform(sample_pred)
print("\nตัวอย่างการทำนาย 5 แถวแรกจากโมเดลที่โหลดกลับมา:")
print(sample_pred_labels)