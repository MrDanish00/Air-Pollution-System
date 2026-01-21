import React, { useState, useEffect } from 'react';
import { Bell, Clock, X, Check, AlertTriangle, Shield, Trash2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const EmailAlertPanel = () => {
    const { user, isAuthenticated } = useAuth();
    const [selectedCity, setSelectedCity] = useState('');
    const [threshold, setThreshold] = useState(150);
    const [alertInterval, setAlertInterval] = useState(24);
    const [cities, setCities] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Modal state
    const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
    const [cityToUnsubscribe, setCityToUnsubscribe] = useState(null);

    useEffect(() => {
        fetchCities();
        if (isAuthenticated) {
            fetchSubscriptions();
        }
    }, [isAuthenticated]);

    const fetchCities = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/cities/');
            const data = await response.json();
            setCities(data);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    const fetchSubscriptions = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/auth/subscriptions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSubscriptions(data);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!selectedCity) {
            setMessage({ text: 'Please select a city', type: 'error' });
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/auth/subscriptions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    city: selectedCity,
                    alert_threshold: threshold,
                    alert_interval_hours: alertInterval
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ text: `Successfully subscribed to ${selectedCity}!`, type: 'success' });
                setSelectedCity('');
                fetchSubscriptions();
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                setMessage({ text: data.message || 'Failed to subscribe', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Failed to connect to server', type: 'error' });
        }
        setLoading(false);
    };

    const confirmUnsubscribe = (cityName) => {
        setCityToUnsubscribe(cityName);
        setShowUnsubscribeModal(true);
    };

    const performUnsubscribe = async () => {
        if (!cityToUnsubscribe) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/auth/subscriptions/?city=${cityToUnsubscribe}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchSubscriptions();
                setMessage({ text: `Unsubscribed from ${cityToUnsubscribe}`, type: 'success' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        } finally {
            setShowUnsubscribeModal(false);
            setCityToUnsubscribe(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-white rounded-lg p-8 shadow-sm text-center border-l-4 border-blue-500">
                <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-6">
                    Please log in to manage email alerts and subscriptions.
                    <br />
                    Stay informed about air quality in your favorite cities.
                </p>
                <div className="text-sm text-gray-400">
                    Navigate to Login via the dashboard header.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-600">
                <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Email Alert Preferences</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Customize when and how you receive air quality alerts.
                </p>
            </div>

            {/* Subscribe Form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Add New Alert</h3>

                <form onSubmit={handleSubscribe} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* City Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select City
                            </label>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                required
                            >
                                <option value="">Choose a city...</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.name}>
                                        {city.name}, {city.country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Interval Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alert Frequency
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={alertInterval}
                                    onChange={(e) => setAlertInterval(parseInt(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                                >
                                    <option value={6}>Every 6 Hours</option>
                                    <option value={12}>Every 12 Hours</option>
                                    <option value={24}>Every 24 Hours (Daily)</option>
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Minimum time between alerts.</p>
                        </div>
                    </div>

                    {/* Threshold Slider */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Alert Threshold
                            </label>
                            <span className={`text-sm font-bold ${threshold <= 100 ? 'text-yellow-600' :
                                threshold <= 150 ? 'text-orange-600' :
                                    'text-red-600'
                                }`}>
                                AQI ≥ {threshold} ({
                                    threshold <= 100 ? 'Moderate' :
                                        threshold <= 150 ? 'Unhealthy for Sensitive' :
                                            threshold <= 200 ? 'Unhealthy' : 'Hazardous'
                                })
                            </span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="300"
                            step="10"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Good (50)</span>
                            <span>Moderate (100)</span>
                            <span>Unhealthy (150)</span>
                            <span>Hazardous (300)</span>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-semibold shadow-sm"
                    >
                        {loading ? 'Saving...' : 'Create Alert Subscription'}
                    </button>
                </form>
            </div>

            {/* Active Subscriptions List */}
            {subscriptions.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Your Active Alerts ({subscriptions.length})</h3>

                    <div className="space-y-3">
                        {subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition-colors bg-gray-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${sub.alert_threshold <= 100 ? 'bg-yellow-100 text-yellow-600' :
                                        sub.alert_threshold <= 150 ? 'bg-orange-100 text-orange-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{sub.city_name}</div>
                                        <div className="text-sm text-gray-600 flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> AQI ≥ {sub.alert_threshold || 150}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Every {sub.alert_interval_hours || 24}h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => confirmUnsubscribe(sub.city_name)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Unsubscribe"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Unsubscribe Confirmation Modal */}
            {showUnsubscribeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe?</h3>
                            <p className="text-gray-600">
                                You will no longer receive air quality alerts for <span className="font-semibold text-gray-800">{cityToUnsubscribe}</span>.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnsubscribeModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={performUnsubscribe}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                Unsubscribe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailAlertPanel;


