"""
XGBoost Classifier - Train/Test Split (70/30) + GridSearchCV (10-fold CV)
================================================================================
- โหลดข้อมูลจาก Book1.xlsx
- แบ่งข้อมูล Train 70% / Test 30%
- ใช้ GridSearchCV (cv=10) เพื่อหาโมเดล XGBoost ที่ดีที่สุด
- ประเมินผลด้วย Accuracy, Precision, Recall, F1-score, RMSE
- บันทึกโมเดลที่ดีที่สุดด้วย joblib เป็นไฟล์ .pkl
"""

import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    mean_squared_error,
    classification_report,
    confusion_matrix,
)

# -----------------------------------------------------------------------
# 1) โหลดข้อมูล
# -----------------------------------------------------------------------
DATA_PATH = "nfs11.xlsx"          # เปลี่ยน path ตามตำแหน่งไฟล์จริงของคุณ
MODEL_PATH = "best_xgboost_model.pkl"
TARGET_COL = "Stroke_Type"        # คอลัมน์เป้าหมาย (label)
ID_COL = "Patient_ID"             # คอลัมน์ ID ที่ไม่ใช้เป็น feature

df = pd.read_excel(DATA_PATH)

# -----------------------------------------------------------------------
# 2) เตรียมข้อมูล (X, y)
# -----------------------------------------------------------------------
# ตัดคอลัมน์ ID ออก เพราะไม่ใช่ feature ที่มีความหมายต่อการทำนาย
X = df.drop(columns=[TARGET_COL, ID_COL])
y_raw = df[TARGET_COL]

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
# 4) Grid Search + Cross Validation (k=10) เพื่อหาโมเดลที่ดีที่สุด
# -----------------------------------------------------------------------
param_grid = {
    "n_estimators": [100, 200],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.01, 0.1, 0.2],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0],
}

# หมายเหตุ: ตั้ง n_jobs=1 ที่ตัวโมเดล เพื่อไม่ให้ขนาน (parallel) ซ้อนกับ GridSearchCV
# (GridSearchCV ใช้ n_jobs=-1 เพื่อรันหลาย combination พร้อมกันแทน)
xgb_clf = XGBClassifier(
    objective="multi:softprob",   # multi-class classification
    num_class=len(label_encoder.classes_),
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=1,
)

grid_search = GridSearchCV(
    estimator=xgb_clf,
    param_grid=param_grid,
    cv=10,                     # k-fold cross validation, k=10
    scoring="f1_macro",        # ใช้ f1_macro เพราะเป็นปัญหา multi-class ที่ข้อมูลไม่สมดุล
    n_jobs=-1,
    verbose=1,
)

print("\nกำลังทำ Grid Search (cv=10) ... อาจใช้เวลาสักครู่")
grid_search.fit(X_train, y_train)

print("\n=== ผลลัพธ์ Grid Search ===")
print("Best Params :", grid_search.best_params_)
print("Best CV Score (f1_macro) :", round(grid_search.best_score_, 4))

best_model = grid_search.best_estimator_

# -----------------------------------------------------------------------
# 5) ประเมินผลบนชุด Test (30%)
# -----------------------------------------------------------------------
y_pred = best_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average="macro")
recall = recall_score(y_test, y_pred, average="macro")
f1 = f1_score(y_test, y_pred, average="macro")
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print("\n=== ผลการประเมินโมเดลบน Test set (30%) ===")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}  (macro average)")
print(f"Recall    : {recall:.4f}  (macro average)")
print(f"F1-score  : {f1:.4f}  (macro average)")
print(f"RMSE      : {rmse:.4f}")

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

print("=== Confusion Matrix ===")
print(confusion_matrix(y_test, y_pred))

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