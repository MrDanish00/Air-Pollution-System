import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';

const TopPollutedCities = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopPollutedCities();
    }, []);

    const fetchTopPollutedCities = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/top-polluted/');
            const result = await response.json();
            setData(result);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching top polluted cities:', error);
            setLoading(false);
        }
    };

    const getBarColor = (aqi) => {
        if (aqi <= 50) return '#10b981'; // Green
        if (aqi <= 100) return '#eab308'; // Yellow
        if (aqi <= 150) return '#f97316'; // Orange
        if (aqi <= 200) return '#ef4444'; // Red
        if (aqi <= 300) return '#a855f7'; // Purple
        return '#991b1b'; // Dark Red
    };

    const getStatus = (aqi) => {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                    <p className="font-bold text-lg">{data.city}</p>
                    <p className="text-sm text-gray-600">{data.country}</p>
                    <div className="mt-2 space-y-1">
                        <p className="text-2xl font-bold" style={{ color: getBarColor(data.aqi) }}>
                            AQI: {data.aqi}
                        </p>
                        <p className="text-sm font-semibold">{getStatus(data.aqi)}</p>
                        <div className="text-xs text-gray-600 mt-2">
                            <div>PM2.5: {data.pm25} µg/m³</div>
                            <div>PM10: {data.pm10} µg/m³</div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Top 10 Most Polluted Cities</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Cities with highest Air Quality Index (AQI) based on latest readings
                </p>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading pollution data...</p>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center text-gray-600 py-12">
                        No pollution data available
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={500}>
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="city"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis label={{ value: 'Air Quality Index (AQI)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="aqi" name="AQI Level" radius={[8, 8, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.aqi)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Data Table */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Detailed Rankings</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">#</th>
                                            <th className="px-4 py-3 text-left font-semibold">City</th>
                                            <th className="px-4 py-3 text-left font-semibold">Country</th>
                                            <th className="px-4 py-3 text-right font-semibold">AQI</th>
                                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                                            <th className="px-4 py-3 text-right font-semibold">PM2.5</th>
                                            <th className="px-4 py-3 text-right font-semibold">PM10</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.map((city, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium">{city.city}</td>
                                                <td className="px-4 py-3 text-gray-600">{city.country}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className="inline-block px-3 py-1 rounded-full text-white font-bold"
                                                        style={{ backgroundColor: getBarColor(city.aqi) }}
                                                    >
                                                        {city.aqi}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm">{getStatus(city.aqi)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">{city.pm25} µg/m³</td>
                                                <td className="px-4 py-3 text-right text-gray-600">{city.pm10} µg/m³</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold mb-3">AQI Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { range: '0-50', label: 'Good', color: '#10b981' },
                        { range: '51-100', label: 'Moderate', color: '#eab308' },
                        { range: '101-150', label: 'Unhealthy for Sensitive', color: '#f97316' },
                        { range: '151-200', label: 'Unhealthy', color: '#ef4444' },
                        { range: '201-300', label: 'Very Unhealthy', color: '#a855f7' },
                        { range: '300+', label: 'Hazardous', color: '#991b1b' }
                    ].map((category, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="text-xs">
                                <div className="font-semibold">{category.range}</div>
                                <div className="text-gray-600">{category.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TopPollutedCities;
