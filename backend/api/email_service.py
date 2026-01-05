from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


def send_air_quality_alert(email, city_name, aqi, status, pm25, pm10):
    """Send air quality alert email to subscriber"""
    
    # Determine severity message
    if aqi >= 300:
        severity = "HAZARDOUS"
        message = "Emergency conditions! Everyone should avoid all outdoor exertion."
        color = "🔴"
    elif aqi >= 200:
        severity = "VERY UNHEALTHY"
        message = "Health alert: everyone may experience more serious health effects."
        color = "🟣"
    elif aqi >= 150:
        severity = "UNHEALTHY"
        message = "Everyone may begin to experience health effects."
        color = "🟠"
    else:
        return False  # Don't send for lower AQI
    
    subject = f"{color} Air Quality Alert: {severity} in {city_name}"
    
    email_body = f"""
Air Quality Alert for {city_name}

Status: {severity} ({status})
Current AQI: {aqi}

Air Quality Details:
• PM2.5: {pm25} µg/m³
• PM10: {pm10} µg/m³

Health Advisory:
{message}

Recommendations:
- Avoid prolonged outdoor activities
- Keep windows closed
- Use air purifiers if available
- Wear N95 masks if you must go outside

This is an automated alert from the Air Quality Monitoring System.
To unsubscribe, visit: http://localhost:3000

---
Air Quality Monitoring System
UET Lahore
"""
    
    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email to {email}: {e}")
        return False


def should_send_alert(subscription, current_aqi):
    """
    Check if an alert should be sent based on:
    1. AQI threshold
    2. Time since last alert (throttling)
    """
    
    # Check if AQI exceeds threshold
    print(f"  Checking subscription for {subscription.email}: AQI {current_aqi} vs threshold {subscription.alert_threshold}")
    if current_aqi < subscription.alert_threshold:
        print(f"  ❌ Skipped: AQI {current_aqi} < threshold {subscription.alert_threshold}")
        return False
    
    # Check if enough time has passed since last alert
    if subscription.last_alert_sent:
        # TESTING MODE: Short rate limit for demonstrations
        # For hazardous (300+), allow more frequent alerts (every 6 hours)
        if current_aqi >= 300:
            time_threshold = timedelta(minutes=1)  # Was: hours=6
        # For very unhealthy/unhealthy, once per day
        else:
            time_threshold = timedelta(minutes=1)  # Was: hours=24
        
        time_since_last_alert = timezone.now() - subscription.last_alert_sent
        print(f"  Last alert sent: {subscription.last_alert_sent}, {time_since_last_alert} ago (threshold: {time_threshold})")
        if time_since_last_alert < time_threshold:
            print(f"  ❌ Skipped: Rate limited (sent {time_since_last_alert} ago, need {time_threshold})")
            return False
    
    print(f"  ✅ Should send alert!")
    return True


def check_and_send_alerts(city, current_aqi, status, pm25, pm10):
    """
    Check all active subscriptions for a city and send alerts if needed
    Returns the number of alerts sent
    """
    from .models import EmailSubscription
    
    print(f"📧 Checking email alerts for {city.name} (AQI: {current_aqi})")
    
    # Get all active subscriptions for this city
    subscriptions = EmailSubscription.objects.filter(
        city=city,
        is_active=True
    )
    
    print(f"📋 Found {subscriptions.count()} active subscription(s) for {city.name}")
    
    alerts_sent = 0
    
    for subscription in subscriptions:
        if should_send_alert(subscription, current_aqi):
            # Send the alert
            if send_air_quality_alert(
                email=subscription.email,
                city_name=city.name,
                aqi=current_aqi,
                status=status,
                pm25=pm25,
                pm10=pm10
            ):
                # Update last alert sent time
                subscription.last_alert_sent = timezone.now()
                subscription.save()
                alerts_sent += 1
                print(f"Alert sent to {subscription.email} for {city.name} (AQI: {current_aqi})")
    
    return alerts_sent
