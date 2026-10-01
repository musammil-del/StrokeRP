import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_predict, GridSearchCV, StratifiedKFold
from sklearn.metrics import (
    confusion_matrix,
    accuracy_score,
    precision_score,
    f1_score,
    recall_score,
    classification_report
)
from sklearn.preprocessing import LabelEncoder
import joblib as jb
import numpy as np

# โหลดชุดข้อมูล StrokesSs.csv
data = pd.read_csv("StrokesSs.csv")
data.fillna(0, inplace=True)

# แยก Features (X) และ Target (y)
X = data.drop(['Stroke_Type'], axis=1).values

le = LabelEncoder()
y = data['Stroke_Type']
y_encode = le.fit_transform(y)

# สร้างโมเดล Random Forest
model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight=None,
    max_depth=20,
    min_samples_leaf=1,
    min_samples_split=4
)


# 10-Fold Stratified Cross Validation
cv = StratifiedKFold(
    n_splits=10,
    shuffle=True,
    random_state=42
)


# ทำนายด้วย 10-Fold Cross Validation
y_pred = cross_val_predict(
    model,
    X,
    y_encode,
    cv=cv
)


# ประเมินประสิทธิภาพโมเดล
acc = accuracy_score(y_encode, y_pred)
pre = precision_score(
    y_encode,
    y_pred,
    average='macro',
    zero_division=0
)
rec = recall_score(
    y_encode,
    y_pred,
    average='macro',
    zero_division=0
)
f1 = f1_score(
    y_encode,
    y_pred,
    average='macro',
    zero_division=0
)


# แสดงผล
print("=== Report (10-Fold Cross Validation) ===")
print(f" Accuracy  : {acc:.2%}")
print(f" Precision : {pre:.2%}")
print(f" Recall    : {rec:.2%}")
print(f" F1-Score  : {f1:.2%}")

print("\n=== Classification Report ===")
print(
    classification_report(
        y_encode,
        y_pred,
        target_names=le.classes_,
        zero_division=0
    )
)


# Confusion Matrix
print("=== Confusion Matrix ===")
print(confusion_matrix(y_encode, y_pred))