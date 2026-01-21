import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { AlertCircle, Wind, Droplets, ThermometerSun, Activity, MapPin, Bell, TrendingUp, Search, RefreshCw, Map as MapIcon, Moon, Sun, Clock, Loader2, User } from 'lucide-react';
import MapView from './MapView';
import EmailAlertPanel from './EmailAlertPanel';
import TopPollutedCities from './TopPollutedCities';
import CitiesBrowser from './CitiesBrowser';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';

const API_BASE = 'http://localhost:8000/api';

const API = {
  async getAQIData(city) {
    try {
      const response = await fetch(`${API_BASE}/aqi/?city=${city}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching AQI:', error);
      return null;
    }
  },

  async getHistoricalData(city) {
    try {
      const response = await fetch(`${API_BASE}/historical/?city=${city}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  },

  async getForecast(city) {
    try {
      const response = await fetch(`${API_BASE}/forecast/?city=${city}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return [];
    }
  },

  async getAlerts(city) {
    try {
      const response = await fetch(`${API_BASE}/alerts/?city=${city}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  async getAQIStats(city, hours = 24) {
    try {
      const response = await fetch(`${API_BASE}/aqi-stats/?city=${city}&hours=${hours}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching AQI stats:', error);
      return null;
    }
  },

  async getFilteredCities(minAqi = 0, maxAqi = 500) {
    try {
      const response = await fetch(`${API_BASE}/cities-filtered/?min_aqi=${minAqi}&max_aqi=${maxAqi}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching filtered cities:', error);
      return [];
    }
  }
};

const AQICard = ({ value, status, color }) => (
  <div className={`${color} rounded-lg p-6 text-white shadow-lg`}>
    <div className="flex items-center justify-between mb-2">
      <Wind className="w-8 h-8" />
      <span className="text-sm font-medium">{status}</span>
    </div>
    <div className="text-4xl font-bold mb-1">{Math.round(value)}</div>
    <div className="text-sm opacity-90">Air Quality Index</div>
  </div>
);

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return { status: 'Good', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' };
  if (aqi <= 100) return { status: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50' };
  if (aqi <= 150) return { status: 'Unhealthy for Sensitive', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' };
  if (aqi <= 200) return { status: 'Unhealthy', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' };
  if (aqi <= 300) return { status: 'Very Unhealthy', color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' };
  return { status: 'Hazardous', color: 'bg-red-900', textColor: 'text-red-900', bgLight: 'bg-red-100' };
};

const getHealthAdvice = (aqi) => {
  if (aqi <= 50) return "Air quality is satisfactory. Enjoy outdoor activities!";
  if (aqi <= 100) return "Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.";
  if (aqi <= 150) return "Members of sensitive groups may experience health effects. Reduce prolonged outdoor exertion.";
  if (aqi <= 200) return "Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.";
  if (aqi <= 300) return "Health alert: everyone may experience serious health effects. Stay indoors.";
  return "Health warnings of emergency conditions. Everyone should avoid outdoor activities.";
};

const AppContent = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // login, signup, profile

  // Debug: Log when activeTab changes
  useEffect(() => {
    console.log('🔖 Active tab changed to:', activeTab);
  }, [activeTab]);

  // Redirect to profile on successfull login
  useEffect(() => {
    if (isAuthenticated && authView === 'login') {
      setAuthView('profile');
    }
  }, [isAuthenticated, authView]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);  // Start with no city selected
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);  // Cities matching search
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAQI, setCurrentAQI] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aqiStats, setAqiStats] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);

  // Debug: Log when filteredCities changes
  useEffect(() => {
    console.log('📊 Filtered cities updated. Count:', filteredCities.length);
  }, [filteredCities]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Popular cities for suggestions
  const popularCities = [
    'Lahore', 'Karachi', 'Islamabad', 'Multan', 'Faisalabad', 'Rawalpindi',
    'Delhi', 'Mumbai', 'Beijing', 'Shanghai', 'Tokyo', 'Seoul',
    'London', 'Paris', 'New York', 'Los Angeles', 'Chicago', 'Toronto',
    'Dubai', 'Singapore', 'Bangkok', 'Jakarta', 'Manila', 'Dhaka'
  ];

  useEffect(() => {
    console.log('🔄 City selected:', selectedCity);
    if (selectedCity) {
      loadData();
    }
  }, [selectedCity]);

  useEffect(() => {
    console.log('🎯 Filter changed to:', selectedFilter);
    console.log('📍 Loading filtered cities...');
    loadFilteredCities();
  }, [selectedFilter]);

  // Load cities on mount (runs once)
  useEffect(() => {
    console.log('🚀 App mounted! Loading initial cities...');
    loadFilteredCities();
  }, []); // Empty dependency = runs once on mount

  const loadFilteredCities = async () => {
    console.log('📡 Fetching cities for filter:', selectedFilter);
    const filters = {
      'all': { min: 0, max: 500 },
      'good': { min: 0, max: 50 },
      'moderate': { min: 51, max: 100 },
      'unhealthy-sensitive': { min: 101, max: 150 },
      'unhealthy': { min: 151, max: 200 },
      'very-unhealthy': { min: 201, max: 300 },
      'hazardous': { min: 301, max: 500 }
    };

    const { min, max } = filters[selectedFilter];
    console.log(`🔍 Calling API with min=${min}, max=${max}`);
    try {
      const cities = await API.getFilteredCities(min, max);
      console.log('✅ Received', cities.length, 'cities from API');
      setFilteredCities(cities);
    } catch (error) {
      console.error('❌ Error loading cities:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const [aqiData, historical, forecastData, alertsData, statsData] = await Promise.all([
        API.getAQIData(selectedCity),
        API.getHistoricalData(selectedCity),
        API.getForecast(selectedCity),
        API.getAlerts(selectedCity),
        API.getAQIStats(selectedCity, 24)
      ]);

      console.log('Forecast Data from API:', forecastData); // DEBUG

      if (aqiData) {
        // Check if API returned an error
        if (aqiData.error) {
          setError(`City "${selectedCity}" not found. Please try another city.`);
          setCurrentAQI(null);
          setHistoricalData([]);
          setForecast([]);
          setAlerts([]);
          // Auto-clear error after 5 seconds
          setTimeout(() => setError(null), 5000);
        } else {
          setCurrentAQI(aqiData);
          setHistoricalData(historical || []);
          setForecast(forecastData || []);
          setAlerts(alertsData || []);
          setAqiStats(statsData || null);
          setLastUpdated(new Date());
        }
      } else {
        setError(`Unable to fetch data for "${selectedCity}". Please try again.`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Failed to connect to server. Please check your connection.`);
      setTimeout(() => setError(null), 5000);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (searchCity.trim()) {
      // Search for matching cities instead of directly selecting
      const query = searchCity.trim().toLowerCase();
      const allCities = await API.getFilteredCities(0, 500);
      const matches = allCities.filter(city =>
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query)
      );
      setSearchResults(matches);
      setSearchCity('');
      setShowSuggestions(false);
      setActiveTab('cities'); // Always go to Cities tab to show matching cities

      // User must click a city card to view its dashboard
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchCity('');
    setShowSuggestions(false);
    setSearchResults([]);  // Clear search results
    // Clear current data
    setCurrentAQI(null);
    setHistoricalData([]);
    setForecast([]);
    setAqiStats(null);  // Clear stats too
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchCity(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setAuthView('login');
      setActiveTab('login');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/auth/subscriptions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city: selectedCity })
      });
      if (response.ok) {
        alert(`Subscribed to ${selectedCity} successfully!`);
      } else {
        alert('Failed to subscribe or already subscribed.');
      }
    } catch (e) {
      console.error(e);
      alert('Error subscribing to city.');
    }
  };

  const searchFilteredCities = searchCity.length > 0
    ? popularCities.filter(city =>
      city.toLowerCase().includes(searchCity.toLowerCase())
    )
    : [];

  const aqiInfo = currentAQI ? getAQIStatus(currentAQI.aqi) : { status: 'Loading...', color: 'bg-gray-500' };

  if (activeTab === 'profile') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <Wind className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Air Quality Monitor</h1>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-white/10">{darkMode ? <Sun /> : <Moon />}</button>
          </div>
        </header>
        <ProfilePage onBack={() => setActiveTab('dashboard')} />
      </div>
    );
  }

  if (activeTab === 'login') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <Wind className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Air Quality Monitor</h1>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-white/10">{darkMode ? <Sun /> : <Moon />}</button>
          </div>
        </header>
        {authView === 'login' ? (
          <LoginPage onSwitchToSignup={() => setAuthView('signup')} onBack={() => setActiveTab('dashboard')} />
        ) : (
          <SignupPage onSwitchToLogin={() => setAuthView('login')} onBack={() => setActiveTab('dashboard')} />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wind className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Air Quality Monitor</h1>
                <p className={`${darkMode ? 'text-gray-300' : 'text-blue-100'} text-sm`}>Real-time pollution tracking & forecasting</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <User className="w-5 h-5" />
                  <span>{user?.username}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setActiveTab('login'); setAuthView('login'); }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={loadData}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchCity}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchCity && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search city..."
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />

              {/* City Suggestions Dropdown */}
              {showSuggestions && searchFilteredCities.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                  {searchFilteredCities.slice(0, 8).map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
            >
              Search
            </button>
          </div>

        </div>
      </header>

      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['dashboard', 'cities', 'map', 'alerts', 'pollution', 'forecast', 'analytics', 'health'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                  ? darkMode
                    ? 'border-blue-400 text-blue-400'
                    : 'border-blue-600 text-blue-600'
                  : darkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Screen */}
        {error && (
          <div className="flex justify-center items-center h-64">
            <div className={`max-w-md w-full ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-6 text-center`}>
              <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>City Not Found</h3>
              <p className={`${darkMode ? 'text-red-200' : 'text-red-700'} mb-4`}>{error}</p>
              <button onClick={() => setError(null)} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Welcome Screen - only on dashboard with no city and no error */}
        {!error && !selectedCity && activeTab === 'dashboard' && (
          <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
            <div className={`text-center max-w-2xl px-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Wind className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to Air Quality Monitor
              </h2>
              <p className="text-lg mb-8 leading-relaxed">
                Select a city to view comprehensive air quality data, including real-time AQI readings,
                7-day forecasts, historical trends, and personalized health recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setActiveTab('cities')}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Browse All Cities
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  View Map
                </button>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-700">
                <p className="text-sm opacity-75">
                  Or use the search bar above to find a specific city
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state for dashboard */}
        {!error && activeTab === 'dashboard' && selectedCity && loading && !currentAQI && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading air quality data for {selectedCity}...</p>
            </div>
          </div>
        )}

        {/* Dashboard tab with city data */}
        {!error && activeTab === 'dashboard' && selectedCity && currentAQI && (
          <div className="space-y-6">
            {/* Current Location Info with Last Updated */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg p-4 shadow-sm border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCity}</h2>
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Last updated: {currentAQI?.timestamp ? new Date(currentAQI.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Loading...'}
                      </span>
                      {currentAQI?.timestamp && (() => {
                        const mins = Math.floor((new Date() - new Date(currentAQI.timestamp)) / 60000);
                        let timeAgo;
                        if (mins < 1) timeAgo = 'Just now';
                        else if (mins < 60) timeAgo = `${mins}m ago`;
                        else {
                          const hours = Math.floor(mins / 60);
                          timeAgo = `${hours}h ${mins % 60}m ago`;
                        }
                        return (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                            {timeAgo}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                    }`}
                >
                  <Bell className="w-4 h-4" />
                  Subscribe
                </button>
              </div>
            </div>


            {/* Current AQI and Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AQICard
                value={loading ? '--' : currentAQI.aqi}
                status={loading ? 'Loading...' : aqiInfo.status}
                color={loading ? 'bg-gray-400' : aqiInfo.color}
              />

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Droplets className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PM2.5</span>
                </div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-gray-400">--</span>
                    </>
                  ) : (
                    `${currentAQI.pm25} µg/m³`
                  )}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Fine Particles</div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Wind className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PM10</span>
                </div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      <span className="text-gray-400">--</span>
                    </>
                  ) : (
                    `${currentAQI.pm10} µg/m³`
                  )}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Coarse Dust</div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>CO</span>
                </div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                      <span className="text-gray-400">--</span>
                    </>
                  ) : (
                    `${currentAQI.co} µg/m³`
                  )}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Carbon Monoxide</div>
              </div>
            </div>

            {/* Additional Pollutants */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">NO₂</div>
                <div className="text-xl font-bold text-gray-900">{currentAQI.no2}</div>
                <div className="text-xs text-gray-500">µg/m³</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">O₃</div>
                <div className="text-xl font-bold text-gray-900">{currentAQI.o3}</div>
                <div className="text-xs text-gray-500">µg/m³</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">SO₂</div>
                <div className="text-xl font-bold text-gray-900">{currentAQI.so2}</div>
                <div className="text-xs text-gray-500">µg/m³</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">NH₃</div>
                <div className="text-xl font-bold text-gray-900">{currentAQI.nh3}</div>
                <div className="text-xs text-gray-500">µg/m³</div>
              </div>
            </div>

            {/* Max/Min AQI Stats - Compact Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && !aqiStats ? (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  </div>
                </>
              ) : aqiStats && !aqiStats.error ? (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Peak AQI</span>
                        </div>
                        <div className="text-3xl font-bold text-red-600 mb-1">{Math.round(aqiStats.max_aqi.value)}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {aqiStats.max_aqi.time_display}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lowest AQI</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-1">{Math.round(aqiStats.min_aqi.value)}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {aqiStats.min_aqi.time_display}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                  Active Alerts
                </h2>
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${alert.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{alert.location}</div>
                          <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                        </div>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Trend - Always show */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Activity className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                24-Hour AQI Trend for {selectedCity}
              </h2>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              ) : historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      stroke={darkMode ? '#4b5563' : '#d1d5db'}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      stroke={darkMode ? '#4b5563' : '#d1d5db'}
                      label={{
                        value: 'AQI',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: darkMode ? '#9ca3af' : '#6b7280' }
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        color: darkMode ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Legend wrapperStyle={{ color: darkMode ? '#d1d5db' : '#374151' }} />
                    <Area
                      type="monotone"
                      dataKey="aqi"
                      stroke="#8884d8"
                      strokeWidth={2}
                      fill="url(#colorAqi)"
                      name="AQI"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No historical data available yet. Data will appear as readings are collected.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
        }

        {
          activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  7-Day AQI Forecast for {selectedCity}
                </h2>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className={`w-12 h-12 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-4`} />
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading forecast data...</p>
                  </div>
                ) : forecast.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="date"
                          stroke={darkMode ? '#9ca3af' : '#6b7280'}
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                          labelFormatter={(date) => {
                            const d = new Date(date);
                            return d.toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="predicted_aqi" name="Predicted AQI" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mt-6">
                      {forecast.map((day, index) => {
                        const date = new Date(day.date);
                        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                          <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg text-center hover:shadow-md transition-shadow`}>
                            <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{weekday}</div>
                            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>{formattedDate}</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                              {Math.round(day.predicted_aqi)}
                            </div>
                            <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                              {day.category || 'Moderate'}
                            </div>
                            {day.confidence && (
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {Math.round(day.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>Loading forecast data...</p>
                )}
              </div>
            </div>
          )}

        {activeTab === 'analytics' && currentAQI && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Current AQI</div>
                <div className="text-3xl font-bold text-gray-900">{Math.round(currentAQI.aqi)}</div>
                <div className={`text-sm mt-2 ${aqiInfo.textColor}`}>{aqiInfo.status}</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Dominant Pollutant</div>
                <div className="text-3xl font-bold text-gray-900">PM2.5</div>
                <div className="text-sm text-gray-500 mt-2">{currentAQI.pm25} µg/m³</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Location</div>
                <div className="text-2xl font-bold text-gray-900">{selectedCity}</div>
                <div className="text-sm text-gray-500 mt-2">Active monitoring</div>
              </div>
            </div>

            {/* Max/Min AQI Analytics Cards */}
            {aqiStats && !aqiStats.error && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  AQI Range (Last 24 Hours)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="text-sm text-gray-600 mb-2">Peak AQI</div>
                    <div className="text-4xl font-bold text-red-600 mb-2">{Math.round(aqiStats.max_aqi.value)}</div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {aqiStats.max_aqi.time_display}
                    </div>
                    <div className="text-sm text-gray-500">
                      PM2.5: {aqiStats.max_aqi.pm25} µg/m³ | PM10: {aqiStats.max_aqi.pm10} µg/m³
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="text-sm text-gray-600 mb-2">Lowest AQI</div>
                    <div className="text-4xl font-bold text-green-600 mb-2">{Math.round(aqiStats.min_aqi.value)}</div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {aqiStats.min_aqi.time_display}
                    </div>
                    <div className="text-sm text-gray-500">
                      PM2.5: {aqiStats.min_aqi.pm25} µg/m³ | PM10: {aqiStats.min_aqi.pm10} µg/m³
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">AQI Variation:</span> {Math.round(aqiStats.max_aqi.value - aqiStats.min_aqi.value)} points
                    <span className="ml-4 font-medium">Total Readings:</span> {aqiStats.total_readings}
                  </div>
                </div>
              </div>
            )}

            {historicalData.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Pollutant Levels Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="aqi" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <MapView />
        )}

        {activeTab === 'alerts' && (
          <EmailAlertPanel />
        )}

        {activeTab === 'pollution' && (
          <TopPollutedCities />
        )}

        {activeTab === 'cities' && (
          <>
            {console.log('🎨 Rendering CitiesBrowser component with:', {
              activeTab,
              filteredCitiesCount: filteredCities.length,
              searchResultsCount: searchResults.length
            })}
            <CitiesBrowser
              darkMode={darkMode}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              filteredCities={filteredCities}
              handleCitySelect={handleCitySelect}
              setActiveTab={setActiveTab}
            />
          </>
        )}

        {activeTab === 'health' && currentAQI && (
          <div className="space-y-6">
            <div className={`${aqiInfo.bgLight} border-l-4 ${aqiInfo.color.replace('bg-', 'border-')} rounded-lg p-6`}>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Health Advisory for {selectedCity}</h2>
              <p className="text-gray-700 text-lg">{getHealthAdvice(currentAQI.aqi)}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">AQI Categories</h3>
              <div className="space-y-3">
                {[
                  { range: '0-50', status: 'Good', color: 'bg-green-500', desc: 'Air quality is satisfactory' },
                  { range: '51-100', status: 'Moderate', color: 'bg-yellow-500', desc: 'Acceptable air quality' },
                  { range: '101-150', status: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', desc: 'Sensitive groups may experience effects' },
                  { range: '151-200', status: 'Unhealthy', color: 'bg-red-500', desc: 'Everyone may experience effects' },
                  { range: '201-300', status: 'Very Unhealthy', color: 'bg-purple-500', desc: 'Health alert: everyone may experience serious effects' },
                  { range: '301+', status: 'Hazardous', color: 'bg-red-900', desc: 'Emergency conditions' }
                ].map((category, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className={`${category.color} w-16 h-10 rounded flex items-center justify-center text-white text-xs font-bold`}>
                      {category.range}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category.status}</div>
                      <div className="text-sm text-gray-600">{category.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      < footer className="bg-white border-t mt-12" >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            Smart Air Pollution Monitoring System | UET Lahore | Powered by OpenWeather API
          </div>
        </div>
      </footer >
    </div >
  );
};


const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
