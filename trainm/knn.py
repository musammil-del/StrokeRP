import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
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
MODEL_PATH = os.path.join(BASE_DIR, "KNN_Stroke.pkl")

TARGET_COL = "Stroke_Type"
ID_COLS = ["Patient_ID"]

df = pd.read_csv(DATA_PATH)

id_cols_present = [c for c in ID_COLS if c in df.columns]

if id_cols_present:
    print("ตัดคอลัมน์รหัสผู้ป่วยออก:", id_cols_present)


# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล
# -----------------------------------------------------------------------

X = df.drop(columns=[TARGET_COL] + id_cols_present)
y_raw = df[TARGET_COL]

print("Selected features:", list(X.columns))

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
    "n_neighbors": [3, 5, 7, 9, 11],
    "weights": ["uniform", "distance"],
    "metric": ["euclidean", "manhattan", "minkowski"],
    "p": [1, 2]
}

all_combinations = list(ParameterGrid(param_grid))

print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ...\n")

results = []

for i, params in enumerate(all_combinations, start=1):

    # StandardScaler -> SMOTE -> K-NN
    pipeline = ImbPipeline([
        ("scaler", StandardScaler()),
        ("smote", SMOTE(random_state=42)),
        ("model", KNeighborsClassifier(
            **params
        )),
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


# เลือกชุดที่ F1-Macro สูงสุด
best_result = max(
    results,
    key=lambda r: r["f1_macro_cv"]
)

best_model = best_result["model"]

print("\n=== ผลลัพธ์ Grid Search : K-NN ===")
print(f"Best Set    : Set {best_result['set']}")
print("Best Params :", best_result["params"])
print("Accuracy CV :", round(best_result["accuracy_cv"], 4))
print("F1 Macro    :", round(best_result["f1_macro_cv"], 4))
print("Precision   :", round(best_result["precision_macro_cv"], 4))
print("Recall      :", round(best_result["recall_macro_cv"], 4))
print("ROC-AUC     :", round(best_result["roc_auc_cv"], 4))


# -----------------------------------------------------------------------
# บันทึกผล Grid Search
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


# -----------------------------------------------------------------------
# 5) ประเมิน Test set 30%
# -----------------------------------------------------------------------

y_pred = best_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test, y_pred,
    average="macro",
    zero_division=0
)

recall = recall_score(
    y_test, y_pred,
    average="macro",
    zero_division=0
)

f1 = f1_score(
    y_test, y_pred,
    average="macro",
    zero_division=0
)

print("\n=== ผลการประเมิน K-NN บน Test set (30%) ===")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f} (macro average)")
print(f"Recall    : {recall:.4f} (macro average)")
print(f"F1-score  : {f1:.4f} (macro average)")


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