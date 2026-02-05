import React, { useState, useEffect } from 'react';
import {
  PreLoginScreen,
  MainMenuScreen,
  WhatScreen,
  CategoryDetailsScreen,
  WhereScreen,
  WhenScreen,
  RecurrenceScreen,
  MediaScreen,
  ReviewScreen,
  PaymentScreen,
  PaymentFormScreen,
  ConfirmationScreen
} from './Screens';
import { UserDisplay } from './UIComponents';

// ===== SCREEN DEFINITIONS =====
const SCREENS = {
  PRE_LOGIN: 'PreLogin',
  MAIN_MENU: 'MainMenu',
  WHAT: 'What',
  CATEGORY_DETAILS: 'CategoryDetails',
  WHERE: 'Where',
  WHEN: 'When',
  RECURRENCE: 'Recurrence',
  MEDIA: 'Media',
  REVIEW: 'Review',
  PAYMENT: 'Payment',
  PAYMENT_FORM: 'PaymentForm',
  CONFIRMATION: 'Confirmation'
};

/**
 * Main reporting flow component that manages the multi-step process.
 * Handles navigation between screens and maintains state for the entire flow.
 */
export const ReportingFlow = ({ onUserStateChange, userInfo = {}, onBackToMainMenu, startAtMainMenu = false, onAppLogout, onProfileClick, onUserUpdate }) => {
  // ===== STATE MANAGEMENT =====
  
  // Current screen and navigation
  const [currentScreen, setCurrentScreen] = useState(
    startAtMainMenu ? SCREENS.MAIN_MENU : SCREENS.PRE_LOGIN
  );
  const [isLoggedIn, setIsLoggedIn] = useState(userInfo.isLoggedIn || false);
  const [isGuest, setIsGuest] = useState(userInfo.isGuest || false);
  const [userType, setUserType] = useState(userInfo.userType || null);
  const [username, setUsername] = useState(userInfo.username || '');
  
  // Sync user state with parent component
  useEffect(() => {
    onUserStateChange?.({
      username,
      isGuest,
      isLoggedIn,
      userType
    });
  }, [username, isGuest, isLoggedIn, userType, onUserStateChange]);
  
  // Form data for each step
  const [reportData, setReportData] = useState({
    // What screen data
    selectedCategories: [],
    searchValue: '',
    category: '',
    description: '',
    noiseLevel: 5,
    
    // Where screen data
    streetAddress: '',
    city: '',
    state: 'WA', // Default to Washington
    zipCode: '',
    location: '',
    blastRadius: '',
    
    // When screen data
    timeOption: 'NOW',
    timeOfDay: '',
    customDate: '',
    selectedDate: '',
    customSlots: [],
    isRecurring: false,
    
    // Category details screen data
    categorySpecificData: {},

    // Recurrence screen data
    recurrenceConfig: {},

    // Media screen data
    mediaFiles: [],
    
    // Payment screen data (hidden for regular reports)
    selectedPaymentMethod: '',
    paymentFormData: {},
    
    // Contact info
    reporterName: '',
    contactEmail: ''
  });

  // ===== NAVIGATION HANDLERS =====
  
  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const goToNext = () => {
    const screenOrder = [
      SCREENS.PRE_LOGIN,
      SCREENS.MAIN_MENU,
      SCREENS.WHAT,
      SCREENS.CATEGORY_DETAILS,
      SCREENS.WHERE,
      SCREENS.WHEN,
      SCREENS.RECURRENCE,
      SCREENS.MEDIA,
      SCREENS.REVIEW,
      SCREENS.PAYMENT,
      SCREENS.PAYMENT_FORM,
      SCREENS.CONFIRMATION
    ];

    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex < screenOrder.length - 1) {
      const nextScreen = screenOrder[currentIndex + 1];

      // Skip recurrence screen if not recurring
      if (currentScreen === SCREENS.WHEN && !reportData.isRecurring) {
        setCurrentScreen(SCREENS.MEDIA);
        return;
      }

      // Skip payment screens for regular reports (non-organizers)
      if (userType !== 'organizer' && (nextScreen === SCREENS.PAYMENT || nextScreen === SCREENS.PAYMENT_FORM)) {
        setCurrentScreen(SCREENS.CONFIRMATION);
      } else {
        setCurrentScreen(nextScreen);
      }
    }
  };

  const goToPrevious = () => {
    const screenOrder = [
      SCREENS.PRE_LOGIN,
      SCREENS.MAIN_MENU,
      SCREENS.WHAT,
      SCREENS.CATEGORY_DETAILS,
      SCREENS.WHERE,
      SCREENS.WHEN,
      SCREENS.RECURRENCE,
      SCREENS.MEDIA,
      SCREENS.REVIEW,
      SCREENS.PAYMENT,
      SCREENS.PAYMENT_FORM,
      SCREENS.CONFIRMATION
    ];

    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex > 0) {
      const previousScreen = screenOrder[currentIndex - 1];

      // Skip recurrence screen when going back if not recurring
      if (currentScreen === SCREENS.MEDIA && !reportData.isRecurring) {
        setCurrentScreen(SCREENS.WHEN);
        return;
      }

      setCurrentScreen(previousScreen);
    }
  };

  // ===== AUTHENTICATION HANDLERS =====
  
  const handleLogin = (credentials) => {
    console.log('Login attempt:', credentials);
    setIsLoggedIn(true);
    setUserType('user');
    setUsername(credentials.username || 'User');
    navigateTo(SCREENS.MAIN_MENU);
  };

  const handleCreateAccount = () => {
    console.log('Create account clicked');
    setIsLoggedIn(true);
    setUserType('user');
    setUsername('New User');
    navigateTo(SCREENS.MAIN_MENU);
  };

  const handleGuestAccess = () => {
    console.log('Guest access selected');
    setIsGuest(true);
    setUserType('guest');
    setUsername('');
    navigateTo(SCREENS.MAIN_MENU);
  };

  const handleSocialLogin = (provider) => {
    console.log('Social login:', provider);
    setIsLoggedIn(true);
    setUserType('user');
    setUsername(`${provider.charAt(0).toUpperCase() + provider.slice(1)} User`);
    navigateTo(SCREENS.MAIN_MENU);
  };

  const handleLogout = () => {
    if (onAppLogout) {
      onAppLogout();
      return;
    }
    setIsLoggedIn(false);
    setIsGuest(false);
    setUserType(null);
    setUsername('');
    setCurrentScreen(SCREENS.MAIN_MENU);
  };

  // ===== MAIN MENU HANDLERS =====
  
  const handleCreateReport = () => {
    navigateTo(SCREENS.WHAT);
  };

  const handleOrganizeEvent = () => {
    setUserType('organizer');
    navigateTo(SCREENS.WHAT);
  };

  // ===== WHAT SCREEN HANDLERS =====
  
  const handleCategorySelect = (category) => {
    setReportData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
      category: category // Store for review screen
    }));
  };

  const handleSearchChange = (value) => {
    // Handle both string values and event objects
    const searchValue = typeof value === 'string' ? value : (value?.target?.value || '');
    setReportData(prev => ({
      ...prev,
      searchValue: searchValue,
      // Don't overwrite description with search value - they're separate fields
    }));
  };

  const handleNoiseLevelChange = (level) => {
    setReportData(prev => ({
      ...prev,
      noiseLevel: level
    }));
  };

  const handleDescriptionChange = (description) => {
    setReportData(prev => ({
      ...prev,
      description: description
    }));
  };

  // ===== CATEGORY DETAILS SCREEN HANDLERS =====

  const handleCategorySpecificDataChange = (data) => {
    setReportData(prev => ({
      ...prev,
      categorySpecificData: data
    }));
  };

  // ===== WHERE SCREEN HANDLERS =====
  
  const handleStreetAddressChange = (address) => {
    setReportData(prev => ({
      ...prev,
      streetAddress: address,
      location: `${address}, ${prev.city}, ${prev.state} ${prev.zipCode}`.trim() // Build full address for review screen
    }));
  };

  const handleCityChange = (city) => {
    setReportData(prev => ({
      ...prev,
      city: city,
      location: `${prev.streetAddress}, ${city}, ${prev.state} ${prev.zipCode}`.trim() // Build full address for review screen
    }));
  };

  const handleStateChange = (state) => {
    setReportData(prev => ({
      ...prev,
      state: state,
      location: `${prev.streetAddress}, ${prev.city}, ${state} ${prev.zipCode}`.trim() // Build full address for review screen
    }));
  };

  const handleZipCodeChange = (zipCode) => {
    setReportData(prev => ({
      ...prev,
      zipCode: zipCode,
      location: `${prev.streetAddress}, ${prev.city}, ${prev.state} ${zipCode}`.trim() // Build full address for review screen
    }));
  };

  const handleBlastRadiusChange = (radius) => {
    setReportData(prev => ({
      ...prev,
      blastRadius: radius
    }));
  };

  // ===== WHEN SCREEN HANDLERS =====
  
  const handleTimeOptionChange = (option) => {
    setReportData(prev => ({
      ...prev,
      timeOption: option,
      timeOfDay: option // Store for review screen
    }));
  };

  const handleCustomDateChange = (date) => {
    setReportData(prev => ({
      ...prev,
      customDate: date,
      selectedDate: date // Store for review screen
    }));
  };

  const handleCustomSlotsChange = (slots) => {
    setReportData(prev => ({
      ...prev,
      customSlots: slots
    }));
  };

  const handleRecurringChange = (isRecurring) => {
    console.log('Recurrence toggle changed:', isRecurring);
    setReportData(prev => {
      const newData = {
        ...prev,
        isRecurring
      };
      console.log('Updated reportData:', newData);
      return newData;
    });
  };

  const handleConfigureRecurrence = () => {
    navigateTo(SCREENS.RECURRENCE);
  };

  // ===== RECURRENCE SCREEN HANDLERS =====
  
  const handleRecurrenceChange = (config) => {
    setReportData(prev => ({
      ...prev,
      recurrenceConfig: config
    }));
  };

  // ===== MEDIA SCREEN HANDLERS =====
  
  const handlePickFromDevice = () => {
    // TODO: Implement file picker
    console.log('Pick from device clicked');
  };

  const handleUseCamera = () => {
    // TODO: Implement camera access
    console.log('Use camera clicked');
  };

  const handleSkipMedia = () => {
    goToNext();
  };

  // ===== REVIEW SCREEN HANDLERS =====
  
  const handleReviewEdit = (section) => {
    console.log('Edit section:', section);
    
    // Navigate to the appropriate screen based on what needs to be edited
    switch (section) {
      case 'category':
        setCurrentScreen(SCREENS.WHAT);
        break;
      case 'location':
        setCurrentScreen(SCREENS.WHERE);
        break;
      case 'date':
      case 'time':
        setCurrentScreen(SCREENS.WHEN);
        break;
      case 'recurrence':
        setCurrentScreen(SCREENS.RECURRENCE);
        break;
      case 'media':
        setCurrentScreen(SCREENS.MEDIA);
        break;
      case 'description':
      case 'noiseLevel':
        setCurrentScreen(SCREENS.WHAT);
        break;
      case 'categoryDetails':
        setCurrentScreen(SCREENS.CATEGORY_DETAILS);
        break;
      case 'contact':
        // Could navigate to a contact screen or stay on review
        break;
      case 'general':
      default:
        // Go back to the first screen to start over
        setCurrentScreen(SCREENS.WHAT);
        break;
    }
  };

  const handleConfirm = async () => {
    console.log('Report confirmed:', reportData);
    
    try {
      // Submit the report to the backend
      await submitNoiseReport();
      
      // For regular reports, skip payment and go directly to confirmation
      if (userType !== 'organizer') {
        setCurrentScreen(SCREENS.CONFIRMATION);
      } else {
        goToNext(); // Go to payment for organizers
      }
    } catch (error) {
      console.error('Failed to submit noise report:', error);
      alert('Failed to submit noise report. Please try again.');
    }
  };

  const submitNoiseReport = async () => {
    // Get the JWT token from localStorage or userInfo
    const token = localStorage.getItem('jwtToken') || userInfo?.jwtToken;
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Extract coordinates from address (coordinates will be generated server-side)
    // For now, we'll use placeholder coordinates since the map is no longer available
    const latitude = 0; // Will be generated server-side from address
    const longitude = 0; // Will be generated server-side from address

    // Prepare the report data for submission
    const reportSubmission = {
      // Location data
      latitude: latitude,
      longitude: longitude,
      streetAddress: reportData.streetAddress || '',
      city: reportData.city || '',
      zipCode: reportData.zipCode || '',
      address: reportData.location || '', // Legacy field for backward compatibility
      blastRadius: reportData.blastRadius || '',
      
      // Noise details
      description: reportData.description || '',
      noiseType: reportData.category || reportData.selectedCategories[0] || 'Other',
      noiseLevel: reportData.noiseLevel || 5,
      categories: reportData.selectedCategories || [],
      searchValue: reportData.searchValue || '',
      
      // Timing information
      timeOption: reportData.timeOption || 'NOW',
      customDate: reportData.customDate || reportData.selectedDate || '',
      customSlots: reportData.customSlots || [],
      isRecurring: reportData.isRecurring || false,
      recurrenceConfig: reportData.recurrenceConfig || {},

      // Category-specific data
      categorySpecificData: reportData.categorySpecificData || {},

      // Media and contact
      mediaFiles: reportData.mediaFiles || [],
      reporterName: reportData.reporterName || '',
      contactEmail: reportData.contactEmail || ''
    };

    // Validate required fields
    if (!reportSubmission.streetAddress.trim()) {
      throw new Error('Street address is required. Please enter the street name and number.');
    }
    
    if (!reportSubmission.city.trim()) {
      throw new Error('City is required. Please enter the city name.');
    }
    
    if (!reportSubmission.zipCode.trim()) {
      throw new Error('ZIP code is required. Please enter the ZIP code.');
    }
    
    if (!reportSubmission.description.trim()) {
      throw new Error('Description is required');
    }

    // Submit to the comprehensive endpoint
    const response = await fetch('/api/noisereports/comprehensive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reportSubmission)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit report: ${errorText}`);
    }

    const result = await response.json();
    console.log('Report submitted successfully:', result);
    
    // Refresh user info to update points display
    if (onUserUpdate) {
      onUserUpdate();
    }
    
    return result;
  };

  const handleCancel = () => {
    // Reset form data and go back to main menu
    setReportData({
      selectedCategories: [],
      searchValue: '',
      category: '',
      description: '',
      noiseLevel: 5,
      categorySpecificData: {},
      streetAddress: '',
      city: '',
      zipCode: '',
      location: '',
      blastRadius: '',
      timeOption: 'NOW',
      timeOfDay: '',
      customDate: '',
      selectedDate: '',
      customSlots: [],
      isRecurring: false,
      recurrenceConfig: {},
      mediaFiles: [],
      selectedPaymentMethod: '',
      paymentFormData: {},
      reporterName: '',
      contactEmail: ''
    });
    
    // If we have a back to main menu function, use it, otherwise navigate to main menu
    if (onBackToMainMenu) {
      onBackToMainMenu();
    } else {
      navigateTo(SCREENS.MAIN_MENU);
    }
  };

  // ===== PAYMENT SCREEN HANDLERS =====
  
  const handlePaymentMethodChange = (method) => {
    setReportData(prev => ({
      ...prev,
      selectedPaymentMethod: method
    }));
  };

  const handlePaymentFormChange = (formData) => {
    setReportData(prev => ({
      ...prev,
      paymentFormData: formData
    }));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    console.log('Payment submitted:', reportData.paymentFormData);
    goToNext();
  };

  // ===== CONFIRMATION SCREEN HANDLERS =====
  
  const handleDone = () => {
    // Reset form data and go back to main menu
    setReportData({
      selectedCategories: [],
      searchValue: '',
      category: '',
      description: '',
      noiseLevel: 5,
      categorySpecificData: {},
      streetAddress: '',
      city: '',
      zipCode: '',
      location: '',
      blastRadius: '',
      timeOption: 'NOW',
      timeOfDay: '',
      customDate: '',
      selectedDate: '',
      customSlots: [],
      isRecurring: false,
      recurrenceConfig: {},
      mediaFiles: [],
      selectedPaymentMethod: '',
      paymentFormData: {},
      reporterName: '',
      contactEmail: ''
    });
    
    // If we have a back to main menu function, use it, otherwise navigate to main menu
    if (onBackToMainMenu) {
      onBackToMainMenu();
    } else {
      navigateTo(SCREENS.MAIN_MENU);
    }
  };

  // Check if we should show the user display (not on login page)
  const shouldShowUserDisplay = currentScreen !== SCREENS.PRE_LOGIN;

  // ===== RENDER CURRENT SCREEN =====
  
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case SCREENS.PRE_LOGIN:
        return (
          <PreLoginScreen
            onLogin={handleLogin}
            onCreateAccount={handleCreateAccount}
            onGuestAccess={handleGuestAccess}
            onSocialLogin={handleSocialLogin}
          />
        );
      case SCREENS.MAIN_MENU:
        return (
          <MainMenuScreen
            username={username}
            isGuest={isGuest}
            onCreateReport={handleCreateReport}
            onOrganizeEvent={handleOrganizeEvent}
            onLogout={handleLogout}
          />
        );
      case SCREENS.WHAT:
        return (
          <WhatScreen
            progress={10}
            selectedCategories={reportData.selectedCategories}
            onCategorySelect={handleCategorySelect}
            onSearchChange={handleSearchChange}
            onNoiseLevelChange={handleNoiseLevelChange}
            onDescriptionChange={handleDescriptionChange}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
            searchValue={reportData.searchValue}
            noiseLevel={reportData.noiseLevel}
            description={reportData.description}
          />
        );
      case SCREENS.CATEGORY_DETAILS:
        return (
          <CategoryDetailsScreen
            progress={20}
            reportData={reportData}
            onCategorySpecificDataChange={handleCategorySpecificDataChange}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
          />
        );
      case SCREENS.WHERE:
        return (
          <WhereScreen
            progress={35}
            streetAddress={reportData.streetAddress}
            city={reportData.city}
            state={reportData.state}
            zipCode={reportData.zipCode}
            blastRadius={reportData.blastRadius}
            onStreetAddressChange={handleStreetAddressChange}
            onCityChange={handleCityChange}
            onStateChange={handleStateChange}
            onZipCodeChange={handleZipCodeChange}
            onBlastRadiusChange={handleBlastRadiusChange}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
          />
        );
      case SCREENS.WHEN:
        return (
          <WhenScreen
            progress={50}
            timeOption={reportData.timeOption}
            customDate={reportData.customDate}
            customSlots={reportData.customSlots}
            isRecurring={reportData.isRecurring}
            onTimeOptionChange={handleTimeOptionChange}
            onCustomDateChange={handleCustomDateChange}
            onCustomSlotsChange={handleCustomSlotsChange}
            onRecurringChange={handleRecurringChange}
            onConfigureRecurrence={handleConfigureRecurrence}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
          />
        );
      case SCREENS.RECURRENCE:
        return (
          <RecurrenceScreen
            progress={60}
            recurrenceConfig={reportData.recurrenceConfig}
            onRecurrenceChange={handleRecurrenceChange}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
          />
        );
      case SCREENS.MEDIA:
        return (
          <MediaScreen
            progress={70}
            mediaFiles={reportData.mediaFiles}
            onPickFromDevice={handlePickFromDevice}
            onUseCamera={handleUseCamera}
            onSkip={handleSkipMedia}
            onNext={goToNext}
            onBack={goToPrevious}
            onCancel={handleCancel}
          />
        );
      case SCREENS.REVIEW:
        return (
          <ReviewScreen
            progress={85}
            reportData={reportData}
            onEdit={handleReviewEdit}
            onConfirm={handleConfirm}
          />
        );
      case SCREENS.PAYMENT:
        // Only show payment screen for organizers
        if (userType === 'organizer') {
          return (
            <PaymentScreen
              selectedPaymentMethod={reportData.selectedPaymentMethod}
              onPaymentMethodChange={handlePaymentMethodChange}
              onNext={goToNext}
            />
          );
        }
        // For regular users, skip to confirmation
        setCurrentScreen(SCREENS.CONFIRMATION);
        return null;

      case SCREENS.PAYMENT_FORM:
        // Only show payment form for organizers
        if (userType === 'organizer') {
          return (
            <PaymentFormScreen
              formData={reportData.paymentFormData}
              onFormChange={handlePaymentFormChange}
              onSubmit={handlePaymentSubmit}
            />
          );
        }
        // For regular users, skip to confirmation
        setCurrentScreen(SCREENS.CONFIRMATION);
        return null;

      case SCREENS.CONFIRMATION:
        return (
          <ConfirmationScreen
            pointsEarned={isGuest ? 0 : 100}
            onDone={handleDone}
            isGuest={isGuest}
          />
        );
      default:
        return <div>Screen not found</div>;
    }
  };

  return (
    <div className="reporting-flow">
      {/* User Display - shown on all screens except login */}
      {shouldShowUserDisplay && (
        <UserDisplay 
          username={username}
          isGuest={isGuest}
          onProfileClick={onProfileClick}
        />
      )}
      
      {/* Current Screen */}
      {renderCurrentScreen()}
    </div>
  );
}; 