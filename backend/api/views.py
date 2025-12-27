from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import requests
from .models import City, AQIReading, Prediction, Alert, EmailSubscription
from .serializers import CitySerializer, AQIReadingSerializer, PredictionSerializer, AlertSerializer, EmailSubscriptionSerializer
import numpy as np

# 🔑 PASTE YOUR API KEY HERE!
# To get a FREE API key, visit: https://openweathermap.org/api
# Replace "your_api_key_here" below with your actual key:
# ```
OPENWEATHER_API_KEY="9237466d47020de0c677982c2ac6dfd6"
OPENWEATHER_BASE_URL = 'http://api.openweathermap.org/data/2.5/air_pollution'

# IQAir API - More accurate real-time AQI data
IQAIR_API_KEY = "0d63563d-6b29-42bf-a5e9-ff30d611b521"
IQAIR_BASE_URL = "http://api.airvisual.com/v2"

class IQAirAPIClient:
    """
    Client for IQAir API (free tier)
    Provides: Real-time AQI and PM2.5 data (more accurate than OpenWeather)
    Free tier limitations: GPS coordinates required, 10,000 calls/month
    """
    
    @staticmethod
    def get_city_aqi(lat, lon):
        """
        Fetch real-time AQI from IQAir using GPS coordinates
        Returns: dict with aqi, pm25, timestamp or None if failed
        """
        try:
            # IQAir free tier: nearest_city endpoint with lat/lon
            url = f"{IQAIR_BASE_URL}/nearest_city"
            params = {
                'lat': lat,
                'lon': lon,
                'key': IQAIR_API_KEY
            }
            
            print(f"🌍 Fetching IQAir data for ({lat}, {lon})...")
            response = requests.get(url, params=params, timeout=10)
            
            print(f"IQAir API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"IQAir Response: {data}")
                
                if data.get('status') == 'success':
                    current = data['data']['current']['pollution']
                    aqi_value = current.get('aqius', 0)
                    pm25_value = current.get('p2', {}).get('conc', 0)
                    
                    print(f"✅ IQAir AQI: {aqi_value}, PM2.5: {pm25_value}")
                    
                    return {
                        'aqi': aqi_value,
                        'pm25': pm25_value,
                        'timestamp': current.get('ts', ''),
                        'source': 'iqair'
                    }
                else:
                    print(f"❌ IQAir API returned non-success status: {data.get('status')}")
            else:
                print(f"❌ IQAir API HTTP error: {response.status_code} - {response.text[:200]}")
            
            return None
        except Exception as e:
            print(f"❌ IQAir API exception: {str(e)}")
            return None

class OpenWeatherAPIClient:
    """Client for OpenWeather Air Pollution API"""
    
    # Whitelist of major world cities (to prevent obscure matches)
    ALLOWED_CITIES = {
        # Pakistan
        'lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta',
        # India
        'delhi', 'mumbai', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur',
        # China
        'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu', 'wuhan', 'hangzhou',
        # Japan
        'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'sapporo', 'fukuoka',
        # Middle East
        'dubai', 'abu dhabi', 'riyadh', 'jeddah', 'doha', 'kuwait city', 'baghdad', 'tehran', 'istanbul',
        # Europe
        'london', 'paris', 'berlin', 'madrid', 'rome', 'barcelona', 'amsterdam', 'vienna', 'prague', 
        'brussels', 'zurich', 'geneva', 'milan', 'athens', 'lisbon', 'copenhagen', 'stockholm', 'oslo',
        'helsinki', 'warsaw', 'budapest', 'dublin', 'edinburgh', 'manchester',
        # Americas
        'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio',
        'san diego', 'dallas', 'san jose', 'austin', 'miami', 'seattle', 'boston', 'san francisco',
        'toronto', 'montreal', 'vancouver', 'calgary', 'mexico city', 'guadalajara', 'monterrey',
        'buenos aires', 'sao paulo', 'rio de janeiro', 'lima', 'bogota', 'santiago',
        # Southeast Asia
        'singapore', 'bangkok', 'jakarta', 'manila', 'kuala lumpur', 'hanoi', 'ho chi minh city',
        # Australia
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'auckland', 'wellington',
        # Africa
        'cairo', 'johannesburg', 'cape town', 'lagos', 'nairobi', 'casablanca',
        # Russia
        'moscow', 'st petersburg', 'novosibirsk',
        # Korea
        'seoul', 'busan', 'incheon',
    }
    
    @staticmethod
    def get_coordinates(city_name):
        """Get coordinates for a city with whitelist validation"""
        # Reject very short searches
        if len(city_name) < 4:
            print(f"❌ City name too short: '{city_name}' (minimum 4 characters required)")
            return None, None, None
        
        # Check against whitelist first
        city_lower = city_name.lower().strip()
        if city_lower not in OpenWeatherAPIClient.ALLOWED_CITIES:
            print(f"❌ City not in allowed list: '{city_name}' (not a major city)")
            return None, None, None
            
        geo_url = "http://api.openweathermap.org/geo/1.0/direct"
        params = {'q': city_name, 'limit': 1, 'appid': OPENWEATHER_API_KEY}
        
        try:
            response = requests.get(geo_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data:
                found_city = data[0]['name'].lower()
                search_city = city_name.lower()
                
                # VERY STRICT MATCHING RULES
                # 1. Exact match (case-insensitive)
                if found_city == search_city:
                    print(f"✅ Exact match: '{city_name}' = '{data[0]['name']}'")
                    return data[0]['lat'], data[0]['lon'], data[0].get('country', 'Unknown')
                
                # 2. Search term is a complete word in multi-word city (e.g., "New" in "New York")
                if search_city in found_city.split():
                    print(f"✅ Word match: '{city_name}' in '{data[0]['name']}'")
                    return data[0]['lat'], data[0]['lon'], data[0].get('country', 'Unknown')
                
                # 3. Allow prefix ONLY if search is 6+ chars AND found city starts with it
                # This allows "Lahore" but rejects "loki"
                if len(search_city) >= 6 and found_city.startswith(search_city):
                    print(f"✅ Prefix match (6+ chars): '{city_name}' -> '{data[0]['name']}'")
                    return data[0]['lat'], data[0]['lon'], data[0].get('country', 'Unknown')
                
                # Everything else is rejected
                print(f"❌ No match: '{city_name}' searched, '{data[0]['name']}' found (too different)")
                return None, None, None
            
            print(f"❌ No city found for: '{city_name}'")
            return None, None, None
        except Exception as e:
            print(f"Error getting coordinates: {e}")
            return None, None, None
    
    @staticmethod
    def get_current_pollution(lat, lon):
        """Get current air pollution data"""
        url = OPENWEATHER_BASE_URL  # Remove /current
        params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHER_API_KEY}
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching pollution data: {e}")
            return None


class AQIDataView(APIView):
    """Get current AQI data for a city"""
    
    def get(self, request):
        city_name = request.query_params.get('city', 'Lahore')
        
        # VALIDATE CITY NAME FIRST - before checking database
        # This prevents using cached invalid cities
        lat, lon, country = OpenWeatherAPIClient.get_coordinates(city_name)
        
        if not lat or not lon:
            # City validation failed or not found
            return Response({
                'error': f'City "{city_name}" not found. Please enter a valid city name.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Now get or create the city with validated coordinates
        city, created = City.objects.get_or_create(
            name=city_name,
            defaults={'country': country, 'latitude': lat, 'longitude': lon}
        )
        
        # Update coordinates if city was created before but had invalid data
        if city.latitude != lat or city.longitude != lon:
            city.latitude = lat
            city.longitude = lon
            city.country = country
            city.save()
        
        # HYBRID APPROACH: Try IQAir for real-time AQI, OpenWeather for detailed pollutants
        iqair_data = IQAirAPIClient.get_city_aqi(city.latitude, city.longitude)
        
        # Always fetch OpenWeather for detailed pollutants
        pollution_data = OpenWeatherAPIClient.get_current_pollution(city.latitude, city.longitude)
        
        if not pollution_data:
            return Response({'error': 'Failed to fetch pollution data'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        components = pollution_data['list'][0]['components']
        pm25 = components.get('pm2_5', 0)
        
        print(f"🔍 OpenWeather PM2.5: {pm25}")
        
        # Use IQAir AQI if available (more accurate), otherwise calculate from PM2.5
        from .aqi_calculator import calculate_aqi_from_pm25
        
        if iqair_data and iqair_data.get('aqi'):
            # Use IQAir's real-time AQI (more accurate)
            calculated_aqi = float(iqair_data['aqi'])
            data_source = 'IQAir (Real-time)'
            print(f"✅ Using IQAir AQI: {calculated_aqi}")
            # Use IQAir's PM2.5 if available
            if iqair_data.get('pm25'):
                pm25 = iqair_data['pm25']
        else:
            # Fallback to calculated AQI from PM2.5
            calculated_aqi = round(calculate_aqi_from_pm25(pm25), 1)
            data_source = 'Calculated from PM2.5'
            print(f"⚠️ IQAir unavailable, calculated AQI from PM2.5 ({pm25}): {calculated_aqi}")
        
        # Save to database for historical tracking
        aqi_for_db = pollution_data['list'][0]['main']['aqi']  # Keep original for reference
        reading = AQIReading.objects.create(
            city=city, aqi=aqi_for_db,
            co=components.get('co', 0),
            no=components.get('no', 0),
            no2=components.get('no2', 0),
            o3=components.get('o3', 0),
            so2=components.get('so2', 0),
            pm25=pm25,
            pm10=components.get('pm10', 0),
            nh3=components.get('nh3', 0)
        )
        
        self.check_and_create_alert(city, aqi_for_db, components, calculated_aqi)
        
        response_data = {
            'city': city_name,
            'aqi': calculated_aqi,  # Use IQAir or calculated AQI
            'co': round(components.get('co', 0), 2),
            'no': round(components.get('no', 0), 2),
            'no2': round(components.get('no2', 0), 2),
            'o3': round(components.get('o3', 0), 2),
            'so2': round(components.get('so2', 0), 2),
            'pm25': round(pm25, 2),
            'pm10': round(components.get('pm10', 0), 2),
            'nh3': round(components.get('nh3', 0), 2),
            'timestamp': reading.timestamp.isoformat(),
            'data_source': data_source,  # Show where AQI came from
            'fresh': True  # Indicator that this is fresh data
        }
        
        return Response(response_data)
    
    def check_and_create_alert(self, city, aqi, components, calculated_aqi):
        """Create alert if AQI exceeds thresholds and send email notifications"""
        from .email_service import check_and_send_alerts
        
        # Use calculated AQI for alerts
        aqi_value = calculated_aqi
        
        # Create alert in database
        if aqi >= 4:
            Alert.objects.create(city=city, severity='high', message=f'Air quality is very poor in {city.name}. Avoid outdoor activities.')
        elif aqi == 3:
            Alert.objects.create(city=city, severity='medium', message=f'Air quality is moderate in {city.name}. Sensitive groups should limit outdoor exposure.')
        
        # Check and send email alerts
        if aqi_value >= 150:  # Unhealthy or worse
            # Determine status
            if aqi_value >= 300:
                status = 'Hazardous'
            elif aqi_value >= 200:
                status = 'Very Unhealthy'
            else:
                status = 'Unhealthy'
            
            # Send alerts to subscribers
            alerts_sent = check_and_send_alerts(
                city=city,
                current_aqi=aqi_value,
                status=status,
                pm25=round(components.get('pm2_5', 0), 2),
                pm10=round(components.get('pm10', 0), 2)
            )
            
            if alerts_sent > 0:
                print(f"Sent {alerts_sent} email alert(s) for {city.name} (AQI: {aqi_value})")


class HistoricalDataView(APIView):
    """Get historical AQI data"""
    
    def get(self, request):
        city_name = request.query_params.get('city', 'Lahore')
        hours = int(request.query_params.get('hours', 24))
        
        try:
            city = City.objects.get(name=city_name)
        except City.DoesNotExist:
            return Response({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)
        
        start_time = timezone.now() - timedelta(hours=hours)
        readings = AQIReading.objects.filter(city=city, timestamp__gte=start_time).order_by('timestamp')
        
        from .aqi_calculator import calculate_aqi_from_pm25
        
        data = []
        for reading in readings:
            # Calculate accurate AQI from PM2.5
            calculated_aqi = round(calculate_aqi_from_pm25(reading.pm25), 1)
            data.append({
                'time': reading.timestamp.strftime('%H:%M'),
                'aqi': calculated_aqi,
                'pm25': round(reading.pm25, 2),
                'pm10': round(reading.pm10, 2),
                'co': round(reading.co, 2)
            })
        
        return Response(data)


class ForecastView(APIView):
    """Get AQI forecast"""
    
    def get(self, request):
        city_name = request.query_params.get('city', 'Lahore')
        
        try:
            city = City.objects.get(name=city_name)
        except City.DoesNotExist:
            return Response({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)
        
        recent_readings = AQIReading.objects.filter(city=city).order_by('-timestamp')[:100]
        
        if recent_readings.count() < 10:
            return Response({'error': 'Insufficient data for forecast'}, status=status.HTTP_400_BAD_REQUEST)
        
        forecast = []
        for day in range(1, 8):
            recent_avg = np.mean([r.aqi * 50 for r in recent_readings[:10]])
            predicted_aqi = recent_avg + np.random.randint(-10, 10)
            confidence = np.random.uniform(75, 95)
            
            forecast.append({
                'day': f'Day {day}',
                'predicted_aqi': round(predicted_aqi, 2),
                'confidence': round(confidence, 2)
            })
            
            Prediction.objects.create(
                city=city,
                predicted_aqi=predicted_aqi,
                confidence_score=confidence,
                prediction_date=timezone.now().date() + timedelta(days=day)
            )
        
        return Response(forecast)


class AlertsView(APIView):
    """Get active alerts"""
    
    def get(self, request):
        city_name = request.query_params.get('city', 'Lahore')
        
        try:
            city = City.objects.get(name=city_name)
        except City.DoesNotExist:
            return Response([])
        
        alerts = Alert.objects.filter(city=city, is_active=True, created_at__gte=timezone.now() - timedelta(hours=24))[:5]
        
        data = []
        for alert in alerts:
            time_diff = timezone.now() - alert.created_at
            if time_diff.seconds < 3600:
                time_ago = f"{time_diff.seconds // 60} mins ago"
            else:
                time_ago = f"{time_diff.seconds // 3600} hours ago"
            
            data.append({
                'id': alert.id,
                'severity': alert.severity,
                'location': city.name,
                'message': alert.message,
                'time': time_ago
            })
        
        return Response(data)


class CitiesView(APIView):
    """Get list of cities"""
    
    def get(self, request):
        cities = City.objects.filter(is_active=True)
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)


class MapDataView(APIView):
    """Get AQI data for multiple cities for map visualization"""
    
    def get(self, request):
        # Default cities to show on map - 75 major cities worldwide
        default_cities = [
            # Pakistan
            'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Rawalpindi', 'Peshawar', 'Quetta',
            # India
            'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune',
            # China
            'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Hong Kong',
            # Middle East
            'Dubai', 'Abu Dhabi', 'Riyadh', 'Doha', 'Kuwait City', 'Tehran', 'Baghdad', 'Jerusalem',
            # Europe
            'London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Brussels', 'Vienna',
            'Athens', 'Istanbul', 'Moscow', 'Warsaw', 'Prague', 'Budapest',
            # North America
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Francisco',
            'Toronto', 'Montreal', 'Vancouver', 'Mexico City',
            # South America
            'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Lima', 'Bogota', 'Santiago',
            # Africa
            'Cairo', 'Lagos', 'Nairobi', 'Johannesburg', 'Casablanca', 'Addis Ababa',
            # Southeast Asia
            'Bangkok', 'Singapore', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Hanoi', 'Ho Chi Minh City',
            # Oceania
            'Sydney', 'Melbourne', 'Auckland', 'Brisbane',
            # Japan & Korea
            'Tokyo', 'Osaka', 'Seoul', 'Busan'
        ]
        
        # Allow custom city list via query params
        cities_param = request.query_params.get('cities', '')
        if cities_param:
            city_names = [city.strip() for city in cities_param.split(',')]
        else:
            city_names = default_cities
        
        map_data = []
        
        for city_name in city_names:
            try:
                try:
                    city = City.objects.get(name=city_name)
                except City.DoesNotExist:
                    city = City.objects.create(
                        name=city_name,
                        country='Unknown',
                        latitude=0.0,
                        longitude=0.0
                    )
                    
                    # Get coordinates if not set for newly created city
                    lat, lon, country = OpenWeatherAPIClient.get_coordinates(city_name)
                    if lat and lon:
                        city.latitude = lat
                        city.longitude = lon
                        city.country = country
                        city.save()
                    else:
                        # If coordinates can't be found for a new city, skip it
                        continue

                # Check for recent reading (within last 5 minutes for fresh data)
                latest_reading = AQIReading.objects.filter(
                    city=city,
                    timestamp__gte=timezone.now() - timedelta(minutes=5)
                ).order_by('-timestamp').first()
                
                # If no recent reading or force refresh, fetch new data
                if not latest_reading or request.query_params.get('refresh'):
                    # Get coordinates if not set for existing city
                    if city.latitude == 0 and city.longitude == 0:
                        lat, lon, country = OpenWeatherAPIClient.get_coordinates(city_name)
                        if lat and lon:
                            city.latitude = lat
                            city.longitude = lon
                            city.country = country
                            city.save()
                        else:
                            continue
                    
                    # Fetch fresh pollution data
                    pollution_data = OpenWeatherAPIClient.get_current_pollution(city.latitude, city.longitude)
                    
                    if pollution_data:
                        components = pollution_data['list'][0]['components']
                        aqi = pollution_data['list'][0]['main']['aqi']
                        pm25 = components.get('pm2_5', 0)
                        
                        from .aqi_calculator import calculate_aqi_from_pm25
                        aqi_value = calculate_aqi_from_pm25(pm25)
                        
                        latest_reading = AQIReading.objects.create(
                            city=city,
                            aqi=aqi,    co=components.get('co', 0),
                            no=components.get('no', 0),
                            no2=components.get('no2', 0),
                            o3=components.get('o3', 0),
                            so2=components.get('so2', 0),
                            pm25=components.get('pm2_5', 0),
                            pm10=components.get('pm10', 0),
                            nh3=components.get('nh3', 0)
                        )
                
                if latest_reading:
                    # Calculate accurate AQI from PM2.5 instead of multiplying by 50
                    from .aqi_calculator import calculate_aqi_from_pm25
                    aqi_value = round(calculate_aqi_from_pm25(latest_reading.pm25), 1)
                    if aqi_value <= 50:
                        status = 'Good'
                        color = 'green'
                    elif aqi_value <= 100:
                        status = 'Moderate'
                        color = 'yellow'
                    elif aqi_value <= 150:
                        status = 'Unhealthy for Sensitive'
                        color = 'orange'
                    elif aqi_value <= 200:
                        status = 'Unhealthy'
                        color = 'red'
                    elif aqi_value <= 300:
                        status = 'Very Unhealthy'
                        color = 'purple'
                    else:
                        status = 'Hazardous'
                        color = 'darkred'
                    
                    map_data.append({
                        'city': city.name,
                        'country': city.country,
                        'latitude': city.latitude,
                        'longitude': city.longitude,
                        'aqi': round(aqi_value, 2),
                        'status': status,
                        'color': color,
                        'pm25': round(latest_reading.pm25, 2),
                        'pm10': round(latest_reading.pm10, 2),
                        'timestamp': latest_reading.timestamp.isoformat()
                    })
                    
            except Exception as e:
                print(f"Error processing city {city_name}: {e}")
                continue
        
        return Response(map_data)