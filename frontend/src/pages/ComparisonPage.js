import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, Wind, MapPin, Trophy, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ComparisonPage = ({ onBack }) => {
    const [cities, setCities] = useState([]);
    const [cityA, setCityA] = useState('');
    const [cityB, setCityB] = useState('');
    const [loading, setLoading] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/cities/');
            const data = await response.json();
            setCities(data);
        } catch (err) {
            console.error("Failed to fetch cities", err);
        }
    };

    const handleCompare = async () => {
        if (!cityA || !cityB) {
            setError("Please select two cities to compare.");
            return;
        }
        if (cityA === cityB) {
            setError("Please select two different cities.");
            return;
        }

        setLoading(true);
        setError('');
        setComparisonData(null);

        try {
            // Fetch Current AQI for both with timeout
            const fetchWithTimeout = (url, ms = 8000) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), ms);
                return fetch(url, { signal: controller.signal })
                    .then(res => {
                        clearTimeout(id);
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res;
                    })
                    .catch(err => {
                        clearTimeout(id);
                        throw err;
                    });
            };

            const [resA, resB, histA, histB] = await Promise.all([
                fetchWithTimeout(`http://localhost:8000/api/aqi/?city=${cityA}`),
                fetchWithTimeout(`http://localhost:8000/api/aqi/?city=${cityB}`),
                fetchWithTimeout(`http://localhost:8000/api/historical/?city=${cityA}`),
                fetchWithTimeout(`http://localhost:8000/api/historical/?city=${cityB}`)
            ]);

            const dataA = await resA.json();
            const dataB = await resB.json();
            const histDataA = await histA.json();
            const histDataB = await histB.json();

            // Structure data for visualizations
            const chartData = histDataA.map((item, index) => ({
                time: item.time,
                [cityA]: item.aqi,
                [cityB]: histDataB[index]?.aqi || null // Fallback if lengths differ
            }));

            setComparisonData({
                cityA: { name: cityA, ...dataA, history: histDataA },
                cityB: { name: cityB, ...dataB, history: histDataB },
                chartData
            });

        } catch (err) {
            setError("Failed to fetch comparison data. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine cleaner city
    const getWinner = () => {
        if (!comparisonData) return null;
        const aqiA = comparisonData.cityA.aqi || 0;
        const aqiB = comparisonData.cityB.aqi || 0;
        if (aqiA < aqiB) return comparisonData.cityA;
        if (aqiB < aqiA) return comparisonData.cityB;
        return null; // Draw
    };

    const winner = getWinner();

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Back to Dashboard"
                >
                    <ArrowLeftRight className="w-6 h-6 rotate-180 hidden" /> {/* Hidden icon for spacing if needed, but we use strict left arrow */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
                    City Air Quality Comparison
                </h1>
            </div>

            {/* Selection Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">City A</label>
                        <select
                            value={cityA}
                            onChange={(e) => setCityA(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                        >
                            <option value="">Select First City</option>
                            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-1 flex justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">City B</label>
                        <select
                            value={cityB}
                            onChange={(e) => setCityB(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 transition-all font-semibold"
                        >
                            <option value="">Select Second City</option>
                            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleCompare}
                        disabled={loading || !cityA || !cityB}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                        Compare Air Quality
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </div>

            {/* Comparison Results */}
            {comparisonData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Winner Banner */}
                    <div className={`p-6 rounded-xl border-l-8 shadow-sm flex items-center gap-4 ${winner === comparisonData.cityA ? 'bg-blue-50 border-blue-500' : 'bg-teal-50 border-teal-500'
                        }`}>
                        <Trophy className={`w-12 h-12 ${winner === comparisonData.cityA ? 'text-blue-600' : 'text-teal-600'}`} />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {winner.name} is cleaner today!
                            </h3>
                            <p className="text-gray-600">
                                With an AQI of <span className="font-bold">{winner.aqi}</span>, the air quality in {winner.name} is better than {winner === comparisonData.cityA ? comparisonData.cityB.name : comparisonData.cityA.name}.
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* City A Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6" /> {comparisonData.cityA.name}</h2>
                                <span className="text-sm opacity-80">Current Stats</span>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-sm">AQI</p>
                                    <p className={`text-3xl font-bold ${comparisonData.cityA.aqi <= 50 ? 'text-green-600' :
                                        comparisonData.cityA.aqi <= 100 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>{comparisonData.cityA.aqi}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-sm">Condition</p>
                                    <p className="text-xl font-semibold text-gray-800">
                                        {comparisonData.cityA.aqi <= 50 ? 'Good' :
                                            comparisonData.cityA.aqi <= 100 ? 'Moderate' :
                                                comparisonData.cityA.aqi <= 150 ? 'Sensitive' :
                                                    comparisonData.cityA.aqi <= 200 ? 'Unhealthy' : 'Hazardous'}
                                    </p>
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50 rounded-lg flex items-center justify-center gap-2 text-blue-800">
                                    <Wind className="w-5 h-5" />
                                    <span className="font-medium">PM2.5: {comparisonData.cityA.pm25} µg/m³</span>
                                </div>
                            </div>
                        </div>

                        {/* City B Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6" /> {comparisonData.cityB.name}</h2>
                                <span className="text-sm opacity-80">Current Stats</span>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-sm">AQI</p>
                                    <p className={`text-3xl font-bold ${comparisonData.cityB.aqi <= 50 ? 'text-green-600' :
                                        comparisonData.cityB.aqi <= 100 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>{comparisonData.cityB.aqi}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-sm">Condition</p>
                                    <p className="text-xl font-semibold text-gray-800">
                                        {comparisonData.cityB.aqi <= 50 ? 'Good' :
                                            comparisonData.cityB.aqi <= 100 ? 'Moderate' :
                                                comparisonData.cityB.aqi <= 150 ? 'Sensitive' :
                                                    comparisonData.cityB.aqi <= 200 ? 'Unhealthy' : 'Hazardous'}
                                    </p>
                                </div>
                                <div className="col-span-2 p-4 bg-teal-50 rounded-lg flex items-center justify-center gap-2 text-teal-800">
                                    <Wind className="w-5 h-5" />
                                    <span className="font-medium">PM2.5: {comparisonData.cityB.pm25} µg/m³</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historical Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-gray-500" />
                            Historical Trends Comparison
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={comparisonData.chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="time" />
                                    <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />

                                    <Line
                                        type="monotone"
                                        dataKey={comparisonData.cityA.name}
                                        name={comparisonData.cityA.name}
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 8 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={comparisonData.cityB.name}
                                        name={comparisonData.cityB.name}
                                        stroke="#0d9488"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonPage;
