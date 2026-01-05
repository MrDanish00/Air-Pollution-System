# Quick Email Test Script
# Save this and run with: .\venv\Scripts\python.exe quick_email_test.py

import os
import sys
import django

# Load environment variable from .env file
env_file = '.env'
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
                print(f"Loaded: {key}")

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'air_quality.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("\n" + "="*60)
print("EMAIL CONFIGURATION TEST")
print("="*60)
print(f"Backend: {settings.EMAIL_BACKEND}")
print(f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
print(f"Sender: {settings.EMAIL_HOST_USER}")
print(f"Password: {'***SET***' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
print("="*60)

if not settings.EMAIL_HOST_PASSWORD:
    print("\n❌ ERROR: EMAIL_HOST_PASSWORD not set!")
    print("Make sure .env file exists with EMAIL_HOST_PASSWORD=your_app_password")
    exit(1)

# Ask for recipient email
print("\n" + "="*60)
recipient_email = input("📧 Enter recipient email to test (press Enter for airguard00@gmail.com): ").strip()
if not recipient_email:
    recipient_email = "airguard00@gmail.com"

print(f"\n📤 Sending test email from airguard00@gmail.com to {recipient_email}...")
try:
    result = send_mail(
        subject='✅ Air Quality Monitor - Email Test',
        message=f'''
Hello!

This is a test email from the Air Quality Monitoring System.

If you're reading this, congratulations! The email alert system is now working correctly.

System Configuration:
✓ SMTP Server: Gmail (smtp.gmail.com:587)
✓ Sender: airguard00@gmail.com (configured sender)
✓ Recipient: {recipient_email} (your email)
✓ TLS: Enabled

The system is ready to send air quality alerts to ANY email address that users subscribe with.

How it works in production:
1. User subscribes with their email (e.g., user@example.com)
2. When AQI exceeds their threshold, alert is sent to their email
3. Sender is always: airguard00@gmail.com

---
Air Quality Monitoring System
UET Lahore
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        fail_silently=False,
    )
    
    print(f"\n✅ SUCCESS! Email sent (result: {result})")
    print("📬 Check inbox for: airguard00@gmail.com")
    print("💡 If not in inbox, check spam folder")
    
except Exception as e:
    print(f"\n❌ FAILED to send email!")
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("1. Verify EMAIL_HOST_PASSWORD is the 16-digit app password")
    print("2. Check that 2FA is enabled in Gmail account")
    print("3. Make sure the app password is for 'Mail' category")
    
print("="*60)
