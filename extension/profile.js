/**
 * LazyMails Profile Page
 * Handles loading and saving user profile
 */

// Configuration
const API_BASE_URL = 'https://lazymails-1.onrender.com/api';

// State
let authToken = null;

// DOM Elements
let profileForm;
let fullNameInput, currentRoleInput, targetRolesInput, aboutMeInput, linkedInUrlInput;
let saveBtn, errorMessage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the profile page
 */
function init() {
  // Get DOM elements
  profileForm = document.getElementById('profileForm');
  fullNameInput = document.getElementById('fullName');
  currentRoleInput = document.getElementById('currentRole');
  targetRolesInput = document.getElementById('targetRoles');
  aboutMeInput = document.getElementById('aboutMe');
  linkedInUrlInput = document.getElementById('linkedInUrl');
  saveBtn = document.getElementById('saveBtn');
  errorMessage = document.getElementById('errorMessage');

  // Event listeners
  profileForm.addEventListener('submit', handleSaveProfile);

  // Check auth and load profile
  checkAuthAndLoad();
}

/**
 * Check authentication and load profile
 */
async function checkAuthAndLoad() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['auth_token']);
      if (result.auth_token) {
        authToken = result.auth_token;
        await loadProfile();
      } else {
        // Redirect to dashboard (which will show login)
        window.location.href = 'dashboard.html';
      }
    } else {
      authToken = localStorage.getItem('auth_token');
      if (authToken) {
        await loadProfile();
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    window.location.href = 'dashboard.html';
  }
}

/**
 * Load existing profile
 */
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Check for expired token
    if (response.status === 401) {
      console.log('Token expired during profile load');
      window.location.href = 'dashboard.html';
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to load profile');
    }

    let profile;
    try {
      profile = await response.json();
    } catch (parseError) {
      console.error('JSON parse error in loadProfile:', parseError);
      return; // Don't show error, just let user fill in the form
    }

    // Populate form
    if (profile.fullName) fullNameInput.value = profile.fullName;
    if (profile.currentRole) currentRoleInput.value = profile.currentRole;
    if (profile.targetRoles) targetRolesInput.value = profile.targetRoles;
    if (profile.aboutMe) aboutMeInput.value = profile.aboutMe;
    if (profile.linkedInUrl) linkedInUrlInput.value = profile.linkedInUrl;

  } catch (error) {
    console.error('Error loading profile:', error);
    // Don't show error, just let user fill in the form
  }
}

/**
 * Handle save profile form submission
 */
async function handleSaveProfile(e) {
  e.preventDefault();

  // Clear previous errors
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';

  // Validate required fields
  const fullName = fullNameInput.value.trim();
  const targetRoles = targetRolesInput.value.trim();
  const aboutMe = aboutMeInput.value.trim();

  if (!fullName) {
    showError('Full name is required');
    return;
  }
  if (!targetRoles) {
    showError('Target roles is required');
    return;
  }
  if (!aboutMe) {
    showError('About me is required');
    return;
  }

  // Disable button
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <circle cx="12" cy="12" r="10"/>
    </svg>
    Saving...
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fullName: fullName,
        currentRole: currentRoleInput.value.trim() || null,
        targetRoles: targetRoles,
        aboutMe: aboutMe,
        linkedInUrl: linkedInUrlInput.value.trim() || null
      })
    });

    // Check for expired token
    if (response.status === 401) {
      console.log('Token expired during profile save');
      showError('Your session has expired. Please log in again.');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }

    if (!response.ok) {
      let errorMessage = 'Failed to save profile';
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    // Show success toast
    showToast('Profile saved successfully!');

    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);

  } catch (error) {
    console.error('Error saving profile:', error);
    showError(error.message || 'Failed to save profile');

    // Re-enable button
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Save Profile
    `;
  }
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

