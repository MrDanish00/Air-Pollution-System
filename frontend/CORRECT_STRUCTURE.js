// REPLACE LINES 382-947 WITH THIS CORRECT VERSION:

{
    error ? (
        <div className="flex justify-center items-center h-64">
            <div className={`max-w-md w-full ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-6 text-center`}>
                <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>City Not Found</h3>
                <p className={`${darkMode ? 'text-red-200' : 'text-red-700'} mb-4`}>{error}</p>
                <button onClick={() => setError(null)} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}>Dismiss</button>
            </div>
        </div>
    ) : (
          <>
            {/* Welcome screen - only on dashboard with no city */}
            {!selectedCity && activeTab === 'dashboard' && (
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
                                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                Browse All Cities
                            </button>
                            <button
                                onClick={() => setActiveTab('map')}
                                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                    }`}
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
            {activeTab === 'dashboard' && selectedCity && loading && !currentAQI && (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading air quality data for {selectedCity}...</p>
                    </div>
                </div>
            )}

            {/* Dashboard tab with city data - CONTINUES ON NEXT LINES... */}
