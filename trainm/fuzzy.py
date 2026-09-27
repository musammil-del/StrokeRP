import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, ParameterGrid, cross_validate
from sklearn.base import BaseEstimator, ClassifierMixin
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
DATA_PATH = os.path.join(BASE_DIR, "DTSstrokeSS.csv")
MODEL_PATH = os.path.join(BASE_DIR, "DFuzzyLogic_Stroke2634.pkl")
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
# 4) นิยาม Fuzzy Logic Classifier (Wang-Mendel Rule-Based Fuzzy System)
# -----------------------------------------------------------------------
class FuzzyLogicClassifier(ClassifierMixin, BaseEstimator):
    """
    Fuzzy Logic Classifier แบบ per-feature weighted scoring
    - แบ่งแต่ละ feature เป็น fuzzy set (Low/Medium/High ...) ด้วย triangular membership function
    - เรียนรู้ "ความสัมพันธ์ fuzzy set กับคลาส" จากข้อมูล train (เหมือน fuzzy weight/confidence)
    - ทำนายด้วยผลรวม (ไม่ใช่ผลคูณ) ของ membership ถ่วงน้ำหนักในทุก feature
      -> ไม่ต้องการให้ทุก feature "ตรง" กันพร้อมกัน จึงไม่มีปัญหา curse of dimensionality
         แบบ rule-based ที่ใช้ AND (คูณ) กันทุก feature
    - n_sets: จำนวน fuzzy set ต่อ feature (เช่น 3 = Low/Medium/High)

    หมายเหตุ: ลำดับ (ClassifierMixin, BaseEstimator) ต้องเป็นแบบนี้เท่านั้น (ClassifierMixin ก่อน)
    ไม่งั้น sklearn บางเวอร์ชัน (>=1.6) จะตรวจจับผิดว่าเป็น regressor เพราะ __sklearn_tags__
    ของ BaseEstimator จะ override ของ ClassifierMixin ถ้าลำดับผิด
    """

    def __init__(self, n_sets=3):
        self.n_sets = n_sets

    def _build_membership(self, X):
        n_features = X.shape[1]
        self.mf_params_ = []  # เก็บจุด (a,b,c) ของ triangular MF แต่ละ feature/set

        for f in range(n_features):
            col = X[:, f]
            min_v, max_v = col.min(), col.max()
            points = np.linspace(min_v, max_v, self.n_sets + 2)
            sets = []
            for i in range(self.n_sets):
                a, b, c = points[i], points[i + 1], points[i + 2]
                sets.append((a, b, c))
            self.mf_params_.append(sets)

    @staticmethod
    def _triangular(x, a, b, c):
        if a == b:
            left = np.where(x <= b, 1.0, 0.0)
        else:
            left = (x - a) / (b - a)
        if b == c:
            right = np.where(x >= b, 1.0, 0.0)
        else:
            right = (c - x) / (c - b)
        return np.clip(np.minimum(left, right), 0, 1)

    def _fuzzify(self, X):
        # คืนค่า membership degree shape: (n_samples, n_features, n_sets)
        n_samples, n_features = X.shape
        mem = np.zeros((n_samples, n_features, self.n_sets))
        for f in range(n_features):
            for s, (a, b, c) in enumerate(self.mf_params_[f]):
                mem[:, f, s] = self._triangular(X[:, f], a, b, c)
        return mem

    def fit(self, X, y):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y)
        self.classes_ = np.unique(y)
        n_classes = len(self.classes_)
        n_features = X.shape[1]

        self._build_membership(X)
        mem = self._fuzzify(X)  # (n_samples, n_features, n_sets)

        # class_weights_[f, s, c] = ค่าเฉลี่ย membership ของตัวอย่างคลาส c ใน fuzzy set (f,s)
        # ตีความว่า "ถ้า feature f อยู่ใน fuzzy set s มากเท่าไหร่ มักจะเป็นคลาส c แค่ไหน"
        class_weights = np.zeros((n_features, self.n_sets, n_classes))
        for ci, c in enumerate(self.classes_):
            mask = (y == c)
            if mask.sum() > 0:
                class_weights[:, :, ci] = mem[mask].mean(axis=0)

        # normalize ในแต่ละ (f,s) ให้รวมกันข้ามคลาส = 1 (กลายเป็น "confidence" ของแต่ละ fuzzy set)
        denom = class_weights.sum(axis=2, keepdims=True)
        denom[denom == 0] = 1e-12
        self.class_weights_ = class_weights / denom

        # จำนวน "fuzzy single-feature rule" ทั้งหมดที่ใช้ (feature x fuzzy set)
        self.n_rules_ = n_features * self.n_sets
        return self

    def predict_proba(self, X):
        X = np.asarray(X, dtype=float)
        mem = self._fuzzify(X)  # (n_samples, n_features, n_sets)

        # คะแนนแต่ละคลาส = sum over (feature, set) ของ membership * confidence
        scores = np.einsum("nfs,fsc->nc", mem, self.class_weights_)

        total = scores.sum(axis=1, keepdims=True)
        total[total == 0] = 1e-12
        return scores / total

    def predict(self, X):
        proba = self.predict_proba(X)
        return self.classes_[np.argmax(proba, axis=1)]


# -----------------------------------------------------------------------
# 4.1) วน Grid Search เองทีละชุดพารามิเตอร์ + Cross Validation (k=10)
#      param_grid ของ Fuzzy Logic คือจำนวน fuzzy set ต่อ feature (n_sets)
#      ไม่มี class_weight เพราะให้ SMOTE จัดการเรื่อง imbalance แทน
# -----------------------------------------------------------------------
param_grid = {
    "n_sets": [2, 3, 4, 5],
}

all_combinations = list(ParameterGrid(param_grid))
print(f"\nจำนวนชุดพารามิเตอร์ทั้งหมด: {len(all_combinations)} ชุด")
print("กำลังทำ Grid Search (cv=10) พร้อม SMOTE ... อาจใช้เวลาสักครู่\n")

results = []

for i, params in enumerate(all_combinations, start=1):
    # Pipeline: SMOTE (เฉพาะ train fold) -> FuzzyLogic
    # หมายเหตุ: ไม่ต้องมี Scaler เพราะข้อมูลชุดนี้ normalize เป็นช่วง 0-1 มาแล้ว
    pipeline = ImbPipeline([
        ("smote", SMOTE(random_state=42)),
        ("model", FuzzyLogicClassifier(**params)),
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
results_csv_path = os.path.join(BASE_DIR, "fuzzy_grid_search_results.csv")
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
# 5.1) จำนวน Fuzzy Rule ที่สร้างได้ (แทนส่วน Feature Importance เดิม
#      เพราะ Fuzzy Logic ไม่มี feature_importances_ แบบ tree-based model)
# -----------------------------------------------------------------------
n_rules = best_model.named_steps["model"].n_rules_
print(f"\n=== จำนวน Fuzzy Rule ที่สร้างจากข้อมูล Train ===")
print(f"Total rules: {n_rules}")

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