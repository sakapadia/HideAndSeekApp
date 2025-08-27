import React from 'react';
import {
  Logo, Heading, Text, Button, Input, Form,
  ChipsList, SearchBar, RadioGroup, ToggleGroup,
  DatePicker, CheckboxGroup, Toggle, RecurrenceWidget,
  ProgressBar
} from './UIComponents';

// ===== SCREEN COMPONENTS =====
// Each screen component represents a step in the reporting flow

/**
 * Main Menu Screen - Choose between reporting or organizing
 */
export const MainMenuScreen = ({ 
  username = '',
  isGuest = false,
  onCreateReport,
  onOrganizeEvent,
  onLogout
}) => {
  return (
    <div className="screen main-menu-screen">
      <div className="menu-header">
        <Logo src="logo.png" alt="Hide & Seek Logo" />
        <Heading text="Welcome to Hide & Seek" level={1} />
        <Text text="What would you like to do today?" />
      </div>
      
      <div className="menu-options">
        <div className="menu-card" onClick={onCreateReport}>
          <div className="menu-icon">📢</div>
          <h3>Create a Report</h3>
          <p>Report noise complaints and issues in your community</p>
          <Button 
            id="btnCreateReport" 
            text="Start Report" 
            className="btn-primary"
          />
        </div>
        
        <div className="menu-card" onClick={onOrganizeEvent}>
          <div className="menu-icon">🎉</div>
          <h3>Organize an Event</h3>
          <p>Plan and manage community events and gatherings</p>
          <Button 
            id="btnOrganizeEvent" 
            text="Start Planning" 
            className="btn-secondary"
          />
        </div>
      </div>
      
      <div className="menu-footer">
        <Text text={`Logged in as: ${isGuest ? 'Anonymous' : username}`} />
        <Button 
          id="btnLogout" 
          text="Logout" 
          onClick={onLogout}
          className="btn-outline"
        />
      </div>
    </div>
  );
};

/**
 * PreLogin Screen - Welcome and authentication
 */
export const PreLoginScreen = ({ onLogin, onCreateAccount, onGuestAccess, onSocialLogin }) => {
  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSocialLogin = (provider) => {
    onSocialLogin(provider);
  };

  return (
    <div className="screen pre-login-screen">
      <Logo src="logo.png" alt="Hide & Seek Logo" />
      <Heading text="Welcome to Hide & Seek" level={1} />
      <Text text="Report and track noise complaints in your community" />
      
      {/* Social Login Buttons */}
      <div className="social-login">
        <Button 
          id="btnGmailLogin" 
          text="Continue with Gmail" 
          onClick={() => handleSocialLogin('gmail')}
          className="btn-social btn-gmail"
        />
        <Button 
          id="btnFacebookLogin" 
          text="Continue with Facebook" 
          onClick={() => handleSocialLogin('facebook')}
          className="btn-social btn-facebook"
        />
      </div>
      
      {/* Divider */}
      <div className="divider">
        <span>or</span>
      </div>
      
      <Button 
        id="btnCreateAccount" 
        text="Create New Account" 
        onClick={onCreateAccount}
        className="btn-primary"
      />
      
      <Form id="loginForm" onSubmit={handleSubmit}>
        <Input
          id="username"
          label="User Name"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleInputChange('username')}
        />
        <Input
          id="password"
          label="Password"
          placeholder="Enter password"
          secure={true}
          value={formData.password}
          onChange={handleInputChange('password')}
        />
        <Button id="btnLogin" text="Login" type="submit" className="btn-primary" />
      </Form>
      
      {/* Guest Access */}
      <div className="guest-access">
        <Text text="Want to report without an account?" />
        <Button 
          id="btnGuestAccess" 
          text="Continue as Guest" 
          onClick={onGuestAccess}
          className="btn-secondary"
        />
        <Text text="Guest reports are anonymous and won't be saved to your account" className="guest-note" />
      </div>
    </div>
  );
};

/**
 * What Screen - Category selection
 */
export const WhatScreen = ({ 
  progress = 10,
  selectedCategories = [],
  onCategorySelect,
  onSearchChange,
  onNoiseLevelChange,
  onDescriptionChange,
  onNext,
  onBack,
  onCancel,
  searchValue = '',
  noiseLevel = 5,
  description = ''
}) => {
  // Popular noise categories
  const popularCategories = [
    "Fireworks",
    "Protests", 
    "Sports",
    "Construction"
  ];

  // Suggested categories (same as popular for now)
  const suggestedCategories = [
    "Fireworks",
    "Protests",
    "Sports", 
    "Construction"
  ];
  const recentSearches = ["Loud neighbors", "Street noise", "Construction site"];

  // Noise level suggestions based on category
  const getNoiseLevelSuggestion = (category) => {
    const suggestions = {
      "Noise": "Typical: 6-8/10",
      "Traffic": "Typical: 4-6/10", 
      "Construction": "Typical: 7-9/10",
      "Party": "Typical: 8-10/10",
      "Music": "Typical: 5-8/10",
      "Industrial": "Typical: 7-9/10",
      "Animals": "Typical: 3-6/10",
      "Events": "Typical: 6-8/10",
      "Sports": "Typical: 5-7/10"
    };
    return suggestions[category] || "Select a category for suggestions";
  };

  const handleCategoryClick = (category) => {
    onCategorySelect(category);
  };

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleNoiseLevelChange = (e) => {
    onNoiseLevelChange(parseInt(e.target.value));
  };

  const handleDescriptionChange = (e) => {
    onDescriptionChange(e.target.value);
  };

  const selectedCategory = selectedCategories.length > 0 ? selectedCategories[0] : '';
  const canProceed = selectedCategories.length > 0 && description.trim().length > 0;

  return (
    <div className="screen what-screen">
      <ProgressBar progress={progress} />
      <Heading text="What are you reporting?" level={2} />
      
      <ChipsList
        id="popularCategories"
        title="Popular Categories"
        items={popularCategories}
        selectedItems={selectedCategories}
        onItemClick={handleCategoryClick}
      />
      
      <ChipsList
        id="suggestedCategories"
        title="Suggested Categories"
        items={suggestedCategories}
        selectedItems={selectedCategories}
        onItemClick={handleCategoryClick}
      />
      
      <ChipsList
        id="recentSearches"
        title="Recent Searches"
        items={recentSearches}
        selectedItems={selectedCategories}
        onItemClick={handleCategoryClick}
      />
      
      <SearchBar
        id="categorySearch"
        placeholder="Search for something…"
        description="Type or speak what you're reporting; AI will match top 2–3 categories."
        value={searchValue}
        onChange={handleSearchChange}
      />

      {/* Description Section */}
      <div className="description-section">
        <h3 className="section-title">Description</h3>
        <div className="description-input">
          <label htmlFor="description" className="description-label">
            Describe the noise issue in detail:
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Please describe what you're experiencing..."
            rows={4}
            className="description-textarea"
            required
          />
        </div>
      </div>

      {/* Noise Level Section */}
      <div className="noise-level-section">
        <h3 className="section-title">Expected Noise Level</h3>
        <div className="noise-level-input">
          <label htmlFor="noiseLevel" className="noise-level-label">
            Rate the expected noise level (1-10):
          </label>
          <div className="noise-level-controls">
            <input
              type="range"
              id="noiseLevel"
              min="1"
              max="10"
              value={noiseLevel}
              onChange={handleNoiseLevelChange}
              className="noise-slider"
            />
            <span className="noise-value">{noiseLevel}/10</span>
          </div>
          {selectedCategory && (
            <p className="noise-suggestion">
              💡 {getNoiseLevelSuggestion(selectedCategory)}
            </p>
          )}
        </div>
      </div>
      
      <div className="screen-actions">
        <Button
          id="btnCancel"
          text="Cancel"
          onClick={onCancel}
          className="btn-secondary"
        />
        <Button
          id="btnBack"
          text="← Back"
          onClick={onBack}
          className="btn-secondary"
        />
        <Button
          id="btnNextWhat"
          text="NEXT →"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary"
        />
      </div>
    </div>
  );
};

/**
 * Where Screen - Location selection
 */
export const WhereScreen = ({ 
  progress = 30,
  streetAddress = '',
  city = '',
  state = '',
  zipCode = '',
  blastRadius = '',
  onStreetAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  onBlastRadiusChange,
  onNext,
  onBack,
  onCancel
}) => {
  const canProceed = streetAddress && city && state && zipCode;

  return (
    <div className="screen where-screen">
      <ProgressBar progress={progress} />
      <Heading text="Where is it occurring?" level={2} />
      
      <div className="where-screen-content">
        {/* Address Input Section */}
        <div className="where-address-section">
          <Input
            id="streetAddress"
            label="Street Address"
            placeholder="Enter street name and number"
            value={streetAddress}
            onChange={(e) => onStreetAddressChange(e.target.value)}
          />
          
          <Input
            id="city"
            label="City"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          />
          
          <Input
            id="state"
            label="State"
            placeholder="WA"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
          />
          
          <Input
            id="zipCode"
            label="ZIP Code"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
          />
          
          <RadioGroup
            id="blastRadius"
            label="Blast radius (if exact point unknown)"
            options={["Small", "Medium", "Large"]}
            selectedValue={blastRadius}
            onChange={onBlastRadiusChange}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="where-actions">
          <Button
            id="btnCancel"
            text="Cancel"
            onClick={onCancel}
            className="btn-secondary"
          />
          <Button
            id="btnBack"
            text="← Back"
            onClick={onBack}
            className="btn-secondary"
          />
          <Button
            id="btnNextWhere"
            text="NEXT →"
            onClick={onNext}
            disabled={!canProceed}
            className="btn-primary"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * When Screen - Time selection
 */
export const WhenScreen = ({ 
  progress = 50,
  timeOption = 'NOW',
  customDate = '',
  customSlots = [],
  isRecurring = false,
  onTimeOptionChange,
  onCustomDateChange,
  onCustomSlotsChange,
  onRecurringChange,
  onConfigureRecurrence,
  onNext,
  onBack,
  onCancel
}) => {
  const timeOptions = ['NOW', 'Morning', 'Afternoon', 'Evening', 'Night'];

  const handleTimeOptionChange = (option) => {
    onTimeOptionChange(option);
  };

  const handleCustomDateChange = (e) => {
    onCustomDateChange(e.target.value);
  };

  const handleRecurringChange = (isRecurring) => {
    console.log('WhenScreen: handleRecurringChange called with:', isRecurring);
    console.log('WhenScreen: onRecurringChange function:', onRecurringChange);
    onRecurringChange(isRecurring);
  };

  const handleConfigureRecurrence = () => {
    onConfigureRecurrence();
  };

  const canProceed = timeOption && (timeOption === 'NOW' || customDate);

  return (
    <div className="screen when-screen">
      <ProgressBar progress={progress} />
      <Heading text="When is it occurring?" level={2} />
      
      <RadioGroup
        id="timeOptions"
        label="Time of Day"
        options={timeOptions}
        selectedValue={timeOption}
        onChange={handleTimeOptionChange}
      />
      
      {timeOption !== 'NOW' && (
        <div className="custom-time-section">
          <Input
            id="customDate"
            label="Date"
            type="date"
            value={customDate}
            onChange={handleCustomDateChange}
          />
        </div>
      )}

      {/* Recurrence Toggle */}
      <div className="recurrence-toggle-section">
        <Toggle
          id="isRecurring"
          label="This is a recurring event"
          checked={isRecurring}
          onChange={handleRecurringChange}
        />
        
        {isRecurring && (
          <div className="recurrence-config">
            <p className="recurrence-note">
              You'll be able to configure the recurrence pattern on the next screen.
            </p>
            <Button
              id="btnConfigureRecurrence"
              text="Configure Recurrence"
              onClick={handleConfigureRecurrence}
              className="btn-secondary"
            />
          </div>
        )}
        
        {/* Test button to manually toggle state */}
        <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px'}}>
          <p style={{fontSize: '12px', marginBottom: '5px'}}>Test: Manually toggle state</p>
          <Button
            text={isRecurring ? "Turn OFF Recurring" : "Turn ON Recurring"}
            onClick={() => handleRecurringChange(!isRecurring)}
            className="btn-secondary"
          />
        </div>
      </div>
      
      <div className="screen-actions">
        <Button
          id="btnCancel"
          text="Cancel"
          onClick={onCancel}
          className="btn-secondary"
        />
        <Button
          id="btnBack"
          text="← Back"
          onClick={onBack}
          className="btn-secondary"
        />
        <Button
          id="btnNextWhen"
          text="NEXT →"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary"
        />
      </div>
    </div>
  );
};

/**
 * Recurrence Screen - Recurrence configuration
 */
export const RecurrenceScreen = ({ 
  progress = 60,
  recurrenceConfig = {},
  onRecurrenceChange,
  onNext,
  onBack,
  onCancel
}) => {
  const handleConfigChange = (newConfig) => {
    onRecurrenceChange(newConfig);
  };

  // Validate that we have at least a frequency and start date
  const isValid = recurrenceConfig.frequency && recurrenceConfig.startDate;

  return (
    <div className="screen recurrence-screen">
      <ProgressBar progress={progress} />
      <Heading text="Recurrence Details" level={2} />
      
      <RecurrenceWidget
        id="recurrenceConfig"
        style="OutlookCalendar"
        config={recurrenceConfig}
        onConfigChange={handleConfigChange}
      />
      
      <div className="screen-actions">
        <Button
          id="btnCancel"
          text="Cancel"
          onClick={onCancel}
          className="btn-secondary"
        />
        <Button
          id="btnBack"
          text="← Back"
          onClick={onBack}
          className="btn-secondary"
        />
        <Button
          id="btnNextRecurrence"
          text="NEXT →"
          onClick={onNext}
          disabled={!isValid}
          className="btn-primary"
        />
      </div>
    </div>
  );
};

/**
 * Media Screen - Photo/media upload
 */
export const MediaScreen = ({ 
  progress = 70,
  mediaFiles = [],
  onPickFromDevice,
  onUseCamera,
  onSkip,
  onNext,
  onBack,
  onCancel
}) => {
  return (
    <div className="screen media-screen">
      <ProgressBar progress={progress} />
      <Heading text="Add Photos or Videos" level={2} />
      <Text text="Help others understand the situation better with visual evidence." />
      
      <div className="media-options">
        <div className="media-option">
          <div className="media-icon">📱</div>
          <h3>Pick from Device</h3>
          <p>Select photos or videos from your device</p>
          <Button 
            id="btnPickFromDevice" 
            text="Choose Files" 
            onClick={onPickFromDevice}
            className="btn-primary"
          />
        </div>
        
        <div className="media-option">
          <div className="media-icon">📷</div>
          <h3>Use Camera</h3>
          <p>Take a photo or video right now</p>
          <Button 
            id="btnUseCamera" 
            text="Open Camera" 
            onClick={onUseCamera}
            className="btn-primary"
          />
        </div>
      </div>
      
      {mediaFiles.length > 0 && (
        <div className="media-preview">
          <h3>Selected Media ({mediaFiles.length} files)</h3>
          <div className="media-grid">
            {mediaFiles.map((file, index) => (
              <div key={index} className="media-item">
                <img src={file.preview} alt={`Media ${index + 1}`} />
                <span className="media-name">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="screen-actions">
        <Button
          id="btnCancel"
          text="Cancel"
          onClick={onCancel}
          className="btn-secondary"
        />
        <Button
          id="btnBack"
          text="← Back"
          onClick={onBack}
          className="btn-secondary"
        />
        <Button
          id="btnSkip"
          text="Skip"
          onClick={onSkip}
          className="btn-secondary"
        />
        <Button
          id="btnNextMedia"
          text="NEXT →"
          onClick={onNext}
          className="btn-primary"
        />
      </div>
    </div>
  );
};

/**
 * Review Screen - Summary of all information
 */
export const ReviewScreen = ({ 
  progress = 80,
  reportData = {},
  onEdit,
  onConfirm
}) => {
  const {
    category = '',
    location = '',
    timeOfDay = '',
    selectedDate = '',
    recurrenceConfig = {},
    mediaFiles = [],
    description = '',
    noiseLevel = 5,
    reporterName = '',
    contactEmail = ''
  } = reportData;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Not specified';
    return time.charAt(0).toUpperCase() + time.slice(1);
  };

  const formatRecurrence = (config) => {
    if (!config.frequency) return 'One-time event';
    
    let summary = `Recur every ${config.interval} ${config.frequency}`;
    
    if (config.frequency === 'weekly' && config.selectedDays?.length > 0) {
      summary += ` on ${config.selectedDays.join(', ')}`;
    }
    
    if (config.startDate) {
      summary += ` starting ${new Date(config.startDate).toLocaleDateString()}`;
    }
    
    if (config.endDate) {
      summary += ` until ${new Date(config.endDate).toLocaleDateString()}`;
    }
    
    return summary;
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    return location;
  };

  const formatCategory = (category) => {
    if (!category) return 'Not specified';
    return category;
  };

  return (
    <div className="screen review-screen">
      <ProgressBar progress={progress} />
      <Heading text="Review Your Report" level={2} />
      <Text text="Please review all the information before submitting your noise report." />
      
      <div className="review-summary">
        <div className="summary-section">
          <h3 className="section-title">📋 Report Summary</h3>
          
          <div className="summary-item">
            <span className="summary-label">Category:</span>
            <span className="summary-value">{formatCategory(category)}</span>
            <button 
              className="edit-btn"
              onClick={() => onEdit('category')}
            >
              Edit
            </button>
          </div>

          <div className="summary-item">
            <span className="summary-label">Location:</span>
            <span className="summary-value">{formatLocation(location)}</span>
            <button 
              className="edit-btn"
              onClick={() => onEdit('location')}
            >
              Edit
            </button>
          </div>

          <div className="summary-item">
            <span className="summary-label">Date:</span>
            <span className="summary-value">{formatDate(selectedDate)}</span>
            <button 
              className="edit-btn"
              onClick={() => onEdit('date')}
            >
              Edit
            </button>
          </div>

          <div className="summary-item">
            <span className="summary-label">Time of Day:</span>
            <span className="summary-value">{formatTime(timeOfDay)}</span>
            <button 
              className="edit-btn"
              onClick={() => onEdit('time')}
            >
              Edit
            </button>
          </div>

          <div className="summary-item">
            <span className="summary-label">Recurrence:</span>
            <span className="summary-value">{formatRecurrence(recurrenceConfig)}</span>
            <button 
              className="edit-btn"
              onClick={() => onEdit('recurrence')}
            >
              Edit
            </button>
          </div>

          {description && (
            <div className="summary-item">
              <span className="summary-label">Description:</span>
              <span className="summary-value">{description}</span>
              <button 
                className="edit-btn"
                onClick={() => onEdit('description')}
              >
                Edit
              </button>
            </div>
          )}

          {noiseLevel && (
            <div className="summary-item">
              <span className="summary-label">Noise Level:</span>
              <span className="summary-value">{noiseLevel}/10</span>
              <button 
                className="edit-btn"
                onClick={() => onEdit('noiseLevel')}
              >
                Edit
              </button>
            </div>
          )}

          {mediaFiles?.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">Media Files:</span>
              <span className="summary-value">{mediaFiles.length} file(s) attached</span>
              <button 
                className="edit-btn"
                onClick={() => onEdit('media')}
              >
                Edit
              </button>
            </div>
          )}

          {(reporterName || contactEmail) && (
            <div className="summary-section">
              <h3 className="section-title">👤 Contact Information</h3>
              
              {reporterName && (
                <div className="summary-item">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">{reporterName}</span>
                  <button 
                    className="edit-btn"
                    onClick={() => onEdit('contact')}
                  >
                    Edit
                  </button>
                </div>
              )}

              {contactEmail && (
                <div className="summary-item">
                  <span className="summary-label">Email:</span>
                  <span className="summary-value">{contactEmail}</span>
                  <button 
                    className="edit-btn"
                    onClick={() => onEdit('contact')}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="review-actions">
          <Button
            id="btnEditReport"
            text="Edit Report"
            onClick={() => onEdit('general')}
            className="btn-secondary"
          />
          <Button
            id="btnConfirmReport"
            text="Confirm & Submit"
            onClick={onConfirm}
            className="btn-primary"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Payment Screen - Payment method selection (HIDDEN for regular reports)
 */
export const PaymentScreen = ({ 
  progress = 90,
  fee = 0,
  taxes = 0,
  selectedPaymentMethod = '',
  onPaymentMethodChange,
  onNext
}) => {
  const paymentMethods = ["Credit Card", "PayPal", "Apple Pay"];
  const canProceed = selectedPaymentMethod;

  return (
    <div className="screen payment-screen">
      <ProgressBar progress={progress} />
      <Heading text="Payment" level={2} />
      
      <Text
        id="feeBreakdown"
        text={`Fee: $${fee}  Taxes: $${taxes}`}
      />
      
      <RadioGroup
        id="paymentMethod"
        options={paymentMethods}
        selectedValue={selectedPaymentMethod}
        onChange={onPaymentMethodChange}
      />
      
      <Button
        id="btnNextPaymentMethod"
        text="NEXT →"
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary"
      />
    </div>
  );
};

/**
 * PaymentForm Screen - Payment details entry (HIDDEN for regular reports)
 */
export const PaymentFormScreen = ({ 
  progress = 95,
  formData = {},
  onFormChange,
  onSubmit
}) => {
  const handleInputChange = (field) => (e) => {
    onFormChange({ ...formData, [field]: e.target.value });
  };

  const isFormValid = formData.name && formData.email && formData.ccNumber && formData.expiry && formData.cvv;

  return (
    <div className="screen payment-form-screen">
      <ProgressBar progress={progress} />
      <Heading text="Enter Payment Details" level={2} />
      
      <Form id="paymentForm" onSubmit={onSubmit}>
        <Input
          id="name"
          label="Name"
          value={formData.name || ''}
          onChange={handleInputChange('name')}
        />
        <Input
          id="address"
          label="Address"
          value={formData.address || ''}
          onChange={handleInputChange('address')}
        />
        <Input
          id="phone"
          label="Phone"
          value={formData.phone || ''}
          onChange={handleInputChange('phone')}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={handleInputChange('email')}
        />
        <Input
          id="ccNumber"
          label="Credit Card #"
          keyboard="numeric"
          value={formData.ccNumber || ''}
          onChange={handleInputChange('ccNumber')}
        />
        <Input
          id="expiry"
          label="Expiry (MM/YY)"
          value={formData.expiry || ''}
          onChange={handleInputChange('expiry')}
        />
        <Input
          id="cvv"
          label="CVV"
          secure={true}
          value={formData.cvv || ''}
          onChange={handleInputChange('cvv')}
        />
        
        <Button
          id="btnSubmitPayment"
          text="SUBMIT PAYMENT"
          type="submit"
          disabled={!isFormValid}
          className="btn-primary"
        />
      </Form>
    </div>
  );
};

/**
 * Confirmation Screen - Success message
 */
export const ConfirmationScreen = ({ 
  progress = 100,
  pointsEarned = 0,
  onDone,
  isGuest = false
}) => {
  return (
    <div className="screen confirmation-screen">
      <ProgressBar progress={progress} />
      <Heading text="Thank You!" level={2} />
      
      <Text
        id="confirmationMsg"
        text={isGuest 
          ? "Thank you for submitting a report! Your anonymous report has been received."
          : `Thank you for submitting a report! You just earned ${pointsEarned} points.`
        }
      />
      
      <Button
        id="btnDone"
        text="Done"
        onClick={onDone}
        className="btn-primary"
      />
    </div>
  );
}; 