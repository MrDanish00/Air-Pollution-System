def calculate_aqi_from_pm25(pm25):
    """
    Calculate AQI from PM2.5 concentration using US EPA standard
    PM2.5 (µg/m³) to AQI conversion
    """
    if pm25 <= 12.0:
        return linear_scale(pm25, 0, 12.0, 0, 50)
    elif pm25 <= 35.4:
        return linear_scale(pm25, 12.1, 35.4, 51, 100)
    elif pm25 <= 55.4:
        return linear_scale(pm25, 35.5, 55.4, 101, 150)
    elif pm25 <= 150.4:
        return linear_scale(pm25, 55.5, 150.4, 151, 200)
    elif pm25 <= 250.4:
        return linear_scale(pm25, 150.5, 250.4, 201, 300)
    elif pm25 <= 350.4:
        return linear_scale(pm25, 250.5, 350.4, 301, 400)
    elif pm25 <= 500.4:
        return linear_scale(pm25, 350.5, 500.4, 401, 500)
    else:
        return 500


def linear_scale(value, in_min, in_max, out_min, out_max):
    """Linear interpolation for AQI calculation"""
    return ((value - in_min) * (out_max - out_min) / (in_max - in_min)) + out_min
