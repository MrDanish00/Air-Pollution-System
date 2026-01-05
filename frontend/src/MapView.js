import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom colored markers
const createColoredIcon = (color) => {
    const colorMap = {
        green: '#10b981',
        yellow: '#eab308',
        orange: '#f97316',
        red: '#ef4444',
        purple: '#a855f7',
        darkred: '#991b1b'
    };

    const svgIcon = `
    <svg width="32" height="45" viewBox="0 0 32 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 29 16 29s16-18 16-29c0-8.837-7.163-16-16-16z"
            fill="${colorMap[color] || colorMap.green}"
            stroke="white"
            stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;

    return L.divIcon({
        html: svgIcon,
        className: 'custom-marker',
        iconSize: [32, 45],
        iconAnchor: [16, 45],
        popupAnchor: [0, -45]
    });
};

// Component to recenter map when data changes
const MapController = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);

    return null;
};

const MapView = () => {
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMapData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchMapData, 300000);
        return () => clearInterval(interval);
    }, []);

    const fetchMapData = async () => {
        console.log('Fetching map data...');
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/map-data/');
            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received map data:', data);
            console.log('Number of cities:', data.length);

            setMapData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching map data:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    // Calculate center based on data
    const mapCenter = mapData.length > 0
        ? [mapData[0].latitude, mapData[0].longitude]
        : [31.5204, 74.3587]; // Default to Lahore

    const getAQIDescription = (aqi) => {
        if (aqi <= 50) return "Air quality is good. Enjoy outdoor activities!";
        if (aqi <= 100) return "Air quality is acceptable for most people.";
        if (aqi <= 150) return "Sensitive groups should limit outdoor exposure.";
        if (aqi <= 200) return "Everyone may experience health effects.";
        if (aqi <= 300) return "Health alert: everyone may experience serious effects.";
        return "Health warnings: everyone should avoid outdoor activities.";
    };

    console.log('Rendering MapView, mapData length:', mapData.length);

    return (
        <div className="space-y-6">
            {/* Map Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Real-Time Air Quality Map</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Click on markers to view detailed air quality information for each city
                        </p>
                    </div>
                    <button
                        onClick={fetchMapData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Refresh Data
                    </button>
                </div>

                {/* Color Legend */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="text-sm text-gray-600 font-semibold">Map Legend:</div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm">Good (0-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">Moderate (51-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-sm">Unhealthy for Sensitive (101-150)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm">Unhealthy (151-200)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                        <span className="text-sm">Very Unhealthy (201-300)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-900"></div>
                        <span className="text-sm">Hazardous (300+)</span>
                    </div>
                </div>
            </div>

            {/* Debug Info */}
            {!loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm">
                        <strong>Debug Info:</strong> Loaded {mapData.length} cities.
                        {mapData.length > 0 && ` Map centered on: ${mapData[0].city}`}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading map data...</p>
                        </div>
                    </div>
                ) : mapData.length === 0 ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <p className="text-gray-600 text-lg">No city data available</p>
                            <button
                                onClick={fetchMapData}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="bg-gray-100 p-2 text-sm text-gray-700">
                            Showing {mapData.length} cities on map
                        </div>
                        <MapContainer
                            center={mapCenter}
                            zoom={5}
                            style={{ height: '600px', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapController center={mapCenter} />

                            {mapData.map((location, index) => {
                                console.log(`Rendering marker ${index}:`, location.city, location.latitude, location.longitude, location.color);
                                return (
                                    <Marker
                                        key={index}
                                        position={[location.latitude, location.longitude]}
                                        icon={createColoredIcon(location.color)}
                                        eventHandlers={{
                                            click: () => setSelectedCity(location)
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <h3 className="font-bold text-lg text-gray-900">{location.city}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{location.country}</p>

                                                <div className="space-y-2">
                                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white`}
                                                        style={{
                                                            backgroundColor: location.color === 'green' ? '#10b981' :
                                                                location.color === 'yellow' ? '#eab308' :
                                                                    location.color === 'orange' ? '#f97316' :
                                                                        location.color === 'red' ? '#ef4444' :
                                                                            location.color === 'purple' ? '#a855f7' : '#991b1b'
                                                        }}>
                                                        {location.status}
                                                    </div>

                                                    <div className="mt-3">
                                                        <div className="text-3xl font-bold text-gray-900">{location.aqi}</div>
                                                        <div className="text-xs text-gray-500">Air Quality Index</div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                                        <div>
                                                            <div className="text-gray-600">PM2.5</div>
                                                            <div className="font-semibold">{location.pm25} µg/m³</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-600">PM10</div>
                                                            <div className="font-semibold">{location.pm10} µg/m³</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                                                        Last updated: {new Date(location.timestamp).toLocaleString()}
                                                    </div>

                                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                        {getAQIDescription(location.aqi)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </div>
                )}
            </div>

            {/* Selected City Details (Optional) */}
            {selectedCity && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Selected Location: {selectedCity.city}, {selectedCity.country}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Current AQI</div>
                            <div className="text-2xl font-bold text-gray-900">{selectedCity.aqi}</div>
                            <div className="text-sm text-gray-600 mt-1">{selectedCity.status}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">PM2.5</div>
                            <div className="text-2xl font-bold text-gray-900">{selectedCity.pm25}</div>
                            <div className="text-sm text-gray-600 mt-1">µg/m³</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">PM10</div>
                            <div className="text-2xl font-bold text-gray-900">{selectedCity.pm10}</div>
                            <div className="text-sm text-gray-600 mt-1">µg/m³</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cities Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Monitored Cities ({mapData.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mapData.map((location, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedCity(location)}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: location.color === 'green' ? '#10b981' :
                                            location.color === 'yellow' ? '#eab308' :
                                                location.color === 'orange' ? '#f97316' :
                                                    location.color === 'red' ? '#ef4444' :
                                                        location.color === 'purple' ? '#a855f7' : '#991b1b'
                                    }}
                                ></div>
                                <div>
                                    <div className="font-medium text-gray-900">{location.city}</div>
                                    <div className="text-xs text-gray-500">{location.country}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{location.aqi}</div>
                                <div className="text-xs text-gray-500">{location.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
