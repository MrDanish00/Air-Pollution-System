"""
Smart Air Quality Monitoring - ML Dataset Generator
===================================================

This script generates a synthetic historical air quality dataset for training
the AQI prediction model. The dataset simulates realistic pollution patterns
based on WHO standards and environmental factors.

Dataset will be used to train a RandomForest regression model that predicts
future AQI values from current pollutant concentrations.

Features (inputs): co, no, no2, o3, so2, pm25, pm10, nh3
Target (output): aqi (0-500 scale, US EPA standard)
"""

import pandas as pd
import numpy as np

def generate_aqi_dataset(n_samples=6000):
    """
    Generate synthetic air quality dataset with realistic pollution patterns
    
    Parameters:
    -----------
    n_samples : int
        Number of data samples to generate (default: 6000)
    
    Returns:
    --------
    pd.DataFrame
        Dataset with pollutant columns and calculated AQI
    """
    np.random.seed(42)  # For reproducibility
    
    # Generate realistic pollutant concentrations
    # Ranges based on WHO air quality guidelines and typical urban pollution levels
    
    # PM2.5 (µg/m³) - Most important for AQI
    # Range: 0-500 (0-50 Good, 50-100 Moderate, 100-250 Unhealthy, 250+ Hazardous)
    pm25 = np.random.lognormal(mean=3.5, sigma=1.0, size=n_samples)
    pm25 = np.clip(pm25, 0, 500)
    
    # PM10 (µg/m³) - Usually 1.5-2x higher than PM2.5
    pm10 = pm25 * np.random.uniform(1.5, 2.5, size=n_samples)
    pm10 = np.clip(pm10, 0, 600)
    
    # CO (µg/m³) - Carbon Mon oxide, range: 0-50000
    co = np.random.lognormal(mean=6.0, sigma=1.5, size=n_samples)
    co = np.clip(co, 0, 50000)
    
    # NO (µg/m³) - Nitric oxide, range: 0-200
    no = np.random.lognormal(mean=2.0, sigma=1.0, size=n_samples)
    no = np.clip(no, 0, 200)
    
    # NO2 (µg/m³) - Nitrogen dioxide, range: 0-400
    no2 = np.random.lognormal(mean=3.0, sigma=1.0, size=n_samples)
    no2 = np.clip(no2, 0, 400)
    
    # O3 (µg/m³) - Ozone, range: 0-500
    o3 = np.random.lognormal(mean=3.5, sigma=0.8, size=n_samples)
    o3 = np.clip(o3, 0, 500)
    
    # SO2 (µg/m³) - Sulfur dioxide, range: 0-1000
    so2 = np.random.lognormal(mean=2.5, sigma=1.2, size=n_samples)
    so2 = np.clip(so2, 0, 1000)
    
    # NH3 (µg/m³) - Ammonia, range: 0-400
    nh3 = np.random.lognormal(mean=2.0, sigma=1.0, size=n_samples)
    nh3 = np.clip(nh3, 0, 400)
    
    # Calculate AQI using PM2.5 as primary indicator (US EPA method)
    # AQI breakpoints for PM2.5:
    # 0-12: Good (0-50 AQI)
    # 12.1-35.4: Moderate (51-100 AQI)
    # 35.5-55.4: Unhealthy for Sensitive (101-150 AQI)
    # 55.5-150.4: Unhealthy (151-200 AQI)
    # 150.5-250.4: Very Unhealthy (201-300 AQI)
    # 250.5+: Hazardous (301-500 AQI)
    
    def calculate_aqi_from_pm25(pm25_value):
        """Calculate AQI using PM2.5 concentration (US EPA formula)"""
        if pm25_value <= 12.0:
            return (50 / 12.0) * pm25_value
        elif pm25_value <= 35.4:
            return 50 + ((100 - 50) / (35.4 - 12.1)) * (pm25_value - 12.1)
        elif pm25_value <= 55.4:
            return 100 + ((150 - 100) / (55.4 - 35.5)) * (pm25_value - 35.5)
        elif pm25_value <= 150.4:
            return 150 + ((200 - 150) / (150.4 - 55.5)) * (pm25_value - 55.5)
        elif pm25_value <= 250.4:
            return 200 + ((300 - 200) / (250.4 - 150.5)) * (pm25_value - 150.5)
        else:
            return 300 + ((500 - 300) / (500 - 250.5)) * min(pm25_value - 250.5, 249.5)
    
    # Calculate AQI for each sample
    aqi = np.array([calculate_aqi_from_pm25(pm) for pm in pm25])
    aqi = np.clip(aqi, 0, 500)  # Ensure within valid range
    
    # Create DataFrame
    dataset = pd.DataFrame({
        'co': co,
        'no': no,
        'no2': no2,
        'o3': o3,
        'so2': so2,
        'pm25': pm25,
        'pm10': pm10,
        'nh3': nh3,
        'aqi': aqi
    })
    
    # Round values for readability
    dataset = dataset.round(2)
    
    return dataset

if __name__ == "__main__":
    print("=" * 60)
    print("Generating Synthetic Air Quality Dataset")
    print("=" * 60)
    
    # Generate dataset
    print("\n📊 Generating 6000 samples of air quality data...")
    df = generate_aqi_dataset(n_samples=6000)
    
    # Display statistics
    print("\n✅ Dataset Generated Successfully!")
    print(f"\nDataset Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print("\n📈 Statistical Summary:")
    print(df.describe())
    
    print("\n🎯 AQI Distribution:")
    aqi_ranges = {
        'Good (0-50)': len(df[df['aqi'] <= 50]),
        'Moderate (51-100)': len(df[(df['aqi'] > 50) & (df['aqi'] <= 100)]),
        'Unhealthy for Sensitive (101-150)': len(df[(df['aqi'] > 100) & (df['aqi'] <= 150)]),
        'Unhealthy (151-200)': len(df[(df['aqi'] > 150) & (df['aqi'] <= 200)]),
        'Very Unhealthy (201-300)': len(df[(df['aqi'] > 200) & (df['aqi'] <= 300)]),
        'Hazardous (301+)': len(df[df['aqi'] > 300])
    }
    
    for category, count in aqi_ranges.items():
        percentage = (count / len(df)) * 100
        print(f"  {category}: {count} ({percentage:.1f}%)")
    
    # Save to CSV
    output_file = "aqi_dataset.csv"
    df.to_csv(output_file, index=False)
    print(f"\n💾 Dataset saved to: {output_file}")
    print("\n" + "=" * 60)
    print("✅ Dataset generation complete!")
    print("Next step: Run 'python train_model.py' to train the ML model")
    print("=" * 60)
