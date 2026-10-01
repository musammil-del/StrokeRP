import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from xgboost import XGBClassifier
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
# 1) โหลดข้อมูล
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "1989.csv")
MODEL_PATH = os.path.join(BASE_DIR, "DXGBoost115.pkl")
TARGET_COL = "Stroke_Type"

# คอลัมน์ที่ไม่ใช่ feature ทางการแพทย์ (เป็นรหัสระบุตัวผู้ป่วย) ต้องตัดออกจาก X
ID_COLS = ["Patient_ID"]

df = pd.read_csv(DATA_PATH)

id_cols_present = [c for c in ID_COLS if c in df.columns]
if id_cols_present:
    print("ตัดคอลัมน์รหัสผู้ป่วย (ไม่ใช่ feature) ออก:", id_cols_present)

# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล (X, y)
# -----------------------------------------------------------------------
X = df.drop(columns=[TARGET_COL] + id_cols_present)
y_raw = df[TARGET_COL]

print("Selected features:", list(X.columns))

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)
n_classes = len(label_encoder.classes_)
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
#    ไม่ใส่ scale_pos_weight/class_weight เพราะให้ SMOTE จัดการเรื่อง imbalance แทนแล้ว
# -----------------------------------------------------------------------
param_grid = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 6],
    "learning_rate": [0.05, 0.1],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0],
    "gamma": [0, 1.0],
    "reg_alpha": [0, 1.0],
    "reg_lambda": [1.0, 2.0],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... อาจใช้เวลานานพอสมควร (XGBoost + combo เยอะ)\n")

results = []

for i, params in enumerate(all_combinations, start=1):
    # Pipeline: SMOTE (ทำเฉพาะ train fold) -> XGBoost
    pipeline = ImbPipeline([
        ("smote", SMOTE(random_state=42)),
        ("model", XGBClassifier(
            random_state=42,
            objective="multi:softprob",
            num_class=n_classes,
            eval_metric="mlogloss",
            n_jobs=1,
            **params,
        )),
    ])

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

best_result = max(results, key=lambda r: r["f1_macro_cv"])
best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Best CV Score (f1_macro)        :", round(best_result["f1_macro_cv"], 4))
print("Best CV Score (precision_macro) :", round(best_result["precision_macro_cv"], 4))
print("Best CV Score (recall_macro)    :", round(best_result["recall_macro_cv"], 4))
print("Best CV Score (roc_auc_ovr)     :", round(best_result["roc_auc_cv"], 4))

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
results_csv_path = os.path.join(BASE_DIR, "xgb_grid_search_results.csv")
results_df.to_csv(results_csv_path, index=False, encoding="utf-8-sig")
print(f"บันทึกผลทุกชุดไปที่: {results_csv_path}")

# -----------------------------------------------------------------------
# 5) ประเมินผลบนชุด Test (30%)
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
recall = recall_score(y_test, y_pred, average="macro", zero_division=0)
precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)

print("\n=== ผลการประเมินโมเดลบน Test set (30%) ===")
print(f"Precision : {precision:.4f}  (macro average)")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Recall    : {recall:.4f}  (macro average)")
print(f"F1-score  : {f1:.4f}  (macro average)")

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=[str(c) for c in label_encoder.classes_], zero_division=0))

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