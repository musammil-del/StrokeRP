"""
Random Forest Classifier + SMOTE - Train/Test Split (70/30) + Manual Grid Search (10-fold CV)
================================================================================
- โหลดข้อมูลที่ผ่าน Feature Selection แล้วจาก featuresdatasetstroke.csv
- แบ่งข้อมูล Train 70% / Test 30%
- ใช้ SMOTE แก้ปัญหา Class Imbalance (ทำเฉพาะ train fold ผ่าน imblearn Pipeline ป้องกัน data leakage)
- ปรับ param_grid ให้แคบลง เพื่อลด Overfitting
- วนทดสอบทุกชุดพารามิเตอร์เอง (ParameterGrid) พร้อม cross-validation (cv=10)
  พิมพ์ผลแต่ละชุดแบบ "Set N: {params}" + F1-score (macro) + Precision (macro)
  + Recall (macro) + ROC-AUC (ovr) + Accuracy (train)
- เลือกชุดที่ดีที่สุดจาก F1-macro (CV) มาเป็นโมเดลสุดท้าย พร้อมแสดงผลแบบเด่นชัด
  และแสดง Top 3 อันดับชุดพารามิเตอร์ที่ดีที่สุด
- ประเมินผลด้วย Accuracy, Recall, F1-score บน Test set
- บันทึกโมเดลที่ดีที่สุดด้วย joblib เป็นไฟล์ .pkl

หมายเหตุ: ต้องติดตั้ง imbalanced-learn ก่อนรัน -> pip install imbalanced-learn
"""

import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.ensemble import RandomForestClassifier
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
DATA_PATH = os.path.join(BASE_DIR, "featuresdatasetstroke.csv")
MODEL_PATH = os.path.join(BASE_DIR, "Randomforestmodel1.pkl")
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
#    param_grid แคบลงกว่าเดิม เพื่อลด Overfitting (ตัด max_depth=None ออก)
#    ไม่ใส่ class_weight เพราะให้ SMOTE จัดการเรื่อง imbalance แทนแล้ว
# -----------------------------------------------------------------------
param_grid = {
    "n_estimators": [100, 200, 300],
    "criterion": ["gini", "entropy"],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2],
    "class_weight": [None, "balanced"],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... อาจใช้เวลาสักครู่\n")

results = []

for i, params in enumerate(all_combinations, start=1):
    # Pipeline: SMOTE (ทำเฉพาะ train fold) -> RandomForest
    pipeline = ImbPipeline([
        ("smote", SMOTE(random_state=42)),
        ("model", RandomForestClassifier(random_state=42, n_jobs=1, **params)),
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

# -----------------------------------------------------------------------
# 4.1) หาชุดที่ดีที่สุดจาก F1-macro (CV) -- ROC-AUC เก็บไว้ดูเสริม ไม่ใช้ตัดสินใจ
#      พร้อมจัดอันดับ Top 3 และแสดงผล Best Set แบบเด่นชัด
# -----------------------------------------------------------------------
results_sorted = sorted(results, key=lambda r: r["f1_macro_cv"], reverse=True)
best_result = results_sorted[0]
best_model = best_result["model"]

print("\n" + "=" * 70)
print("สรุปชุดพารามิเตอร์ที่ดีที่สุด 3 อันดับแรก (เรียงตาม F1-macro CV)")
print("=" * 70)
for rank, r in enumerate(results_sorted[:3], start=1):
    print(f"\nอันดับ {rank}  ->  Set {r['set']}")
    print(f"  Params            : {r['params']}")
    print(f"  F1-score (macro)  : {r['f1_macro_cv']:.4f}")
    print(f"  Precision (macro) : {r['precision_macro_cv']:.4f}")
    print(f"  Recall (macro)    : {r['recall_macro_cv']:.4f}")
    print(f"  ROC-AUC (ovr)     : {r['roc_auc_cv']:.4f}")
    print(f"  Accuracy (train)  : {r['train_accuracy']:.4f}")

print("\n" + "#" * 70)
print("###  BEST SET (ชุดพารามิเตอร์ที่ดีที่สุด นำไปใช้เป็นโมเดลสุดท้าย)  ###")
print("#" * 70)
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Best CV Score (f1_macro)        :", round(best_result["f1_macro_cv"], 4))
print("Best CV Score (precision_macro) :", round(best_result["precision_macro_cv"], 4))
print("Best CV Score (recall_macro)    :", round(best_result["recall_macro_cv"], 4))
print("Best CV Score (roc_auc_ovr)     :", round(best_result["roc_auc_cv"], 4))
print("#" * 70)

# บันทึกผลทุกชุดลงไฟล์ CSV เผื่อไว้เปรียบเทียบ/ทำตาราง
results_df = pd.DataFrame([
    {
        "set": r["set"],
        **r["params"],
        "f1_macro_cv": r["f1_macro_cv"],
        "precision_macro_cv": r["precision_macro_cv"],
        "recall_macro_cv": r["recall_macro_cv"],
        "roc_auc_cv": r["roc_auc_cv"],
        "train_accuracy": r["train_accuracy"],
    }
    for r in results
])
# เรียงลำดับตาม f1_macro_cv จากมากไปน้อย เพื่อให้เปิดไฟล์แล้วเห็น Best Set อยู่บนสุดทันที
results_df = results_df.sort_values(by="f1_macro_cv", ascending=False).reset_index(drop=True)
results_csv_path = os.path.join(BASE_DIR, "rf_grid_search_results.csv")
results_df.to_csv(results_csv_path, index=False, encoding="utf-8-sig")
print(f"\nบันทึกผลทุกชุดไปที่: {results_csv_path} (เรียงจาก Best Set ไปน้อยสุด)")

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
report_text = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
print(report_text)

# -----------------------------------------------------------------------
# 5.03) วาดกราฟแท่งเปรียบเทียบ Precision / Recall / F1-score รายคลาส
#       แล้วบันทึกเป็นไฟล์รูปภาพ (ใช้ label ตามคลาสจริงของ Stroke_Type)
# -----------------------------------------------------------------------
report_dict = classification_report(
    y_test, y_pred, target_names=label_encoder.classes_, output_dict=True
)
class_labels_bar = list(label_encoder.classes_)

precision_vals = [report_dict[c]["precision"] for c in class_labels_bar]
recall_vals = [report_dict[c]["recall"] for c in class_labels_bar]
f1_vals = [report_dict[c]["f1-score"] for c in class_labels_bar]

x = np.arange(len(class_labels_bar))
bar_width = 0.25

fig, ax = plt.subplots(figsize=(10, 6))
bars_p = ax.bar(x - bar_width, precision_vals, bar_width, label="precision", color="#1f77b4")
bars_r = ax.bar(x, recall_vals, bar_width, label="recall", color="#ff7f0e")
bars_f = ax.bar(x + bar_width, f1_vals, bar_width, label="f1-score", color="#2ca02c")

# ใส่ตัวเลขค่ากำกับไว้บนแต่ละแท่ง (แนวตั้ง เหมือนตัวอย่าง)
for bars, color in [(bars_p, "#1f77b4"), (bars_r, "#ff7f0e"), (bars_f, "#2ca02c")]:
    for b in bars:
        height = b.get_height()
        ax.text(
            b.get_x() + b.get_width() / 2,
            height + 0.01,
            f"{height:.2f}",
            ha="center",
            va="bottom",
            rotation=90,
            fontsize=9,
            fontweight="bold",
            color=color,
        )

ax.set_xticks(x)
ax.set_xticklabels(class_labels_bar, rotation=30, ha="right")
ax.set_ylim(0, 1.2)
ax.legend(loc="lower right")
ax.set_title("Precision / Recall / F1-score")
plt.tight_layout()

metrics_plot_path = os.path.join(BASE_DIR, "rf_precision_recall_f1_by_class.png")
plt.savefig(metrics_plot_path, dpi=200)
plt.close()
print(f"บันทึกกราฟ Precision/Recall/F1 รายคลาสไปที่: {metrics_plot_path}")

print("=== Confusion Matrix ===")
cm = confusion_matrix(y_test, y_pred)
print(cm)

# -----------------------------------------------------------------------
# 5.05) วาดกราฟ Confusion Matrix แบบ Heatmap แล้วบันทึกเป็นไฟล์รูปภาพ
#       (ใช้ label ตามคลาสจริงของ Stroke_Type)
# -----------------------------------------------------------------------
class_labels = list(label_encoder.classes_)

plt.figure(figsize=(8, 6))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_labels,
    yticklabels=class_labels,
    cbar=True,
)
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.tight_layout()

cm_plot_path = os.path.join(BASE_DIR, "rf_confusion_matrix.png")
plt.savefig(cm_plot_path, dpi=200)
plt.close()
print(f"บันทึกกราฟ Confusion Matrix ไปที่: {cm_plot_path}")

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
        "best_params": best_result["params"],
        "best_set": best_result["set"],
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