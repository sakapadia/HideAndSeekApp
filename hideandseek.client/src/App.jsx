import React, { useState, useEffect } from 'react';
import { ReportingFlow } from './components/ReportingFlow';
import { UserProfile } from './components/UserProfile';
import { OAuthLogin } from './components/OAuthLogin';
import './App.css';
import './components/ReportingFlow.css';
import './components/UserProfile.css';
import './components/OAuthLogin.css';
import { UserDisplay } from './components/UIComponents';
import { CATEGORY_FIELDS, CATEGORY_HIERARCHY } from './components/Screens';

// ===== CONFIGURATION =====
// Google Maps API key is fetched at runtime from /api/config/google-maps-api-key
// Configure the key in Azure App Service settings or server environment

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

// ===== CATEGORY PIN ICONS =====
// Maps major categories to pin colors and center icons
const CATEGORY_PIN_CONFIG = {
  "Celebrations, Entertainment & Gatherings": {
    color: "#9C27B0",
    icon: (c) => `<polygon points="12,6 12.7,8.2 15,8.2 13.2,9.5 13.8,11.8 12,10.5 10.2,11.8 10.8,9.5 9,8.2 11.3,8.2" fill="${c}"/>`
  },
  "Traffic, Transportation & Infrastructure": {
    color: "#FF9800",
    icon: (c) => `<rect x="9.2" y="7.5" width="5.6" height="3" rx="0.3" fill="none" stroke="${c}" stroke-width="0.7"/><line x1="10.5" y1="7.5" x2="12.5" y2="10.5" stroke="${c}" stroke-width="0.7"/><line x1="12.5" y1="7.5" x2="14.5" y2="10.5" stroke="${c}" stroke-width="0.7"/>`
  },
  "Public Safety, Hazards & Emergencies": {
    color: "#F44336",
    icon: (c) => `<path d="M12 6.2L15.2 11.5H8.8Z" fill="none" stroke="${c}" stroke-width="0.8" stroke-linejoin="round"/><line x1="12" y1="7.8" x2="12" y2="9.8" stroke="${c}" stroke-width="0.8" stroke-linecap="round"/><circle cx="12" cy="10.7" r="0.4" fill="${c}"/>`
  },
  "Protests, Civil Unrest & Political Activity": {
    color: "#3F51B5",
    icon: (c) => `<path d="M9 8.5V9.8H10.2L13.5 11.2V7L10.2 8.5H9Z" fill="${c}"/><line x1="14" y1="7.8" x2="15.2" y2="7.3" stroke="${c}" stroke-width="0.5"/><line x1="14" y1="9" x2="15.3" y2="9" stroke="${c}" stroke-width="0.5"/><line x1="14" y1="10.2" x2="15.2" y2="10.7" stroke="${c}" stroke-width="0.5"/>`
  },
  "Public Nuisances & Quality-of-Life Issues": {
    color: "#607D8B",
    icon: (c) => `<path d="M8.5 9C9.5 7.2 10.7 6.5 12 6.5C13.3 6.5 14.5 7.2 15.5 9C14.5 10.8 13.3 11.5 12 11.5C10.7 11.5 9.5 10.8 8.5 9Z" fill="none" stroke="${c}" stroke-width="0.7"/><circle cx="12" cy="9" r="1.5" fill="${c}"/>`
  },
  "Health & Biohazards": {
    color: "#4CAF50",
    icon: (c) => `<path d="M12 6C12 6 9.2 8.8 9.2 10.2C9.2 11.8 10.5 13 12 13C13.5 13 14.8 11.8 14.8 10.2C14.8 8.8 12 6 12 6Z" fill="${c}"/>`
  },
  "Animals & Wildlife": {
    color: "#795548",
    icon: (c) => `<circle cx="10.5" cy="7.2" r="0.7" fill="${c}"/><circle cx="13.5" cy="7.2" r="0.7" fill="${c}"/><circle cx="9.2" cy="9" r="0.7" fill="${c}"/><circle cx="14.8" cy="9" r="0.7" fill="${c}"/><ellipse cx="12" cy="10.8" rx="1.8" ry="1.2" fill="${c}"/>`
  },
  "Commerce, Services & Crowd Density": {
    color: "#009688",
    // People cluster - three figures
    icon: (c) => `<circle cx="12" cy="6.5" r="0.9" fill="${c}"/><path d="M10.2 11C10.2 9.5 11 8.2 12 8.2C13 8.2 13.8 9.5 13.8 11" fill="${c}"/><circle cx="9.5" cy="7.8" r="0.7" fill="${c}"/><path d="M8.2 11C8.2 9.8 8.8 8.8 9.5 8.8C10.1 8.8 10.5 9.5 10.7 10.5" fill="${c}"/><circle cx="14.5" cy="7.8" r="0.7" fill="${c}"/><path d="M13.3 10.5C13.5 9.5 13.9 8.8 14.5 8.8C15.2 8.8 15.8 9.8 15.8 11" fill="${c}"/>`
  },
  "Community, Neighborhood & Social Events": {
    color: "#2196F3",
    // House cluster - two small houses
    icon: (c) => `<path d="M10 9L8 7.5L10 6V9Z" fill="${c}"/><rect x="8.2" y="7.5" width="3.5" height="2.8" fill="${c}"/><rect x="9.2" y="8.8" width="1" height="1.5" fill="white"/><path d="M14.5 10L12.5 8.5L14.5 7V10Z" fill="${c}"/><rect x="12.7" y="8.5" width="3.5" height="2.8" fill="${c}"/><rect x="13.7" y="9.8" width="1" height="1.5" fill="white"/>`
  },
  "Other / Emerging Categories": {
    color: "#9E9E9E",
    icon: (c) => `<text x="12" y="11.5" text-anchor="middle" font-size="7" font-weight="bold" fill="${c}" font-family="Arial,sans-serif">?</text>`
  }
};

const getMarkerSvg = (noiseType) => {
  const hierarchy = CATEGORY_HIERARCHY[noiseType];
  const majorCategory = hierarchy ? hierarchy.major : "Other / Emerging Categories";
  const config = CATEGORY_PIN_CONFIG[majorCategory] || CATEGORY_PIN_CONFIG["Other / Emerging Categories"];
  return `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${config.color}" stroke="#FFFFFF" stroke-width="1"/>
      <circle cx="12" cy="9" r="3.8" fill="white"/>
      ${config.icon(config.color)}
    </svg>
  `;
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
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [persistentMap, setPersistentMap] = useState(null);

  // Upvote state - track which reports the user has upvoted
  const [upvotedReports, setUpvotedReports] = useState(new Set());
  const [reportUpvotes, setReportUpvotes] = useState(new Map()); // reportId -> upvote count

  // ===== REFS =====
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const persistentMapMarkersRef = React.useRef([]);
  const updateIntervalRef = React.useRef(null);
  const debounceTimeoutRef = React.useRef(null);

  // ===== UTILITY FUNCTIONS =====
  const getNoiseLevelColor = (level) => {
    if (level <= 3) return '#4CAF50'; // Green for low noise
    if (level <= 6) return '#FF9800'; // Orange for medium noise
    return '#F44336'; // Red for high noise
  };

  // Extract duplicate OAuth login success handler
  const handleOAuthLoginSuccess = (userData) => {
    setUserInfoFromData(userData, userData.Token);
    setForceAccountSelection(false);
    localStorage.removeItem('hideandseek_force_account_selection');
  };

  // Extract duplicate OAuth login error handler
  const handleOAuthLoginError = (error) => {
    setError(error);
  };

  // Extract duplicate user info setting logic
  const setUserInfoFromData = (userData, token = '') => {
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
  };

  const clearUserInfo = () => {
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
  };

  // Extract duplicate UI components
  const LoadingOverlay = ({ message = "Validating authentication..." }) => (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );

  const ErrorBanner = () => (
    <div className="error-banner">
      <p>{error}</p>
      <button onClick={() => setError(null)}>Dismiss</button>
    </div>
  );

  // Function to generate estimated duration display text
  function getEstimatedDurationText(report) {
    // Check for multiple possible field name variations - prioritize PascalCase since API returns that
    const customDate = report.CustomDate || report.customDate || report.custom_date || report.CUSTOM_DATE;
    const isRecurring = report.IsRecurring || report.isRecurring || report.is_recurring || report.IS_RECURRING;
    const recurrenceConfig = report.RecurrenceConfig || report.recurrenceConfig || report.recurrence_config || report.RECURRENCE_CONFIG;
    const customSlots = report.CustomSlots || report.customSlots || report.custom_slots || report.CUSTOM_SLOTS;
    
    // Debug logging removed for cleaner output
    
    // Priority 1: Custom date (most specific timing information)
    if (customDate && customDate.trim() !== '') {
      try {
        const date = new Date(customDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (error) {
        console.warn('Invalid custom date:', customDate, error);
      }
    }
    
    // Priority 2: Recurrence configuration (if recurring)
    if (isRecurring && recurrenceConfig && recurrenceConfig.trim() !== '') {
      try {
        const config = JSON.parse(recurrenceConfig);
        
        // Check for frequency field (based on your Azure data structure)
        const frequency = config.frequency;
        
        if (frequency) {
          // Capitalize the first letter and return just the frequency
          const capitalizedFrequency = frequency.charAt(0).toUpperCase() + frequency.slice(1);
          return capitalizedFrequency;
        } else {
          return 'Recurring';
        }
      } catch (error) {
        console.warn('Invalid recurrence config:', recurrenceConfig, error);
        return 'Recurring';
      }
    }
    
    // Priority 3: Custom time slots
    if (customSlots && customSlots.trim() !== '') {
      try {
        const slots = JSON.parse(customSlots);
        if (Array.isArray(slots) && slots.length > 0) {
          return `Custom times: ${slots.join(', ')}`;
        }
      } catch (error) {
        console.warn('Invalid custom slots:', customSlots);
      }
    }
    
    // Priority 4: Check if recurring but no config (fallback for recurring)
    if (isRecurring) {
      return 'Recurring';
    }
    
    // Priority 5: Time option (basic time period)
    const timeOption = report.timeOption || report.TimeOption;
    if (timeOption && timeOption !== 'NOW' && timeOption.trim() !== '') {
      return `Time: ${timeOption}`;
    }
    
    // Fallback: No timing information available
    return 'Duration not specified';
  }

  // Function to load comments for a report
  async function loadComments(reportId) {
    try {
      const response = await fetch(`/api/noisereports/${reportId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      
      const comments = await response.json();
      const commentsContainer = document.getElementById(`comments-${reportId}`);
      
      if (commentsContainer) {
        // Update comment count in the header
        const commentHeader = document.querySelector(`h4[style*="margin: 0 0 8px 0; color: #333; font-size: 14px;"]`);
        if (commentHeader && commentHeader.textContent.includes('Comments')) {
          commentHeader.textContent = `Comments (${comments.length})`;
        }
        
        if (comments.length === 0) {
          commentsContainer.innerHTML = '<p style="margin: 5px 0; color: #999; font-size: 12px; font-style: italic;">No comments yet</p>';
        } else {
          const commentsHtml = comments.map(comment => `
            <div style="margin-bottom: 8px; padding: 6px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #4CAF50;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 11px; color: #333;">${comment.username}</strong>
                <span style="font-size: 10px; color: #666;">${new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.4;">${comment.text}</p>
              ${comment.isFromMerge ? '<span style="font-size: 10px; color: #4CAF50; font-style: italic;">(from merged report)</span>' : ''}
            </div>
          `).join('');
          
          commentsContainer.innerHTML = commentsHtml;
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      const commentsContainer = document.getElementById(`comments-${reportId}`);
      if (commentsContainer) {
        commentsContainer.innerHTML = '<p style="margin: 5px 0; color: #e74c3c; font-size: 12px;">Error loading comments</p>';
      }
    }
  }

  // Function to add a comment to a report
  async function addComment(reportId) {
    const input = document.getElementById(`comment-input-${reportId}`);
    const commentText = input?.value?.trim();
    
    if (!commentText) {
      alert('Please enter a comment');
      return;
    }
    
    try {
      const response = await fetch(`/api/noisereports/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: commentText })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      // Clear the input
      input.value = '';
      
      // Reload comments
      await loadComments(reportId);
      
      console.log('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  }

  // Function to get display text for a report (most recent comment or description)
  function getReportDisplayText(report) {
    // If the report has comments, get the most recent one
    if (report.comments && Array.isArray(report.comments) && report.comments.length > 0) {
      const sortedComments = report.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sortedComments[0].text;
    }
    
    // Fallback to description
    return report.description || report.Description || 'No description available';
  }

  // Make functions globally available for onclick handlers
  window.addComment = addComment;

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
        setUserInfoFromData(userData, token);
        localStorage.setItem('hideandseek_token', token);
      } else {
        const errorText = await response.text();
        // Token is invalid, clear stored token
        localStorage.removeItem('hideandseek_token');
        clearUserInfo();
      }
    } catch (error) {
      localStorage.removeItem('hideandseek_token');
    } finally {
      setLoading(false);
    }
  };

  // Set up global upvote function for main App component
  useEffect(() => {
    window.upvoteReport = handleUpvoteMain;
    return () => {
      delete window.upvoteReport;
    };
  }, [userInfo.jwtToken]);

  // ===== FETCH GOOGLE MAPS API KEY =====
  useEffect(() => {
    const fetchApiKey = async () => {
      console.log('Fetching Google Maps API key...');
      setApiKeyLoading(true);
      setApiKeyError(null);

      try {
        const response = await fetch('/api/config/google-maps-api-key');
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.status}`);
        }
        const data = await response.json();
        if (data.apiKey && data.apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
          setGoogleMapsApiKey(data.apiKey);
          console.log('Google Maps API key fetched successfully');
        } else {
          setApiKeyError('Google Maps API key not configured on server');
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
        setApiKeyError(error.message);
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // ===== GOOGLE MAPS INITIALIZATION =====
  useEffect(() => {
    if (!googleMapsApiKey) return;

    const initializeMaps = async () => {
      console.log('Initializing Google Maps...');

      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: googleMapsApiKey,
          version: 'weekly',
          libraries: ['places', 'marker']
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
  }, [googleMapsApiKey]);

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
            mapId: 'DEMO_MAP_ID',
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
                const userMarker = new google.maps.marker.AdvancedMarkerElement({
                  position: userLocation,
                  map: persistentMapInstance,
                  title: 'Your Location',
                  content: document.createElement('div')
                });
                
                // Set the marker content with custom icon
                const markerContent = userMarker.content;
                markerContent.innerHTML = `
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
                  </svg>
                `;
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
    // Clean up persistent map markers before switching
    persistentMapMarkersRef.current.forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });
    persistentMapMarkersRef.current = [];
    setPersistentMap(null);
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
        const userMarker = new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: persistentMap,
          title: 'Your Location',
          content: document.createElement('div')
        });
        
        // Set the marker content with custom icon
        const markerContent = userMarker.content;
        markerContent.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
          </svg>
        `;
        
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

  // Function to update info window content after upvote (main App component scope)
  const updateInfoWindowContent = (reportId, upvoteCount, hasUpvoted) => {
    // Find the button element and update its appearance
    const buttonElement = document.getElementById(`upvote-btn-${reportId}`);
    if (buttonElement) {
      buttonElement.style.background = hasUpvoted ? '#ccc' : '#667eea';
      buttonElement.style.cursor = hasUpvoted ? 'not-allowed' : 'pointer';
      buttonElement.disabled = hasUpvoted;
      buttonElement.innerHTML = `👍 ${upvoteCount}`;
    }
  };

  // Global upvote handler for main App component (used by persistent map)
  const handleUpvoteMain = async (reportId) => {
    try {
      console.log('Upvoting report from main component:', reportId);
      
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
      console.log('Upvote response from main component:', upvoteData);

      // Update local state
      setUpvotedReports(prev => new Set([...prev, reportId]));
      setReportUpvotes(prev => new Map(prev.set(reportId, upvoteData.upvotes)));

      // Update the info window content to reflect the new upvote state
      updateInfoWindowContent(reportId, upvoteData.upvotes, true);

      // Show success message
      console.log('Successfully upvoted report from main component!');
      
    } catch (error) {
      console.error('Error upvoting report from main component:', error);
      setError(`Failed to upvote report: ${error.message}`);
    }
  };

  // Check upvote status for multiple reports at once (main App component scope)
  const checkUpvoteStatusForReports = async (reports, userToken) => {
    if (!reports || reports.length === 0 || !userToken) return;
    
    try {
      // Check upvote status for all reports in parallel
      const upvotePromises = reports.map(async (report) => {
        const reportId = report.id || report.Id || report.rowKey || report.RowKey;
        if (!reportId) return null;
        
        try {
          const response = await fetch(`/api/noisereports/${reportId}/upvote-status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            }
          });

          if (response.ok) {
            const upvoteData = await response.json();
            return {
              reportId,
              upvotes: upvoteData.upvotes,
              hasUserUpvoted: upvoteData.hasUserUpvoted
            };
          }
        } catch (error) {
          console.error(`Error checking upvote status for report ${reportId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(upvotePromises);
      
      // Update the global upvote state
      results.forEach(result => {
        if (result) {
          // Update reportUpvotes state
          setReportUpvotes(prev => new Map(prev.set(result.reportId, result.upvotes)));
          // Update upvotedReports state
          if (result.hasUserUpvoted) {
            setUpvotedReports(prev => new Set([...prev, result.reportId]));
          }
          // Update the info window content to reflect the current upvote state
          updateInfoWindowContent(result.reportId, result.upvotes, result.hasUserUpvoted);
        }
      });
    } catch (error) {
      console.error('Error checking upvote status for reports:', error);
    }
  };

  // Function to add noise report markers to any map instance
  const addNoiseReportMarkersToMap = async (mapInstance) => {
    try {
      // Adding noise report markers to map instance
      
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
      
      // Fetching reports for map instance bounds

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
      // ZIP codes found for map instance

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
      // Noise reports data received for map instance

      if (!data.reports || data.reports.length === 0) {
        console.log('No reports found for map instance in the current bounds');
        return;
      }

      // Check upvote status for all reports when they're first loaded
      checkUpvoteStatusForReports(data.reports, userInfo.jwtToken);

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
          // Using coordinates for map instance
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

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: markerPosition,
          map: mapInstance,
          title: `${report.noiseType || report.NoiseType}: ${getReportDisplayText(report)}`,
          content: document.createElement('div')
        });
        
        // Set the marker content with category-specific icon
        const markerContent = marker.content;
        markerContent.innerHTML = getMarkerSvg(report.noiseType || report.NoiseType);

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
            <div style="padding: 10px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${report.noiseType || report.NoiseType}</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Latest Update:</strong> ${getReportDisplayText(report)}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Noise Level:</strong> ${report.noiseLevel || report.NoiseLevel}/10</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Reported:</strong> ${new Date(report.reportDate || report.ReportDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${addressDisplay}</p>
              ${(report.blastRadius || report.BlastRadius) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Blast Radius:</strong> ${report.blastRadius || report.BlastRadius}</p>` : ''}
              ${(report.timeOption || report.TimeOption) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Time:</strong> ${report.timeOption || report.TimeOption}</p>` : ''}
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Estimated Duration:</strong> ${getEstimatedDurationText(report)}</p>
              ${(report.isRecurring || report.IsRecurring) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Recurring:</strong> Yes</p>` : ''}
              ${(report.mergedReportCount && report.mergedReportCount > 0) ? `<p style="margin: 5px 0; color: #4CAF50; font-size: 12px;"><strong>📝 ${report.mergedReportCount} related reports merged</strong></p>` : ''}
              
              <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">Comments (${report.comments ? report.comments.length : 0})</h4>
                <div id="comments-${reportId}" style="max-height: 150px; overflow-y: auto; margin-bottom: 10px;">
                  <p style="margin: 5px 0; color: #666; font-size: 12px; font-style: italic;">Loading comments...</p>
                </div>
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                  <input type="text" id="comment-input-${reportId}" placeholder="Add a comment..." 
                         style="flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;">
                  <button onclick="window.addComment('${reportId}')" 
                          style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                    Add
                  </button>
                </div>
              </div>
              
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
            loadComments(reportId);
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
        // Marker created for map instance report
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
      clearUserInfo();
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
          onLoginSuccess={handleOAuthLoginSuccess}
          onLoginError={handleOAuthLoginError}
          forceAccountSelection={forceAccountSelection}
        />
        {loading && <LoadingOverlay />}
        {error && <ErrorBanner />}
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
  {apiKeyLoading
                  ? '🗺️ Loading configuration...'
                  : apiKeyError
                    ? `🗺️ ${apiKeyError}`
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

              <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '10px', paddingTop: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>Categories</div>
                {Object.entries(CATEGORY_PIN_CONFIG).map(([name, cfg]) => {
                  const shortName = name
                    .replace('Celebrations, Entertainment & Gatherings', 'Celebrations & Events')
                    .replace('Traffic, Transportation & Infrastructure', 'Traffic & Infrastructure')
                    .replace('Public Safety, Hazards & Emergencies', 'Public Safety & Hazards')
                    .replace('Protests, Civil Unrest & Political Activity', 'Protests & Unrest')
                    .replace('Public Nuisances & Quality-of-Life Issues', 'Public Nuisances')
                    .replace('Health & Biohazards', 'Health & Biohazards')
                    .replace('Animals & Wildlife', 'Animals & Wildlife')
                    .replace('Commerce, Services & Crowd Density', 'Commerce & Crowds')
                    .replace('Community, Neighborhood & Social Events', 'Community & Local')
                    .replace('Other / Emerging Categories', 'Other / Emerging');
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                      <div
                        style={{ width: '20px', height: '20px', marginRight: '6px', flexShrink: 0 }}
                        dangerouslySetInnerHTML={{ __html: `
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${cfg.color}" stroke="#FFF" stroke-width="1"/>
                            <circle cx="12" cy="9" r="3.8" fill="white"/>
                            ${cfg.icon(cfg.color)}
                          </svg>
                        `}}
                      />
                      <span style={{ lineHeight: '1.2' }}>{shortName}</span>
                    </div>
                  );
                })}
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
        {/* {userInfo.isLoggedIn && persistentMap && (
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
        )} */}
        
        {/* Show OAuth login if not logged in, otherwise show main menu */}
        {!userInfo.isLoggedIn ? (
          <OAuthLogin 
            onLoginSuccess={handleOAuthLoginSuccess}
            onLoginError={handleOAuthLoginError}
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
        {loading && <LoadingOverlay />}
        
        {/* Error display */}
        {error && <ErrorBanner />}
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
          onLoginSuccess={handleOAuthLoginSuccess}
          onLoginError={handleOAuthLoginError}
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
          debounceTimeoutRef={debounceTimeoutRef}
          getEstimatedDurationText={getEstimatedDurationText}
          checkUpvoteStatusForReports={checkUpvoteStatusForReports}
          upvotedReports={upvotedReports}
          setUpvotedReports={setUpvotedReports}
          reportUpvotes={reportUpvotes}
          setReportUpvotes={setReportUpvotes}
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
      {loading && <LoadingOverlay />}

      {/* Error display */}
      {error && <ErrorBanner />}
    </div>
  );
}

/**
 * Original map interface component.
 * This is the previous implementation with Google Maps integration.
 */
function MapInterface({ userInfo, mapsLoaded, persistentMap, setError, error, setCurrentMode, mapRef, markersRef, persistentMapMarkersRef, updateIntervalRef, debounceTimeoutRef, getEstimatedDurationText, checkUpvoteStatusForReports, upvotedReports, setUpvotedReports, reportUpvotes, setReportUpvotes }) {
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
    timePeriods: [], // Array of selected time periods (Morning, Afternoon, Evening, Night)
    startDate: '', // Start date for date range filter
    endDate: '', // End date for date range filter
    showFilters: false
  });
  
  // Marker state tracking for incremental updates
  const [displayedReportIds, setDisplayedReportIds] = useState(new Set());
  const [cachedReports, setCachedReports] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedFilterCategories, setExpandedFilterCategories] = useState({});

  // Build the full category tree from CATEGORY_FIELDS (always shows all 10 main + 30 sub)
  // Returns: { majorCat: { subCat: [noiseType1, noiseType2, ...], ... }, ... }
  const categoryTree = React.useMemo(() => {
    const tree = {};
    for (const majorCat of Object.keys(CATEGORY_FIELDS)) {
      tree[majorCat] = {};
      for (const subCat of Object.keys(CATEGORY_FIELDS[majorCat])) {
        tree[majorCat][subCat] = Object.entries(CATEGORY_HIERARCHY)
          .filter(([, h]) => h.major === majorCat && h.sub === subCat)
          .map(([noiseType]) => noiseType);
      }
    }
    return tree;
  }, []);

  // Helper: get all noiseTypes for a main category
  const getNoiseTypesForMainCategory = (majorCat) => {
    return Object.values(categoryTree[majorCat] || {}).flat();
  };

  // Helper: get all noiseTypes for a subcategory
  const getNoiseTypesForSubcategory = (majorCat, subCat) => {
    return categoryTree[majorCat]?.[subCat] || [];
  };

  // Refs are now defined in the main App component

  // Google Maps state is now handled in the main App component
  // No need to duplicate the initialization here
  
  // Use ref to store current filters to avoid closure issues
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;
  
  // Use ref to track if we're currently fetching to prevent race conditions
  const isFetchingRef = React.useRef(false);

  // Make upvote function available globally for info window buttons
  React.useEffect(() => {
    window.upvoteReport = handleUpvote;
    return () => {
      delete window.upvoteReport;
    };
  }, [userInfo.jwtToken]);
  
  // Debug component lifecycle
  useEffect(() => {
    // MapInterface component mounted
    return () => {
      // MapInterface component unmounting
    };
  }, []);

  // Refresh map when filters change
  useEffect(() => {
    if (map && !isFetchingRef.current && cachedReports.length > 0) {
      console.log('Filters changed, updating markers with cached data:', filters);
      // Use cached data to avoid API call when only filters change
      updateMarkersIncremental(cachedReports, map);
    } else if (map && !isFetchingRef.current) {
      console.log('Filters changed, fetching new data:', filters);
      fetchNoiseReports(map);
    }
  }, [filters.categories, filters.minNoiseLevel, filters.maxNoiseLevel, filters.city, filters.zipCode, filters.timePeriods, filters.startDate, filters.endDate, map]);

  // Note: No need to clean up stale categories - the hierarchical filter always
  // shows all categories from CATEGORY_HIERARCHY. If selected categories have no
  // matching reports, applyFilters simply filters them out.

  // Initialize the map when mapsLoaded becomes true
  useEffect(() => {
    // MapInterface useEffect triggered
    
    // If we already have a map, don't reinitialize
    if (map) {
      // Map already exists, skipping initialization
      return;
    }
    
    if (mapsLoaded && mapRef.current && !map) {
      // Initializing map in MapInterface
      
      // Check if container has proper dimensions
      if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        // Map container has no dimensions, waiting...
        // Wait a bit for the container to get proper dimensions
        setTimeout(() => {
          if (mapRef.current && !map) {
            // Retrying map initialization after delay...
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
        mapId: 'DEMO_MAP_ID',
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
      
      // Clear any existing markers when initializing a new map
      clearAllMarkers(mapInstance);
      
      // Add bounds changed listener to refresh markers when map is moved
      mapInstance.addListener('bounds_changed', () => {
        // Skip if already fetching
        if (isFetchingRef.current) {
          console.log('Skipping bounds_changed event - already fetching');
          return;
        }
        
        // Debounce the bounds change to avoid too many API calls
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
          try {
            console.log('Bounds changed, refreshing with current filters:', filtersRef.current);
            fetchNoiseReports(mapInstance);
          } catch (error) {
            console.error('Error in bounds_changed listener:', error);
          }
        }, 2000); // Wait 2 seconds after user stops moving the map
      });
      
      // Initial fetch with a delay to ensure map is fully loaded
      setTimeout(() => {
        console.log('Initial fetch of noise reports after map load delay');
        try {
          handleInitialLoad(mapInstance);
        } catch (error) {
          console.error('Error in initial fetch:', error);
        }
      }, 2000);
      
        // Map initialized successfully in MapInterface
        
        // Debug map size after initialization
        setTimeout(() => {
          // Map instance bounds and container dimensions set
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
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      }
    };
  }, [mapsLoaded, mapRef.current, map]); // Add mapRef.current to ensure container is available

  const startPeriodicUpdates = (mapInstance) => {
    // Update noise reports every 15 minutes
    updateIntervalRef.current = setInterval(() => {
      // Only fetch if map is still valid and bounds are available
      if (mapInstance && mapInstance.getBounds && mapInstance.getBounds()) {
        fetchNoiseReports(mapInstance);
      }
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
      
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) {
        console.log('Already fetching markers, skipping duplicate request');
        return;
      }
      
      isFetchingRef.current = true;
      setMarkersLoading(true);
      setError(null); // Clear any previous errors
      // Fetching noise reports
      
      const bounds = mapInstance.getBounds();
      if (!bounds) {
        // Map bounds not available yet, using default bounds
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
      isFetchingRef.current = false;
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
      
      // Time period filter
      if (currentFilters.timePeriods.length > 0) {
        const reportTimeOption = report.timeOption || report.TimeOption;
        console.log('Time period filter check:', {
          reportTimeOption,
          selectedTimePeriods: currentFilters.timePeriods,
          isIncluded: currentFilters.timePeriods.includes(reportTimeOption)
        });
        if (!reportTimeOption || !currentFilters.timePeriods.includes(reportTimeOption)) {
          return false;
        }
      }
      
      // Date range filter - use custom date (when the noise occurred) instead of report date
      if (currentFilters.startDate || currentFilters.endDate) {
        const customDate = report.customDate || report.CustomDate;
        console.log('Date range filter check:', {
          customDate,
          startDate: currentFilters.startDate,
          endDate: currentFilters.endDate,
          hasCustomDate: !!customDate
        });
        if (!customDate) {
          // If no custom date, skip this report
          return false;
        }
        
        const reportDate = new Date(customDate);
        const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : null;
        const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : null;
        
        if (startDate && reportDate < startDate) {
          return false;
        }
        if (endDate && reportDate > endDate) {
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

  // Toggle all noiseTypes under a main category
  const toggleMainCategory = (majorCat) => {
    const noiseTypes = getNoiseTypesForMainCategory(majorCat);
    setFilters(prev => {
      const allSelected = noiseTypes.every(nt => prev.categories.includes(nt));
      return {
        ...prev,
        categories: allSelected
          ? prev.categories.filter(c => !noiseTypes.includes(c))
          : [...new Set([...prev.categories, ...noiseTypes])]
      };
    });
  };

  // Toggle all noiseTypes under a subcategory
  const toggleSubcategory = (majorCat, subCat) => {
    const noiseTypes = getNoiseTypesForSubcategory(majorCat, subCat);
    setFilters(prev => {
      const allSelected = noiseTypes.every(nt => prev.categories.includes(nt));
      return {
        ...prev,
        categories: allSelected
          ? prev.categories.filter(c => !noiseTypes.includes(c))
          : [...new Set([...prev.categories, ...noiseTypes])]
      };
    });
  };

  // Toggle expand/collapse for a main category in the filter UI
  const toggleFilterCategoryExpand = (majorCat) => {
    setExpandedFilterCategories(prev => ({
      ...prev,
      [majorCat]: !prev[majorCat]
    }));
  };

  const toggleTimePeriod = (timePeriod) => {
    setFilters(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.includes(timePeriod)
        ? prev.timePeriods.filter(t => t !== timePeriod)
        : [...prev.timePeriods, timePeriod]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      minNoiseLevel: 1,
      maxNoiseLevel: 10,
      city: '',
      zipCode: '',
      timePeriods: [],
      startDate: '',
      endDate: '',
      showFilters: false
    });
    setExpandedFilterCategories({});
    
    // Refresh the map to show all reports within current bounds
    if (map && !isFetchingRef.current) {
      console.log('Clearing filters, refreshing map to show all reports');
      fetchNoiseReports(map);
    }
  };


  // Function to update info window content after upvote
  const updateInfoWindowContent = (reportId, upvoteCount, hasUpvoted) => {
    // Find the button element and update its appearance
    const buttonElement = document.getElementById(`upvote-btn-${reportId}`);
    if (buttonElement) {
      buttonElement.style.background = hasUpvoted ? '#ccc' : '#667eea';
      buttonElement.style.cursor = hasUpvoted ? 'not-allowed' : 'pointer';
      buttonElement.disabled = hasUpvoted;
      buttonElement.innerHTML = `👍 ${upvoteCount}`;
    }
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

      // Update the info window content to reflect the new upvote state
      updateInfoWindowContent(reportId, upvoteData.upvotes, true);

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
        
        // Update the info window content to reflect the current upvote state
        updateInfoWindowContent(reportId, upvoteData.upvotes, upvoteData.hasUserUpvoted);
      }
    } catch (error) {
      console.error('Error checking upvote status:', error);
    }
  };


  // Function to clear all markers from a map instance
  const clearAllMarkers = (mapInstance) => {
    const isPersistentMap = mapInstance === persistentMap;
    const markerRef = isPersistentMap ? persistentMapMarkersRef : markersRef;
    
    console.log(`Clearing all markers from ${isPersistentMap ? 'persistent' : 'regular'} map. Count: ${markerRef.current.length}`);
    
    // Remove all markers and circles
    markerRef.current.forEach(item => {
      if (item && (item.setMap || item.map)) {
        if (item.setMap) {
          item.setMap(null);
        } else if (item.map) {
          item.map = null;
        }
      }
    });
    
    // Clear the array
    markerRef.current.length = 0;
    
    // Reset displayed report IDs
    setDisplayedReportIds(new Set());
    
    // Cleared all markers
  };

  // Incremental marker update function
  const updateMarkersIncremental = (newReports, mapInstance) => {
    try {
      // Updating markers incrementally
      
      // Extract unique categories from the raw reports
      const categories = [...new Set(
        (newReports || [])
          .map(r => r.noiseType || r.NoiseType)
          .filter(Boolean)
      )].sort();
      setAvailableCategories(categories);

      // Apply filters to the new reports
      const filteredReports = applyFilters(newReports || [], filtersRef.current);
      // Filtered reports based on current filters
    
    // Determine which marker reference array to use based on map instance
    const isPersistentMap = mapInstance === persistentMap;
    const markerRef = isPersistentMap ? persistentMapMarkersRef : markersRef;
    
    // Always clear all existing markers first to ensure clean state
    // Clearing all existing markers
    markerRef.current.forEach(item => {
      if (item && (item.setMap || item.map)) {
        if (item.setMap) {
          item.setMap(null);
        } else if (item.map) {
          item.map = null;
        }
      }
    });
    markerRef.current.length = 0;
    
    // Reset displayed report IDs
    setDisplayedReportIds(new Set());
    
    console.log(`Cleared all markers. New count: ${markerRef.current.length}`);
    
    // Now add all filtered reports as new markers
    const reportsToAdd = filteredReports;
    
    // Adding filtered reports as new markers
    
    // Add markers for filtered reports
    let markersCreated = 0;
    let markersSkipped = 0;
    
    reportsToAdd.forEach(report => {
      // Ensure we have valid coordinates for the marker
      let markerPosition = null;
      
      const lat = report.latitude || report.Latitude;
      const lng = report.longitude || report.Longitude;
      
      if (lat && lng && lat !== 0 && lng !== 0) {
        markerPosition = { lat: lat, lng: lng };
      } else if (report.streetAddress && report.city && report.state && report.zipCode) {
        console.warn(`Report ${report.id} has no coordinates but has address: ${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`);
        markersSkipped++;
        return;
      } else {
        console.warn(`Report ${report.id} has no valid location information`);
        markersSkipped++;
        return;
      }

      const reportId = report.id || report.Id || report.rowKey || report.RowKey;
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: markerPosition,
        map: mapInstance,
        title: `${report.noiseType || report.NoiseType}: ${report.description || report.Description}`,
        content: document.createElement('div')
      });
      
      // Set the marker content with category-specific icon
      const markerContent = marker.content;
      markerContent.innerHTML = getMarkerSvg(report.noiseType || report.NoiseType);

      // Store report ID on marker for easy removal
      marker.reportId = reportId;

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
      const upvoteCount = reportUpvotes.get(reportId) || report.upvotes || report.Upvotes || 0;
      const hasUpvoted = upvotedReports.has(reportId);
      
      // Get estimated duration text before creating the info window
      const estimatedDurationText = getEstimatedDurationText(report);
      
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${report.noiseType || report.NoiseType}</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Noise Level:</strong> ${report.noiseLevel || report.NoiseLevel}/10</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Reported:</strong> ${new Date(report.reportDate || report.ReportDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${addressDisplay}</p>
            ${(report.blastRadius || report.BlastRadius) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Blast Radius:</strong> ${report.blastRadius || report.BlastRadius}</p>` : ''}
            ${(report.timeOption || report.TimeOption) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Time:</strong> ${report.timeOption || report.TimeOption}</p>` : ''}
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Estimated Duration:</strong> ${estimatedDurationText}</p>
            ${(report.isRecurring || report.IsRecurring) ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Recurring:</strong> Yes</p>` : ''}
            ${(report.mergedReportCount && report.mergedReportCount > 0) ? `<p style="margin: 5px 0; color: #4CAF50; font-size: 12px;"><strong>📝 ${report.mergedReportCount} related reports merged</strong></p>` : ''}
            
            <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">Comments (${report.commentCount || 0})</h4>
              <div id="comments-${reportId}" style="max-height: 150px; overflow-y: auto; margin-bottom: 10px;">
                <p style="margin: 5px 0; color: #666; font-size: 12px; font-style: italic;">Loading comments...</p>
              </div>
              <div style="display: flex; gap: 5px; margin-top: 10px;">
                <input type="text" id="comment-input-${reportId}" placeholder="Add a comment..." 
                       style="flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;">
                <button onclick="window.addComment('${reportId}')" 
                        style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                  Add
                </button>
              </div>
            </div>
            
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
        if (reportId) {
          checkUpvoteStatus(reportId);
          loadComments(reportId);
        }
      });

      // Create blast radius circle if blast radius is specified
      const blastRadius = report.blastRadius || report.BlastRadius;
      if (blastRadius) {
        const circle = createBlastRadiusCircle(mapInstance, markerPosition, blastRadius);
        if (circle) {
          circle.reportId = reportId; // Store report ID for cleanup
          markerRef.current.push(circle);
        }
      }

      markerRef.current.push(marker);
      markersCreated++;
      console.log('Marker created for report:', report.id);
    });
    
    // Update state
    const newReportIds = new Set(filteredReports.map(report => report.id || report.Id || report.rowKey || report.RowKey));
    setDisplayedReportIds(newReportIds);
    setCachedReports(filteredReports);
    setNoiseReports(filteredReports);
    
    // Marker update complete
    } catch (error) {
      console.error('Error in updateMarkersIncremental:', error);
      // Don't throw the error here as it would break the calling function
      // Just log it and continue
    }
  };

  const fetchNoiseReportsWithBounds = async (bounds, mapInstance) => {
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Fetching reports for bounds

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
      // ZIP codes found

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
      // Raw reports from API
      
      // Check upvote status for all reports when they're first loaded
      if (data.reports && data.reports.length > 0 && checkUpvoteStatusForReports) {
        checkUpvoteStatusForReports(data.reports, userInfo.jwtToken);
      }
      
      // Use incremental update instead of recreating all markers
      updateMarkersIncremental(data.reports || [], mapInstance);
      
    } catch (error) {
      console.error('Error fetching noise reports with bounds:', error);
      throw error;
    }
  };

  // Handle initial load when no cached data exists
  const handleInitialLoad = (mapInstance) => {
    if (cachedReports.length === 0) {
      console.log('No cached data, performing initial load');
      fetchNoiseReports(mapInstance);
    } else {
      console.log('Using cached data for initial load');
      updateMarkersIncremental(cachedReports, mapInstance);
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
        const userMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: latitude, lng: longitude },
          map,
          title: 'Your Location',
          content: document.createElement('div')
        });
        
        // Set the marker content with custom icon
        const markerContent = userMarker.content;
        markerContent.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
          </svg>
        `;
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
              // Map container ref set
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
                <li>Configure the key in Azure App Service settings or server environment as <code>GoogleMapsApiKey</code></li>
                <li>The key is served from <code>/api/config/google-maps-api-key</code></li>
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
                  // Clear cache to force fresh data fetch
                  setCachedReports([]);
                  setDisplayedReportIds(new Set());
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
              <div className="category-filter-tree">
                {Object.entries(categoryTree).map(([majorCat, subcats]) => {
                  const allNoiseTypes = getNoiseTypesForMainCategory(majorCat);
                  const selectedCount = allNoiseTypes.filter(nt => filters.categories.includes(nt)).length;
                  const allSelected = allNoiseTypes.length > 0 && selectedCount === allNoiseTypes.length;
                  const someSelected = selectedCount > 0 && !allSelected;
                  const isExpanded = expandedFilterCategories[majorCat];

                  return (
                    <div key={majorCat} className="category-group">
                      <div className="category-group-header">
                        <label className="category-checkbox">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => toggleMainCategory(majorCat)}
                          />
                          <span>{majorCat}</span>
                        </label>
                        <button
                          className="category-expand-btn"
                          onClick={() => toggleFilterCategoryExpand(majorCat)}
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '\u25BE' : '\u25B8'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="category-subcategories">
                          {Object.entries(subcats).map(([subCat, noiseTypes]) => {
                            const subSelectedCount = noiseTypes.filter(nt => filters.categories.includes(nt)).length;
                            const subAllSelected = noiseTypes.length > 0 && subSelectedCount === noiseTypes.length;
                            const subSomeSelected = subSelectedCount > 0 && !subAllSelected;

                            return (
                              <label key={subCat} className="subcategory-item">
                                <input
                                  type="checkbox"
                                  checked={subAllSelected}
                                  ref={el => { if (el) el.indeterminate = subSomeSelected; }}
                                  onChange={() => toggleSubcategory(majorCat, subCat)}
                                />
                                <span>{subCat}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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

            {/* Time Period Filter */}
            <div className="filter-section">
              <h4>Time Period</h4>
              <div className="time-period-filters">
                {['Morning', 'Afternoon', 'Evening', 'Night'].map(timePeriod => (
                  <label key={timePeriod} className="time-period-filter-item">
                    <input
                      type="checkbox"
                      checked={filters.timePeriods.includes(timePeriod)}
                      onChange={() => toggleTimePeriod(timePeriod)}
                    />
                    <span>{timePeriod}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="filter-section">
              <h4>Date Range</h4>
              <div className="date-range-filters">
                <div className="filter-input">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="filter-input">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="filter-summary">
              <h4>Active Filters</h4>
              <div className="active-filters">
                {filters.categories.length > 0 && (() => {
                  // Summarize selected categories by main/sub groups
                  const summary = [];
                  for (const [majorCat, subcats] of Object.entries(categoryTree)) {
                    const allNT = getNoiseTypesForMainCategory(majorCat);
                    const selectedNT = allNT.filter(nt => filters.categories.includes(nt));
                    if (selectedNT.length === 0) continue;
                    if (selectedNT.length === allNT.length) {
                      summary.push(majorCat);
                    } else {
                      for (const [subCat, noiseTypes] of Object.entries(subcats)) {
                        const subSelected = noiseTypes.filter(nt => filters.categories.includes(nt));
                        if (subSelected.length === noiseTypes.length) {
                          summary.push(subCat);
                        } else if (subSelected.length > 0) {
                          summary.push(`${subCat} (${subSelected.length}/${noiseTypes.length})`);
                        }
                      }
                    }
                  }
                  return (
                    <span className="active-filter-tag">
                      Categories: {summary.join(', ')}
                    </span>
                  );
                })()}
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
                {filters.timePeriods.length > 0 && (
                  <span className="active-filter-tag">
                    Time: {filters.timePeriods.join(', ')}
                  </span>
                )}
                {filters.startDate && (
                  <span className="active-filter-tag">
                    From: {new Date(filters.startDate).toLocaleDateString()}
                  </span>
                )}
                {filters.endDate && (
                  <span className="active-filter-tag">
                    To: {new Date(filters.endDate).toLocaleDateString()}
                  </span>
                )}
                {filters.categories.length === 0 && 
                 filters.minNoiseLevel === 1 && 
                 filters.maxNoiseLevel === 10 && 
                 !filters.city && 
                 !filters.zipCode &&
                 filters.timePeriods.length === 0 &&
                 !filters.startDate &&
                 !filters.endDate && (
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

            <h4 style={{ marginTop: '15px', marginBottom: '8px' }}>Category Pins</h4>
            {Object.entries(CATEGORY_PIN_CONFIG).map(([name, cfg]) => {
              const shortName = name
                .replace('Celebrations, Entertainment & Gatherings', 'Celebrations & Events')
                .replace('Traffic, Transportation & Infrastructure', 'Traffic & Infrastructure')
                .replace('Public Safety, Hazards & Emergencies', 'Public Safety & Hazards')
                .replace('Protests, Civil Unrest & Political Activity', 'Protests & Unrest')
                .replace('Public Nuisances & Quality-of-Life Issues', 'Public Nuisances')
                .replace('Commerce, Services & Crowd Density', 'Commerce & Crowds')
                .replace('Community, Neighborhood & Social Events', 'Community & Local')
                .replace('Other / Emerging Categories', 'Other / Emerging');
              return (
                <div key={name} className="legend-item">
                  <div
                    style={{ width: '20px', height: '20px', marginRight: '8px', flexShrink: 0, display: 'inline-block' }}
                    dangerouslySetInnerHTML={{ __html: `
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${cfg.color}" stroke="#FFF" stroke-width="1"/>
                        <circle cx="12" cy="9" r="3.8" fill="white"/>
                        ${cfg.icon(cfg.color)}
                      </svg>
                    `}}
                  />
                  <span>{shortName}</span>
                </div>
              );
            })}
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


export default App;