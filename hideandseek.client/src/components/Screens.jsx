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