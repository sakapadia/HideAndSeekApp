import React, { useState, useRef, useEffect } from 'react';
import { ReportingFlow } from './components/ReportingFlow';
import './App.css';
import './components/ReportingFlow.css';
import { UserDisplay } from './components/UIComponents';

// ===== CONFIGURATION =====
// Replace with your actual Google Maps API key
// Get one from: https://console.cloud.google.com/
// Required APIs: Maps JavaScript API, Geocoding API (optional)
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

/**
 * Main application component.
 * 
 * This app provides two modes:
 * 1. Map View - Interactive Google Maps for viewing noise reports
 * 2. Reporting Flow - Multi-step form for submitting new reports
 * 
 * Users can switch between these modes using the toggle button.
 */
function App() {
  // ===== STATE MANAGEMENT =====
  const [currentMode, setCurrentMode] = useState('mainMenu'); // 'mainMenu' or 'map'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // User state that persists across modes
  const [userInfo, setUserInfo] = useState({ 
    username: '', 
    isGuest: false,
    isLoggedIn: false,
    userType: null
  });

  // ===== MODE SWITCHING =====
  const switchToMapMode = () => {
    setCurrentMode('map');
  };

  const switchToMainMenu = () => {
    setCurrentMode('mainMenu');
  };

  // ===== INITIAL LOGIN CHECK =====
  const isFirstTimeUser = !userInfo.isLoggedIn && !userInfo.isGuest;

  // ===== USER STATE MANAGEMENT =====
  const updateUserInfo = (newUserInfo) => {
    setUserInfo(prev => ({ ...prev, ...newUserInfo }));
  };

  // ===== RENDER BASED ON MODE =====
  if (currentMode === 'mainMenu') {
    return (
      <div className="app">
        {/* User Display */}
        <UserDisplay 
          username={userInfo.username}
          isGuest={userInfo.isGuest}
        />
        
        {/* Mode Switch Button */}
        <div className="mode-switch">
          <button 
            className="mode-btn active"
            onClick={switchToMainMenu}
          >
            Main Menu
          </button>
          <button 
            className="mode-btn"
            onClick={switchToMapMode}
          >
            Map View
          </button>
        </div>
        
        {/* Show login only for first-time users, otherwise show main menu */}
        {isFirstTimeUser ? (
          <ReportingFlow 
            onUserStateChange={updateUserInfo}
            userInfo={userInfo}
          />
        ) : (
          <ReportingFlow 
            onUserStateChange={updateUserInfo}
            userInfo={userInfo}
            startAtMainMenu={true}
          />
        )}
      </div>
    );
  }

  // ===== MAP MODE (Original Implementation) =====
  return (
    <div className="app">
      {/* User Display for Map Interface */}
      <UserDisplay 
        username={userInfo.username}
        isGuest={userInfo.isGuest}
      />
      
      {/* Mode Switch Button */}
      <div className="mode-switch">
        <button 
          className="mode-btn"
          onClick={switchToMainMenu}
        >
          Main Menu
        </button>
        <button 
          className="mode-btn active"
          onClick={switchToMapMode}
        >
          Map View
        </button>
      </div>

      {/* Original Map Interface */}
      <MapInterface />
    </div>
  );
}

/**
 * Original map interface component.
 * This is the previous implementation with Google Maps integration.
 */
function MapInterface() {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [noiseReports, setNoiseReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const updateIntervalRef = React.useRef(null);

  // ===== GOOGLE MAPS INITIALIZATION =====
  React.useEffect(() => {
    const initMap = async () => {
      try {
        // Check if API key is configured
        if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
          setError('Google Maps API key not configured. Please add your API key to use the map feature.');
          setLoading(false);
          return;
        }

        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        
        // Get user's current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ lat: latitude, lng: longitude });
              
              // Initialize map centered on user location
              const mapInstance = new google.maps.Map(mapRef.current, {
                center: { lat: latitude, lng: longitude },
                zoom: 14,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                  }
                ]
              });

              setMap(mapInstance);
              setLoading(false);

              // Add user location marker
              new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: mapInstance,
                title: 'Your Location',
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(24, 24)
                }
              });

              // Start periodic updates
              startPeriodicUpdates(mapInstance);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Fallback to default location (New York City)
              const defaultLocation = { lat: 40.7128, lng: -74.0060 };
              setUserLocation(defaultLocation);
              
              const mapInstance = new google.maps.Map(mapRef.current, {
                center: defaultLocation,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
              });

              setMap(mapInstance);
              setLoading(false);
              startPeriodicUpdates(mapInstance);
            }
          );
        } else {
          setError('Geolocation is not supported by this browser.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const startPeriodicUpdates = (mapInstance) => {
    // Update noise reports every 15 minutes
    updateIntervalRef.current = setInterval(() => {
      fetchNoiseReports(mapInstance);
    }, 15 * 60 * 1000);

    // Initial fetch
    fetchNoiseReports(mapInstance);
  };

  const fetchNoiseReports = async (mapInstance) => {
    try {
      const bounds = mapInstance.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Get ZIP codes for the current bounds
      const zipCodesResponse = await fetch('/api/noisereports/zipcodes?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng()
      }));

      const zipCodes = (await zipCodesResponse.json()).join(',');

      // Fetch noise reports
      const response = await fetch('/api/noisereports?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng(),
        zipCodes: zipCodes
      }));

      const data = await response.json();

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add new markers
      data.reports.forEach(report => {
        const marker = new google.maps.Marker({
          position: { lat: report.latitude, lng: report.longitude },
          map: mapInstance,
          title: `${report.noiseType}: ${report.description}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${getNoiseLevelColor(report.noiseLevel)}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${report.noiseLevel}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 5px 0; color: #333;">${report.noiseType}</h3>
              <p style="margin: 5px 0; color: #666;">${report.description}</p>
              <p style="margin: 5px 0; color: #666;">Noise Level: ${report.noiseLevel}/10</p>
              <p style="margin: 5px 0; color: #666;">Reported: ${new Date(report.reportDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #666;">Address: ${report.address}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        markersRef.current.push(marker);
      });

      setNoiseReports(data.reports);
    } catch (error) {
      console.error('Error fetching noise reports:', error);
    }
  };

  const getNoiseLevelColor = (level) => {
    if (level <= 3) return '#4CAF50'; // Green for low noise
    if (level <= 6) return '#FF9800'; // Orange for medium noise
    return '#F44336'; // Red for high noise
  };

  const handleMapClick = (event) => {
    setSelectedLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    });
    setShowReportForm(true);
  };

  const handleSubmitReport = async (reportData) => {
    try {
      await fetch('/api/noisereports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        })
      });

      setShowReportForm(false);
      setSelectedLocation(null);
      
      // Refresh noise reports
      if (map) {
        fetchNoiseReports(map);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit noise report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Map Not Available</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentMode('mainMenu')}
          >
            Use Main Menu Instead
          </button>
        </div>
        <div className="api-key-info">
          <h3>To enable the map feature:</h3>
          <ol>
            <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Enable the "Maps JavaScript API"</li>
            <li>Replace <code>YOUR_GOOGLE_MAPS_API_KEY</code> in <code>src/App.jsx</code> with your actual API key</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* User Display for Map Interface */}
      <UserDisplay 
        username={userInfo.username}
        isGuest={userInfo.isGuest}
      />
      
      <header className="header">
        <h1>Noise Report Map</h1>
        <p>Report and view noise complaints in your area</p>
      </header>
      
      <div className="map-container">
        <div ref={mapRef} className="map" onClick={handleMapClick}></div>
        
        <div className="map-controls">
          <button 
            className="report-button"
            onClick={() => setShowReportForm(true)}
          >
            Report Noise
          </button>
          
          <div className="legend">
            <h4>Noise Level Legend</h4>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
              <span>Low (1-3)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
              <span>Medium (4-6)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
              <span>High (7-10)</span>
            </div>
          </div>
        </div>
      </div>

      {showReportForm && (
        <NoiseReportForm
          location={selectedLocation}
          onSubmit={handleSubmitReport}
          onCancel={() => {
            setShowReportForm(false);
            setSelectedLocation(null);
          }}
        />
      )}

      <div className="stats">
        <p>Total noise reports in view: {noiseReports.length}</p>
      </div>
    </div>
  );
}

/**
 * Simple noise report form component (for map mode).
 */
function NoiseReportForm({ location, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: '',
    noiseType: 'Traffic',
    noiseLevel: 5,
    reporterName: '',
    contactEmail: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Report Noise Complaint</h2>
        {location && (
          <p className="location-info">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the noise issue..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="noiseType">Noise Type</label>
            <select
              id="noiseType"
              name="noiseType"
              value={formData.noiseType}
              onChange={handleChange}
            >
              <option value="Traffic">Traffic</option>
              <option value="Construction">Construction</option>
              <option value="Music">Music</option>
              <option value="Party">Party</option>
              <option value="Industrial">Industrial</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="noiseLevel">Noise Level (1-10)</label>
            <input
              type="range"
              id="noiseLevel"
              name="noiseLevel"
              min="1"
              max="10"
              value={formData.noiseLevel}
              onChange={handleChange}
            />
            <span>{formData.noiseLevel}</span>
          </div>

          <div className="form-group">
            <label htmlFor="reporterName">Your Name</label>
            <input
              type="text"
              id="reporterName"
              name="reporterName"
              value={formData.reporterName}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail">Email</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



export default App;