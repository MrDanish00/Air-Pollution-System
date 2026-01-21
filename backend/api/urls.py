from django.urls import path, include
from .views import (
    AQIDataView, AQIStatsView, HistoricalDataView, ForecastView,
    AlertsView, CitiesView, CitiesFilteredView, MapDataView,
    UserProfileView, UserSubscriptionsView
)
from .email_views import (
    EmailSubscribeView, EmailUnsubscribeView, UserSubscriptionsView as LegacyUserSubscriptionsView
)
from .top_cities_view import TopPollutedCitiesView

urlpatterns = [
    path('aqi/', AQIDataView.as_view(), name='aqi'),
    path('aqi-stats/', AQIStatsView.as_view(), name='aqi-stats'),
    path('historical/', HistoricalDataView.as_view(), name='historical'),
    path('forecast/', ForecastView.as_view(), name='forecast'),
    path('alerts/', AlertsView.as_view(), name='alerts'),
    path('cities/', CitiesView.as_view(), name='cities'),
    path('cities-filtered/', CitiesFilteredView.as_view(), name='cities-filtered'),
    path('map-data/', MapDataView.as_view(), name='map-data'),
    path('top-polluted/', TopPollutedCitiesView.as_view(), name='top-polluted'),

    # Legacy Email Subscriptions
    path('subscribe-email/', EmailSubscribeView.as_view(), name='subscribe-email'),
    path('unsubscribe-email/', EmailUnsubscribeView.as_view(), name='unsubscribe-email'),
    path('my-subscriptions/', LegacyUserSubscriptionsView.as_view(), name='my-subscriptions-legacy'),
    
    # New Auth & Profile Endpoints
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/subscriptions/', UserSubscriptionsView.as_view(), name='user-subscriptions'),
]