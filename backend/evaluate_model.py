"""
Model Evaluation Script
Generates confusion matrix and accuracy metrics for the AQI prediction model
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

# Load the trained model
print("Loading model...")
with open('aqi_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Load the dataset
print("Loading dataset...")
df = pd.read_csv('aqi_dataset.csv')

# Prepare features and target
features = ['co', 'no', 'no2', 'o3', 'so2', 'pm25', 'pm10', 'nh3']
X = df[features]
y = df['aqi']

# Make predictions
print("Making predictions...")
y_pred = model.predict(X)

# Regression metrics
print("\n" + "="*60)
print("REGRESSION METRICS (Continuous AQI Prediction)")
print("="*60)
mae = mean_absolute_error(y, y_pred)
r2 = r2_score(y, y_pred)
print(f"Mean Absolute Error (MAE): {mae:.2f} AQI points")
print(f"R² Score: {r2:.4f} ({r2*100:.2f}% variance explained)")

# Calculate accuracy percentage (within ±20 AQI points)
within_20 = np.abs(y - y_pred) <= 20
accuracy_20 = np.mean(within_20) * 100
print(f"Predictions within ±20 AQI: {accuracy_20:.2f}%")

within_10 = np.abs(y - y_pred) <= 10
accuracy_10 = np.mean(within_10) * 100
print(f"Predictions within ±10 AQI: {accuracy_10:.2f}%")

# Convert AQI to categories for confusion matrix
def aqi_to_category(aqi):
    """Convert AQI value to health category"""
    if aqi <= 50:
        return 'Good'
    elif aqi <= 100:
        return 'Moderate'
    elif aqi <= 150:
        return 'Unhealthy Sensitive'
    elif aqi <= 200:
        return 'Unhealthy'
    elif aqi <= 300:
        return 'Very Unhealthy'
    else:
        return 'Hazardous'

# Create categorical predictions
y_cat = pd.Series(y).apply(aqi_to_category)
y_pred_cat = pd.Series(y_pred).apply(aqi_to_category)

# Classification metrics
print("\n" + "="*60)
print("CLASSIFICATION METRICS (AQI Category Prediction)")
print("="*60)

# Confusion Matrix
categories = ['Good', 'Moderate', 'Unhealthy Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous']
cm = confusion_matrix(y_cat, y_pred_cat, labels=categories)

print("\nConfusion Matrix:")
print("-" * 60)
cm_df = pd.DataFrame(cm, index=categories, columns=categories)
print(cm_df)

# Calculate category accuracy
category_accuracy = np.trace(cm) / np.sum(cm) * 100
print(f"\nCategory Prediction Accuracy: {category_accuracy:.2f}%")

# Classification Report
print("\nClassification Report:")
print("-" * 60)
print(classification_report(y_cat, y_pred_cat, labels=categories, zero_division=0))

# Save confusion matrix visualization
print("\nGenerating confusion matrix visualization...")
plt.figure(figsize=(10, 8))
sns.heatmap(cm_df, annot=True, fmt='d', cmap='Blues', cbar_kws={'label': 'Count'})
plt.title('AQI Category Prediction Confusion Matrix', fontsize=16, fontweight='bold')
plt.ylabel('Actual Category', fontsize=12)
plt.xlabel('Predicted Category', fontsize=12)
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
print("Confusion matrix saved as 'confusion_matrix.png'")

# Additional analysis
print("\n" + "="*60)
print("DETAILED ANALYSIS")
print("="*60)

# Per-category accuracy
print("\nPer-Category Accuracy:")
for i, cat in enumerate(categories):
    if cm[i].sum() > 0:
        cat_acc = cm[i][i] / cm[i].sum() * 100
        print(f"  {cat:20s}: {cat_acc:6.2f}% ({cm[i][i]}/{cm[i].sum()})")
    else:
        print(f"  {cat:20s}: No samples")

# Error distribution
errors = np.abs(y - y_pred)
print(f"\nError Distribution:")
print(f"  Mean Error: {np.mean(errors):.2f} AQI")
print(f"  Median Error: {np.median(errors):.2f} AQI")
print(f"  Max Error: {np.max(errors):.2f} AQI")
print(f"  Min Error: {np.min(errors):.2f} AQI")
print(f"  Std Dev: {np.std(errors):.2f} AQI")

print("\n" + "="*60)
print("EVALUATION COMPLETE!")
print("="*60)
