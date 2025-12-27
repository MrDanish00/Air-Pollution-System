import React, { useState, useEffect } from 'react';
import { Bell, Mail, X, Check } from 'lucide-react';

const EmailAlertPanel = () => {
    const [email, setEmail] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [threshold, setThreshold] = useState(150);
    const [cities, setCities] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/cities/');
            const data = await response.json();
            setCities(data);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    const fetchSubscriptions = async (userEmail) => {
        if (!userEmail) return;

        try {
            const response = await fetch(`http://localhost:8000/api/my-subscriptions/?email=${userEmail}`);
            const data = await response.json();
            setSubscriptions(data);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();

        if (!email || !selectedCity) {
            setMessage('Please enter email and select a city');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/subscribe-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    city: selectedCity,
                    threshold
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`✓ Successfully subscribed to ${selectedCity} alerts!`);
                setSelectedCity('');
                fetchSubscriptions(email);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(`Error: ${data.error || 'Failed to subscribe'}`);
            }
        } catch (error) {
            setMessage('Error: Failed to connect to server');
        }
        setLoading(false);
    };

    const handleUnsubscribe = async (city) => {
        try {
            const response = await fetch('http://localhost:8000/api/unsubscribe-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    city
                })
            });

            if (response.ok) {
                fetchSubscriptions(email);
                setMessage(`✓ Unsubscribed from ${city}`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    };

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        if (newEmail.includes('@')) {
            fetchSubscriptions(newEmail);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Email Alert Subscriptions</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Get notified when air quality becomes unhealthy (AQI ≥ 150) in your selected cities
                </p>
            </div>

            {/* Subscribe Form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Subscribe to Alerts</h3>

                <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="your-email@example.com"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select City
                        </label>
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alert Threshold: AQI ≥ {threshold}
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="300"
                            step="10"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Moderate (100)</span>
                            <span>Unhealthy (150)</span>
                            <span>Hazardous (300)</span>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? 'Subscribing...' : 'Subscribe to Alerts'}
                    </button>
                </form>
            </div>

            {/* Active Subscriptions */}
            {subscriptions.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Your Active Subscriptions ({subscriptions.length})</h3>

                    <div className="space-y-2">
                        {subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-600" />
                                    <div>
                                        <div className="font-medium text-gray-900">{sub.city_name}</div>
                                        <div className="text-sm text-gray-600">
                                            Alert when AQI ≥ {sub.alert_threshold}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUnsubscribe(sub.city_name)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Unsubscribe"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You'll receive emails when AQI exceeds your threshold</li>
                    <li>• Alerts are sent once per day for unhealthy levels</li>
                    <li>• Hazardous levels (AQI ≥ 300) trigger alerts every 6 hours</li>
                    <li>• You can subscribe to multiple cities</li>
                    <li>• Unsubscribe anytime by clicking the X button</li>
                </ul>
            </div>
        </div>
    );
};

export default EmailAlertPanel;
