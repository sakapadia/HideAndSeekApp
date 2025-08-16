import React, { useState } from 'react';

// ===== REUSABLE UI COMPONENTS =====
// These components match the design specification for the multi-step reporting flow

/**
 * Logo component for branding
 */
export const Logo = ({ src, alt = "Logo", className = "" }) => (
  <img src={src} alt={alt} className={`logo ${className}`} />
);

/**
 * Heading component for titles
 */
export const Heading = ({ text, level = 1, className = "" }) => {
  const Tag = `h${level}`;
  return <Tag className={`heading ${className}`}>{text}</Tag>;
};

/**
 * Text component for paragraphs and descriptions
 */
export const Text = ({ text, className = "" }) => (
  <p className={`text ${className}`}>{text}</p>
);

/**
 * Button component with various states
 */
export const Button = ({ 
  id, 
  text, 
  onClick, 
  disabled = false, 
  className = "",
  type = "button"
}) => (
  <button
    id={id}
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`btn ${className}`}
  >
    {text}
  </button>
);

/**
 * Input component for forms
 */
export const Input = ({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  secure = false,
  keyboard = "default",
  className = ""
}) => (
  <div className={`input-group ${className}`}>
    {label && <label htmlFor={id} className="input-label">{label}</label>}
    <input
      id={id}
      type={secure ? "password" : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field"
      inputMode={keyboard === "numeric" ? "numeric" : "text"}
    />
  </div>
);

/**
 * Form container component
 */
export const Form = ({ id, onSubmit, children, className = "" }) => (
  <form id={id} onSubmit={onSubmit} className={`form ${className}`}>
    {children}
  </form>
);

/**
 * Chips list for category selection
 */
export const ChipsList = ({ id, title, items, selectedItems = [], onItemClick, className = "" }) => (
  <div className={`chips-list ${className}`}>
    {title && <h3 className="chips-title">{title}</h3>}
    <div className="chips-container">
      {items.map((item, index) => (
        <button
          key={index}
          className={`chip ${selectedItems.includes(item) ? 'selected' : ''}`}
          onClick={() => onItemClick?.(item)}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Search bar component
 */
export const SearchBar = ({ 
  id, 
  placeholder, 
  description, 
  value, 
  onChange, 
  className = "" 
}) => (
  <div className={`search-bar ${className}`}>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="search-input"
    />
    {description && <p className="search-description">{description}</p>}
  </div>
);

/**
 * Map component wrapper
 */
export const Map = ({ 
  id, 
  initialView = "currentLocation",
  showAddressPreview = true,
  streetViewToggle = true,
  satelliteViewToggle = true,
  zoomControls = true,
  onLocationChange,
  selectedAddress = "",
  className = ""
}) => {
  const [clickedCoordinates, setClickedCoordinates] = useState(null);

  // Mock coordinates for demo purposes - in production this would use Google Maps API
  const mockCoordinates = {
    "123 Main St": { lat: 40.7128, lng: -74.0060 },
    "456 Oak Ave": { lat: 40.7589, lng: -73.9851 },
    "789 Pine Rd": { lat: 40.7505, lng: -73.9934 },
    "321 Elm St": { lat: 40.7484, lng: -73.9857 },
    "654 Maple Dr": { lat: 40.7527, lng: -73.9772 },
    "100 Broadway": { lat: 40.7580, lng: -73.9855 },
    "200 5th Ave": { lat: 40.7402, lng: -73.9897 },
    "300 Park Ave": { lat: 40.7505, lng: -73.9764 },
    "400 Madison Ave": { lat: 40.7589, lng: -73.9731 },
    "500 Lexington Ave": { lat: 40.7505, lng: -73.9731 }
  };

  const handleAddressSearch = () => {
    if (selectedAddress && mockCoordinates[selectedAddress]) {
      const coords = mockCoordinates[selectedAddress];
      onLocationChange?.(coords);
      setClickedCoordinates(null); // Clear clicked coordinates when address is used
    } else if (selectedAddress) {
      // Generate mock coordinates for any address (demo purposes)
      // Use a hash of the address to generate consistent coordinates
      const hash = selectedAddress.split('').reduce((a, b) => {
        a = ((a << 5) - a + b.charCodeAt(0)) & 0xFFFFFFFF;
        return a;
      }, 0);
      
      const lat = 40.7 + (Math.abs(hash) % 100) / 1000;
      const lng = -74.0 + (Math.abs(hash >> 16) % 100) / 1000;
      onLocationChange?.({ lat, lng });
      setClickedCoordinates(null); // Clear clicked coordinates when address is used
    }
  };

  const handleMapClick = (e) => {
    // Simulate getting coordinates from map click
    // In production, this would use the actual map API
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to mock coordinates
    const lat = 40.7 + (y / rect.height) * 0.1;
    const lng = -74.0 + (x / rect.width) * 0.1;
    
    const coords = { lat, lng };
    onLocationChange?.(coords);
    setClickedCoordinates(coords);
  };

  // Auto-update coordinates when address changes
  React.useEffect(() => {
    if (selectedAddress) {
      handleAddressSearch();
    }
  }, [selectedAddress]);

  return (
    <div id={id} className={`map-container ${className}`}>
      <div className="map-content" onClick={handleMapClick}>
        {/* Google Maps will be initialized here */}
        <div className="map-instructions">
          <p>🗺️ Interactive Map</p>
          <p>📍 Type an address above or click on the map to select coordinates</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Radio group component
 */
export const RadioGroup = ({ 
  id, 
  label, 
  options, 
  selectedValue, 
  onChange, 
  className = "" 
}) => (
  <div className={`radio-group ${className}`}>
    {label && <label className="radio-label">{label}</label>}
    <div className="radio-options">
      {options.map((option, index) => (
        <label key={index} className="radio-option">
          <input
            type="radio"
            name={id}
            value={option}
            checked={selectedValue === option}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <span className="radio-text">{option}</span>
        </label>
      ))}
    </div>
  </div>
);

/**
 * Toggle group component
 */
export const ToggleGroup = ({ 
  id, 
  options, 
  selectedValue, 
  onChange, 
  className = "" 
}) => (
  <div className={`toggle-group ${className}`}>
    {options.map((option, index) => (
      <button
        key={index}
        className={`toggle-btn ${selectedValue === option ? 'selected' : ''}`}
        onClick={() => onChange?.(option)}
      >
        {option}
      </button>
    ))}
  </div>
);

/**
 * Date picker component
 */
export const DatePicker = ({ 
  id, 
  placeholder, 
  value, 
  onChange, 
  enabled = true,
  className = "" 
}) => (
  <input
    id={id}
    type="date"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={!enabled}
    className={`date-picker ${className}`}
  />
);

/**
 * Checkbox group component
 */
export const CheckboxGroup = ({ 
  id, 
  options, 
  selectedItems = [], 
  onChange, 
  enabled = true,
  className = "" 
}) => (
  <div className={`checkbox-group ${className}`}>
    {options.map((option, index) => (
      <label key={index} className="checkbox-option">
        <input
          type="checkbox"
          value={option}
          checked={selectedItems.includes(option)}
          onChange={(e) => {
            if (e.target.checked) {
              onChange?.([...selectedItems, option]);
            } else {
              onChange?.(selectedItems.filter(item => item !== option));
            }
          }}
          disabled={!enabled}
        />
        <span className="checkbox-text">{option}</span>
      </label>
    ))}
  </div>
);

/**
 * Toggle switch component
 */
export const Toggle = ({ 
  id, 
  label, 
  checked, 
  onChange, 
  className = "" 
}) => {
  const handleToggle = () => {
    const newValue = !checked;
    console.log('Toggle clicked! Current:', checked, 'New:', newValue);
    onChange?.(newValue);
  };
  
  return (
    <div className={`toggle-container ${className}`}>
      <div 
        className={`toggle-switch ${checked ? 'checked' : ''}`}
        onClick={handleToggle}
        style={{
          width: '60px',
          height: '30px',
          backgroundColor: checked ? '#667eea' : '#e1e5e9',
          borderRadius: '15px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          display: 'inline-block',
          marginRight: '12px'
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '32px' : '2px',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        />
      </div>
      <span 
        className="toggle-label"
        onClick={handleToggle}
        style={{
          cursor: 'pointer',
          fontWeight: '600',
          color: '#333',
          fontSize: '1rem'
        }}
      >
        {label}
      </span>
    </div>
  );
};

/**
 * Recurrence widget component with comprehensive options
 */
export const RecurrenceWidget = ({ 
  id, 
  style = "OutlookCalendar",
  className = "",
  config = {},
  onConfigChange
}) => {
  const {
    frequency = 'weekly',
    interval = 1,
    selectedDays = [],
    startDate = '',
    endDate = ''
  } = config;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const frequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  const handleFrequencyChange = (newFrequency) => {
    onConfigChange?.({ ...config, frequency: newFrequency.toLowerCase() });
  };

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    onConfigChange?.({ ...config, interval: value });
  };

  const handleDayToggle = (day) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    onConfigChange?.({ ...config, selectedDays: newSelectedDays });
  };

  const handleStartDateChange = (e) => {
    onConfigChange?.({ ...config, startDate: e.target.value });
  };

  const handleEndDateChange = (e) => {
    onConfigChange?.({ ...config, endDate: e.target.value });
  };

  return (
    <div id={id} className={`recurrence-widget ${style} ${className}`}>
      <div className="recurrence-section">
        <h4 className="recurrence-title">Recurrence Pattern</h4>
        
        {/* Frequency Selection */}
        <div className="frequency-section">
          <label className="recurrence-label">Recur every:</label>
          <div className="frequency-input-group">
            <input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={handleIntervalChange}
              className="interval-input"
            />
            <ToggleGroup
              id="frequency"
              options={frequencyOptions}
              selectedValue={frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              onChange={handleFrequencyChange}
            />
          </div>
        </div>

        {/* Day Selection (for weekly frequency) */}
        {frequency === 'weekly' && (
          <div className="days-section">
            <label className="recurrence-label">on:</label>
            <div className="days-grid">
              {daysOfWeek.map((day) => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  <span className="day-text">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        <div className="date-range-section">
          <h4 className="recurrence-title">Date Range</h4>
          <div className="date-inputs">
            <div className="date-input-group">
              <label className="recurrence-label">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label className="recurrence-label">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="date-input"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="recurrence-summary">
          <h4 className="recurrence-title">Summary</h4>
          <p className="summary-text">
            {generateRecurrenceSummary(config)}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to generate recurrence summary
 */
const generateRecurrenceSummary = (config) => {
  const { frequency, interval, selectedDays, startDate, endDate } = config;
  
  let summary = `Recur every ${interval} ${frequency}`;
  
  if (frequency === 'weekly' && selectedDays.length > 0) {
    summary += ` on ${selectedDays.join(', ')}`;
  }
  
  if (startDate) {
    summary += ` starting ${new Date(startDate).toLocaleDateString()}`;
  }
  
  if (endDate) {
    summary += ` until ${new Date(endDate).toLocaleDateString()}`;
  }
  
  return summary;
};

/**
 * User display component for showing username in corner with profile button
 */
export const UserDisplay = ({ username, isGuest = false, className = "", onProfileClick }) => {
  const displayName = isGuest ? "Anonymous" : (username && username.trim().length > 0 ? username : "User");
  
  const handleProfileClick = () => {
    if (isGuest) return;
    if (typeof onProfileClick === 'function') onProfileClick();
  };
  
  return (
    <div className={`user-display ${className}`}>
      <div className="user-info">
        <span className="user-label">User:</span>
        <span className="user-name">{displayName}</span>
      </div>
      {!isGuest && (
        <button 
          className="profile-btn"
          onClick={handleProfileClick}
          title="View Profile"
        >
          👤
        </button>
      )}
    </div>
  );
};

/**
 * Progress bar component
 */
export const ProgressBar = ({ progress, className = "" }) => (
  <div className={`progress-bar ${className}`}>
    <div 
      className="progress-fill" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
); 