import React from 'react';
import { MapPin, Activity, TrendingUp, Wind } from 'lucide-react';

const CitiesBrowser = ({
    darkMode,
    searchResults,
    setSearchResults,
    selectedFilter,
    setSelectedFilter,
    filteredCities,
    handleCitySelect,
    setActiveTab
}) => {
    console.log('🏙️ CitiesBrowser rendering!', { filteredCitiesCount: filteredCities?.length, searchResultsCount: searchResults?.length });
    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} rounded-xl p-10 text-white shadow-2xl`}>
                <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Wind className="w-10 h-10" />
                        <h1 className="text-4xl font-bold">Explore Air Quality Worldwide</h1>
                    </div>
                    <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                        Monitor real-time air quality data for major cities across the globe. Filter by AQI levels,
                        search by name, or click any city to view detailed analytics and forecasts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm rounded-lg p-4`}>
                            <div className="flex items-center gap-3 mb-2">
                                <MapPin className="w-6 h-6" />
                                <span className="text-2xl font-bold">{filteredCities.length}</span>
                            </div>
                            <p className="text-sm text-blue-100">Cities Monitored</p>
                        </div>
                        <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm rounded-lg p-4`}>
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-6 h-6" />
                                <span className="text-2xl font-bold">Real-time</span>
                            </div>
                            <p className="text-sm text-blue-100">Live Updates</p>
                        </div>
                        <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm rounded-lg p-4`}>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-6 h-6" />
                                <span className="text-2xl font-bold">7-Day</span>
                            </div>
                            <p className="text-sm text-blue-100">Forecasts Available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg border`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Search Results
                            <span className={`ml-3 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({searchResults.length} {searchResults.length === 1 ? 'city' : 'cities'} found)
                            </span>
                        </h3>
                        <button
                            onClick={() => setSearchResults([])}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                } transition-colors`}
                        >
                            Clear Search
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {searchResults.map((city, index) => (
                            <CityCard
                                key={index}
                                city={city}
                                darkMode={darkMode}
                                onClick={() => { handleCitySelect(city.name); setActiveTab('dashboard'); }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg border`}>
                <h3 className={`text-sm font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-wider flex items-center gap-2`}>
                    <Activity className="w-4 h-4" />
                    Filter by Air Quality Level
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                        { id: 'all', label: 'All Cities', sub: null, color: 'bg-gray-500', hoverColor: 'hover:bg-gray-600' },
                        { id: 'good', label: 'Good', sub: '0-50', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
                        { id: 'moderate', label: 'Moderate', sub: '51-100', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
                        { id: 'unhealthy-sensitive', label: 'Sensitive', sub: '101-150', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
                        { id: 'unhealthy', label: 'Unhealthy', sub: '151-200', color: 'bg-red-500', hoverColor: 'hover:bg-red-600' },
                        { id: 'very-unhealthy', label: 'Very Bad', sub: '201-300', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
                        { id: 'hazardous', label: 'Hazardous', sub: '301+', color: 'bg-red-900', hoverColor: 'hover:bg-red-800' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`p-3 rounded-lg text-sm font-medium transition-all transform ${selectedFilter === filter.id
                                ? `${filter.color} text-white shadow-lg scale-105 ring-2 ring-offset-2 ${darkMode ? 'ring-offset-gray-900' : 'ring-offset-white'} ring-blue-500`
                                : darkMode
                                    ? `bg-gray-700 text-gray-300 ${filter.hoverColor}`
                                    : `bg-gray-100 text-gray-700 ${filter.hoverColor}`
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${selectedFilter === filter.id ? 'bg-white/20' : filter.color}`}></div>
                            <div className="font-bold text-xs">{filter.label}</div>
                            {filter.sub && <div className="text-xs opacity-75 mt-0.5">{filter.sub}</div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cities Grid */}
            {filteredCities.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg border`}>
                    <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedFilter === 'all'
                            ? 'All Cities Worldwide'
                            : `${selectedFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Air Quality`}
                        <span className={`ml-3 text-base font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ({filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'})
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredCities.map((city, index) => (
                            <CityCard
                                key={index}
                                city={city}
                                darkMode={darkMode}
                                onClick={() => { handleCitySelect(city.name); setActiveTab('dashboard'); }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filteredCities.length === 0 && searchResults.length === 0 && (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
                    <Activity className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        No cities found
                    </h3>
                    <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                        Try adjusting your filters or search criteria
                    </p>
                </div>
            )}
        </div>
    );
};

const CityCard = ({ city, darkMode, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-lg p-4 border-l-4 transition-all transform hover:scale-105 hover:shadow-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-white hover:shadow-lg'
                }`}
            style={{ borderLeftColor: city.color }}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {city.name}
                    </h4>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {city.country}
                    </p>
                </div>
                <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            <div className="mb-2">
                <div className="text-3xl font-bold mb-1" style={{ color: city.color }}>
                    {Math.round(city.aqi)}
                </div>
                <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {city.status}
                </div>
            </div>

            <div className={`pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>PM2.5</span>
                        <div className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {city.pm25} µg/m³
                        </div>
                    </div>
                    <div>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>PM10</span>
                        <div className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {city.pm10} µg/m³
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitiesBrowser;
