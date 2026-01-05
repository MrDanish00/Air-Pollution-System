from django.urls import path
from .views import (
    AQIDataView, HistoricalDataView, ForecastView,
    AlertsView, CitiesView, MapDataView
)
from .email_views import (
    EmailSubscribeView, EmailUnsubscribeView, UserSubscriptionsView
)
from .top_cities_view import TopPollutedCitiesView

urlpatterns = [
    path('aqi/', AQIDataView.as_view(), name='aqi'),
    path('historical/', HistoricalDataView.as_view(), name='historical'),
    path('forecast/', ForecastView.as_view(), name='forecast'),
    path('alerts/', AlertsView.as_view(), name='alerts'),
    path('cities/', CitiesView.as_view(), name='cities'),
    path('map-data/', MapDataView.as_view(), name='map-data'),
    path('top-polluted/', TopPollutedCitiesView.as_view(), name='top-polluted'),

    path('subscribe-email/', EmailSubscribeView.as_view(), name='subscribe-email'),
    path('unsubscribe-email/', EmailUnsubscribeView.as_view(), name='unsubscribe-email'),
    path('my-subscriptions/', UserSubscriptionsView.as_view(), name='my-subscriptions'),
]