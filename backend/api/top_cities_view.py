from rest_framework.views import APIView
from rest_framework.response import Response
from .models import City, AQIReading
from .views import IQAirAPIClient


class TopPollutedCitiesView(APIView):
    """Get top 10 most polluted cities with IQAir AQI"""
    
    def get(self, request):
        from .aqi_calculator import calculate_aqi_from_pm25
        from django.db.models import Max
        
        # Get the latest reading for each city
        cities_with_readings = []
        
        for city in City.objects.filter(is_active=True):
            latest_reading = AQIReading.objects.filter(city=city).order_by('-timestamp').first()
            
            if latest_reading and city.latitude and city.longitude:
                # Use calculated AQI for top cities (prevents rate limiting)
                aqi_value = round(calculate_aqi_from_pm25(latest_reading.pm25), 1)
                pm25_value = latest_reading.pm25
                
                cities_with_readings.append({
                    'city': city.name,
                    'country': city.country,
                    'aqi': round(aqi_value, 1),
                    'pm25': round(pm25_value, 2),
                    'pm10': round(latest_reading.pm10, 2),
                    'timestamp': latest_reading.timestamp.isoformat(),
                    'source': 'Calculated'
                })
        
        # Sort by AQI descending and get top 10
        top_cities = sorted(cities_with_readings, key=lambda x: x['aqi'], reverse=True)[:10]
        
        return Response(top_cities)
