from rest_framework.views import APIView
from rest_framework.response import Response
from .models import City, AQIReading


class TopPollutedCitiesView(APIView):
    """Get top 10 most polluted cities"""
    
    def get(self, request):
        from .aqi_calculator import calculate_aqi_from_pm25
        from django.db.models import Max
        
        # Get the latest reading for each city
        cities_with_readings = []
        
        for city in City.objects.filter(is_active=True):
            latest_reading = AQIReading.objects.filter(city=city).order_by('-timestamp').first()
            
            if latest_reading:
                calculated_aqi = round(calculate_aqi_from_pm25(latest_reading.pm25), 1)
                cities_with_readings.append({
                    'city': city.name,
                    'country': city.country,
                    'aqi': calculated_aqi,
                    'pm25': round(latest_reading.pm25, 2),
                    'pm10': round(latest_reading.pm10, 2),
                    'timestamp': latest_reading.timestamp.isoformat()
                })
        
        # Sort by AQI descending and get top 10
        top_cities = sorted(cities_with_readings, key=lambda x: x['aqi'], reverse=True)[:10]
        
        return Response(top_cities)
