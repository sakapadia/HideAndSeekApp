import React, { useState, useEffect } from 'react';
import { Button, Heading, Text } from './UIComponents';
import { getCategoryHierarchy, getFieldConfig } from './Screens';
import './UserProfile.css';

/**
 * User Profile Component
 * Displays user information, points, and report history
 */
export const UserProfile = ({ 
  userInfo, 
  onClose, 
  onLogout,
  onUserUpdate,
  fullScreen = false
}) => {
  console.log('UserProfile: Component rendered');
  console.log('UserProfile: userInfo:', userInfo);
  console.log('UserProfile: onClose function:', onClose);
  console.log('UserProfile: Component props received');
  const [userProfile, setUserProfile] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    timezone: '',
    customUsername: ''
  });

  // Fetch user profile and reports on component mount
  useEffect(() => {
    if (userInfo.userId && !userInfo.isGuest) {
      fetchUserProfile();
      fetchUserReports();
    } else {
      setLoading(false);
    }
  }, [userInfo.userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userInfo.userId}/profile`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        setEditForm({
          displayName: profile.displayName || '',
          timezone: profile.timezone || '',
          customUsername: profile.customUsername || ''
        });
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError('Error loading user profile');
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchUserReports = async () => {
    try {
      const response = await fetch('/api/noisereports/my-reports', {
        headers: {
          'Authorization': `Bearer ${userInfo.jwtToken}`
        }
      });
      if (response.ok) {
        const reports = await response.json();
        setUserReports(reports);
      } else {
        setError('Failed to load user reports');
      }
    } catch (err) {
      setError('Error loading user reports');
      console.error('Error fetching user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/noisereports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo.jwtToken}`
        }
      });

      if (response.ok) {
        // Remove the report from the list
        setUserReports(prev => prev.filter(report => report.id !== reportId));
        // Refresh user profile to update points
        fetchUserProfile();
        // Refresh user info in parent component to update points display
        if (onUserUpdate) {
          onUserUpdate();
        }
        alert('Report deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete report: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error deleting report');
      console.error('Error deleting report:', err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userInfo.userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(updatedProfile);
        setEditingProfile(false);
        if (onUserUpdate) {
          onUserUpdate(updatedProfile);
        }
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleLogoutClick = async () => {
    setLogoutLoading(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoiseLevelColor = (level) => {
    if (level <= 3) return '#4CAF50'; // Green
    if (level <= 6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Parse category-specific data from JSON string
  const parseCategorySpecificData = (report) => {
    if (!report.categorySpecificData) return null;

    try {
      // If it's already an object, use it directly
      if (typeof report.categorySpecificData === 'object') {
        return report.categorySpecificData;
      }
      // If it's a string, parse it
      return JSON.parse(report.categorySpecificData);
    } catch (e) {
      console.error('Error parsing category specific data:', e);
      return null;
    }
  };

  // Get field label from config
  const getFieldLabel = (fieldName, category) => {
    const fieldConfig = getFieldConfig(category);
    if (fieldConfig) {
      const field = fieldConfig.fields.find(f => f.name === fieldName);
      if (field) return field.label;
    }
    // Fallback: convert camelCase to Title Case
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Format category-specific value for display
  const formatCategoryValue = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  };

  if (userInfo.isGuest) {
    return fullScreen ? (
      <div className="user-profile-page">
        <div className="user-profile-modal">
          <div className="profile-header">
            <Heading text="Guest User" level={2} />
            <Button 
              text="✕" 
              onClick={onClose}
              className="close-btn"
            />
          </div>
          <div className="profile-content">
            <Text text="Guest users cannot access profile features. Please log in to view your profile, points, and report history." />
            <div className="profile-actions">
              <Button 
                text="Close" 
                onClick={onClose}
                className="btn-primary"
              />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="user-profile-overlay">
        <div className="user-profile-modal">
          <div className="profile-header">
            <Heading text="Guest User" level={2} />
            <Button 
              text="✕" 
              onClick={onClose}
              className="close-btn"
            />
          </div>
          <div className="profile-content">
            <Text text="Guest users cannot access profile features. Please log in to view your profile, points, and report history." />
            <div className="profile-actions">
              <Button 
                text="Close" 
                onClick={onClose}
                className="btn-primary"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    const Content = (
      <div className="user-profile-modal">
        <div className="loading-spinner">
          <Text text="Loading profile..." />
        </div>
      </div>
    );
    return fullScreen ? (
      <div className="user-profile-page">{Content}</div>
    ) : (
      <div className="user-profile-overlay">{Content}</div>
    );
  }

  const Body = (
    <div className="user-profile-modal">
        <div className="profile-header">
          <Heading text="User Profile" level={2} />
          <Button 
            text="✕" 
            onClick={onClose}
            className="close-btn"
          />
        </div>

        <div className="profile-content">
          {error && (
            <div className="error-message">
              <Text text={error} />
            </div>
          )}

          {/* User Information Section */}
          <div className="profile-section">
            <Heading text="Account Information" level={3} />
            
            {editingProfile ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Display Name:</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter display name"
                  />
                </div>
                <div className="form-group">
                  <label>Timezone:</label>
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="">Select timezone</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Custom Username:</label>
                  <input
                    type="text"
                    value={editForm.customUsername}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customUsername: e.target.value }))}
                    placeholder="Choose a username"
                  />
                </div>
                <div className="form-actions">
                  <Button 
                    text="Save" 
                    onClick={handleUpdateProfile}
                    className="btn-primary"
                  />
                  <Button 
                    text="Cancel" 
                    onClick={() => setEditingProfile(false)}
                    className="btn-secondary"
                  />
                </div>
              </div>
            ) : (
              <div className="user-info">
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{userInfo?.username || userProfile?.displayName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userProfile?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Display Name:</span>
                  <span className="info-value">{userProfile?.displayName || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Sign-in Provider:</span>
                  <span className="info-value">
                    {userInfo.provider ? (
                      <span className="provider-badge">
                        {userInfo.provider.charAt(0).toUpperCase() + userInfo.provider.slice(1)}
                      </span>
                    ) : 'Unknown'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{userProfile?.createdDate ? formatDate(userProfile.createdDate) : 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Login:</span>
                  <span className="info-value">{userProfile?.lastLoginDate ? formatDate(userProfile.lastLoginDate) : 'Unknown'}</span>
                </div>
                <Button 
                  text="Edit Profile" 
                  onClick={() => setEditingProfile(true)}
                  className="btn-outline"
                />
              </div>
            )}
          </div>

          {/* Points Section */}
          <div className="profile-section">
            <Heading text="Points & Achievements" level={3} />
            <div className="points-display">
              <div className="points-circle">
                <span className="points-number">{userProfile?.points || 0}</span>
                <span className="points-label">Total Points</span>
              </div>
              <div className="points-info">
                <Text text="You earn 10 points for each noise report you submit. Points help track your contributions to the community." />
              </div>
            </div>
          </div>

          {/* Report History Section */}
          <div className="profile-section">
            <Heading text="Report History" level={3} />
            {userReports.length === 0 ? (
              <Text text="You haven't submitted any reports yet. Start by creating your first noise report!" />
            ) : (
              <div className="reports-list">
                {userReports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-meta">
                        <span className="report-date">{formatDate(report.reportDate)}</span>
                        <span
                          className="noise-level-badge"
                          style={{ backgroundColor: getNoiseLevelColor(report.noiseLevel) }}
                        >
                          Level {report.noiseLevel}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="delete-report-btn"
                        title="Delete Report"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="report-content">
                      <div className="report-type">{report.noiseType}</div>
                      <div className="report-description">{report.description}</div>
                      <div className="report-location">
                        📍 {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                      </div>
                      {/* Category-Specific Details */}
                      {(() => {
                        const categoryData = parseCategorySpecificData(report);
                        if (!categoryData || Object.keys(categoryData).length === 0) return null;

                        const hierarchy = getCategoryHierarchy(report.noiseType);
                        return (
                          <div className="report-category-details">
                            <div className="category-details-header">
                              {hierarchy?.sub || 'Additional'} Details
                            </div>
                            <div className="category-details-list">
                              {Object.entries(categoryData).map(([key, value]) => {
                                const formattedValue = formatCategoryValue(value);
                                if (formattedValue === null) return null;
                                return (
                                  <div key={key} className="category-detail-item">
                                    <span className="detail-label">{getFieldLabel(key, report.noiseType)}:</span>
                                    <span className="detail-value">{formattedValue}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="report-footer">
                      <span className="points-earned">+{report.pointsAwarded} points</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Actions */}
          <div className="profile-actions">
            <Button 
              text={logoutLoading ? "Logging out..." : "Logout"} 
              onClick={handleLogoutClick}
              className="btn-outline"
              disabled={logoutLoading}
            />
            <Button 
              text="Close" 
              onClick={onClose}
              className="btn-primary"
            />
          </div>
        </div>
      </div>
  );

  return fullScreen ? (
    <div className="user-profile-page">{Body}</div>
  ) : (
    <div className="user-profile-overlay">{Body}</div>
  );
}; 