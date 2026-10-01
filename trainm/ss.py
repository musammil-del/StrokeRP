import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.ensemble import RandomForestClassifier
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
MODEL_PATH = os.path.join(BASE_DIR, "RRRR.pkl")
TARGET_COL = "Stroke_Type"

# คอลัมน์ที่ไม่ใช่ feature ทางการแพทย์
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

# -----------------------------------------------------------------------
# กำหนด Class เอง
#
# Class 0 = No Stroke
# Class 1 = Ischemic
# Class 2 = Hemorrhagic
# -----------------------------------------------------------------------
class_mapping = {
    "No Stroke": 0,
    "Ischemic": 1,
    "Hemorrhagic": 2
}

inverse_mapping = {
    0: "No Stroke",
    1: "Ischemic",
    2: "Hemorrhagic"
}

# แปลง Stroke_Type เป็นตัวเลขตาม mapping
y = y_raw.map(class_mapping)

# ตรวจสอบว่ามีค่า Stroke_Type ที่ไม่ได้กำหนดไว้หรือไม่
if y.isna().any():
    unknown_classes = y_raw[y.isna()].unique()
    raise ValueError(
        f"พบ Stroke_Type ที่ไม่ได้กำหนดใน class_mapping: {unknown_classes}"
    )

y = y.astype(int).values

print("\nClass mapping:")
print(class_mapping)

print("\nจำนวนต่อคลาส (ทั้งชุดข้อมูล):")
print(y_raw.value_counts())

print("\nจำนวน Class:")
print(pd.Series(y).value_counts().sort_index())

# -----------------------------------------------------------------------
# 3) แบ่งข้อมูล Train 70% / Test 30%
# -----------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.30,
    train_size=0.70,
    random_state=42,
    stratify=y,
)

print(f"\nจำนวนข้อมูล Train: {X_train.shape[0]} แถว")
print(f"จำนวนข้อมูล Test : {X_test.shape[0]} แถว")

# -----------------------------------------------------------------------
# 4) Grid Search + Cross Validation (k=10)
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

print(
    f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: "
    f"{len(all_combinations)} ชุด"
)

print(
    "กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... "
    "อาจใช้เวลาสักครู่\n"
)

results = []

for i, params in enumerate(all_combinations, start=1):

    # Pipeline:
    # SMOTE -> Random Forest
    pipeline = ImbPipeline([
        (
            "smote",
            SMOTE(random_state=42)
        ),
        (
            "model",
            RandomForestClassifier(
                random_state=42,
                n_jobs=1,
                **params
            )
        ),
    ])

    # Cross Validation
    cv_results = cross_validate(
        pipeline,
        X_train,
        y_train,
        cv=10,
        scoring=[
            "f1_macro",
            "precision_macro",
            "recall_macro",
            "roc_auc_ovr"
        ],
        n_jobs=4,
    )

    f1_macro_cv = cv_results[
        "test_f1_macro"
    ].mean()

    precision_macro_cv = cv_results[
        "test_precision_macro"
    ].mean()

    recall_macro_cv = cv_results[
        "test_recall_macro"
    ].mean()

    roc_auc_cv = cv_results[
        "test_roc_auc_ovr"
    ].mean()

    # Train model
    pipeline.fit(X_train, y_train)

    train_accuracy = accuracy_score(
        y_train,
        pipeline.predict(X_train)
    )

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
    print(
        f"  F1-score (macro)  : "
        f"{f1_macro_cv:.4f}"
    )
    print(
        f"  Precision (macro) : "
        f"{precision_macro_cv:.4f}"
    )
    print(
        f"  Recall (macro)    : "
        f"{recall_macro_cv:.4f}"
    )
    print(
        f"  ROC-AUC (ovr)     : "
        f"{roc_auc_cv:.4f}"
    )
    print(
        f"  Accuracy (train)  : "
        f"{train_accuracy:.4f}"
    )
    print("-" * 70)

# -----------------------------------------------------------------------
# เลือกโมเดลที่มี F1-macro สูงสุด
# -----------------------------------------------------------------------
best_result = max(
    results,
    key=lambda r: r["f1_macro_cv"]
)

best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search ===")

print(
    f"Best Set    : "
    f"Set {best_result['set']}"
)

print(
    "Best Params :",
    best_result["params"]
)

print(
    "Best CV Score (f1_macro) :",
    round(best_result["f1_macro_cv"], 4)
)

print(
    "Best CV Score (precision_macro) :",
    round(
        best_result["precision_macro_cv"],
        4
    )
)

print(
    "Best CV Score (recall_macro) :",
    round(
        best_result["recall_macro_cv"],
        4
    )
)

print(
    "Best CV Score (roc_auc_ovr) :",
    round(
        best_result["roc_auc_cv"],
        4
    )
)

# -----------------------------------------------------------------------
# บันทึกผล Grid Search
# -----------------------------------------------------------------------
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

results_csv_path = os.path.join(
    BASE_DIR,
    "rf_grid_search_results.csv"
)

results_df.to_csv(
    results_csv_path,
    index=False,
    encoding="utf-8-sig"
)

print(
    f"\nบันทึกผลทุกชุดไปที่: "
    f"{results_csv_path}"
)

# -----------------------------------------------------------------------
# 5) ประเมินผลบน Test set (30%)
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    y_pred
)

recall = recall_score(
    y_test,
    y_pred,
    average="macro",
    zero_division=0
)

precision = precision_score(
    y_test,
    y_pred,
    average="macro",
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    average="macro",
    zero_division=0
)

print(
    "\n=== ผลการประเมินโมเดลบน Test set (30%) ==="
)

print(
    f"Precision : {precision:.4f} "
    f" (macro average)"
)

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Recall    : {recall:.4f} "
    f" (macro average)"
)

print(
    f"F1-score  : {f1:.4f} "
    f" (macro average)"
)

# -----------------------------------------------------------------------
# Classification Report
# -----------------------------------------------------------------------
print("\n=== Classification Report ===")

print(
    classification_report(
        y_test,
        y_pred,
        labels=[0, 1, 2],
        target_names=[
            "No Stroke",
            "Ischemic",
            "Hemorrhagic"
        ],
        zero_division=0
    )
)

# -----------------------------------------------------------------------
# Confusion Matrix
# -----------------------------------------------------------------------
print("=== Confusion Matrix ===")

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=[0, 1, 2]
)

print(cm)

print("\nClass order:")
print("Class 0 = No Stroke")
print("Class 1 = Ischemic")
print("Class 2 = Hemorrhagic")

# -----------------------------------------------------------------------
# 5.0.1) Confusion Matrix Visualization
# -----------------------------------------------------------------------
# แสดงผล Confusion Matrix ในรูปแบบ Heatmap
# ใช้ลำดับเดียวกับรูปตัวอย่าง: Hemorrhagic, Ischemic, No Stroke
plot_labels = ["Hemorrhagic", "Ischemic", "No_Stroke"]

# cm เดิมมีลำดับ: No Stroke, Ischemic, Hemorrhagic
# จึงสลับแถว/คอลัมน์ให้ตรงกับ plot_labels
plot_order = [2, 1, 0]
cm_plot = cm[np.ix_(plot_order, plot_order)]

plt.figure(figsize=(10, 7))
sns.heatmap(
    cm_plot,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=plot_labels,
    yticklabels=plot_labels,
    vmin=0,
    vmax=cm_plot.max()
)

plt.title("Confusion Matrix", fontsize=20, pad=15)
plt.xlabel("Predicted", fontsize=16)
plt.ylabel("Actual", fontsize=16)
plt.xticks(fontsize=13)
plt.yticks(fontsize=13, rotation=90)
plt.tight_layout()

cm_plot_path = os.path.join(BASE_DIR, "rf_confusion_matrix.png")
plt.savefig(cm_plot_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()

print(f"\nบันทึก Confusion Matrix เป็นรูปภาพที่: {cm_plot_path}")


# -----------------------------------------------------------------------
# 5.0.2) Precision / Recall / F1-score แยกแต่ละประเภทโรค
# -----------------------------------------------------------------------
# คำนวณ metric รายคลาส เพื่อให้ได้ผลแบบรูปตัวอย่าง
report = classification_report(
    y_test,
    y_pred,
    labels=[2, 1, 0],
    target_names=plot_labels,
    output_dict=True,
    zero_division=0
)

metrics_df = pd.DataFrame({
    "precision": [report[label]["precision"] for label in plot_labels],
    "recall": [report[label]["recall"] for label in plot_labels],
    "f1-score": [report[label]["f1-score"] for label in plot_labels]
}, index=plot_labels)

print("\n=== Precision / Recall / F1-score แยกแต่ละประเภทโรค ===")
print(metrics_df.round(4))

# วาดกราฟแท่ง
ax = metrics_df.plot(
    kind="bar",
    figsize=(12, 7),
    width=0.75
)

plt.title("Precision / Recall / F1-score", fontsize=20, pad=15)
plt.xlabel("")
plt.ylabel("Score", fontsize=15)
plt.ylim(0, 1.2)
plt.xticks(rotation=30, ha="right", fontsize=13)
plt.yticks(fontsize=12)
plt.legend(fontsize=12, loc="lower right")

# แสดงค่าตัวเลขบนแท่ง
for container in ax.containers:
    ax.bar_label(
        container,
        fmt="%.2f",
        padding=5,
        fontsize=11,
        rotation=90
    )

plt.tight_layout()

metrics_plot_path = os.path.join(
    BASE_DIR,
    "rf_precision_recall_f1_by_class.png"
)
plt.savefig(metrics_plot_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()

print(
    f"บันทึกกราฟ Precision/Recall/F1-score เป็นรูปภาพที่: "
    f"{metrics_plot_path}"
)


# -----------------------------------------------------------------------
# 5.0.3) บันทึก Metrics รายคลาสเป็น CSV
# -----------------------------------------------------------------------
metrics_csv_path = os.path.join(
    BASE_DIR,
    "rf_precision_recall_f1_by_class.csv"
)

metrics_df.to_csv(
    metrics_csv_path,
    encoding="utf-8-sig"
)

print(
    f"บันทึก Metrics รายคลาสเป็น CSV ที่: "
    f"{metrics_csv_path}"
)


# -----------------------------------------------------------------------
# 5.1) Feature Importance
# -----------------------------------------------------------------------
importances = pd.Series(
    best_model.named_steps["model"].feature_importances_,
    index=X.columns
)

importances = importances.sort_values(
    ascending=False
)

print("\n=== Feature Importance ===")
print(importances)

# -----------------------------------------------------------------------
# 6) บันทึกโมเดล
# -----------------------------------------------------------------------
joblib.dump(
    {
        "model": best_model,
        "class_mapping": class_mapping,
        "inverse_mapping": inverse_mapping,
        "feature_columns": list(X.columns),
    },
    MODEL_PATH,
)

print(
    f"\nบันทึกโมเดลที่ดีที่สุดไปที่: "
    f"{MODEL_PATH}"
)

# -----------------------------------------------------------------------
# 7) โหลดโมเดลกลับมาใช้งาน (Inference)
# -----------------------------------------------------------------------
loaded = joblib.load(MODEL_PATH)

loaded_model = loaded["model"]
loaded_inverse_mapping = loaded["inverse_mapping"]
loaded_features = loaded["feature_columns"]

sample_pred = loaded_model.predict(
    X_test[loaded_features].iloc[:5]
)

sample_pred_labels = [
    loaded_inverse_mapping[int(x)]
    for x in sample_pred
]

print(
    "\nตัวอย่างการทำนาย 5 แถวแรก "
    "จากโมเดลที่โหลดมา:"
)

print(sample_pred_labels)