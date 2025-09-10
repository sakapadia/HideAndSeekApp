import React, { useState, useEffect } from 'react';
import { ReportingFlow } from './components/ReportingFlow';
import { UserProfile } from './components/UserProfile';
import { OAuthLogin } from './components/OAuthLogin';
import './App.css';
import './components/ReportingFlow.css';
import './components/UserProfile.css';
import './components/OAuthLogin.css';
import { UserDisplay } from './components/UIComponents';

// ===== CONFIGURATION =====
// Google Maps API key is read from Vite env: VITE_GOOGLE_MAPS_API_KEY
// Create hideandseek.client/.env.local with: VITE_GOOGLE_MAPS_API_KEY=your_key_here
// Docs: https://vitejs.dev/guide/env-and-mode.html
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

// ===== UTILITY FUNCTIONS =====
// Function to create translucent red circles based on blast radius
const createBlastRadiusCircle = (mapInstance, position, blastRadius) => {
  if (!blastRadius || blastRadius === '') return null;
  
  // Define circle sizes based on blast radius
  let radiusInMeters;
  switch (blastRadius.toLowerCase()) {
    case 'small':
      radiusInMeters = 100; // 100 meters
      break;
    case 'medium':
      radiusInMeters = 250; // 250 meters
      break;
    case 'large':
      radiusInMeters = 500; // 500 meters
      break;
    default:
      return null; // No circle for unknown blast radius
  }
  
  // Create translucent red circle
  const circle = new google.maps.Circle({
    strokeColor: '#FF0000',
    strokeOpacity: 0.3,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.1,
    map: mapInstance,
    center: position,
    radius: radiusInMeters
  });
  
  return circle;
};

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
    userId: '',
    displayName: '',
    email: '',
    provider: '',
    customUsername: '',
    username: '',
    isLoggedIn: false,
    jwtToken: ''
  });

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);
  const [forceAccountSelection, setForceAccountSelection] = useState(() => {
    // Check localStorage for forceAccountSelection state on component mount
    const stored = localStorage.getItem('hideandseek_force_account_selection');
    return stored === 'true';
  });

  // Google Maps state
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [persistentMap, setPersistentMap] = useState(null);

  // ===== REFS =====
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const persistentMapMarkersRef = React.useRef([]);
  const updateIntervalRef = React.useRef(null);

  // ===== UTILITY FUNCTIONS =====
  const getNoiseLevelColor = (level) => {
    if (level <= 3) return '#4CAF50'; // Green for low noise
    if (level <= 6) return '#FF9800'; // Orange for medium noise
    return '#F44336'; // Red for high noise
  };

  // ===== OAuth Token Handling =====
  useEffect(() => {
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');
    const error = urlParams.get('error');

    if (error) {
      setError(`Authentication failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token) {
      // Validate the JWT token
      validateToken(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check for stored token
      const storedToken = localStorage.getItem('hideandseek_token');
      if (storedToken) {
        validateToken(storedToken);
      }
    }
  }, []);

  const validateToken = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Support both PascalCase and camelCase keys from the server
        const userId = userData.UserId || userData.userId || '';
        const displayName = userData.DisplayName || userData.displayName || '';
        const email = userData.Email || userData.email || '';
        const provider = userData.Provider || userData.provider || '';
        const customUsername = userData.CustomUsername || userData.customUsername || '';
        const computedUsername = customUsername || displayName || (email ? email.split('@')[0] : '');
        setUserInfo({
          userId,
          displayName,
          email,
          provider,
          customUsername,
          username: computedUsername,
          isLoggedIn: true,
          jwtToken: token
        });
        localStorage.setItem('hideandseek_token', token);
      } else {
        const errorText = await response.text();
        // Token is invalid, clear stored token
        localStorage.removeItem('hideandseek_token');
        setUserInfo({
          userId: '',
          displayName: '',
          email: '',
          provider: '',
          customUsername: '',
          username: '',
          isLoggedIn: false,
          jwtToken: ''
        });
      }
    } catch (error) {
      localStorage.removeItem('hideandseek_token');
    } finally {
      setLoading(false);
    }
  };

  // ===== GOOGLE MAPS INITIALIZATION =====
  useEffect(() => {
    const initializeMaps = async () => {
      console.log('Initializing Google Maps...');
      console.log('API Key configured:', GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
      
      if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.warn('Google Maps API key not configured. Please add your API key to use the map feature.');
        return;
      }

      try {
        console.log('Loading Google Maps API...');
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        console.log('Google Maps API loaded successfully');
        setMapsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
      }
    };

    initializeMaps();
  }, []);

  // Initialize persistent map when container becomes available
  useEffect(() => {
    if (mapsLoaded && !persistentMap && currentMode === 'mainMenu') {
      const initializePersistentMap = () => {
        const persistentContainer = document.getElementById('persistent-map-container');
        if (persistentContainer && !persistentMap) {
          console.log('Persistent map container found, initializing map...');
          const persistentMapInstance = new google.maps.Map(persistentContainer, {
            center: { lat: 47.6062, lng: -122.3321 }, // Seattle
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true, // Hide default controls
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#667eea' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#bbdefb' }]
              }
            ]
          });
          setPersistentMap(persistentMapInstance);
          console.log('Persistent map initialized successfully');
          
          // Automatically center on user location
          if (navigator.geolocation) {
            console.log('📍 Requesting user location for auto-centering...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                const userLocation = { lat: latitude, lng: longitude };
                
                console.log('📍 User location detected:', userLocation);
                persistentMapInstance.setCenter(userLocation);
                persistentMapInstance.setZoom(14);
                
                // Add user location marker
                const userMarker = new google.maps.Marker({
                  position: userLocation,
                  map: persistentMapInstance,
                  title: 'Your Location',
                  icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(24, 24)
                  }
                });
                persistentMapMarkersRef.current.push(userMarker);
                console.log('✅ User location marker added');
                
                // Now add noise report markers around user location
                addNoiseReportMarkersToMap(persistentMapInstance);
              },
              (error) => {
                console.warn('📍 Could not get user location, using default center:', error);
                // Fallback: add noise report markers around default center
                addNoiseReportMarkersToMap(persistentMapInstance);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
          } else {
            console.warn('📍 Geolocation not supported, using default center');
            // Fallback: add noise report markers around default center
            addNoiseReportMarkersToMap(persistentMapInstance);
          }
        }
      };

      // Try to initialize after a short delay to ensure DOM is ready
      setTimeout(initializePersistentMap, 100);
    }
  }, [mapsLoaded, persistentMap, currentMode]);

  // ===== MODE SWITCHING =====
  const switchToMapMode = () => {
    console.log('Switching to map mode');
    setCurrentMode('map');
  };

  const switchToMainMenu = () => {
    console.log('Switching to main menu');
    setCurrentMode('mainMenu');
  };

  // Center on Me function for persistent background map
  const centerOnPersistentMap = () => {
    console.log('Center on Me button clicked for persistent map');
    
    if (!persistentMap) {
      console.error('Persistent map not initialized');
      setError('Persistent map not initialized.');
      return;
    }
    
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setError('Geolocation is not supported by this browser.');
      return;
    }
    
    console.log('Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position);
        const { latitude, longitude } = position.coords;
        const userLocation = { lat: latitude, lng: longitude };
        
        console.log('Setting map center to:', userLocation);
        persistentMap.setCenter(userLocation);
        persistentMap.setZoom(14);
        
        // Add a marker for user location
        new google.maps.Marker({
          position: userLocation,
          map: persistentMap,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });
        
        console.log('Centered persistent map on user location:', userLocation);
        setError(null); // Clear any previous errors
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to access your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 300000 }
    );
  };

  // Function to add noise report markers to any map instance
  const addNoiseReportMarkersToMap = async (mapInstance) => {
    try {
      console.log('Adding noise report markers to map instance:', mapInstance === persistentMap ? 'PERSISTENT MAP' : 'OTHER MAP');
      
      // Get current map bounds or use default bounds around current center
      let bounds;
      if (mapInstance.getBounds()) {
        // Use current map bounds
        bounds = mapInstance.getBounds();
      } else {
        // Fallback: create bounds around current map center
        const center = mapInstance.getCenter();
        const lat = center.lat();
        const lng = center.lng();
        bounds = {
          getNorthEast: () => ({ lat: () => lat + 0.1, lng: () => lng + 0.1 }),
          getSouthWest: () => ({ lat: () => lat - 0.1, lng: () => lng - 0.1 })
        };
      }
      
      await fetchNoiseReportsWithBoundsForMap(bounds, mapInstance);
      
    } catch (error) {
      console.error('Error adding noise report markers to map:', error);
    }
  };

  // Function to fetch and display noise reports for a specific map instance
  const fetchNoiseReportsWithBoundsForMap = async (bounds, mapInstance) => {
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      console.log('Fetching reports for map instance bounds:', {
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng()
      });

      // Get ZIP codes for the current bounds
      const zipCodesResponse = await fetch('/api/noisereports/zipcodes?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng()
      }));

      if (!zipCodesResponse.ok) {
        throw new Error(`ZIP codes API failed: ${zipCodesResponse.status}`);
      }

      const zipCodes = (await zipCodesResponse.json()).join(',');
      console.log('ZIP codes found for map instance:', zipCodes);

      // Fetch noise reports
      const response = await fetch('/api/noisereports?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng(),
        zipCodes: zipCodes
      }));

      if (!response.ok) {
        throw new Error(`Noise reports API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Noise reports data received for map instance:', data);

      if (!data.reports || data.reports.length === 0) {
        console.log('No reports found for map instance in the current bounds');
        return;
      }

      let markersCreated = 0;
      let markersSkipped = 0;

              // Add new markers to the specified map instance
      data.reports.forEach(report => {
        // Ensure we have valid coordinates for the marker
        let markerPosition = null;
        
        if (report.latitude && report.longitude && 
            report.latitude !== 0 && report.longitude !== 0) {
          // Use provided coordinates
          markerPosition = { lat: report.latitude, lng: report.longitude };
          console.log('Using coordinates for map instance:', markerPosition);
        } else if (report.streetAddress && report.city && report.state && report.zipCode) {
          // If no coordinates but we have address, skip for now
          console.warn(`Report ${report.id} has no coordinates but has address: ${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`);
          markersSkipped++;
          return;
        } else {
          // Skip reports with no location information
          console.warn(`Report ${report.id} has no valid location information`);
          markersSkipped++;
          return;
        }

        const marker = new google.maps.Marker({
          position: markerPosition,
          map: mapInstance,
          title: `${report.noiseType || report.NoiseType}: ${report.description || report.Description}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${report.noiseLevel || report.NoiseLevel}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        // Build address display string
        let addressDisplay = 'No address provided';
        if (report.streetAddress && report.city && report.state && report.zipCode) {
          addressDisplay = `${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`;
        } else if (report.address || report.Address) {
          addressDisplay = report.address || report.Address;
        } else if (report.latitude && report.longitude) {
          addressDisplay = `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
        }

        // Add info window with enhanced content
        const reportId = report.id || report.Id || report.rowKey || report.RowKey;
        const upvoteCount = reportUpvotes.get(reportId) || report.upvotes || report.Upvotes || 0;
        const hasUpvoted = upvotedReports.has(reportId);
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${report.noiseType || report.NoiseType}</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Description:</strong> ${report.description || report.Description}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Noise Level:</strong> ${report.noiseLevel || report.NoiseLevel}/10</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Reported:</strong> ${new Date(report.reportDate || report.ReportDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${addressDisplay}</p>
              ${(report.blastRadius || report.BlastRadius) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Blast Radius:</strong> ${report.blastRadius || report.BlastRadius}</p>` : ''}
              ${(report.timeOption || report.TimeOption) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Time:</strong> ${report.timeOption || report.TimeOption}</p>` : ''}
              ${(report.isRecurring || report.IsRecurring) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Recurring:</strong> Yes</p>` : ''}
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
                <button 
                  id="upvote-btn-${reportId}" 
                  onclick="window.upvoteReport('${reportId}')"
                  style="
                    background: ${hasUpvoted ? '#ccc' : '#667eea'};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: ${hasUpvoted ? 'not-allowed' : 'pointer'};
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: background 0.2s;
                  "
                  ${hasUpvoted ? 'disabled' : ''}
                >
                  👍 ${upvoteCount}
                </button>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
          // Check upvote status when info window opens
          if (reportId) {
            checkUpvoteStatus(reportId);
          }
        });

        // Create blast radius circle if blast radius is specified
        const blastRadius = report.blastRadius || report.BlastRadius;
        if (blastRadius) {
          const circle = createBlastRadiusCircle(mapInstance, markerPosition, blastRadius);
          if (circle && mapInstance === persistentMap) {
            // Store circle reference for cleanup if needed
            persistentMapMarkersRef.current.push(circle);
          }
        }
        
        // Store marker in persistentMapMarkersRef if this is the persistent map
        if (mapInstance === persistentMap) {
          persistentMapMarkersRef.current.push(marker);
        }
        
        markersCreated++;
        console.log('Marker created for map instance report:', report.id);
      });

      console.log(`Map instance markers created: ${markersCreated}, Skipped: ${markersSkipped}, Total reports: ${data.reports.length}`);
      
      if (markersSkipped > 0) {
        console.warn(`${markersSkipped} reports were skipped for map instance due to missing location information`);
      }
      
    } catch (error) {
      console.error('Error fetching noise reports for map instance:', error);
      throw error;
    }
  };

  // ===== USER STATE MANAGEMENT =====
  const handleLogout = async () => {
    try {
      // Call server logout endpoint to revoke OAuth tokens
      if (userInfo.jwtToken) {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: userInfo.jwtToken })
        });
        
        if (response.ok) {
          // no-op
        } else {
          // continue client-side
        }
      } else {
        // no token
      }

      // Get provider-specific logout URLs
      try {
        const logoutUrlsResponse = await fetch('/api/auth/logout-urls');
        if (logoutUrlsResponse.ok) {
          const logoutUrls = await logoutUrlsResponse.json();
          
          // Redirect to provider-specific logout based on current provider
          if (userInfo.provider && logoutUrls[userInfo.provider]) {
            const logoutUrl = logoutUrls[userInfo.provider];
            console.log(`Redirecting to ${userInfo.provider} logout: ${logoutUrl}`);
            
            // Open logout URL in a new window/tab
            window.open(logoutUrl, '_blank', 'width=400,height=600');
          }
        }
      } catch (error) {
          // ignore
      }

      // Clear local state
      setUserInfo({
        userId: '',
        displayName: '',
        email: '',
        provider: '',
          customUsername: '',
          username: '',
        isLoggedIn: false,
        jwtToken: ''
      });
      localStorage.removeItem('hideandseek_token');
      setShowProfile(false);
      
      // Set flag to force account selection on next login
      setForceAccountSelection(true);
      localStorage.setItem('hideandseek_force_account_selection', 'true');
      
      // Force a page reload to clear any cached authentication state
      window.location.reload();
    } catch (error) {
      // Even if there's an error, clear local state and reload
      setUserInfo({
        userId: '',
        displayName: '',
        email: '',
        provider: '',
        isLoggedIn: false,
        jwtToken: ''
      });
      localStorage.removeItem('hideandseek_token');
      setShowProfile(false);
      window.location.reload();
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  const refreshUserInfo = async () => {
    if (userInfo.jwtToken) {
      await validateToken(userInfo.jwtToken);
    }
  };

  // ===== RENDER BASED ON MODE =====
  // Gate the entire app behind authentication: show a dedicated login screen until logged in
  if (!userInfo.isLoggedIn) {
    return (
      <div className="app">
        <OAuthLogin 
          onLoginSuccess={(userData) => {
            const computedUsername = userData.CustomUsername || userData.DisplayName || (userData.Email ? userData.Email.split('@')[0] : '');
            setUserInfo({
              userId: userData.UserId,
              displayName: userData.DisplayName,
              email: userData.Email,
              provider: userData.Provider,
              customUsername: userData.CustomUsername || '',
              username: computedUsername,
              isLoggedIn: true,
              jwtToken: userData.Token
            });
            setForceAccountSelection(false);
            localStorage.removeItem('hideandseek_force_account_selection');
          }}
          onLoginError={(error) => {
            setError(error);
          }}
          forceAccountSelection={forceAccountSelection}
        />
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Validating authentication...</p>
          </div>
        )}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
    );
  }
  if (currentMode === 'mainMenu') {
    return (
      <div className="app">
        {/* Persistent Background Map - Always visible on the right side */}
        <div className="persistent-map">
          <div id="persistent-map-container" className="map-background">
            {!mapsLoaded && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#667eea',
                fontSize: '1.2rem',
                fontWeight: '600',
                textAlign: 'center',
                padding: '2rem'
              }}>
                {GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' 
                  ? '🗺️ Google Maps API key not configured'
                  : '🗺️ Loading Google Maps...'
                }
              </div>
            )}
          </div>
          
          {/* Blast Radius Legend for Persistent Map */}
          {mapsLoaded && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Blast Radius</div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  marginRight: '6px'
                }}></div>
                <span>Small</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  marginRight: '6px'
                }}></div>
                <span>Medium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  marginRight: '6px'
                }}></div>
                <span>Large</span>
              </div>
            </div>
          )}
        </div>
        
        {/* User Display - Show when user is logged in */}
        {userInfo.isLoggedIn && (
          <UserDisplay 
            username={userInfo.username}
            isGuest={false}
            onProfileClick={handleProfileClick}
          />
        )}
        
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

        {/* Center on Me Button for Main Menu */}
        {userInfo.isLoggedIn && persistentMap && (
          <div style={{
            position: 'fixed',
            top: '120px',
            left: '10px',
            zIndex: 2500
          }}>
            <button 
              className="report-button"
              onClick={() => centerOnPersistentMap()}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                marginBottom: '0.5rem',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
              }}
            >
              📍 Center on Me
            </button>
          </div>
        )}
        
        {/* Show OAuth login if not logged in, otherwise show main menu */}
        {!userInfo.isLoggedIn ? (
          <OAuthLogin 
            onLoginSuccess={(userData) => {
              const computedUsername = userData.CustomUsername || userData.DisplayName || (userData.Email ? userData.Email.split('@')[0] : '');
              setUserInfo({
                userId: userData.UserId,
                displayName: userData.DisplayName,
                email: userData.Email,
                provider: userData.Provider,
                customUsername: userData.CustomUsername || '',
                username: computedUsername,
                isLoggedIn: true,
                jwtToken: userData.Token
              });
              // Reset the force account selection flag after successful login
              setForceAccountSelection(false);
              localStorage.removeItem('hideandseek_force_account_selection');
              console.log('✅ DEBUG: forceAccountSelection reset to FALSE after successful login');
            }}
            onLoginError={(error) => {
              setError(error);
            }}
            forceAccountSelection={forceAccountSelection}
          />
        ) : (
          <ReportingFlow 
            userInfo={userInfo}
            startAtMainMenu={true}
            onAppLogout={handleLogout}
            onProfileClick={handleProfileClick}
            onUserUpdate={refreshUserInfo}
          />
        )}
        

        
        {/* User Profile Modal */}
        {showProfile && (
          <UserProfile
            userInfo={userInfo}
            onClose={handleProfileClose}
            onLogout={handleLogout}
            onUserUpdate={refreshUserInfo}
          />
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Validating authentication...</p>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
    );
  }

  // ===== MAP MODE =====
  return (
    <div className="app">
      {/* User Display for Map Interface */}
      {userInfo.isLoggedIn && (
        <UserDisplay 
          username={userInfo.username}
          isGuest={false}
          onProfileClick={handleProfileClick}
        />
      )}
      
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

      {/* Show OAuth login if not logged in, otherwise show map */}
      {!userInfo.isLoggedIn ? (
        <OAuthLogin 
          onLoginSuccess={(userData) => {
            const computedUsername = userData.CustomUsername || userData.DisplayName || (userData.Email ? userData.Email.split('@')[0] : '');
            setUserInfo({
              userId: userData.UserId,
              displayName: userData.DisplayName,
              email: userData.Email,
              provider: userData.Provider,
              customUsername: userData.CustomUsername || '',
              username: computedUsername,
              isLoggedIn: true,
              jwtToken: userData.Token
            });
            // Reset the force account selection flag after successful login
            setForceAccountSelection(false);
            localStorage.removeItem('hideandseek_force_account_selection');
            console.log('✅ DEBUG: forceAccountSelection reset to FALSE after successful login');
          }}
          onLoginError={(error) => {
            setError(error);
          }}
          forceAccountSelection={forceAccountSelection}
        />
      ) : (
        <MapInterface 
          userInfo={userInfo} 
          mapsLoaded={mapsLoaded}
          persistentMap={persistentMap}
          setError={setError}
          error={error}
          setCurrentMode={setCurrentMode}
          mapRef={mapRef}
          markersRef={markersRef}
          persistentMapMarkersRef={persistentMapMarkersRef}
          updateIntervalRef={updateIntervalRef}
        />
      )}
      
      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile
          userInfo={userInfo}
          onClose={handleProfileClose}
          onLogout={handleLogout}
          onUserUpdate={refreshUserInfo}
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Validating authentication...</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

/**
 * Original map interface component.
 * This is the previous implementation with Google Maps integration.
 */
function MapInterface({ userInfo, mapsLoaded, persistentMap, setError, error, setCurrentMode, mapRef, markersRef, persistentMapMarkersRef, updateIntervalRef }) {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [noiseReports, setNoiseReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markersLoading, setMarkersLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    categories: [], // Array of selected categories
    minNoiseLevel: 1,
    maxNoiseLevel: 10,
    city: '',
    zipCode: '',
    showFilters: false
  });

  // Upvote state - track which reports the user has upvoted
  const [upvotedReports, setUpvotedReports] = useState(new Set());
  const [reportUpvotes, setReportUpvotes] = useState(new Map()); // reportId -> upvote count
  
  // Refs are now defined in the main App component

  // Google Maps state is now handled in the main App component
  // No need to duplicate the initialization here
  
  // Use ref to store current filters to avoid closure issues
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  // Make upvote function available globally for info window buttons
  React.useEffect(() => {
    window.upvoteReport = handleUpvote;
    return () => {
      delete window.upvoteReport;
    };
  }, [userInfo.jwtToken]);
  
  // Debug component lifecycle
  useEffect(() => {
    console.log('MapInterface component mounted');
    return () => {
      console.log('MapInterface component unmounting');
    };
  }, []);

  // Refresh map when filters change
  useEffect(() => {
    if (map) {
      console.log('Filters changed, refreshing map markers with filters:', filters);
      fetchNoiseReports(map);
    }
  }, [filters.categories, filters.minNoiseLevel, filters.maxNoiseLevel, filters.city, filters.zipCode, map]);

  // Initialize the map when mapsLoaded becomes true
  useEffect(() => {
    console.log('MapInterface useEffect triggered:', { mapsLoaded, mapRefCurrent: !!mapRef.current, map: !!map });
    
    // If we already have a map, don't reinitialize
    if (map) {
      console.log('Map already exists, skipping initialization');
      return;
    }
    
    if (mapsLoaded && mapRef.current && !map) {
      console.log('Initializing map in MapInterface...');
      console.log('Map container dimensions:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);
      console.log('Map container styles:', window.getComputedStyle(mapRef.current));
      console.log('Map container in DOM:', document.contains(mapRef.current));
      
      // Check if container has proper dimensions
      if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        console.log('Map container has no dimensions, waiting...');
        // Wait a bit for the container to get proper dimensions
        setTimeout(() => {
          if (mapRef.current && !map) {
            console.log('Retrying map initialization after delay...');
            // This will trigger the useEffect again
          }
        }, 100);
        return;
      }
      
      // Check if container is visible
      const computedStyle = window.getComputedStyle(mapRef.current);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.log('Map container is not visible, waiting...');
        setTimeout(() => {
          if (mapRef.current && !map) {
            console.log('Retrying map initialization after visibility check...');
          }
        }, 100);
        return;
      }
      
      // Force container to have proper dimensions if needed
      if (mapRef.current.offsetWidth < 100 || mapRef.current.offsetHeight < 100) {
        console.log('Forcing container dimensions...');
        mapRef.current.style.width = '100vw';
        mapRef.current.style.height = '100vh';
        // Wait a bit for the styles to take effect
        setTimeout(() => {
          if (mapRef.current && !map) {
            console.log('Retrying map initialization after forcing dimensions...');
          }
        }, 100);
        return;
      }
      
      try {
        // Check if Google Maps API is available
        if (typeof google === 'undefined' || !google.maps) {
          console.error('Google Maps API not available');
          setError('Google Maps API not loaded. Please refresh the page.');
          return;
        }
        
        const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 47.6062, lng: -122.3321 }, // Seattle
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false, // Show default controls for main map
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#667eea' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#bbdefb' }]
          }
        ]
      });
      
      setMap(mapInstance);
      setLoading(false);
      
      // Add bounds changed listener to refresh markers when map is moved
      mapInstance.addListener('bounds_changed', () => {
        // Debounce the bounds change to avoid too many API calls
        clearTimeout(updateIntervalRef.current);
        updateIntervalRef.current = setTimeout(() => {
          try {
            console.log('Bounds changed, refreshing with current filters:', filtersRef.current);
            fetchNoiseReports(mapInstance);
          } catch (error) {
            console.error('Error in bounds_changed listener:', error);
          }
        }, 1000); // Wait 1 second after user stops moving the map
      });
      
      // Initial fetch with a delay to ensure map is fully loaded
      setTimeout(() => {
        console.log('Initial fetch of noise reports after map load delay');
        try {
          fetchNoiseReports(mapInstance);
        } catch (error) {
          console.error('Error in initial fetch:', error);
        }
      }, 2000);
      
        console.log('Map initialized successfully in MapInterface');
        
        // Debug map size after initialization
        setTimeout(() => {
          console.log('Map instance bounds:', mapInstance.getBounds());
          console.log('Map container final dimensions:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);
        }, 1000);
      } catch (error) {
        console.error('Error initializing map in MapInterface:', error);
        setError('Failed to initialize map. Please try again.');
        setLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      if (map) {
        console.log('Cleaning up map instance');
        // Clear any intervals or listeners
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      }
    };
  }, [mapsLoaded, mapRef.current, map]); // Add mapRef.current to ensure container is available

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
      if (!mapInstance) {
        console.error('Map instance is null or undefined');
        return;
      }
      
      setMarkersLoading(true);
      console.log('Fetching noise reports...');
      
      const bounds = mapInstance.getBounds();
      if (!bounds) {
        console.log('Map bounds not available yet, using default bounds');
        // Use bounds around current map center if map bounds are not available yet
        const center = mapInstance.getCenter();
        if (!center) {
          console.error('Map center is not available');
          return;
        }
        const lat = center.lat();
        const lng = center.lng();
        const defaultBounds = {
          getNorthEast: () => ({ lat: () => lat + 0.1, lng: () => lng + 0.1 }),
          getSouthWest: () => ({ lat: () => lat - 0.1, lng: () => lng - 0.1 })
        };
        await fetchNoiseReportsWithBounds(defaultBounds, mapInstance);
        return;
      }

      await fetchNoiseReportsWithBounds(bounds, mapInstance);
      
    } catch (error) {
      console.error('Error in fetchNoiseReports:', error);
      setError('Failed to load noise reports. Please try again.');
    } finally {
      setMarkersLoading(false);
    }
  };

  // Filter functions
  const applyFilters = (reports, currentFilters = filtersRef.current) => {
    console.log('Applying filters:', currentFilters);
    return reports.filter(report => {
      // Category filter
      if (currentFilters.categories.length > 0) {
        const reportCategory = report.noiseType || report.NoiseType;
        if (!currentFilters.categories.includes(reportCategory)) {
          return false;
        }
      }
      
      // Noise level filter
      const reportNoiseLevel = report.noiseLevel || report.NoiseLevel;
      if (reportNoiseLevel < currentFilters.minNoiseLevel || reportNoiseLevel > currentFilters.maxNoiseLevel) {
        return false;
      }
      
      // City filter
      if (currentFilters.city && currentFilters.city.trim() !== '') {
        const reportCity = report.city || report.City;
        if (!reportCity || !reportCity.toLowerCase().includes(currentFilters.city.toLowerCase())) {
          return false;
        }
      }
      
      // ZIP code filter
      if (currentFilters.zipCode && currentFilters.zipCode.trim() !== '') {
        const reportZipCode = report.zipCode || report.ZipCode;
        if (!reportZipCode || !reportZipCode.includes(currentFilters.zipCode)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleCategory = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      minNoiseLevel: 1,
      maxNoiseLevel: 10,
      city: '',
      zipCode: '',
      showFilters: false
    });
  };

  // Upvote functions
  const handleUpvote = async (reportId) => {
    try {
      console.log('Upvoting report:', reportId);
      
      const response = await fetch(`/api/noisereports/${reportId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.jwtToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upvote report');
      }

      const upvoteData = await response.json();
      console.log('Upvote response:', upvoteData);

      // Update local state
      setUpvotedReports(prev => new Set([...prev, reportId]));
      setReportUpvotes(prev => new Map(prev.set(reportId, upvoteData.upvotes)));

      // Show success message
      console.log('Successfully upvoted report!');
      
    } catch (error) {
      console.error('Error upvoting report:', error);
      setError(`Failed to upvote report: ${error.message}`);
    }
  };

  const checkUpvoteStatus = async (reportId) => {
    try {
      const response = await fetch(`/api/noisereports/${reportId}/upvote-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.jwtToken}`
        }
      });

      if (response.ok) {
        const upvoteData = await response.json();
        setReportUpvotes(prev => new Map(prev.set(reportId, upvoteData.upvotes)));
        if (upvoteData.hasUserUpvoted) {
          setUpvotedReports(prev => new Set([...prev, reportId]));
        }
      }
    } catch (error) {
      console.error('Error checking upvote status:', error);
    }
  };

  const fetchNoiseReportsWithBounds = async (bounds, mapInstance) => {
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      console.log('Fetching reports for bounds:', {
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng()
      });

      // Get ZIP codes for the current bounds
      const zipCodesResponse = await fetch('/api/noisereports/zipcodes?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng()
      }));

      if (!zipCodesResponse.ok) {
        throw new Error(`ZIP codes API failed: ${zipCodesResponse.status}`);
      }

      const zipCodes = (await zipCodesResponse.json()).join(',');
      console.log('ZIP codes found:', zipCodes);

      // Fetch noise reports
      const response = await fetch('/api/noisereports?' + new URLSearchParams({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng(),
        zipCodes: zipCodes
      }));

      if (!response.ok) {
        throw new Error(`Noise reports API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Apply filters to the data
      console.log('Raw reports from API:', data.reports?.length || 0);
      console.log('Current filters being applied:', filtersRef.current);
      const filteredReports = applyFilters(data.reports || [], filtersRef.current);
      console.log(`Filtered ${data.reports?.length || 0} reports to ${filteredReports.length} based on current filters`);
      
      // Clear existing markers and circles
      markersRef.current.forEach(item => {
        if (item.setMap) {
          item.setMap(null);
        }
      });
      markersRef.current = [];

      let markersCreated = 0;
      let markersSkipped = 0;

      if (!filteredReports || filteredReports.length === 0) {
        console.log('No reports found in the current bounds after filtering');
        setNoiseReports([]);
        return;
      }

      // Add new markers
      filteredReports.forEach(report => {
        // Ensure we have valid coordinates for the marker
        // Handle both PascalCase (Latitude, Longitude) and camelCase (latitude, longitude)
        let markerPosition = null;
        
        const lat = report.latitude || report.Latitude;
        const lng = report.longitude || report.Longitude;
        
        if (lat && lng && lat !== 0 && lng !== 0) {
          // Use provided coordinates
          markerPosition = { lat: lat, lng: lng };
        } else if (report.streetAddress && report.city && report.state && report.zipCode) {
          // If no coordinates but we have address, skip for now
          console.warn(`Report ${report.id} has no coordinates but has address: ${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`);
          markersSkipped++;
          return;
        } else {
          // Skip reports with no location information
          console.warn(`Report ${report.id} has no valid location information`);
          markersSkipped++;
          return;
        }

        const marker = new google.maps.Marker({
          position: markerPosition,
          map: mapInstance,
          title: `${report.noiseType || report.NoiseType}: ${report.description || report.Description}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${report.noiseLevel || report.NoiseLevel}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        // Build address display string
        let addressDisplay = 'No address provided';
        if (report.streetAddress && report.city && report.state && report.zipCode) {
          addressDisplay = `${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`;
        } else if (report.address || report.Address) {
          addressDisplay = report.address || report.Address;
        } else if (lat && lng) {
          addressDisplay = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        // Add info window with enhanced content
        const reportId = report.id || report.Id || report.rowKey || report.RowKey;
        const upvoteCount = reportUpvotes.get(reportId) || report.upvotes || report.Upvotes || 0;
        const hasUpvoted = upvotedReports.has(reportId);
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${report.noiseType || report.NoiseType}</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Description:</strong> ${report.description || report.Description}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Noise Level:</strong> ${report.noiseLevel || report.NoiseLevel}/10</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Reported:</strong> ${new Date(report.reportDate || report.ReportDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${addressDisplay}</p>
              ${(report.blastRadius || report.BlastRadius) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Blast Radius:</strong> ${report.blastRadius || report.BlastRadius}</p>` : ''}
              ${(report.timeOption || report.TimeOption) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Time:</strong> ${report.timeOption || report.TimeOption}</p>` : ''}
              ${(report.isRecurring || report.IsRecurring) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Recurring:</strong> Yes</p>` : ''}
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
                <button 
                  id="upvote-btn-${reportId}" 
                  onclick="window.upvoteReport('${reportId}')"
                  style="
                    background: ${hasUpvoted ? '#ccc' : '#667eea'};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: ${hasUpvoted ? 'not-allowed' : 'pointer'};
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: background 0.2s;
                  "
                  ${hasUpvoted ? 'disabled' : ''}
                >
                  👍 ${upvoteCount}
                </button>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
          // Check upvote status when info window opens
          if (reportId) {
            checkUpvoteStatus(reportId);
          }
        });

        // Create blast radius circle if blast radius is specified
        const blastRadius = report.blastRadius || report.BlastRadius;
        if (blastRadius) {
          const circle = createBlastRadiusCircle(mapInstance, markerPosition, blastRadius);
          if (circle) {
            // Store circle reference for cleanup
            markersRef.current.push(circle);
          }
        }

        markersRef.current.push(marker);
        markersCreated++;
        console.log('Marker created for report:', report.id);
      });

      setNoiseReports(filteredReports);
      
      // Log marker creation summary
      console.log(`Markers created: ${markersCreated}, Skipped: ${markersSkipped}, Total filtered reports: ${filteredReports.length}`);
      
      if (markersSkipped > 0) {
        console.warn(`${markersSkipped} reports were skipped due to missing location information`);
      }
      
    } catch (error) {
      console.error('Error fetching noise reports with bounds:', error);
      throw error;
    }
  };

  // Center map on user's current location on demand
  const centerOnUser = () => {
    console.log('Center on Me button clicked!');
    if (!map) return;
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        map.setCenter({ lat: latitude, lng: longitude });
        map.setZoom(14);
        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          title: 'Your Location'
        });
      },
      () => {
        setError('Unable to access your location. Please allow location access or try again.');
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 300000 }
    );
  };

  // getNoiseLevelColor is now defined in the main App component

  const handleMapClick = (event) => {
    if (event && event.latLng) {
      setSelectedLocation({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
      setShowReportForm(true);
    }
  };

  const handleSubmitReport = async (reportData) => {
    try {
      const response = await fetch('/api/noisereports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.jwtToken}`
        },
        body: JSON.stringify({
          ...reportData,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          submittedBy: userInfo.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

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

  return (
    <div className="app">
      {/* Header hidden in map mode to maximize map viewport */}
      <header className="header" style={{ display: 'none' }}>
        <h1>Noise Report Map</h1>
        <p>Report and view noise complaints in your area</p>
      </header>
      
      <div className="map-container fullscreen">
        <div 
          ref={(el) => {
            mapRef.current = el;
            if (el) {
              console.log('Map container ref set:', el);
              console.log('Container dimensions:', el.offsetWidth, 'x', el.offsetHeight);
            }
          }}
          className="map" 
          onClick={handleMapClick} 
          style={{ width: '100%', height: '100vh' }}
          data-testid="map-container"
        ></div>
        
        {/* Overlays for loading/error */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading map...</p>
          </div>
        )}
        {error && (
          <div className="error" style={{ position: 'absolute', inset: 0 }}>
            <h2>Map Not Available</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setTimeout(() => setLoading(false), 100);
                }}
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
                <li>Create <code>hideandseek.client/.env.local</code> with:<br/> <code>VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY</code></li>
                <li>Restart the dev server: <code>npm run dev</code></li>
                <li>Optional security: Restrict the key to referrer <code>http://localhost:50696/*</code></li>
              </ol>
            </div>
          </div>
        )}

        <div className="map-controls">
          <button 
            onClick={centerOnUser}
            className="map-control-btn"
            title="Center on My Location"
          >
            📍 Center on Me
          </button>
          <button 
            onClick={() => {
              if (map) {
                try {
                  fetchNoiseReports(map);
                } catch (error) {
                  console.error('Error refreshing reports:', error);
                  setError('Failed to refresh reports. Please try again.');
                }
              }
            }}
            className="map-control-btn"
            title="Refresh Reports"
          >
            🔄 Refresh Reports
          </button>
          <button 
            onClick={() => handleFilterChange('showFilters', !filters.showFilters)}
            className="map-control-btn"
            title="Toggle Filters"
          >
            🔍 {filters.showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Filter Panel */}
        {filters.showFilters && (
          <div className="filter-panel">
            <div className="filter-header">
              <h3>Filter Reports</h3>
              <button 
                onClick={clearFilters}
                className="clear-filters-btn"
                title="Clear All Filters"
              >
                Clear All
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="filter-section">
              <h4>Noise Categories</h4>
              <div className="category-filters">
                {['Traffic', 'Construction', 'Music', 'Party', 'Industrial', 'Other'].map(category => (
                  <label key={category} className="category-filter-item">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Noise Level Filter */}
            <div className="filter-section">
              <h4>Noise Level Range</h4>
              <div className="noise-level-filters">
                <div className="range-input">
                  <label>Min: {filters.minNoiseLevel}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.minNoiseLevel}
                    onChange={(e) => handleFilterChange('minNoiseLevel', parseInt(e.target.value))}
                  />
                </div>
                <div className="range-input">
                  <label>Max: {filters.maxNoiseLevel}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.maxNoiseLevel}
                    onChange={(e) => handleFilterChange('maxNoiseLevel', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Location Filters */}
            <div className="filter-section">
              <h4>Location</h4>
              <div className="location-filters">
                <div className="filter-input">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="Enter city name..."
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div className="filter-input">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    placeholder="Enter ZIP code..."
                    value={filters.zipCode}
                    onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="filter-summary">
              <h4>Active Filters</h4>
              <div className="active-filters">
                {filters.categories.length > 0 && (
                  <span className="active-filter-tag">
                    Categories: {filters.categories.join(', ')}
                  </span>
                )}
                {(filters.minNoiseLevel > 1 || filters.maxNoiseLevel < 10) && (
                  <span className="active-filter-tag">
                    Noise Level: {filters.minNoiseLevel}-{filters.maxNoiseLevel}
                  </span>
                )}
                {filters.city && (
                  <span className="active-filter-tag">
                    City: {filters.city}
                  </span>
                )}
                {filters.zipCode && (
                  <span className="active-filter-tag">
                    ZIP: {filters.zipCode}
                  </span>
                )}
                {filters.categories.length === 0 && 
                 filters.minNoiseLevel === 1 && 
                 filters.maxNoiseLevel === 10 && 
                 !filters.city && 
                 !filters.zipCode && (
                  <span className="no-filters">No filters applied</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="legend-section">
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
            
            <h4 style={{ marginTop: '15px', marginBottom: '8px' }}>Blast Radius Legend</h4>
            <div className="legend-item">
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                border: '2px solid rgba(255, 0, 0, 0.3)',
                display: 'inline-block',
                marginRight: '8px'
              }}></div>
              <span>Small (100m)</span>
            </div>
            <div className="legend-item">
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                border: '2px solid rgba(255, 0, 0, 0.3)',
                display: 'inline-block',
                marginRight: '8px'
              }}></div>
              <span>Medium (250m)</span>
            </div>
            <div className="legend-item">
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                border: '2px solid rgba(255, 0, 0, 0.3)',
                display: 'inline-block',
                marginRight: '8px',
                transform: 'scale(1.2)'
              }}></div>
              <span>Large (500m)</span>
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
        <p>Filtered noise reports in view: {noiseReports.length}</p>
        {filters.categories.length > 0 || filters.minNoiseLevel > 1 || filters.maxNoiseLevel < 10 || filters.city || filters.zipCode ? (
          <p className="filter-info">Filters are active</p>
        ) : null}
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