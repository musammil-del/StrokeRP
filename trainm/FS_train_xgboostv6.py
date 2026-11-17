import os
import warnings
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix,
    roc_curve, auc,
)
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

warnings.filterwarnings("ignore", category=FutureWarning)

# -----------------------------------------------------------------------
# 1) โหลดข้อมูล
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "1989.csv")
MODEL_PATH = os.path.join(BASE_DIR, "DXGBoost115.pkl")
TARGET_COL = "Stroke_Type"

ID_COLS = ["Patient_ID"]
df = pd.read_csv(DATA_PATH)

if TARGET_COL not in df.columns:
    raise ValueError(f"ไม่พบคอลัมน์เป้าหมาย '{TARGET_COL}' ในไฟล์ {DATA_PATH}")

id_cols_present = [c for c in ID_COLS if c in df.columns]
if id_cols_present:
    print("ตัดคอลัมน์รหัสผู้ป่วย (ไม่ใช่ feature) ออก:", id_cols_present)

# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล (X, y)
# -----------------------------------------------------------------------
X = df.drop(columns=[TARGET_COL] + id_cols_present).copy()
y_raw = df[TARGET_COL]

non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
if non_numeric:
    raise ValueError(
        "พบฟีเจอร์ที่ไม่ใช่ตัวเลข กรุณาเข้ารหัสข้อมูลก่อนฝึกโมเดล: "
        + ", ".join(non_numeric)
    )

# กำหนดลำดับ Class ให้ตรงกับกราฟและรายงาน
# Class 0 = No Stroke, Class 1 = Ischemic, Class 2 = Hemorrhagic
class_mapping = {"No Stroke": 0, "Ischemic": 1, "Hemorrhagic": 2}
inverse_mapping = {0: "No Stroke", 1: "Ischemic", 2: "Hemorrhagic"}
class_labels = [0, 1, 2]
class_names = ["No Stroke", "Ischemic", "Hemorrhagic"]

y = y_raw.map(class_mapping)
if y.isna().any():
    unknown_classes = y_raw[y.isna()].unique()
    raise ValueError(
        f"พบค่า Stroke_Type ที่ไม่ได้กำหนดใน class_mapping: {unknown_classes}"
    )
y = y.astype(int).values
n_classes = len(class_labels)

print("Selected features:", list(X.columns))
print("\nClass mapping:", class_mapping)
print("\nจำนวนต่อคลาส (ทั้งชุดข้อมูล):")
print(y_raw.value_counts())
print("\nจำนวนข้อมูลแต่ละ Class:")
print(pd.Series(y).value_counts().sort_index())

# -----------------------------------------------------------------------
# 3) แบ่งข้อมูล Train 70% / Test 30%
# -----------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, train_size=0.70,
    random_state=42, stratify=y,
)
print(f"\nจำนวนข้อมูล Train: {X_train.shape[0]} แถว")
print(f"จำนวนข้อมูล Test : {X_test.shape[0]} แถว")

# -----------------------------------------------------------------------
# 4) Grid Search + Cross Validation (k=10)
# หมายเหตุ: max_depth ของ XGBoost ต้องเป็นจำนวนเต็ม จึงไม่ใช้ None
# -----------------------------------------------------------------------
param_grid = {
    "n_estimators": [100, 200, 300],
    "max_depth": [None,5, 10],
    "learning_rate": [0.05, 0.1],
    "subsample": [0.8, 1.0],
    "gamma": [0, 1.0],
    "reg_alpha": [0, 0.5],
    "reg_lambda": [1.0, 2.0],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... อาจใช้เวลานาน\n")

results = []
for i, params in enumerate(all_combinations, start=1):
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
        pipeline, X_train, y_train, cv=10,
        scoring=["f1_macro", "precision_macro", "recall_macro", "roc_auc_ovr"],
        n_jobs=4, error_score="raise",
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

# -----------------------------------------------------------------------
# เลือกโมเดลที่มี F1-macro สูงสุด
# -----------------------------------------------------------------------
best_result = max(results, key=lambda r: r["f1_macro_cv"])
best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Best CV Score (f1_macro)        :", round(best_result["f1_macro_cv"], 4))
print("Best CV Score (precision_macro) :", round(best_result["precision_macro_cv"], 4))
print("Best CV Score (recall_macro)    :", round(best_result["recall_macro_cv"], 4))
print("Best CV Score (roc_auc_ovr)     :", round(best_result["roc_auc_cv"], 4))

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
results_csv_path = os.path.join(BASE_DIR, "xgb_grid_search_results.csv")
results_df.to_csv(results_csv_path, index=False, encoding="utf-8-sig")
print(f"บันทึกผลทุกชุดไปที่: {results_csv_path}")

# -----------------------------------------------------------------------
# 5) ประเมินผลบนชุด Test (30%)
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)

accuracy = accuracy_score(y_test, y_pred)
recall = recall_score(y_test, y_pred, average="macro", zero_division=0)
precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
auroc = roc_auc_score(
    y_test, y_proba, multi_class="ovr",
    average="macro", labels=class_labels,
)

print("\n=== ผลการประเมินโมเดลบน Test set (30%) ===")
print(f"Precision : {precision:.4f}  (macro average)")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Recall    : {recall:.4f}  (macro average)")
print(f"F1-score  : {f1:.4f}  (macro average)")
print(f"AUROC     : {auroc:.4f}  (macro average, ovr)")

# -----------------------------------------------------------------------
# 5.1) Classification Report
# -----------------------------------------------------------------------
print("\n=== Classification Report ===")
print(classification_report(
    y_test, y_pred, labels=class_labels,
    target_names=class_names, zero_division=0,
))
print("\nClass order:")
print("Class 0 = No Stroke")
print("Class 1 = Ischemic")
print("Class 2 = Hemorrhagic")

# -----------------------------------------------------------------------
# 5.2) Confusion Matrix (รูปแบบตามภาพที่ 1)
# -----------------------------------------------------------------------
cm = confusion_matrix(y_test, y_pred, labels=class_labels)
print("\n=== Confusion Matrix ===")
print(cm)

plt.figure(figsize=(10, 8))
plt.imshow(cm, interpolation="nearest", cmap="Blues")
plt.title("Confusion Matrix", fontsize=20)
plt.colorbar()
tick_marks = np.arange(len(class_names))
plt.xticks(tick_marks, class_names, fontsize=13)
plt.yticks(tick_marks, class_names, fontsize=13)

threshold = cm.max() / 2.0 if cm.size else 0
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(
            j, i, format(cm[i, j], "d"),
            ha="center", va="center",
            color="white" if cm[i, j] > threshold else "black",
            fontsize=16,
        )

plt.ylabel("Actual", fontsize=15)
plt.xlabel("Predicted", fontsize=15)
plt.tight_layout()
cm_path = os.path.join(BASE_DIR, "XGB_Confusion_Matrix.png")
plt.savefig(cm_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()
print(f"บันทึกกราฟ Confusion Matrix: {cm_path}")

# -----------------------------------------------------------------------
# 5.3) Feature Importance (รูปแบบตามภาพที่ 2)
# -----------------------------------------------------------------------
xgb_model = best_model.named_steps["model"]
importances = pd.Series(
    xgb_model.feature_importances_, index=X.columns,
).sort_values(ascending=True)

print("\n=== Feature Importance ===")
print(importances.sort_values(ascending=False))

plt.figure(figsize=(12, 9))
plt.barh(importances.index, importances.values)
plt.xlabel("Importance")
plt.ylabel("Features")
plt.title("XGBoost - Feature Importance")
plt.tight_layout()
feature_path = os.path.join(BASE_DIR, "XGB_Feature_Importance.png")
plt.savefig(feature_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()
print(f"บันทึกกราฟ Feature Importance: {feature_path}")

# -----------------------------------------------------------------------
# 5.4) ROC Curve รวมทั้ง 3 Classes ในภาพเดียว (รูปแบบตามภาพที่ 3)
# -----------------------------------------------------------------------
plt.figure(figsize=(12, 9))
for class_id in class_labels:
    y_test_binary = (y_test == class_id).astype(int)
    class_position = list(xgb_model.classes_).index(class_id)
    y_score = y_proba[:, class_position]

    fpr, tpr, thresholds = roc_curve(y_test_binary, y_score)
    class_auc = auc(fpr, tpr)
    plt.plot(
        fpr, tpr, linewidth=2.5,
        label=f"{inverse_mapping[class_id]} (AUC = {class_auc:.4f})",
    )

plt.plot(
    [0, 1], [0, 1], color="red",
    linestyle="--", linewidth=2,
    label="Random Classifier",
)
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel("False Positive Rate", fontsize=14)
plt.ylabel("True Positive Rate", fontsize=14)
plt.title("XGBoost - ROC Curve (All Classes)", fontsize=18)
plt.legend(loc="lower right", fontsize=12)
plt.grid(alpha=0.3)
plt.tight_layout()
roc_path = os.path.join(BASE_DIR, "XGB_ROC_All_Classes.png")
plt.savefig(roc_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()
print(f"บันทึกกราฟ ROC รวม 3 Classes: {roc_path}")

# -----------------------------------------------------------------------
# สรุปไฟล์กราฟที่สร้าง
# -----------------------------------------------------------------------
print("\n=== XGBoost Graphs ===")
print("1. XGB_Confusion_Matrix.png")
print("2. XGB_Feature_Importance.png")
print("3. XGB_ROC_All_Classes.png")

# -----------------------------------------------------------------------
# 6) บันทึกโมเดลที่ดีที่สุดด้วย joblib (.pkl) -- ทั้ง pipeline
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
print(f"\nบันทึกโมเดลที่ดีที่สุดไปที่: {MODEL_PATH}")

# -----------------------------------------------------------------------
# 7) ตัวอย่างการโหลดโมเดลกลับมาใช้งาน (Inference)
# -----------------------------------------------------------------------
loaded = joblib.load(MODEL_PATH)
loaded_model = loaded["model"]
loaded_inverse_mapping = loaded["inverse_mapping"]
loaded_features = loaded["feature_columns"]

sample_pred = loaded_model.predict(X_test[loaded_features].iloc[:5])
sample_pred_labels = [
    loaded_inverse_mapping[int(value)] for value in sample_pred
]
print("\nตัวอย่างการทำนาย 5 แถวแรกจากโมเดลที่โหลดกลับมา:")
print(sample_pred_labels)
