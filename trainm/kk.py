import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

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
    ConfusionMatrixDisplay,
    make_scorer,
)

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE


# -----------------------------------------------------------------------
# 1) โหลดข้อมูล
# -----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "Dstrokev1.xlsx")
MODEL_PATH = os.path.join(BASE_DIR, "DRandomforest115.pkl")

TARGET_COL = "ประเภทโรคหลอดเลือดสมอง"

# รหัสผู้ป่วยไม่ใช่ feature ทางการแพทย์
ID_COLS = ["รหัสผู้ป่วย"]

df = pd.read_excel(DATA_PATH)

id_cols_present = [
    c for c in ID_COLS
    if c in df.columns
]

if id_cols_present:
    print(
        "ตัดคอลัมน์รหัสผู้ป่วยออก:",
        id_cols_present
    )


# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล X และ y
# -----------------------------------------------------------------------
X = df.drop(
    columns=[TARGET_COL] + id_cols_present
)

y_raw = df[TARGET_COL]

print("\n=== Selected Features ===")
print(list(X.columns))

label_encoder = LabelEncoder()

y = label_encoder.fit_transform(y_raw)

print("\n=== Class Mapping ===")

class_mapping = dict(
    zip(
        label_encoder.classes_,
        label_encoder.transform(
            label_encoder.classes_
        )
    )
)

print(class_mapping)

print("\n=== จำนวนข้อมูลแต่ละคลาส ===")

print(
    pd.Series(y_raw).value_counts()
)


# -----------------------------------------------------------------------
# ตรวจสอบว่า class 2 มีอยู่จริง
# -----------------------------------------------------------------------
if 2 not in np.unique(y):

    raise ValueError(
        "ไม่พบ class 2 หลังจาก LabelEncoder "
        "กรุณาตรวจสอบประเภทข้อมูลใน TARGET_COL"
    )


# -----------------------------------------------------------------------
# 3) แบ่ง Train 70% / Test 30%
# -----------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.30,
    train_size=0.70,
    random_state=42,
    stratify=y,
)

print("\n=== Dataset Split ===")

print(
    f"Train: {X_train.shape[0]} แถว"
)

print(
    f"Test : {X_test.shape[0]} แถว"
)

print("\nจำนวนแต่ละคลาสใน Train:")

print(
    pd.Series(y_train).value_counts().sort_index()
)

print("\nจำนวนแต่ละคลาสใน Test:")

print(
    pd.Series(y_test).value_counts().sort_index()
)


# -----------------------------------------------------------------------
# 4) Scoring
# -----------------------------------------------------------------------

# F1 ของ class 2 โดยเฉพาะ
f1_class2_scorer = make_scorer(
    f1_score,
    average="macro",
    labels=[2],
    zero_division=0
)

# Recall ของ class 2 โดยเฉพาะ
recall_class2_scorer = make_scorer(
    recall_score,
    average="macro",
    labels=[2],
    zero_division=0
)

# Precision ของ class 2 โดยเฉพาะ
precision_class2_scorer = make_scorer(
    precision_score,
    average="macro",
    labels=[2],
    zero_division=0
)


# -----------------------------------------------------------------------
# 5) Parameter Grid
#
# เพิ่ม class_weight สำหรับ class 2
# -----------------------------------------------------------------------

param_grid = {

    "n_estimators": [
        200, 300, 500
    ],

    "criterion": [
        "gini", "entropy"
    ],

    "max_depth": [
        10, 15, 20
    ],
 
    "min_samples_split": [
        2, 5, 10
    ],

    "min_samples_leaf": [
        1, 2, 4
    ],

    # เพิ่มน้ำหนัก class 2
    "class_weight": [
        None,

        "balanced",

        {
            0: 1,
            1: 1,
            2: 1.5
        },

        {
            0: 1,
            1: 1,
            2: 2
        },

        {
            0: 1,
            1: 1,
            2: 3
        }
    ]
}


all_combinations = list(
    ParameterGrid(param_grid)
)

print(
    f"\nจำนวนชุด Parameter ทั้งหมด: "
    f"{len(all_combinations)} ชุด"
)

print(
    "\nกำลังทำ Grid Search + "
    "10-Fold CV + SMOTE ..."
)

print(
    "เน้นเพิ่ม F1 ของ Class 2\n"
)


# -----------------------------------------------------------------------
# 6) Grid Search
# -----------------------------------------------------------------------

results = []

for i, params in enumerate(
    all_combinations,
    start=1
):

    pipeline = ImbPipeline([

        # SMOTE
        (
            "smote",
            SMOTE(
                random_state=42,
                k_neighbors=5
            )
        ),

        # Random Forest
        (
            "model",
            RandomForestClassifier(
                random_state=42,
                n_jobs=1,
                **params
            )
        )
    ])


    # ---------------------------------------------------------------
    # Cross Validation
    # ---------------------------------------------------------------

    cv_results = cross_validate(

        pipeline,

        X_train,

        y_train,

        cv=10,

        scoring={

            "f1_macro":
                "f1_macro",

            "precision_macro":
                "precision_macro",

            "recall_macro":
                "recall_macro",

            "f1_class2":
                f1_class2_scorer,

            "recall_class2":
                recall_class2_scorer,

            "precision_class2":
                precision_class2_scorer,

            "accuracy":
                "accuracy"
        },

        n_jobs=4
    )


    # ค่าเฉลี่ยจาก CV

    f1_macro_cv = np.mean(
        cv_results["test_f1_macro"]
    )

    precision_macro_cv = np.mean(
        cv_results["test_precision_macro"]
    )

    recall_macro_cv = np.mean(
        cv_results["test_recall_macro"]
    )

    f1_class2_cv = np.mean(
        cv_results["test_f1_class2"]
    )

    recall_class2_cv = np.mean(
        cv_results["test_recall_class2"]
    )

    precision_class2_cv = np.mean(
        cv_results["test_precision_class2"]
    )

    accuracy_cv = np.mean(
        cv_results["test_accuracy"]
    )


    # ---------------------------------------------------------------
    # Composite Score
    #
    # ให้น้ำหนัก Class 2 มากกว่า Macro F1
    #
    # 60% = F1 Class 2
    # 40% = Macro F1
    # ---------------------------------------------------------------

    selection_score = (
        0.60 * f1_class2_cv
        +
        0.40 * f1_macro_cv
    )


    # ---------------------------------------------------------------
    # เก็บผล
    # ---------------------------------------------------------------

    results.append({

        "set":
            i,

        "params":
            params,

        "f1_macro_cv":
            f1_macro_cv,

        "precision_macro_cv":
            precision_macro_cv,

        "recall_macro_cv":
            recall_macro_cv,

        "f1_class2_cv":
            f1_class2_cv,

        "precision_class2_cv":
            precision_class2_cv,

        "recall_class2_cv":
            recall_class2_cv,

        "accuracy_cv":
            accuracy_cv,

        "selection_score":
            selection_score,

        "model":
            pipeline
    })


    # ---------------------------------------------------------------
    # แสดงผลทุกชุด
    # ---------------------------------------------------------------

    print(
        f"\nSet {i}/{len(all_combinations)}"
    )

    print(
        "Params:",
        params
    )

    print(
        f"  Accuracy CV       : "
        f"{accuracy_cv:.4f}"
    )

    print(
        f"  Macro F1          : "
        f"{f1_macro_cv:.4f}"
    )

    print(
        f"  Macro Recall      : "
        f"{recall_macro_cv:.4f}"
    )

    print(
        f"  Class 2 Precision : "
        f"{precision_class2_cv:.4f}"
    )

    print(
        f"  Class 2 Recall    : "
        f"{recall_class2_cv:.4f}"
    )

    print(
        f"  Class 2 F1        : "
        f"{f1_class2_cv:.4f}"
    )

    print(
        f"  Selection Score   : "
        f"{selection_score:.4f}"
    )

    print(
        "-" * 70
    )


# -----------------------------------------------------------------------
# 7) เลือกโมเดลที่ดีที่สุด
# -----------------------------------------------------------------------

best_result = max(
    results,
    key=lambda r: r["selection_score"]
)

best_model = best_result["model"]


print("\n")
print("=" * 70)

print(
    "BEST MODEL"
)

print("=" * 70)

print(
    f"Best Set : "
    f"{best_result['set']}"
)

print(
    "\nBest Parameters:"
)

print(
    best_result["params"]
)

print(
    f"\nMacro F1 CV : "
    f"{best_result['f1_macro_cv']:.4f}"
)

print(
    f"Class 2 Precision CV : "
    f"{best_result['precision_class2_cv']:.4f}"
)

print(
    f"Class 2 Recall CV : "
    f"{best_result['recall_class2_cv']:.4f}"
)

print(
    f"Class 2 F1 CV : "
    f"{best_result['f1_class2_cv']:.4f}"
)

print(
    f"Selection Score : "
    f"{best_result['selection_score']:.4f}"
)


# -----------------------------------------------------------------------
# 8) บันทึกผล Grid Search
# -----------------------------------------------------------------------

results_df = pd.DataFrame([

    {
        **r["params"],

        "f1_macro_cv":
            r["f1_macro_cv"],

        "precision_macro_cv":
            r["precision_macro_cv"],

        "recall_macro_cv":
            r["recall_macro_cv"],

        "f1_class2_cv":
            r["f1_class2_cv"],

        "precision_class2_cv":
            r["precision_class2_cv"],

        "recall_class2_cv":
            r["recall_class2_cv"],

        "accuracy_cv":
            r["accuracy_cv"],

        "selection_score":
            r["selection_score"]
    }

    for r in results

])


results_csv_path = os.path.join(
    BASE_DIR,
    "rf_grid_search_results_class2.csv"
)


results_df.to_csv(
    results_csv_path,
    index=False,
    encoding="utf-8-sig"
)


print(
    f"\nบันทึกผล Grid Search ที่:"
    f"\n{results_csv_path}"
)


# -----------------------------------------------------------------------
# 9) Train Best Model
# -----------------------------------------------------------------------

best_model.fit(
    X_train,
    y_train
)


# -----------------------------------------------------------------------
# 10) Predict Test
# -----------------------------------------------------------------------

y_pred = best_model.predict(
    X_test
)


# -----------------------------------------------------------------------
# 11) Overall Metrics
# -----------------------------------------------------------------------

accuracy = accuracy_score(
    y_test,
    y_pred
)

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


print("\n")
print("=" * 70)

print(
    "ผลการประเมินโมเดลบน Test Set"
)

print("=" * 70)

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Precision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1-score  : {f1:.4f}"
)


# -----------------------------------------------------------------------
# 12) Classification Report
# -----------------------------------------------------------------------

print("\n")
print(
    "=== Classification Report ==="
)

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            str(c)
            for c in label_encoder.classes_
        ],
        zero_division=0
    )
)


# -----------------------------------------------------------------------
# 13) ดึงค่า Class 2 โดยเฉพาะ
# -----------------------------------------------------------------------

report = classification_report(
    y_test,
    y_pred,
    output_dict=True,
    zero_division=0
)


class2_precision = report["2"]["precision"]
class2_recall = report["2"]["recall"]
class2_f1 = report["2"]["f1-score"]


print("\n")
print("=" * 70)

print(
    "ผลเฉพาะ Class 2"
)

print("=" * 70)

print(
    f"Class 2 Precision : "
    f"{class2_precision:.4f}"
)

print(
    f"Class 2 Recall    : "
    f"{class2_recall:.4f}"
)

print(
    f"Class 2 F1-score  : "
    f"{class2_f1:.4f}"
)


# -----------------------------------------------------------------------
# 14) Confusion Matrix
# -----------------------------------------------------------------------

cm = confusion_matrix(
    y_test,
    y_pred
)


print("\n")
print(
    "=== Confusion Matrix ==="
)

print(cm)


# -----------------------------------------------------------------------
# 15) สร้างกราฟ Confusion Matrix
# -----------------------------------------------------------------------

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=label_encoder.classes_
)


disp.plot(
    values_format="d"
)


plt.title(
    "Confusion Matrix - Random Forest"
)

plt.xlabel(
    "Predicted Label"
)

plt.ylabel(
    "True Label"
)

plt.tight_layout()


cm_path = os.path.join(
    BASE_DIR,
    "confusion_matrix_class2.png"
)


plt.savefig(
    cm_path,
    dpi=300,
    bbox_inches="tight"
)


print(
    f"\nบันทึก Confusion Matrix ที่:"
    f"\n{cm_path}"
)


plt.show()

plt.close()


# -----------------------------------------------------------------------
# 16) Feature Importance
# -----------------------------------------------------------------------

importances = pd.Series(

    best_model
    .named_steps["model"]
    .feature_importances_,

    index=X.columns

)


importances = importances.sort_values(
    ascending=False
)


print("\n")
print(
    "=== Feature Importance ==="
)

print(
    importances
)


# -----------------------------------------------------------------------
# 17) บันทึก Model
# -----------------------------------------------------------------------

joblib.dump(

    {
        "model":
            best_model,

        "label_encoder":
            label_encoder,

        "feature_columns":
            list(X.columns)
    },

    MODEL_PATH
)


print(
    f"\nบันทึกโมเดลที่ดีที่สุดที่:"
    f"\n{MODEL_PATH}"
)


# -----------------------------------------------------------------------
# 18) ทดสอบโหลด Model
# -----------------------------------------------------------------------

loaded = joblib.load(
    MODEL_PATH
)


loaded_model = loaded["model"]

loaded_encoder = loaded["label_encoder"]

loaded_features = loaded["feature_columns"]


sample_pred = loaded_model.predict(
    X_test[
        loaded_features
    ].iloc[:5]
)


sample_pred_labels = (
    loaded_encoder
    .inverse_transform(sample_pred)
)


print(
    "\nตัวอย่างผลการทำนาย 5 ตัวอย่าง:"
)

print(
    sample_pred_labels
)