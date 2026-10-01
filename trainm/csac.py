from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

param_grid = {
    "hidden_layer_sizes": [ (50,),(100,),(50, 50),(100, 50) ],
    "activation": ["relu", "tanh"],
    "alpha": [0.0001, 0.001, 0.01],
    "learning_rate_init": [0.001, 0.01]
}

all_combinations = list(ParameterGrid(param_grid))

results = []

for i, params in enumerate(all_combinations, start=1):

    pipeline = ImbPipeline([
        ("scaler", StandardScaler()),
        ("smote", SMOTE(random_state=42)),
        ("model", MLPClassifier(
            random_state=42,
            max_iter=1000,
            early_stopping=True,
            **params
        ))
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
        n_jobs=4
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
        "model": pipeline
    })

best_result = max(
    results,
    key=lambda r: r["f1_macro_cv"]
)

best_model = best_result["model"]

print("\n=== Best Neural Network ===")
print("Best Params :", best_result["params"])
print("Accuracy CV :", round(best_result["accuracy_cv"], 4))
print("F1 Macro    :", round(best_result["f1_macro_cv"], 4))
print("Precision   :", round(best_result["precision_macro_cv"], 4))
print("Recall      :", round(best_result["recall_macro_cv"], 4))
print("ROC-AUC     :", round(best_result["roc_auc_cv"], 4))