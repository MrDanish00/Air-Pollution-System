
import pandas as pd
import numpy as np

def generate_aqi_dataset(n_samples=6000):
    np.random.seed(42)


    pm25 = np.random.lognormal(mean=3.5, sigma=1.0, size=n_samples)
    pm25 = np.clip(pm25, 0, 500)

    pm10 = pm25 * np.random.uniform(1.5, 2.5, size=n_samples)
    pm10 = np.clip(pm10, 0, 600)

    co = np.random.lognormal(mean=6.0, sigma=1.5, size=n_samples)
    co = np.clip(co, 0, 50000)

    no = np.random.lognormal(mean=2.0, sigma=1.0, size=n_samples)
    no = np.clip(no, 0, 200)

    no2 = np.random.lognormal(mean=3.0, sigma=1.0, size=n_samples)
    no2 = np.clip(no2, 0, 400)

    o3 = np.random.lognormal(mean=3.5, sigma=0.8, size=n_samples)
    o3 = np.clip(o3, 0, 500)

    so2 = np.random.lognormal(mean=2.5, sigma=1.2, size=n_samples)
    so2 = np.clip(so2, 0, 1000)

    nh3 = np.random.lognormal(mean=2.0, sigma=1.0, size=n_samples)
    nh3 = np.clip(nh3, 0, 400)


    def calculate_aqi_from_pm25(pm25_value):
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

    aqi = np.array([calculate_aqi_from_pm25(pm) for pm in pm25])
    aqi = np.clip(aqi, 0, 500)

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

    dataset = dataset.round(2)

    return dataset

if __name__ == "__main__":
    print("=" * 60)
    print("Generating Synthetic Air Quality Dataset")
    print("=" * 60)

    print("\n Generating 6000 samples of air quality data...")
    df = generate_aqi_dataset(n_samples=6000)

    print("\n Dataset Generated Successfully!")
    print(f"\nDataset Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print("\n Statistical Summary:")
    print(df.describe())

    print("\n AQI Distribution:")
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

    output_file = "aqi_dataset.csv"
    df.to_csv(output_file, index=False)
    print(f"\n Dataset saved to: {output_file}")
    print("\n" + "=" * 60)
    print(" Dataset generation complete!")
    print("Next step: Run 'python train_model.py' to train the ML model")
    print("=" * 60)
