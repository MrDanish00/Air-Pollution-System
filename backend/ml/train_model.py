
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import pickle
import os

def load_dataset(filepath='aqi_dataset.csv'):
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Dataset not found at {filepath}.\n"
            "Please run 'python generate_dataset.py' first to create the dataset."
        )

    df = pd.read_csv(filepath)
    print(f" Dataset loaded: {df.shape[0]} samples, {df.shape[1]} features")
    return df

def train_model(df):
    feature_columns = ['co', 'no', 'no2', 'o3', 'so2', 'pm25', 'pm10', 'nh3']
    target_column = 'aqi'

    X = df[feature_columns]
    y = df[target_column]

    print(f"\n Training Data:")
    print(f"  Features: {', '.join(feature_columns)}")
    print(f"  Target: {target_column}")
    print(f"  Total samples: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"\n Data Split:")
    print(f"  Training samples: {len(X_train)}")
    print(f"  Testing samples: {len(X_test)}")

    print("\n Training RandomForest Model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)
    print(" Model training complete!")

    print("\n Evaluating Model Performance...")
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    metrics = {
        'mae': mae,
        'rmse': rmse,
        'r2': r2
    }

    print("\n" + "=" * 60)
    print(" Model Performance Metrics:")
    print("=" * 60)
    print(f"  Mean Absolute Error (MAE):  {mae:.2f}")
    print(f"  Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"  R² Score: {r2:.4f}")
    print("=" * 60)

    if mae < 20:
        print(" Excellent! MAE < 20 - Model is highly accurate")
    elif mae < 30:
        print(" Good! MAE < 30 - Model performance is acceptable")
    else:
        print(" ️  Warning: MAE > 30 - Consider model tuning")

    if r2 > 0.9:
        print(" Excellent! R² > 0.9 - Model explains data very well")
    elif r2 > 0.8:
        print(" Good! R² > 0.8 - Model has good explanatory power")

    print("\n Feature Importance (Top contributors to AQI):")
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    for idx, row in feature_importance.iterrows():
        print(f"  {row['feature']:8s}: {row['importance']:.4f}")

    return model, metrics

def save_model(model, filepath='aqi_model.pkl'):
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
    print(f"\n Model saved to: {filepath}")
    print(f"   File size: {os.path.getsize(filepath) / 1024:.2f} KB")

def test_prediction(model):
    print("\n Testing Model with Sample Prediction:")
    print("-" * 60)

    sample = {
        'co': 500.0,
        'no': 15.0,
        'no2': 25.0,
        'o3': 50.0,
        'so2': 10.0,
        'pm25': 45.0,
        'pm10': 75.0,
        'nh3': 20.0
    }

    print("Input Pollutant Concentrations:")
    for key, value in sample.items():
        print(f"  {key.upper():6s}: {value:.2f} µg/m³")

    sample_df = pd.DataFrame([sample])
    predicted_aqi = model.predict(sample_df)[0]

    print(f"\n Predicted AQI: {predicted_aqi:.1f}")

    if predicted_aqi <= 50:
        category = "Good"
    elif predicted_aqi <= 100:
        category = "Moderate"
    elif predicted_aqi <= 150:
        category = "Unhealthy for Sensitive Groups"
    elif predicted_aqi <= 200:
        category = "Unhealthy"
    elif predicted_aqi <= 300:
        category = "Very Unhealthy"
    else:
        category = "Hazardous"

    print(f"   Category: {category}")
    print("-" * 60)

if __name__ == "__main__":
    print("=" * 60)
    print("AQI Prediction Model Training")
    print("=" * 60)

    try:
        print("\n Loading dataset...")
        df = load_dataset()

        model, metrics = train_model(df)

        save_model(model)

        test_prediction(model)

        print("\n" + "=" * 60)
        print(" Model Training Complete!")
        print("=" * 60)
        print("\n Summary:")
        print(f"  - Model Type: RandomForest Regressor")
        print(f"  - Training Samples: 4800")
        print(f"  - Test Samples: 1200")
        print(f"  - MAE: {metrics['mae']:.2f}")
        print(f"  - R² Score: {metrics['r2']:.4f}")
        print("\n Next Steps:")
        print("  1. Run 'python visualize_data.py' to see data analysis")
        print("  2. Integrate model with Django API (ml_utils.py)")
        print("  3. Test with live API data")
        print("=" * 60)

    except FileNotFoundError as e:
        print(f"\n Error: {e}")
        print("\n Solution: Run 'python generate_dataset.py' first")
    except Exception as e:
        print(f"\n Unexpected error: {e}")
        import traceback
        traceback.print_exc()
