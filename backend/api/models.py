from django.db import models
from django.contrib.auth.models import User

class City(models.Model):
    name = models.CharField(max_length=100, unique=True)
    country = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cities'
        verbose_name_plural = 'Cities'

    def __str__(self):
        return f"{self.name}, {self.country}"


class AQIReading(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='readings')
    aqi = models.IntegerField()
    co = models.FloatField(help_text='Carbon Monoxide (μg/m³)')
    no = models.FloatField(help_text='Nitrogen Monoxide (μg/m³)', null=True)
    no2 = models.FloatField(help_text='Nitrogen Dioxide (μg/m³)')
    o3 = models.FloatField(help_text='Ozone (μg/m³)')
    so2 = models.FloatField(help_text='Sulphur Dioxide (μg/m³)')
    pm25 = models.FloatField(help_text='Fine Particles Matter (μg/m³)')
    pm10 = models.FloatField(help_text='Coarse Particulate Matter (μg/m³)')
    nh3 = models.FloatField(help_text='Ammonia (μg/m³)')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'aqi_readings'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['city', '-timestamp']),
            models.Index(fields=['aqi']),
        ]

    def __str__(self):
        return f"{self.city.name} - AQI: {self.aqi} at {self.timestamp}"


class Prediction(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='predictions')
    predicted_aqi = models.FloatField()
    confidence_score = models.FloatField()
    prediction_date = models.DateField()
    model_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'predictions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Prediction for {self.city.name}: {self.predicted_aqi}"


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='alerts')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.severity.upper()} Alert for {self.city.name}"


class EmailSubscription(models.Model):
    """User email subscriptions for air quality alerts"""
    email = models.EmailField()
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='subscriptions')
    is_active = models.BooleanField(default=True)
    alert_threshold = models.IntegerField(default=150, help_text='AQI threshold to trigger alerts')
    last_alert_sent = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'email_subscriptions'
        ordering = ['-created_at']
        unique_together = ['email', 'city']  # One subscription per email per city

    def __str__(self):
        return f"{self.email} subscribed to {self.city.name}"
