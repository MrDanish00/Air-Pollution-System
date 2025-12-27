from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import City, EmailSubscription
from .serializers import EmailSubscriptionSerializer


class EmailSubscribeView(APIView):
    """Subscribe to email alerts for a city"""
    
    def post(self, request):
        email = request.data.get('email')
        city_name = request.data.get('city')
        threshold = request.data.get('threshold', 150)
        
        if not email or not city_name:
            return Response(
                {'error': 'Email and city are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            city = City.objects.get(name=city_name)
        except City.DoesNotExist:
            return Response(
                {'error': f'City "{city_name}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update subscription
        subscription, created = EmailSubscription.objects.get_or_create(
            email=email,
            city=city,
            defaults={'alert_threshold': threshold}
        )
        
        if not created:
            subscription.is_active = True
            subscription.alert_threshold = threshold
            subscription.save()
        
        serializer = EmailSubscriptionSerializer(subscription)
        
        return Response({
            'message': f'Successfully subscribed to alerts for {city_name}',
            'subscription': serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class EmailUnsubscribeView(APIView):
    """Unsubscribe from email alerts"""
    
    def post(self, request):
        email = request.data.get('email')
        city_name = request.data.get('city')
        
        if not email or not city_name:
            return Response(
                {'error': 'Email and city are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            city = City.objects.get(name=city_name)
            subscription = EmailSubscription.objects.get(email=email, city=city)
            subscription.is_active = False
            subscription.save()
            
            return Response({
                'message': f'Successfully unsubscribed from alerts for {city_name}'
            })
        except City.DoesNotExist:
            return Response(
                {'error': f'City "{city_name}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except EmailSubscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserSubscriptionsView(APIView):
    """Get all subscriptions for an email"""
    
    def get(self, request):
        email = request.query_params.get('email')
        
        if not email:
            return Response(
                {'error': 'Email parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscriptions = EmailSubscription.objects.filter(email=email, is_active=True)
        serializer = EmailSubscriptionSerializer(subscriptions, many=True)
        
        return Response(serializer.data)
