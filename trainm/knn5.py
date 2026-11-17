import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.inspection import permutation_importance

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
)

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE


# -----------------------------------------------------------------------
# 1) โหลดข้อมูล
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(BASE_DIR, "1989.csv")
MODEL_PATH = os.path.join(BASE_DIR, "KNN_Stroke.pkl")

TARGET_COL = "Stroke_Type"
ID_COLS = ["Patient_ID"]

df = pd.read_csv(DATA_PATH)

if TARGET_COL not in df.columns:
    raise ValueError(f"ไม่พบคอลัมน์เป้าหมาย '{TARGET_COL}' ในไฟล์ {DATA_PATH}")

id_cols_present = [c for c in ID_COLS if c in df.columns]

if id_cols_present:
    print("ตัดคอลัมน์รหัสผู้ป่วยออก:", id_cols_present)


# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล
# -----------------------------------------------------------------------
X = df.drop(columns=[TARGET_COL] + id_cols_present).copy()
y_raw = df[TARGET_COL]

print("Selected features:", list(X.columns))

# ตรวจสอบว่า features เป็นตัวเลข
non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
if non_numeric:
    raise ValueError(
        "พบฟีเจอร์ที่ไม่ใช่ตัวเลข กรุณาเข้ารหัสข้อมูลก่อนฝึกโมเดล: "
        + ", ".join(non_numeric)
    )

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

CLASS_LABELS = [0, 1, 2]
CLASS_NAMES = [
    "No Stroke",
    "Ischemic",
    "Hemorrhagic"
]

y = y_raw.map(class_mapping)

if y.isna().any():
    unknown_classes = y_raw[y.isna()].unique()
    raise ValueError(
        f"พบ Stroke_Type ที่ไม่ได้กำหนดใน class_mapping: {unknown_classes}"
    )

y = y.astype(int).values

print("\nClass mapping:")
print(class_mapping)

print("\nจำนวนต่อคลาส:")
print(y_raw.value_counts())

print("\nจำนวนข้อมูลแต่ละ Class:")
print(pd.Series(y).value_counts().sort_index())


# -----------------------------------------------------------------------
# 3) Train 70% / Test 30%
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
    "n_neighbors": [25, 30, 35],
    "weights": ["distance"],
    "p": [1]
}

all_combinations = list(ParameterGrid(param_grid))

print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ...\n")

results = []

for i, params in enumerate(all_combinations, start=1):

    # StandardScaler -> SMOTE -> KNN
    pipeline = ImbPipeline([
        ("scaler", StandardScaler()),
        ("smote", SMOTE(random_state=42)),
        ("model", KNeighborsClassifier(**params)),
    ])

    cv_results = cross_validate(
        pipeline,
        X_train,
        y_train,
        cv=10,
        scoring=[
            "accuracy",
            "f1_macro",
            "precision_macro",
            "recall_macro",
            "roc_auc_ovr"
        ],
        n_jobs=4,
    )

    accuracy_cv = cv_results["test_accuracy"].mean()
    f1_macro_cv = cv_results["test_f1_macro"].mean()
    precision_macro_cv = cv_results["test_precision_macro"].mean()
    recall_macro_cv = cv_results["test_recall_macro"].mean()
    roc_auc_cv = cv_results["test_roc_auc_ovr"].mean()

    pipeline.fit(X_train, y_train)

    train_accuracy = accuracy_score(
        y_train,
        pipeline.predict(X_train)
    )

    results.append({
        "set": i,
        "params": params,
        "accuracy_cv": accuracy_cv,
        "f1_macro_cv": f1_macro_cv,
        "precision_macro_cv": precision_macro_cv,
        "recall_macro_cv": recall_macro_cv,
        "roc_auc_cv": roc_auc_cv,
        "train_accuracy": train_accuracy,
        "model": pipeline,
    })

    print(f"Set {i}: {params}")
    print(f"  Accuracy (CV)     : {accuracy_cv:.4f}")
    print(f"  F1-score (macro)  : {f1_macro_cv:.4f}")
    print(f"  Precision (macro) : {precision_macro_cv:.4f}")
    print(f"  Recall (macro)    : {recall_macro_cv:.4f}")
    print(f"  ROC-AUC (ovr)     : {roc_auc_cv:.4f}")
    print(f"  Accuracy (train)  : {train_accuracy:.4f}")
    print("-" * 70)


# -----------------------------------------------------------------------
# 4.1) เลือกชุดที่ F1-Macro สูงสุด
# -----------------------------------------------------------------------
best_result = max(
    results,
    key=lambda r: r["f1_macro_cv"]
)

best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search : KNN ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Accuracy CV :", round(best_result["accuracy_cv"], 4))
print("F1 Macro    :", round(best_result["f1_macro_cv"], 4))
print("Precision   :", round(best_result["precision_macro_cv"], 4))
print("Recall      :", round(best_result["recall_macro_cv"], 4))
print("ROC-AUC     :", round(best_result["roc_auc_cv"], 4))


# -----------------------------------------------------------------------
# 4.2) บันทึกผล Grid Search
# -----------------------------------------------------------------------
results_df = pd.DataFrame([
    {
        **r["params"],
        "accuracy_cv": r["accuracy_cv"],
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
    "knn_grid_search_results.csv"
)

results_df.to_csv(
    results_csv_path,
    index=False,
    encoding="utf-8-sig"
)

print(f"\nบันทึกผล Grid Search ที่: {results_csv_path}")


# -----------------------------------------------------------------------
# 5) ประเมิน Test set 30%
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    average="macro",
    zero_division=0
)

recall = recall_score(
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

auroc = roc_auc_score(
    y_test,
    y_proba,
    multi_class="ovr",
    average="macro",
    labels=CLASS_LABELS
)

print("\n=== ผลการประเมิน KNN บน Test set (30%) ===")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f} (macro average)")
print(f"Recall    : {recall:.4f} (macro average)")
print(f"F1-score  : {f1:.4f} (macro average)")
print(f"AUROC     : {auroc:.4f} (macro average, ovr)")


# -----------------------------------------------------------------------
# 5.1) Classification Report
# -----------------------------------------------------------------------
print("\n=== Classification Report ===")

print(
    classification_report(
        y_test,
        y_pred,
        labels=CLASS_LABELS,
        target_names=CLASS_NAMES,
        zero_division=0
    )
)


# -----------------------------------------------------------------------
# 5.2) Confusion Matrix (รูปแบบตามภาพที่ 1)
# -----------------------------------------------------------------------
cm = confusion_matrix(
    y_test,
    y_pred,
    labels=CLASS_LABELS
)

print("\n=== Confusion Matrix ===")
print(cm)

plt.figure(figsize=(10, 8))
plt.imshow(
    cm,
    interpolation="nearest",
    cmap="Blues"
)

plt.title("Confusion Matrix", fontsize=20)
plt.colorbar()

tick_marks = np.arange(len(CLASS_NAMES))
plt.xticks(tick_marks, CLASS_NAMES, fontsize=13)
plt.yticks(tick_marks, CLASS_NAMES, fontsize=13)

threshold = cm.max() / 2.0 if cm.size else 0

for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(
            j,
            i,
            format(cm[i, j], "d"),
            ha="center",
            va="center",
            color="white" if cm[i, j] > threshold else "black",
            fontsize=16
        )

plt.ylabel("Actual", fontsize=15)
plt.xlabel("Predicted", fontsize=15)
plt.tight_layout()

cm_path = os.path.join(BASE_DIR, "KNN_Confusion_Matrix.png")
plt.savefig(cm_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()

print(f"บันทึกกราฟ Confusion Matrix: {cm_path}")


# -----------------------------------------------------------------------
# 5.3) Feature Importance (รูปแบบตามภาพที่ 2)
# KNN ไม่มี feature_importances_ โดยตรง
# จึงใช้ Permutation Importance แทน
# -----------------------------------------------------------------------
print("\nกำลังคำนวณ Permutation Feature Importance...")

permutation_result = permutation_importance(
    best_model,
    X_test,
    y_test,
    scoring="f1_macro",
    n_repeats=10,
    random_state=42,
    n_jobs=4
)

importances = pd.Series(
    permutation_result.importances_mean,
    index=X.columns
).sort_values(ascending=True)

print("\n=== Permutation Feature Importance ===")
print(importances.sort_values(ascending=False))

plt.figure(figsize=(12, 9))
plt.barh(
    importances.index,
    importances.values
)

plt.xlabel("Importance")
plt.ylabel("Features")
plt.title("KNN - Feature Importance")
plt.tight_layout()

feature_path = os.path.join(BASE_DIR, "KNN_Feature_Importance.png")
plt.savefig(feature_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()

print(f"บันทึกกราฟ Feature Importance: {feature_path}")


# -----------------------------------------------------------------------
# 5.4) ROC Curve รวมทั้ง 3 Classes ในภาพเดียว (รูปแบบตามภาพที่ 3)
# -----------------------------------------------------------------------
plt.figure(figsize=(12, 9))

for class_id in CLASS_LABELS:
    # One-vs-Rest: คลาสปัจจุบันเป็น Positive และคลาสอื่นเป็น Negative
    y_test_binary = (y_test == class_id).astype(int)

    # ดึง Probability ของคลาสปัจจุบัน
    class_position = list(best_model.classes_).index(class_id)
    y_score = y_proba[:, class_position]

    # คำนวณ ROC Curve
    fpr, tpr, thresholds = roc_curve(
        y_test_binary,
        y_score
    )

    class_auc = auc(fpr, tpr)

    # วาด ROC ของแต่ละ Class ลงในกราฟเดียวกัน
    plt.plot(
        fpr,
        tpr,
        linewidth=2.5,
        label=f"{inverse_mapping[class_id]} (AUC = {class_auc:.4f})"
    )

# เส้นอ้างอิง Random Classifier
plt.plot(
    [0, 1],
    [0, 1],
    color="red",
    linestyle="--",
    linewidth=2,
    label="Random Classifier"
)

plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])

plt.xlabel("False Positive Rate", fontsize=14)
plt.ylabel("True Positive Rate", fontsize=14)

plt.title(
    "KNN - ROC Curve (All Classes)",
    fontsize=18
)

plt.legend(
    loc="lower right",
    fontsize=12
)

plt.grid(alpha=0.3)
plt.tight_layout()

roc_path = os.path.join(BASE_DIR, "KNN_ROC_All_Classes.png")
plt.savefig(roc_path, dpi=300, bbox_inches="tight")
plt.show()
plt.close()

print(f"บันทึกกราฟ ROC รวม 3 Classes: {roc_path}")


# -----------------------------------------------------------------------
# สรุปไฟล์กราฟที่สร้าง
# -----------------------------------------------------------------------
print("\n=== KNN Graphs ===")
print("1. KNN_Confusion_Matrix.png")
print("2. KNN_Feature_Importance.png")
print("3. KNN_ROC_All_Classes.png")


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

print(f"\nบันทึกโมเดลที่ดีที่สุดไปที่: {MODEL_PATH}")


# -----------------------------------------------------------------------
# 7) โหลดโมเดลกลับมาใช้งาน
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

print("\nตัวอย่างการทำนาย 5 แถวแรก:")
print(sample_pred_labels)
