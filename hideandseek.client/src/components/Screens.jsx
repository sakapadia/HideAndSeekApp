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
  // Master Event & Occurrence Directory - Hide & Seek Taxonomy v1
  // Comprehensive list of all categories from the master taxonomy
  const allCategories = [
    // 1. Celebrations, Entertainment & Gatherings
    // 1.1 Holidays & Cultural Celebrations
    "Fireworks (legal displays)",
    "Fireworks (illegal / residential)",
    "Holiday parades",
    "Street celebrations",
    "Cultural festivals",
    "Religious observances",
    "Seasonal markets (Christmas markets, holiday bazaars)",
    "New Year's celebrations",
    "Independence / national day events",
    "Pride events",
    "Ethnic heritage festivals",
    // 1.2 Music, Arts & Performance
    "Concerts (indoor)",
    "Concerts (outdoor)",
    "Music festivals",
    "Street performers / buskers",
    "Theater performances",
    "Film festivals",
    "Outdoor movie nights",
    "Art walks / gallery nights",
    // 1.3 Sports & Recreation
    "Professional sports games",
    "College sports games",
    "High school sports events",
    "Marathons / races",
    "Fun runs / charity walks",
    "E-sports tournaments",
    "Recreational leagues",
    "Extreme sports events",
    // 1.4 Fairs, Expos & Conventions
    "County fairs",
    "State fairs",
    "Trade shows",
    "Comic / fan conventions",
    "Auto shows",
    "Home & garden expos",
    "Food & wine festivals",
    "Tech conferences",
    "Career fairs",
    // 2. Traffic, Transportation & Infrastructure
    // 2.1 Road & Traffic Conditions
    "Traffic congestion",
    "Accidents (minor)",
    "Accidents (major)",
    "Vehicle breakdowns",
    "Disabled vehicles",
    "Road rage incidents",
    "DUI checkpoints",
    // 2.2 Road Closures & Restrictions
    "Planned road closures",
    "Emergency road closures",
    "Construction detours",
    "Event-related closures",
    "Police barricades",
    "Motorcade routes (VIP / politicians)",
    "Bridge closures",
    "Tunnel closures",
    // 2.3 Construction & Maintenance
    "Road construction",
    "Utility work",
    "Sidewalk closures",
    "Lane reductions",
    "Night construction",
    "Infrastructure upgrades",
    "Noise-producing maintenance",
    // 2.4 Public Transit & Travel
    "Transit delays",
    "Transit shutdowns",
    "Bus reroutes",
    "Train disruptions",
    "Airport delays",
    "Airport congestion",
    "TSA/security backups",
    "Port or ferry disruptions",
    // 3. Public Safety, Hazards & Emergencies
    // 3.1 Weather & Natural Events
    "Heavy rain",
    "Flooding",
    "Flash flooding",
    "Snowstorms",
    "Ice storms",
    "Extreme heat",
    "Extreme cold",
    "High winds",
    "Wildfires",
    "Smoke / poor air quality",
    "Earthquakes",
    "Landslides",
    "Hurricanes / tropical storms",
    "Tornado sightings",
    // 3.2 Environmental Hazards
    "Fallen trees",
    "Downed power lines",
    "Gas leaks",
    "Chemical spills",
    "Oil spills",
    "Radiation alerts",
    "Water contamination",
    "Sinkholes",
    // 3.3 Crime & Police Activity
    "Police presence (general)",
    "Active police investigation",
    "Crime scene",
    "Shots fired reports",
    "Armed suspect reports",
    "Robbery incidents",
    "Assault reports",
    "Carjacking incidents",
    "Police chases",
    "SWAT activity",
    "Curfews",
    // 4. Protests, Civil Unrest & Political Activity
    // 4.1 Organized Protests & Demonstrations
    "Peaceful protests",
    "Marches",
    "Rallies",
    "Sit-ins",
    "Strikes",
    "Labor picket lines",
    // 4.2 Escalated Civil Unrest
    "Riots",
    "Looting",
    "Vandalism",
    "Property destruction",
    "Fires / arson",
    "Crowd violence",
    "Tear gas deployment",
    "Crowd control actions",
    // 4.3 Political Events
    "Political rallies",
    "Campaign events",
    "Inaugurations",
    "Town halls",
    "Debates",
    "Visiting dignitaries",
    "Government announcements",
    // 5. Public Nuisances & Quality-of-Life Issues
    // 5.1 Noise & Disturbances
    "Illegal fireworks",
    "Loud parties",
    "Nighttime noise",
    "Street racing",
    "Revving engines",
    "Car alarms",
    "Construction noise (off-hours)",
    "Barking dogs",
    "Loudspeakers / megaphones",
    // 5.2 Cleanliness & Environmental Nuisances
    "Trash dumping (illegal)",
    "Litter accumulation",
    "Overflowing dumpsters",
    "Abandoned furniture",
    "Abandoned shopping carts",
    "Construction debris",
    "Glass on roadway",
    "Needles / syringes",
    "Human waste",
    "Animal waste",
    "Dead animals",
    // 5.3 Graffiti & Vandalism
    "Graffiti (new)",
    "Graffiti (recurring hotspot)",
    "Property damage",
    "Broken windows",
    "Defaced signs",
    "Tagging activity",
    "Damaged public art",
    // 5.4 Homelessness-Related Encounters
    "Homeless encampments",
    "Temporary encampments",
    "Encampment cleanup activity",
    "Sidewalk obstructions",
    "RV dwellers",
    "Tent clusters",
    "Fires within encampments",
    "Accumulated debris",
    // 5.5 Aggressive or Disruptive Behavior
    "Panhandlers / beggars",
    "Aggressive panhandling",
    "Harassment reports",
    "Intoxicated individuals",
    "Public drug use",
    "Public drinking",
    "Fights / altercations",
    "Mental health crises (public)",
    // 6. Health & Biohazards
    // 6.1 Biological & Sanitation Risks
    "Human waste",
    "Blood spills",
    "Medical waste",
    "Syringes / needles",
    "Vomit",
    "Dead animals",
    "Pest infestations",
    "Rodent sightings",
    "Insect swarms",
    // 6.2 Public Health Alerts
    "Disease outbreaks",
    "Quarantine zones",
    "Health department warnings",
    "Food safety alerts",
    "Contaminated water notices",
    "Smoke advisories",
    "Heat advisories",
    // 7. Animals & Wildlife
    // 7.1 Domestic Animal Issues
    "Loose dogs",
    "Aggressive dogs",
    "Dog attacks",
    "Lost pets",
    "Found pets",
    "Animal control activity",
    "Dogs playing",
    // 7.2 Wildlife Encounters
    "Coyotes",
    "Bears",
    "Mountain lions",
    "Alligators",
    "Snakes",
    "Raccoons",
    "Skunks",
    "Birds of prey",
    "Swarms (bees, locusts)",
    // 7.3 Animal-Related Hazards
    "Roadkill",
    "Animal on roadway",
    "Injured wildlife",
    "Nesting hazards",
    "Animal-induced traffic issues",
    // 8. Commerce, Services & Crowd Density
    // 8.1 Retail & Business Conditions
    "Store openings",
    "Store closures",
    "Long lines",
    "Black Friday crowds",
    "Sales events",
    "Product shortages",
    "Gas shortages",
    "Panic buying",
    // 8.2 Dining & Hospitality
    "Restaurant openings",
    "Restaurant closures",
    "Long wait times",
    "Food truck gatherings",
    "Bar crawls",
    "Happy hour hotspots",
    // 8.3 Lodging & Travel
    "Hotel availability spikes",
    "Hotel shortages",
    "Event-driven pricing surges",
    "Airbnb saturation",
    "Tourist influxes",
    // 9. Community, Neighborhood & Social Events
    // 9.1 Neighborhood Activities
    "Block parties",
    "Garage sales",
    "Yard sales",
    "Neighborhood meetings",
    "HOA activities",
    "Street cleanups",
    // 9.2 Schools & Institutions
    "School closures",
    "School events",
    "Graduations",
    "Campus protests",
    "Exams / move-in days",
    // 9.3 Religious & Faith-Based Events
    "Church services",
    "Large congregations",
    "Pilgrimages",
    "Processions",
    "Faith festivals",
    // 10. "Other" / Emerging / AI-Discovered Categories
    "Unclassified events",
    "Emerging trends",
    "New nuisances",
    "New celebration types",
    "Location-specific anomalies",
    "Other"
  ];

  // Filter categories based on search input
  const getFilteredCategories = () => {
    if (!searchValue || searchValue.trim().length === 0) {
      return [];
    }
    const searchLower = searchValue.toLowerCase().trim();
    return allCategories.filter(category => 
      category.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 suggestions
  };

  const filteredCategories = getFilteredCategories();
  const showSuggestions = searchValue.trim().length > 0 && filteredCategories.length > 0;

  // Noise level suggestions based on category
  // Maps categories to typical noise level ranges
  const getNoiseLevelSuggestion = (category) => {
    const suggestions = {
      // Celebrations, Entertainment & Gatherings
      "Fireworks (legal displays)": "Typical: 8-10/10",
      "Fireworks (illegal / residential)": "Typical: 8-10/10",
      "Holiday parades": "Typical: 6-8/10",
      "Street celebrations": "Typical: 7-9/10",
      "Cultural festivals": "Typical: 6-8/10",
      "Religious observances": "Typical: 4-7/10",
      "Seasonal markets (Christmas markets, holiday bazaars)": "Typical: 5-7/10",
      "New Year's celebrations": "Typical: 8-10/10",
      "Independence / national day events": "Typical: 7-9/10",
      "Pride events": "Typical: 6-8/10",
      "Ethnic heritage festivals": "Typical: 6-8/10",
      "Concerts (indoor)": "Typical: 7-9/10",
      "Concerts (outdoor)": "Typical: 7-9/10",
      "Music festivals": "Typical: 7-9/10",
      "Street performers / buskers": "Typical: 4-6/10",
      "Theater performances": "Typical: 3-5/10",
      "Film festivals": "Typical: 3-5/10",
      "Outdoor movie nights": "Typical: 5-7/10",
      "Art walks / gallery nights": "Typical: 3-5/10",
      "Professional sports games": "Typical: 7-9/10",
      "College sports games": "Typical: 6-8/10",
      "High school sports events": "Typical: 5-7/10",
      "Marathons / races": "Typical: 5-7/10",
      "Fun runs / charity walks": "Typical: 4-6/10",
      "E-sports tournaments": "Typical: 4-6/10",
      "Recreational leagues": "Typical: 4-6/10",
      "Extreme sports events": "Typical: 6-8/10",
      "County fairs": "Typical: 6-8/10",
      "State fairs": "Typical: 7-9/10",
      "Trade shows": "Typical: 4-6/10",
      "Comic / fan conventions": "Typical: 5-7/10",
      "Auto shows": "Typical: 4-6/10",
      "Home & garden expos": "Typical: 4-6/10",
      "Food & wine festivals": "Typical: 5-7/10",
      "Tech conferences": "Typical: 4-6/10",
      "Career fairs": "Typical: 4-5/10",
      // Traffic, Transportation & Infrastructure
      "Traffic congestion": "Typical: 4-6/10",
      "Accidents (minor)": "Typical: 5-7/10",
      "Accidents (major)": "Typical: 7-9/10",
      "Vehicle breakdowns": "Typical: 3-5/10",
      "Disabled vehicles": "Typical: 3-4/10",
      "Road rage incidents": "Typical: 6-8/10",
      "DUI checkpoints": "Typical: 4-6/10",
      "Planned road closures": "Typical: 3-5/10",
      "Emergency road closures": "Typical: 6-8/10",
      "Construction detours": "Typical: 4-6/10",
      "Event-related closures": "Typical: 5-7/10",
      "Police barricades": "Typical: 6-8/10",
      "Motorcade routes (VIP / politicians)": "Typical: 6-8/10",
      "Bridge closures": "Typical: 4-6/10",
      "Tunnel closures": "Typical: 4-6/10",
      "Road construction": "Typical: 6-8/10",
      "Utility work": "Typical: 5-7/10",
      "Sidewalk closures": "Typical: 3-4/10",
      "Lane reductions": "Typical: 4-5/10",
      "Night construction": "Typical: 6-8/10",
      "Infrastructure upgrades": "Typical: 6-8/10",
      "Noise-producing maintenance": "Typical: 5-7/10",
      "Transit delays": "Typical: 3-5/10",
      "Transit shutdowns": "Typical: 4-6/10",
      "Bus reroutes": "Typical: 3-5/10",
      "Train disruptions": "Typical: 5-7/10",
      "Airport delays": "Typical: 4-6/10",
      "Airport congestion": "Typical: 5-7/10",
      "TSA/security backups": "Typical: 4-6/10",
      "Port or ferry disruptions": "Typical: 4-6/10",
      // Public Safety, Hazards & Emergencies
      "Heavy rain": "Typical: 3-5/10",
      "Flooding": "Typical: 4-7/10",
      "Flash flooding": "Typical: 5-8/10",
      "Snowstorms": "Typical: 3-5/10",
      "Ice storms": "Typical: 3-5/10",
      "Extreme heat": "Typical: 2-4/10",
      "Extreme cold": "Typical: 2-4/10",
      "High winds": "Typical: 5-7/10",
      "Wildfires": "Typical: 6-9/10",
      "Smoke / poor air quality": "Typical: 2-4/10",
      "Earthquakes": "Typical: 7-10/10",
      "Landslides": "Typical: 6-8/10",
      "Hurricanes / tropical storms": "Typical: 7-9/10",
      "Tornado sightings": "Typical: 7-9/10",
      "Fallen trees": "Typical: 5-7/10",
      "Downed power lines": "Typical: 4-6/10",
      "Gas leaks": "Typical: 3-6/10",
      "Chemical spills": "Typical: 5-8/10",
      "Oil spills": "Typical: 4-6/10",
      "Radiation alerts": "Typical: 2-4/10",
      "Water contamination": "Typical: 2-3/10",
      "Sinkholes": "Typical: 5-7/10",
      "Police presence (general)": "Typical: 5-7/10",
      "Active police investigation": "Typical: 6-8/10",
      "Crime scene": "Typical: 5-7/10",
      "Shots fired reports": "Typical: 9-10/10",
      "Armed suspect reports": "Typical: 7-9/10",
      "Robbery incidents": "Typical: 6-8/10",
      "Assault reports": "Typical: 6-8/10",
      "Carjacking incidents": "Typical: 7-9/10",
      "Police chases": "Typical: 8-10/10",
      "SWAT activity": "Typical: 8-10/10",
      "Curfews": "Typical: 3-5/10",
      // Protests, Civil Unrest & Political Activity
      "Peaceful protests": "Typical: 5-7/10",
      "Marches": "Typical: 5-7/10",
      "Rallies": "Typical: 6-8/10",
      "Sit-ins": "Typical: 4-6/10",
      "Strikes": "Typical: 5-7/10",
      "Labor picket lines": "Typical: 5-7/10",
      "Riots": "Typical: 8-10/10",
      "Looting": "Typical: 7-9/10",
      "Vandalism": "Typical: 5-7/10",
      "Property destruction": "Typical: 6-8/10",
      "Fires / arson": "Typical: 7-9/10",
      "Crowd violence": "Typical: 8-10/10",
      "Tear gas deployment": "Typical: 6-8/10",
      "Crowd control actions": "Typical: 7-9/10",
      "Political rallies": "Typical: 6-8/10",
      "Campaign events": "Typical: 5-7/10",
      "Inaugurations": "Typical: 7-9/10",
      "Town halls": "Typical: 4-6/10",
      "Debates": "Typical: 4-6/10",
      "Visiting dignitaries": "Typical: 6-8/10",
      "Government announcements": "Typical: 4-6/10",
      // Public Nuisances & Quality-of-Life Issues
      "Illegal fireworks": "Typical: 8-10/10",
      "Loud parties": "Typical: 8-10/10",
      "Nighttime noise": "Typical: 5-8/10",
      "Street racing": "Typical: 7-9/10",
      "Revving engines": "Typical: 6-8/10",
      "Car alarms": "Typical: 8-10/10",
      "Construction noise (off-hours)": "Typical: 7-9/10",
      "Barking dogs": "Typical: 4-7/10",
      "Loudspeakers / megaphones": "Typical: 7-9/10",
      "Trash dumping (illegal)": "Typical: 2-4/10",
      "Litter accumulation": "Typical: 2-3/10",
      "Overflowing dumpsters": "Typical: 2-4/10",
      "Abandoned furniture": "Typical: 2-3/10",
      "Abandoned shopping carts": "Typical: 2-3/10",
      "Construction debris": "Typical: 3-5/10",
      "Glass on roadway": "Typical: 2-3/10",
      "Needles / syringes": "Typical: 2-3/10",
      "Human waste": "Typical: 2-3/10",
      "Animal waste": "Typical: 2-3/10",
      "Dead animals": "Typical: 2-3/10",
      "Graffiti (new)": "Typical: 2-3/10",
      "Graffiti (recurring hotspot)": "Typical: 2-3/10",
      "Property damage": "Typical: 3-5/10",
      "Broken windows": "Typical: 3-4/10",
      "Defaced signs": "Typical: 2-3/10",
      "Tagging activity": "Typical: 2-3/10",
      "Damaged public art": "Typical: 3-4/10",
      "Homeless encampments": "Typical: 3-5/10",
      "Temporary encampments": "Typical: 3-5/10",
      "Encampment cleanup activity": "Typical: 4-6/10",
      "Sidewalk obstructions": "Typical: 3-4/10",
      "RV dwellers": "Typical: 3-5/10",
      "Tent clusters": "Typical: 3-4/10",
      "Fires within encampments": "Typical: 5-7/10",
      "Accumulated debris": "Typical: 2-4/10",
      "Panhandlers / beggars": "Typical: 2-4/10",
      "Aggressive panhandling": "Typical: 4-6/10",
      "Harassment reports": "Typical: 4-6/10",
      "Intoxicated individuals": "Typical: 4-6/10",
      "Public drug use": "Typical: 3-5/10",
      "Public drinking": "Typical: 3-5/10",
      "Fights / altercations": "Typical: 6-8/10",
      "Mental health crises (public)": "Typical: 5-7/10",
      // Health & Biohazards
      "Blood spills": "Typical: 3-4/10",
      "Medical waste": "Typical: 2-3/10",
      "Vomit": "Typical: 2-3/10",
      "Pest infestations": "Typical: 2-4/10",
      "Rodent sightings": "Typical: 2-3/10",
      "Insect swarms": "Typical: 3-5/10",
      "Disease outbreaks": "Typical: 2-4/10",
      "Quarantine zones": "Typical: 3-5/10",
      "Health department warnings": "Typical: 2-3/10",
      "Food safety alerts": "Typical: 2-3/10",
      "Contaminated water notices": "Typical: 2-3/10",
      "Smoke advisories": "Typical: 2-4/10",
      "Heat advisories": "Typical: 2-3/10",
      // Animals & Wildlife
      "Loose dogs": "Typical: 3-5/10",
      "Aggressive dogs": "Typical: 5-7/10",
      "Dog attacks": "Typical: 6-8/10",
      "Lost pets": "Typical: 2-3/10",
      "Found pets": "Typical: 2-3/10",
      "Animal control activity": "Typical: 4-6/10",
      "Dogs playing": "Typical: 3-5/10",
      "Coyotes": "Typical: 3-5/10",
      "Bears": "Typical: 4-6/10",
      "Mountain lions": "Typical: 4-6/10",
      "Alligators": "Typical: 3-5/10",
      "Snakes": "Typical: 2-4/10",
      "Raccoons": "Typical: 3-4/10",
      "Skunks": "Typical: 3-4/10",
      "Birds of prey": "Typical: 3-4/10",
      "Swarms (bees, locusts)": "Typical: 4-6/10",
      "Roadkill": "Typical: 2-4/10",
      "Animal on roadway": "Typical: 4-6/10",
      "Injured wildlife": "Typical: 3-5/10",
      "Nesting hazards": "Typical: 2-4/10",
      "Animal-induced traffic issues": "Typical: 4-6/10",
      // Commerce, Services & Crowd Density
      "Store openings": "Typical: 4-6/10",
      "Store closures": "Typical: 2-3/10",
      "Long lines": "Typical: 3-5/10",
      "Black Friday crowds": "Typical: 6-8/10",
      "Sales events": "Typical: 5-7/10",
      "Product shortages": "Typical: 2-3/10",
      "Gas shortages": "Typical: 3-5/10",
      "Panic buying": "Typical: 5-7/10",
      "Restaurant openings": "Typical: 4-6/10",
      "Restaurant closures": "Typical: 2-3/10",
      "Long wait times": "Typical: 3-4/10",
      "Food truck gatherings": "Typical: 5-7/10",
      "Bar crawls": "Typical: 7-9/10",
      "Happy hour hotspots": "Typical: 6-8/10",
      "Hotel availability spikes": "Typical: 2-3/10",
      "Hotel shortages": "Typical: 2-3/10",
      "Event-driven pricing surges": "Typical: 2-3/10",
      "Airbnb saturation": "Typical: 2-3/10",
      "Tourist influxes": "Typical: 4-6/10",
      // Community, Neighborhood & Social Events
      "Block parties": "Typical: 6-8/10",
      "Garage sales": "Typical: 3-5/10",
      "Yard sales": "Typical: 3-5/10",
      "Neighborhood meetings": "Typical: 3-4/10",
      "HOA activities": "Typical: 3-4/10",
      "Street cleanups": "Typical: 4-6/10",
      "School closures": "Typical: 2-3/10",
      "School events": "Typical: 4-6/10",
      "Graduations": "Typical: 6-8/10",
      "Campus protests": "Typical: 5-7/10",
      "Exams / move-in days": "Typical: 4-6/10",
      "Church services": "Typical: 3-5/10",
      "Large congregations": "Typical: 5-7/10",
      "Pilgrimages": "Typical: 5-7/10",
      "Processions": "Typical: 5-7/10",
      "Faith festivals": "Typical: 5-7/10",
      // Other
      "Unclassified events": "Select a category for suggestions",
      "Emerging trends": "Select a category for suggestions",
      "New nuisances": "Select a category for suggestions",
      "New celebration types": "Select a category for suggestions",
      "Location-specific anomalies": "Select a category for suggestions",
      "Other": "Select a category for suggestions"
    };
    return suggestions[category] || "Select a category for suggestions";
  };

  const handleSearchChange = (e) => {
    // Extract value from event if it's an event object, otherwise use as-is
    const value = e && e.target ? e.target.value : (typeof e === 'string' ? e : '');
    onSearchChange(value);
  };

  const handleSuggestionClick = (category) => {
    onCategorySelect(category);
    // Clear search after selection - pass empty string directly
    if (onSearchChange) {
      onSearchChange('');
    }
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
      
      <SearchBar
        id="categorySearch"
        placeholder="Type to search for a category (e.g., 'fire', 'construction', 'music')…"
        description="Type the type of event or noise you want to report. Matching categories will appear below."
        value={searchValue}
        onChange={handleSearchChange}
        suggestions={filteredCategories}
        onSuggestionClick={handleSuggestionClick}
        showSuggestions={showSuggestions}
      />

      {/* Show selected categories */}
      {selectedCategories.length > 0 && (
        <div className="selected-categories">
          <h3 className="section-title">Selected Categories</h3>
          <div className="selected-categories-list">
            {selectedCategories.map((category, index) => (
              <span key={index} className="selected-category-chip">
                {category}
                <button
                  type="button"
                  className="remove-category-btn"
                  onClick={() => onCategorySelect(category)}
                  aria-label={`Remove ${category}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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

// ===== CATEGORY FIELDS CONFIGURATION =====
// Field configurations for all 30 subcategories

const CATEGORY_FIELDS = {
  // 1. Celebrations, Entertainment & Gatherings
  "Celebrations, Entertainment & Gatherings": {
    "Holidays & Cultural Celebrations": {
      fields: [
        { name: "estimatedCrowdSize", label: "Estimated Crowd Size", type: "select",
          options: ["Under 50", "50-200", "200-500", "500-1000", "1000+"], required: false },
        { name: "hasAmplifiedSound", label: "Amplified Sound?", type: "boolean", required: false },
        { name: "permitStatus", label: "Permit Status", type: "select",
          options: ["Permitted", "Not Permitted", "Unknown"], required: false },
        { name: "expectedDuration", label: "Expected Duration (hours)", type: "number", required: false },
        { name: "roadBlocked", label: "Road Blocked?", type: "boolean", required: false }
      ]
    },
    "Music, Arts & Performance": {
      fields: [
        { name: "venueName", label: "Venue Name", type: "text", required: false },
        { name: "artistName", label: "Artist/Performer", type: "text", required: false },
        { name: "genreType", label: "Genre", type: "select",
          options: ["Rock", "Pop", "Electronic", "Classical", "Jazz", "Hip-Hop", "Country", "Other"], required: false },
        { name: "amplificationLevel", label: "Sound Level", type: "select",
          options: ["Low", "Medium", "High", "Festival-Grade"], required: false },
        { name: "expectedEndTime", label: "Expected End Time", type: "time", required: false }
      ]
    },
    "Sports & Recreation": {
      fields: [
        { name: "teamOrEventName", label: "Team/Event Name", type: "text", required: false },
        { name: "sportType", label: "Sport Type", type: "select",
          options: ["Football", "Baseball", "Basketball", "Hockey", "Soccer", "Running", "Cycling", "Other"], required: false },
        { name: "expectedAttendance", label: "Expected Attendance", type: "number", required: false },
        { name: "tailgatingPresent", label: "Tailgating Present?", type: "boolean", required: false },
        { name: "parkingImpact", label: "Parking Impact", type: "select",
          options: ["None", "Minor", "Moderate", "Severe"], required: false }
      ]
    },
    "Fairs, Expos & Conventions": {
      fields: [
        { name: "eventName", label: "Event Name", type: "text", required: false },
        { name: "ridesPresent", label: "Rides Present?", type: "boolean", required: false },
        { name: "liveEntertainment", label: "Live Entertainment?", type: "boolean", required: false },
        { name: "expectedDailyAttendance", label: "Expected Daily Attendance", type: "number", required: false },
        { name: "operatingHours", label: "Operating Hours", type: "text", required: false }
      ]
    }
  },
  // 2. Traffic, Transportation & Infrastructure
  "Traffic, Transportation & Infrastructure": {
    "Road & Traffic Conditions": {
      fields: [
        { name: "congestionLevel", label: "Congestion Level", type: "select",
          options: ["Light", "Moderate", "Heavy", "Gridlock"], required: false },
        { name: "lanesAffected", label: "Lanes Affected", type: "number", required: false },
        { name: "estimatedDelayMinutes", label: "Estimated Delay (minutes)", type: "number", required: false },
        { name: "alternateRouteAvailable", label: "Alternate Route Available?", type: "boolean", required: false }
      ]
    },
    "Road Closures & Restrictions": {
      fields: [
        { name: "closureReason", label: "Closure Reason", type: "text", required: false },
        { name: "detourRoute", label: "Detour Route", type: "text", required: false },
        { name: "fullOrPartialClosure", label: "Closure Type", type: "select",
          options: ["Full", "Partial"], required: false },
        { name: "expectedReopenTime", label: "Expected Reopen Time", type: "time", required: false },
        { name: "localAccessOnly", label: "Local Access Only?", type: "boolean", required: false }
      ]
    },
    "Construction & Maintenance": {
      fields: [
        { name: "constructionType", label: "Construction Type", type: "select",
          options: ["Repaving", "Expansion", "Repair", "Utility", "Other"], required: false },
        { name: "heavyEquipmentInUse", label: "Heavy Equipment In Use?", type: "boolean", required: false },
        { name: "nightWorkScheduled", label: "Night Work Scheduled?", type: "boolean", required: false },
        { name: "estimatedCompletionDate", label: "Estimated Completion Date", type: "date", required: false },
        { name: "jackhammering", label: "Jackhammering?", type: "boolean", required: false }
      ]
    },
    "Public Transit & Travel": {
      fields: [
        { name: "transitType", label: "Transit Type", type: "select",
          options: ["Bus", "Train", "Subway", "Light Rail", "Airport", "Ferry"], required: false },
        { name: "routeOrLineAffected", label: "Route/Line Affected", type: "text", required: false },
        { name: "delayMinutes", label: "Delay (minutes)", type: "number", required: false },
        { name: "alternativeServiceAvailable", label: "Alternative Service Available?", type: "boolean", required: false }
      ]
    }
  },
  // 3. Public Safety, Hazards & Emergencies
  "Public Safety, Hazards & Emergencies": {
    "Weather & Natural Events": {
      fields: [
        { name: "severityLevel", label: "Severity Level", type: "select",
          options: ["Minor", "Moderate", "Severe", "Extreme"], required: false },
        { name: "evacuationStatus", label: "Evacuation Status", type: "select",
          options: ["None", "Advisory", "Mandatory"], required: false },
        { name: "expectedDuration", label: "Expected Duration", type: "text", required: false },
        { name: "visibilityImpact", label: "Visibility Impact?", type: "boolean", required: false },
        { name: "powerOutages", label: "Power Outages?", type: "boolean", required: false }
      ]
    },
    "Environmental Hazards": {
      fields: [
        { name: "hazardType", label: "Hazard Type", type: "select",
          options: ["Fallen Tree", "Power Lines", "Gas Leak", "Chemical Spill", "Sinkhole", "Other"], required: false },
        { name: "areaSecured", label: "Area Secured?", type: "boolean", required: false },
        { name: "emergencyServicesOnScene", label: "Emergency Services On Scene?", type: "boolean", required: false },
        { name: "evacuationRadius", label: "Evacuation Radius", type: "text", required: false }
      ]
    },
    "Crime & Police Activity": {
      fields: [
        { name: "policePresenceLevel", label: "Police Presence Level", type: "select",
          options: ["Light", "Moderate", "Heavy", "SWAT"], required: false },
        { name: "areaSecured", label: "Area Secured?", type: "boolean", required: false },
        { name: "shelterInPlace", label: "Shelter In Place?", type: "boolean", required: false },
        { name: "estimatedDuration", label: "Estimated Duration", type: "text", required: false },
        { name: "mediaPresent", label: "Media Present?", type: "boolean", required: false }
      ]
    }
  },
  // 4. Protests, Civil Unrest & Political Activity
  "Protests, Civil Unrest & Political Activity": {
    "Organized Protests & Demonstrations": {
      fields: [
        { name: "cause", label: "Cause/Topic", type: "text", required: false },
        { name: "estimatedCrowdSize", label: "Estimated Crowd Size", type: "number", required: false },
        { name: "permitStatus", label: "Permit Status", type: "select",
          options: ["Permitted", "Not Permitted", "Unknown"], required: false },
        { name: "counterProtestersPresent", label: "Counter-Protesters Present?", type: "boolean", required: false },
        { name: "policePresent", label: "Police Present?", type: "boolean", required: false }
      ]
    },
    "Escalated Civil Unrest": {
      fields: [
        { name: "escalationLevel", label: "Escalation Level", type: "select",
          options: ["Tense", "Active Conflict", "Dangerous"], required: false },
        { name: "propertyDamageObserved", label: "Property Damage Observed?", type: "boolean", required: false },
        { name: "injuriesReported", label: "Injuries Reported?", type: "boolean", required: false },
        { name: "policeResponseLevel", label: "Police Response Level", type: "select",
          options: ["None", "Present", "Active", "Overwhelming"], required: false },
        { name: "avoidanceRadius", label: "Avoidance Radius", type: "text", required: false }
      ]
    },
    "Political Events": {
      fields: [
        { name: "eventType", label: "Event Type", type: "select",
          options: ["Rally", "Campaign", "Inauguration", "Town Hall", "Debate", "VIP Visit"], required: false },
        { name: "dignitaryName", label: "Dignitary Name", type: "text", required: false },
        { name: "securityLevel", label: "Security Level", type: "select",
          options: ["Normal", "Elevated", "High", "Maximum"], required: false },
        { name: "streetClosures", label: "Street Closures?", type: "boolean", required: false },
        { name: "expectedAttendance", label: "Expected Attendance", type: "number", required: false }
      ]
    }
  },
  // 5. Public Nuisances & Quality-of-Life Issues
  "Public Nuisances & Quality-of-Life Issues": {
    "Noise & Disturbances": {
      fields: [
        { name: "noiseSource", label: "Noise Source", type: "select",
          options: ["Music", "Engines", "Construction", "Animals", "Voices", "Other"], required: false },
        { name: "frequencyPattern", label: "Frequency Pattern", type: "select",
          options: ["Occasional", "Frequent", "Constant"], required: false },
        { name: "previouslyReported", label: "Previously Reported?", type: "boolean", required: false },
        { name: "sourceIdentifiable", label: "Source Identifiable?", type: "boolean", required: false }
      ]
    },
    "Cleanliness & Environmental Nuisances": {
      fields: [
        { name: "contaminationType", label: "Contamination Type", type: "select",
          options: ["Trash", "Debris", "Waste", "Needles", "Other"], required: false },
        { name: "hazardLevel", label: "Hazard Level", type: "select",
          options: ["Low", "Moderate", "High"], required: false },
        { name: "quantityEstimate", label: "Quantity Estimate", type: "select",
          options: ["Small", "Moderate", "Large", "Major"], required: false },
        { name: "odorPresent", label: "Odor Present?", type: "boolean", required: false }
      ]
    },
    "Graffiti & Vandalism": {
      fields: [
        { name: "vandalismType", label: "Vandalism Type", type: "select",
          options: ["Graffiti", "Property Damage", "Broken Windows", "Other"], required: false },
        { name: "offensiveContent", label: "Offensive Content?", type: "boolean", required: false },
        { name: "estimatedDamage", label: "Estimated Damage", type: "select",
          options: ["Minor", "Moderate", "Significant", "Major"], required: false },
        { name: "recurringLocation", label: "Recurring Location?", type: "boolean", required: false }
      ]
    },
    "Homelessness-Related Encounters": {
      fields: [
        { name: "encampmentSize", label: "Encampment Size", type: "select",
          options: ["Single Person", "Small Group", "Large Camp"], required: false },
        { name: "blockingSidewalk", label: "Blocking Sidewalk?", type: "boolean", required: false },
        { name: "debrisPresent", label: "Debris Present?", type: "boolean", required: false },
        { name: "fireHazardPresent", label: "Fire Hazard Present?", type: "boolean", required: false },
        { name: "assistanceNeeded", label: "Assistance Needed?", type: "boolean", required: false }
      ]
    },
    "Aggressive or Disruptive Behavior": {
      fields: [
        { name: "behaviorType", label: "Behavior Type", type: "select",
          options: ["Verbal", "Following", "Threatening", "Physical"], required: false },
        { name: "personCount", label: "Number of People", type: "number", required: false },
        { name: "intoxicationSuspected", label: "Intoxication Suspected?", type: "boolean", required: false },
        { name: "weaponsObserved", label: "Weapons Observed?", type: "boolean", required: false },
        { name: "immediateThreat", label: "Immediate Threat?", type: "boolean", required: false }
      ]
    }
  },
  // 6. Health & Biohazards
  "Health & Biohazards": {
    "Biological & Sanitation Risks": {
      fields: [
        { name: "biohazardType", label: "Biohazard Type", type: "select",
          options: ["Blood", "Needles", "Waste", "Medical", "Dead Animal", "Pests"], required: false },
        { name: "hazardSize", label: "Hazard Size", type: "select",
          options: ["Small", "Moderate", "Large"], required: false },
        { name: "professionalCleanupNeeded", label: "Professional Cleanup Needed?", type: "boolean", required: false },
        { name: "childrenAreaNearby", label: "Children's Area Nearby?", type: "boolean", required: false }
      ]
    },
    "Public Health Alerts": {
      fields: [
        { name: "alertType", label: "Alert Type", type: "select",
          options: ["Disease", "Contamination", "Air Quality", "Heat", "Other"], required: false },
        { name: "officialAdvisory", label: "Official Advisory?", type: "boolean", required: false },
        { name: "affectedArea", label: "Affected Area", type: "text", required: false },
        { name: "precautionsRecommended", label: "Precautions Recommended", type: "text", required: false }
      ]
    }
  },
  // 7. Animals & Wildlife
  "Animals & Wildlife": {
    "Domestic Animal Issues": {
      fields: [
        { name: "animalType", label: "Animal Type", type: "select",
          options: ["Dog", "Cat", "Other"], required: false },
        { name: "behaviorObserved", label: "Behavior Observed", type: "select",
          options: ["Friendly", "Scared", "Aggressive", "Unknown"], required: false },
        { name: "ownerPresent", label: "Owner Present?", type: "boolean", required: false },
        { name: "animalControlNeeded", label: "Animal Control Needed?", type: "boolean", required: false }
      ]
    },
    "Wildlife Encounters": {
      fields: [
        { name: "wildlifeType", label: "Wildlife Type", type: "text", required: false },
        { name: "behaviorObserved", label: "Behavior Observed", type: "select",
          options: ["Passing Through", "Foraging", "Aggressive", "Injured"], required: false },
        { name: "distanceFromHomes", label: "Distance From Homes", type: "select",
          options: ["Near", "Moderate", "Far"], required: false },
        { name: "wildlifeAgencyNotified", label: "Wildlife Agency Notified?", type: "boolean", required: false }
      ]
    },
    "Animal-Related Hazards": {
      fields: [
        { name: "hazardType", label: "Hazard Type", type: "select",
          options: ["Roadkill", "Animal on Road", "Injured Animal", "Nesting", "Other"], required: false },
        { name: "trafficHazard", label: "Traffic Hazard?", type: "boolean", required: false },
        { name: "removalNeeded", label: "Removal Needed?", type: "boolean", required: false }
      ]
    }
  },
  // 8. Commerce, Services & Crowd Density
  "Commerce, Services & Crowd Density": {
    "Retail & Business Conditions": {
      fields: [
        { name: "businessName", label: "Business Name", type: "text", required: false },
        { name: "crowdLevel", label: "Crowd Level", type: "select",
          options: ["Light", "Moderate", "Heavy", "Extreme"], required: false },
        { name: "lineLength", label: "Line Length", type: "select",
          options: ["Short", "Medium", "Long", "Around Block"], required: false },
        { name: "parkingImpact", label: "Parking Impact?", type: "boolean", required: false }
      ]
    },
    "Dining & Hospitality": {
      fields: [
        { name: "venueName", label: "Venue Name", type: "text", required: false },
        { name: "waitTimeMinutes", label: "Wait Time (minutes)", type: "number", required: false },
        { name: "outdoorSeating", label: "Outdoor Seating?", type: "boolean", required: false },
        { name: "noiseLevel", label: "Noise Level", type: "select",
          options: ["Normal", "Loud", "Very Loud"], required: false }
      ]
    },
    "Lodging & Travel": {
      fields: [
        { name: "eventCausing", label: "Event Causing Impact", type: "text", required: false },
        { name: "availabilityLevel", label: "Availability Level", type: "select",
          options: ["Available", "Limited", "Very Limited", "Sold Out"], required: false },
        { name: "priceImpact", label: "Price Impact", type: "select",
          options: ["Normal", "Elevated", "Surge"], required: false }
      ]
    }
  },
  // 9. Community, Neighborhood & Social Events
  "Community, Neighborhood & Social Events": {
    "Neighborhood Activities": {
      fields: [
        { name: "eventType", label: "Event Type", type: "select",
          options: ["Block Party", "Garage Sale", "Meeting", "Cleanup", "Other"], required: false },
        { name: "streetsClosed", label: "Streets Closed?", type: "boolean", required: false },
        { name: "permitStatus", label: "Permit Status", type: "select",
          options: ["Permitted", "Not Permitted", "Unknown"], required: false },
        { name: "expectedEndTime", label: "Expected End Time", type: "time", required: false }
      ]
    },
    "Schools & Institutions": {
      fields: [
        { name: "institutionName", label: "Institution Name", type: "text", required: false },
        { name: "eventType", label: "Event Type", type: "select",
          options: ["Closure", "Sports", "Performance", "Graduation", "Protest", "Move-In"], required: false },
        { name: "expectedAttendance", label: "Expected Attendance", type: "number", required: false },
        { name: "trafficImpact", label: "Traffic Impact", type: "select",
          options: ["None", "Minor", "Moderate", "Major"], required: false }
      ]
    },
    "Religious & Faith-Based Events": {
      fields: [
        { name: "faithTradition", label: "Faith Tradition", type: "text", required: false },
        { name: "eventType", label: "Event Type", type: "select",
          options: ["Service", "Festival", "Procession", "Pilgrimage"], required: false },
        { name: "expectedAttendance", label: "Expected Attendance", type: "number", required: false },
        { name: "amplifiedSound", label: "Amplified Sound?", type: "boolean", required: false }
      ]
    }
  },
  // 10. Other / Emerging Categories
  "Other / Emerging Categories": {
    "Other/Unclassified": {
      fields: [
        { name: "detailedDescription", label: "Detailed Description", type: "textarea", required: true },
        { name: "suggestedCategory", label: "Suggested Category", type: "text", required: false },
        { name: "impactType", label: "Impact Type", type: "select",
          options: ["Noise", "Traffic", "Safety", "Quality of Life", "Other"], required: false },
        { name: "urgencyLevel", label: "Urgency Level", type: "select",
          options: ["Low", "Medium", "High"], required: false }
      ]
    }
  }
};

// Category hierarchy mapping - maps specific event types to their major/sub categories
const CATEGORY_HIERARCHY = {
  // 1. Celebrations, Entertainment & Gatherings
  // 1.1 Holidays & Cultural Celebrations
  "Fireworks (legal displays)": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Fireworks (illegal / residential)": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Holiday parades": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Street celebrations": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Cultural festivals": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Religious observances": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Seasonal markets (Christmas markets, holiday bazaars)": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "New Year's celebrations": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Independence / national day events": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Pride events": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  "Ethnic heritage festivals": { major: "Celebrations, Entertainment & Gatherings", sub: "Holidays & Cultural Celebrations" },
  // 1.2 Music, Arts & Performance
  "Concerts (indoor)": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Concerts (outdoor)": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Music festivals": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Street performers / buskers": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Theater performances": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Film festivals": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Outdoor movie nights": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  "Art walks / gallery nights": { major: "Celebrations, Entertainment & Gatherings", sub: "Music, Arts & Performance" },
  // 1.3 Sports & Recreation
  "Professional sports games": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "College sports games": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "High school sports events": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "Marathons / races": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "Fun runs / charity walks": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "E-sports tournaments": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "Recreational leagues": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  "Extreme sports events": { major: "Celebrations, Entertainment & Gatherings", sub: "Sports & Recreation" },
  // 1.4 Fairs, Expos & Conventions
  "County fairs": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "State fairs": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Trade shows": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Comic / fan conventions": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Auto shows": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Home & garden expos": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Food & wine festivals": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Tech conferences": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  "Career fairs": { major: "Celebrations, Entertainment & Gatherings", sub: "Fairs, Expos & Conventions" },
  // 2. Traffic, Transportation & Infrastructure
  // 2.1 Road & Traffic Conditions
  "Traffic congestion": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "Accidents (minor)": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "Accidents (major)": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "Vehicle breakdowns": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "Disabled vehicles": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "Road rage incidents": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  "DUI checkpoints": { major: "Traffic, Transportation & Infrastructure", sub: "Road & Traffic Conditions" },
  // 2.2 Road Closures & Restrictions
  "Planned road closures": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Emergency road closures": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Construction detours": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Event-related closures": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Police barricades": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Motorcade routes (VIP / politicians)": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Bridge closures": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  "Tunnel closures": { major: "Traffic, Transportation & Infrastructure", sub: "Road Closures & Restrictions" },
  // 2.3 Construction & Maintenance
  "Road construction": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Utility work": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Sidewalk closures": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Lane reductions": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Night construction": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Infrastructure upgrades": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  "Noise-producing maintenance": { major: "Traffic, Transportation & Infrastructure", sub: "Construction & Maintenance" },
  // 2.4 Public Transit & Travel
  "Transit delays": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Transit shutdowns": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Bus reroutes": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Train disruptions": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Airport delays": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Airport congestion": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "TSA/security backups": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  "Port or ferry disruptions": { major: "Traffic, Transportation & Infrastructure", sub: "Public Transit & Travel" },
  // 3. Public Safety, Hazards & Emergencies
  // 3.1 Weather & Natural Events
  "Heavy rain": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Flooding": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Flash flooding": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Snowstorms": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Ice storms": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Extreme heat": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Extreme cold": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "High winds": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Wildfires": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Smoke / poor air quality": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Earthquakes": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Landslides": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Hurricanes / tropical storms": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  "Tornado sightings": { major: "Public Safety, Hazards & Emergencies", sub: "Weather & Natural Events" },
  // 3.2 Environmental Hazards
  "Fallen trees": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Downed power lines": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Gas leaks": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Chemical spills": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Oil spills": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Radiation alerts": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Water contamination": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  "Sinkholes": { major: "Public Safety, Hazards & Emergencies", sub: "Environmental Hazards" },
  // 3.3 Crime & Police Activity
  "Police presence (general)": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Active police investigation": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Crime scene": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Shots fired reports": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Armed suspect reports": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Robbery incidents": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Assault reports": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Carjacking incidents": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Police chases": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "SWAT activity": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  "Curfews": { major: "Public Safety, Hazards & Emergencies", sub: "Crime & Police Activity" },
  // 4. Protests, Civil Unrest & Political Activity
  // 4.1 Organized Protests & Demonstrations
  "Peaceful protests": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  "Marches": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  "Rallies": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  "Sit-ins": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  "Strikes": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  "Labor picket lines": { major: "Protests, Civil Unrest & Political Activity", sub: "Organized Protests & Demonstrations" },
  // 4.2 Escalated Civil Unrest
  "Riots": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Looting": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Vandalism": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Property destruction": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Fires / arson": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Crowd violence": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Tear gas deployment": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  "Crowd control actions": { major: "Protests, Civil Unrest & Political Activity", sub: "Escalated Civil Unrest" },
  // 4.3 Political Events
  "Political rallies": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Campaign events": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Inaugurations": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Town halls": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Debates": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Visiting dignitaries": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  "Government announcements": { major: "Protests, Civil Unrest & Political Activity", sub: "Political Events" },
  // 5. Public Nuisances & Quality-of-Life Issues
  // 5.1 Noise & Disturbances
  "Illegal fireworks": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Loud parties": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Nighttime noise": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Street racing": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Revving engines": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Car alarms": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Construction noise (off-hours)": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Barking dogs": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  "Loudspeakers / megaphones": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Noise & Disturbances" },
  // 5.2 Cleanliness & Environmental Nuisances
  "Trash dumping (illegal)": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Litter accumulation": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Overflowing dumpsters": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Abandoned furniture": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Abandoned shopping carts": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Construction debris": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Glass on roadway": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Needles / syringes": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Human waste": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Animal waste": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  "Dead animals": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Cleanliness & Environmental Nuisances" },
  // 5.3 Graffiti & Vandalism
  "Graffiti (new)": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Graffiti (recurring hotspot)": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Property damage": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Broken windows": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Defaced signs": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Tagging activity": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  "Damaged public art": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Graffiti & Vandalism" },
  // 5.4 Homelessness-Related Encounters
  "Homeless encampments": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Temporary encampments": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Encampment cleanup activity": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Sidewalk obstructions": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "RV dwellers": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Tent clusters": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Fires within encampments": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  "Accumulated debris": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Homelessness-Related Encounters" },
  // 5.5 Aggressive or Disruptive Behavior
  "Panhandlers / beggars": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Aggressive panhandling": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Harassment reports": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Intoxicated individuals": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Public drug use": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Public drinking": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Fights / altercations": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  "Mental health crises (public)": { major: "Public Nuisances & Quality-of-Life Issues", sub: "Aggressive or Disruptive Behavior" },
  // 6. Health & Biohazards
  // 6.1 Biological & Sanitation Risks (note: some overlap with 5.2)
  "Blood spills": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  "Medical waste": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  "Vomit": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  "Pest infestations": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  "Rodent sightings": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  "Insect swarms": { major: "Health & Biohazards", sub: "Biological & Sanitation Risks" },
  // 6.2 Public Health Alerts
  "Disease outbreaks": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Quarantine zones": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Health department warnings": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Food safety alerts": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Contaminated water notices": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Smoke advisories": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  "Heat advisories": { major: "Health & Biohazards", sub: "Public Health Alerts" },
  // 7. Animals & Wildlife
  // 7.1 Domestic Animal Issues
  "Loose dogs": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Aggressive dogs": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Dog attacks": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Lost pets": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Found pets": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Animal control activity": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  "Dogs playing": { major: "Animals & Wildlife", sub: "Domestic Animal Issues" },
  // 7.2 Wildlife Encounters
  "Coyotes": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Bears": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Mountain lions": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Alligators": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Snakes": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Raccoons": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Skunks": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Birds of prey": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  "Swarms (bees, locusts)": { major: "Animals & Wildlife", sub: "Wildlife Encounters" },
  // 7.3 Animal-Related Hazards
  "Roadkill": { major: "Animals & Wildlife", sub: "Animal-Related Hazards" },
  "Animal on roadway": { major: "Animals & Wildlife", sub: "Animal-Related Hazards" },
  "Injured wildlife": { major: "Animals & Wildlife", sub: "Animal-Related Hazards" },
  "Nesting hazards": { major: "Animals & Wildlife", sub: "Animal-Related Hazards" },
  "Animal-induced traffic issues": { major: "Animals & Wildlife", sub: "Animal-Related Hazards" },
  // 8. Commerce, Services & Crowd Density
  // 8.1 Retail & Business Conditions
  "Store openings": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Store closures": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Long lines": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Black Friday crowds": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Sales events": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Product shortages": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Gas shortages": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  "Panic buying": { major: "Commerce, Services & Crowd Density", sub: "Retail & Business Conditions" },
  // 8.2 Dining & Hospitality
  "Restaurant openings": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  "Restaurant closures": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  "Long wait times": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  "Food truck gatherings": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  "Bar crawls": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  "Happy hour hotspots": { major: "Commerce, Services & Crowd Density", sub: "Dining & Hospitality" },
  // 8.3 Lodging & Travel
  "Hotel availability spikes": { major: "Commerce, Services & Crowd Density", sub: "Lodging & Travel" },
  "Hotel shortages": { major: "Commerce, Services & Crowd Density", sub: "Lodging & Travel" },
  "Event-driven pricing surges": { major: "Commerce, Services & Crowd Density", sub: "Lodging & Travel" },
  "Airbnb saturation": { major: "Commerce, Services & Crowd Density", sub: "Lodging & Travel" },
  "Tourist influxes": { major: "Commerce, Services & Crowd Density", sub: "Lodging & Travel" },
  // 9. Community, Neighborhood & Social Events
  // 9.1 Neighborhood Activities
  "Block parties": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  "Garage sales": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  "Yard sales": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  "Neighborhood meetings": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  "HOA activities": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  "Street cleanups": { major: "Community, Neighborhood & Social Events", sub: "Neighborhood Activities" },
  // 9.2 Schools & Institutions
  "School closures": { major: "Community, Neighborhood & Social Events", sub: "Schools & Institutions" },
  "School events": { major: "Community, Neighborhood & Social Events", sub: "Schools & Institutions" },
  "Graduations": { major: "Community, Neighborhood & Social Events", sub: "Schools & Institutions" },
  "Campus protests": { major: "Community, Neighborhood & Social Events", sub: "Schools & Institutions" },
  "Exams / move-in days": { major: "Community, Neighborhood & Social Events", sub: "Schools & Institutions" },
  // 9.3 Religious & Faith-Based Events
  "Church services": { major: "Community, Neighborhood & Social Events", sub: "Religious & Faith-Based Events" },
  "Large congregations": { major: "Community, Neighborhood & Social Events", sub: "Religious & Faith-Based Events" },
  "Pilgrimages": { major: "Community, Neighborhood & Social Events", sub: "Religious & Faith-Based Events" },
  "Processions": { major: "Community, Neighborhood & Social Events", sub: "Religious & Faith-Based Events" },
  "Faith festivals": { major: "Community, Neighborhood & Social Events", sub: "Religious & Faith-Based Events" },
  // 10. Other / Emerging Categories
  "Unclassified events": { major: "Other / Emerging Categories", sub: "Other/Unclassified" },
  "Emerging trends": { major: "Other / Emerging Categories", sub: "Other/Unclassified" },
  "New nuisances": { major: "Other / Emerging Categories", sub: "Other/Unclassified" },
  "New celebration types": { major: "Other / Emerging Categories", sub: "Other/Unclassified" },
  "Location-specific anomalies": { major: "Other / Emerging Categories", sub: "Other/Unclassified" },
  "Other": { major: "Other / Emerging Categories", sub: "Other/Unclassified" }
};

/**
 * Helper function to get category hierarchy from a selected category
 */
const getCategoryHierarchy = (selectedCategory) => {
  return CATEGORY_HIERARCHY[selectedCategory] || { major: "Other / Emerging Categories", sub: "Other/Unclassified" };
};

/**
 * Helper function to get field configuration for a category
 */
const getFieldConfig = (selectedCategory) => {
  const hierarchy = getCategoryHierarchy(selectedCategory);
  return CATEGORY_FIELDS[hierarchy.major]?.[hierarchy.sub] || null;
};

/**
 * Dynamic Field Component - Renders appropriate input based on field type
 */
const DynamicField = ({ field, value, onChange }) => {
  const handleChange = (e) => {
    let newValue;
    if (field.type === 'boolean') {
      newValue = e.target.checked;
    } else if (field.type === 'number') {
      newValue = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    } else {
      newValue = e.target.value;
    }
    onChange(newValue);
  };

  switch (field.type) {
    case 'text':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <input
            type="text"
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
          />
        </div>
      );

    case 'number':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <input
            type="number"
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            min="0"
          />
        </div>
      );

    case 'select':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <select
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );

    case 'boolean':
      return (
        <div className="dynamic-field dynamic-field-boolean">
          <label>
            <input
              type="checkbox"
              id={field.name}
              checked={value || false}
              onChange={handleChange}
            />
            {field.label}
          </label>
        </div>
      );

    case 'time':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <input
            type="time"
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
          />
        </div>
      );

    case 'date':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <input
            type="date"
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="dynamic-field">
          <label htmlFor={field.name}>{field.label}{field.required && ' *'}</label>
          <textarea
            id={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            rows={4}
          />
        </div>
      );

    default:
      return null;
  }
};

/**
 * Category Details Screen - Dynamic fields based on selected category
 */
export const CategoryDetailsScreen = ({
  progress = 20,
  reportData = {},
  onCategorySpecificDataChange,
  onNext,
  onBack,
  onCancel
}) => {
  const selectedCategory = reportData.selectedCategories?.[0];
  const categorySpecificData = reportData.categorySpecificData || {};

  // Get field configuration for the selected category
  const fieldConfig = selectedCategory ? getFieldConfig(selectedCategory) : null;
  const hierarchy = selectedCategory ? getCategoryHierarchy(selectedCategory) : null;

  console.log('CategoryDetailsScreen: selectedCategory:', selectedCategory);
  console.log('CategoryDetailsScreen: hierarchy:', hierarchy);
  console.log('CategoryDetailsScreen: fieldConfig:', fieldConfig);
  console.log('CategoryDetailsScreen: categorySpecificData:', categorySpecificData);

  // If no specific fields for this category, auto-skip to next screen
  React.useEffect(() => {
    if (!fieldConfig || fieldConfig.fields.length === 0) {
      console.log('CategoryDetailsScreen: Auto-skipping - no fields configured');
      onNext();
    }
  }, [fieldConfig, onNext]);

  // If no fields, show nothing (will auto-skip)
  if (!fieldConfig || fieldConfig.fields.length === 0) {
    return null;
  }

  const updateField = (fieldName, value) => {
    const newData = {
      ...categorySpecificData,
      [fieldName]: value
    };
    console.log('CategoryDetailsScreen: Updating field:', fieldName, 'to:', value);
    console.log('CategoryDetailsScreen: New categorySpecificData:', newData);
    onCategorySpecificDataChange(newData);
  };

  // Check if required fields are filled
  const requiredFieldsFilled = fieldConfig.fields
    .filter(f => f.required)
    .every(f => {
      const val = categorySpecificData[f.name];
      return val !== undefined && val !== null && val !== '';
    });

  const canProceed = requiredFieldsFilled;

  return (
    <div className="screen category-details-screen">
      <ProgressBar progress={progress} />
      <Heading text="Additional Details" level={2} />
      <Text text={`Help us understand more about this ${hierarchy?.sub || 'report'}`} />

      <div className="category-details-fields">
        {fieldConfig.fields.map((field) => (
          <DynamicField
            key={field.name}
            field={field}
            value={categorySpecificData[field.name]}
            onChange={(value) => updateField(field.name, value)}
          />
        ))}
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
          id="btnSkipDetails"
          text="Skip"
          onClick={onNext}
          className="btn-secondary"
        />
        <Button
          id="btnNextCategoryDetails"
          text="NEXT →"
          onClick={onNext}
          disabled={!canProceed && fieldConfig.fields.some(f => f.required)}
          className="btn-primary"
        />
      </div>
    </div>
  );
};

// Export the helper functions and configurations for use in other components
export { CATEGORY_FIELDS, CATEGORY_HIERARCHY, getCategoryHierarchy, getFieldConfig };

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
    selectedCategories = [],
    location = '',
    timeOfDay = '',
    selectedDate = '',
    recurrenceConfig = {},
    mediaFiles = [],
    description = '',
    noiseLevel = 5,
    reporterName = '',
    contactEmail = '',
    categorySpecificData = {}
  } = reportData;

  // Get field configuration for the selected category to display labels
  const selectedCategory = selectedCategories[0] || category;
  const fieldConfig = selectedCategory ? getFieldConfig(selectedCategory) : null;
  const hierarchy = selectedCategory ? getCategoryHierarchy(selectedCategory) : null;

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

  const formatCategorySpecificValue = (value, fieldType) => {
    if (value === undefined || value === null || value === '') return null;
    if (fieldType === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Check if there's any category-specific data to display
  const hasCategorySpecificData = Object.keys(categorySpecificData).some(
    key => categorySpecificData[key] !== undefined && categorySpecificData[key] !== null && categorySpecificData[key] !== ''
  );

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

          {/* Category-Specific Details Section */}
          {hasCategorySpecificData && fieldConfig && (
            <div className="summary-section category-specific-section">
              <h3 className="section-title">
                📝 {hierarchy?.sub || 'Category'} Details
              </h3>
              {fieldConfig.fields.map((field) => {
                const value = formatCategorySpecificValue(categorySpecificData[field.name], field.type);
                if (value === null) return null;
                return (
                  <div key={field.name} className="summary-item">
                    <span className="summary-label">{field.label}:</span>
                    <span className="summary-value">{value}</span>
                  </div>
                );
              })}
              <button
                className="edit-btn"
                onClick={() => onEdit('categoryDetails')}
                style={{ marginTop: '10px' }}
              >
                Edit Details
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