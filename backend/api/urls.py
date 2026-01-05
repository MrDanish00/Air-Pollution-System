from django.urls import path
from .views import (
    AQIDataView, AQIStatsView, HistoricalDataView, ForecastView,
    AlertsView, CitiesView, CitiesFilteredView, MapDataView
)
from .email_views import (
    EmailSubscribeView, EmailUnsubscribeView, UserSubscriptionsView
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

    path('subscribe-email/', EmailSubscribeView.as_view(), name='subscribe-email'),
    path('unsubscribe-email/', EmailUnsubscribeView.as_view(), name='unsubscribe-email'),
    path('my-subscriptions/', UserSubscriptionsView.as_view(), name='my-subscriptions'),
]