"""
Test script to verify email configuration
Run this from Django shell: python manage.py shell < test_email.py
"""

from django.core.mail import send_mail
from django.conf import settings

print("=" * 60)
print("EMAIL CONFIGURATION TEST")
print("=" * 60)
print(f"Email Backend: {settings.EMAIL_BACKEND}")
print(f"SMTP Host: {settings.EMAIL_HOST}")
print(f"SMTP Port: {settings.EMAIL_PORT}")
print(f"Use TLS: {settings.EMAIL_USE_TLS}")
print(f"From Email: {settings.EMAIL_HOST_USER}")
print(f"Password Set: {'Yes' if settings.EMAIL_HOST_PASSWORD else 'No'}")
print("=" * 60)

# Send test email
print("\nSending test email...")
try:
    send_mail(
        subject='✅ Air Quality Monitor - Email System Test',
        message='''
Hello!

This is a test email from the Air Quality Monitoring System.

If you're reading this, the email configuration is working correctly!

System Details:
- SMTP Server: Gmail (smtp.gmail.com)
- Sender: airguard00@gmail.com
- Email Backend: Django SMTP

The email alert system is now ready to send air quality notifications.

---
Air Quality Monitoring System
UET Lahore
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['airguard00@gmail.com'],  # Send to same address for testing
        fail_silently=False,
    )
    print("✅ SUCCESS! Test email sent successfully!")
    print("📧 Check the inbox for airguard00@gmail.com")
    print("💡 If not in inbox, check the spam folder")
except Exception as e:
    print(f"❌ ERROR: Failed to send email")
    print(f"Error details: {e}")
    print("\nTroubleshooting:")
    print("1. Make sure EMAIL_HOST_PASSWORD is set in .env file")
    print("2. Verify the app password is correct (16 characters)")
    print("3. Check that 2-factor authentication is enabled in Gmail")
    print("4. Ensure 'Less secure app access' is not required")

print("=" * 60)
