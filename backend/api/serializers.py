from rest_framework import serializers
from .models import City, AQIReading, Prediction, Alert, EmailSubscription, UserProfile, Subscription

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'country', 'latitude', 'longitude', 'is_active']


class AQIReadingSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = AQIReading
        fields = ['id', 'city', 'city_name', 'aqi', 'co', 'no', 'no2', 'o3',
                 'so2', 'pm25', 'pm10', 'nh3', 'timestamp']


class PredictionSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = Prediction
        fields = ['id', 'city', 'city_name', 'predicted_aqi', 'confidence_score',
                 'prediction_date', 'model_version', 'created_at']


class AlertSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = Alert
        fields = ['id', 'city', 'city_name', 'severity', 'message',
                 'is_active', 'created_at', 'resolved_at']


class EmailSubscriptionSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = EmailSubscription
        fields = ['id', 'email', 'city', 'city_name', 'is_active',
                 'alert_threshold', 'last_alert_sent', 'created_at']
        read_only_fields = ['last_alert_sent', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'phone_number', 'receive_email_alerts']


class SubscriptionSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    country = serializers.CharField(source='city.country', read_only=True)
    aqi = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ['id', 'city', 'city_name', 'country', 'is_active', 'alert_threshold', 'alert_interval_hours', 'created_at', 'aqi', 'status']
        read_only_fields = ['created_at']

    def get_aqi(self, obj):
        # Get latest reading for the city
        reading = AQIReading.objects.filter(city=obj.city).order_by('-timestamp').first()
        if reading:
            from .aqi_calculator import calculate_aqi_from_pm25
            return round(calculate_aqi_from_pm25(reading.pm25), 1)
        return None

    def get_status(self, obj):
        aqi = self.get_aqi(obj)
        if aqi is None: return "Unknown"
        if aqi <= 50: return "Good"
        if aqi <= 100: return "Moderate"
        if aqi <= 150: return "Unhealthy for Sensitive"
        if aqi <= 200: return "Unhealthy"
        if aqi <= 300: return "Very Unhealthy"
        return "Hazardous"