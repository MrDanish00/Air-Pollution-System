from rest_framework import serializers
from .models import City, AQIReading, Prediction, Alert, EmailSubscription

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