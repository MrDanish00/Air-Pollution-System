"""
Smart Air Quality Monitoring - ML Utilities for Django
=====================================================

This module provides ML model integration with Django REST API.
It loads the trained RandomForest model and makes predictions on
live air quality data from OpenWeather API.

Usage in Django views:
    from .ml_utils import predict_aqi, predict_future_trend
    
    # Predict current AQI from pollutants
    current_aqi = predict_aqi(components_dict)
    
    # Predict 7-day trend
    forecast = predict_future_trend(current_data, days=7)
"""

import pickle
import os
import numpy as np
from datetime import datetime, timedelta

# Path to trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../aqi_model.pkl')

# Global variable to cache loaded model
_model = None

def load_model():
    """
    Load the trained RandomForest model from disk
    
    Returns:
    --------
    model : RandomForestRegressor
        Trained model ready for predictions
    
    Raises:
    -------
    FileNotFoundError
        If model file doesn't exist (need to train first)
    """
    global _model
    
    # Return cached model if already loaded
    if _model is not None:
        return _model
    
    # Check if model file exists
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"ML model not found at {MODEL_PATH}\n"
            "Please run 'python ml/train_model.py' to train the model first."
        )
    
    # Load model from pickle file
    with open(MODEL_PATH, 'rb') as f:
        _model = pickle.load(f)
    
    print(f"ML Model loaded from: {MODEL_PATH}")
    return _model

def predict_aqi(components_dict):
    """
    Predict AQI from pollutant concentrations (single prediction)
    
    Parameters:
    -----------
    components_dict : dict
        Dictionary containing pollutant values from OpenWeather API
        Required keys: co, no, no2, o3, so2, pm2_5, pm10, nh3
        
    Returns:
    --------
    float
        Predicted AQI value (0-500 scale)
        
    Example:
    --------
    >>> components = {
    ...     'co': 500.0,
    ...     'no': 15.0,
    ...     'no2': 25.0,
    ...     'o3': 50.0,
    ...     'so2': 10.0,
    ...     'pm2_5': 45.0,
    ...     'pm10': 75.0,
    ...     'nh3': 20.0
    ... }
    >>> aqi = predict_aqi(components)
    >>> print(f"Predicted AQI: {aqi:.1f}")
    """
    try:
        # Load model
        model = load_model()
        
        # Use pandas DataFrame to preserve feature names (avoid sklearn warning)
        import pandas as pd
        features = pd.DataFrame([[
            components_dict.get('co', 0),
            components_dict.get('no', 0),
            components_dict.get('no2', 0),
            components_dict.get('o3', 0),
            components_dict.get('so2', 0),
            components_dict.get('pm2_5', 0),
            components_dict.get('pm10', 0),
            components_dict.get('nh3', 0)
        ]], columns=['co', 'no', 'no2', 'o3', 'so2', 'pm25', 'pm10', 'nh3'])
        
        # Make prediction
        predicted_aqi = model.predict(features)[0]
        
        # Ensure AQI is within valid range
        predicted_aqi = max(0, min(500, predicted_aqi))
        
        return round(predicted_aqi, 1)
        
    except Exception as e:
        print(f"Error in predict_aqi: {e}")
        # Fallback to simple PM2.5-based calculation
        from .aqi_calculator import calculate_aqi_from_pm25
        pm25 = components_dict.get('pm2_5', 0)
        return calculate_aqi_from_pm25(pm25)

def predict_future_trend(current_data, days=7):
    """
    Predict future AQI trend for next N days
    
    This uses the current pollutant levels and applies small random variations
    to simulate potential future conditions (simplified forecasting).
    
    Parameters:
    -----------
    current_data : dict
        Current pollutant concentrations from API
    days : int
        Number of days to forecast (default: 7)
        
    Returns:
    --------
    list of dict
        List of predictions, each containing:
        - date: str (YYYY-MM-DD)
        - predicted_aqi: float
        - confidence: float (0-1, decreases with time)
        
    Example:
    --------
    >>> forecast = predict_future_trend(current_data, days=7)
    >>> for day in forecast:
    ...     print(f"{day['date']}: AQI = {day['predicted_aqi']:.1f}")
    """
    try:
        model = load_model()
        forecast = []
        
        # Base prediction on current data
        base_aqi = predict_aqi(current_data)
        
        # Generate forecast for each day
        for day in range(1, days + 1):
            # Apply small random variations (±10% with trend)
            # Real forecasting would use weather data, historical patterns, etc.
            variation = np.random.normal(0, base_aqi * 0.05)
            trend = day * 2  # Slight upward trend (pollution tends to accumulate)
            
            predicted_aqi = base_aqi + variation + trend
            predicted_aqi = max(0, min(500, predicted_aqi))
            
            # Confidence decreases with time (less certain about distant future)
            confidence = max(0.5, 1.0 - (day * 0.05))
            
            # Calculate date
            forecast_date = datetime.now() + timedelta(days=day)
            
            forecast.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted_aqi': round(predicted_aqi, 1),
                'confidence': round(confidence, 2)
            })
        
        return forecast
        
    except Exception as e:
        print(f"Error in predict_future_trend: {e}")
        # Return empty forecast on error
        return []

def get_aqi_category(aqi_value):
    """
    Get AQI category and color for a given AQI value
    
    Parameters:
    -----------
    aqi_value : float
        AQI value (0-500)
        
    Returns:
    --------
    dict
        Contains 'category', 'color', and 'message'
    """
    if aqi_value <= 50:
        return {
            'category': 'Good',
            'color': 'green',
            'message': 'Air quality is satisfactory'
        }
    elif aqi_value <= 100:
        return {
            'category': 'Moderate',
            'color': 'yellow',
            'message': 'Acceptable air quality'
        }
    elif aqi_value <= 150:
        return {
            'category': 'Unhealthy for Sensitive Groups',
            'color': 'orange',
            'message': 'Sensitive groups may experience health effects'
        }
    elif aqi_value <= 200:
        return {
            'category': 'Unhealthy',
            'color': 'red',
            'message': 'Everyone may experience health effects'
        }
    elif aqi_value <= 300:
        return {
            'category': 'Very Unhealthy',
            'color': 'purple',
            'message': 'Health alert: everyone may experience serious effects'
        }
    else:
        return {
            'category': 'Hazardous',
            'color': 'maroon',
            'message': 'Health warning: emergency conditions'
        }

# Test function (for development)
if __name__ == "__main__":
    print("Testing ML Utilities...")
    
    # Test data
    test_components = {
        'co': 500.0,
        'no': 15.0,
        'no2': 25.0,
        'o3': 50.0,
        'so2': 10.0,
        'pm2_5': 45.0,
        'pm10': 75.0,
        'nh3': 20.0
    }
    
    try:
        # Test single prediction
        aqi = predict_aqi(test_components)
        category = get_aqi_category(aqi)
        print(f"\nSingle Prediction:")
        print(f"   AQI: {aqi}")
        print(f"   Category: {category['category']}")
        print(f"   {category['message']}")
        
        # Test trend prediction
        forecast = predict_future_trend(test_components, days=7)
        print(f"\n7-Day Forecast:")
        for day in forecast:
            cat = get_aqi_category(day['predicted_aqi'])
            print(f"   {day['date']}: {day['predicted_aqi']} ({cat['category']}) - Confidence: {day['confidence']}")
            
    except FileNotFoundError as e:
        print(f"\n{e}")
        print("   Run 'python ml/train_model.py' first to create the model.")
    except Exception as e:
        print(f"\nError: {e}")
