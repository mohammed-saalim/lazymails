/**
 * Popup script for the LinkedIn Cold Email Generator extension
 * Handles authentication, email generation, and UI interactions
 */

// DOM Elements
let authSection, mainSection, loginForm, registerForm;
let loginTab, registerTab;
let loginEmail, loginPassword, loginButton;
let registerEmail, registerPassword, registerButton;
let logoutButton, generateButton, copyButton, newEmailButton;
let statusMessage, errorMessage, authError;
let emailDisplay, emailContent;
let userEmailDisplay, dashboardLink, userActions;
let emailTypeSelect, customPromptContainer, customPromptTextarea;
let hintMessage, guestButton;

// Loading animation state
let zzzAnimationInterval = null;

// Fun loading messages
const loadingMessages = [
  "Taking a quick nap while we write your email...",
  "Dreaming up your perfect email...",
  "Catching some Z's...",
  "Snoozing through the hard work...",
  "Let me sleep on it..."
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the popup
 */
async function init() {
  // Get DOM elements
  authSection = document.getElementById('authSection');
  mainSection = document.getElementById('mainSection');
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');

  loginTab = document.getElementById('loginTab');
  registerTab = document.getElementById('registerTab');

  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  loginButton = document.getElementById('loginButton');

  registerEmail = document.getElementById('registerEmail');
  registerPassword = document.getElementById('registerPassword');
  registerButton = document.getElementById('registerButton');

  logoutButton = document.getElementById('logoutButton');
  generateButton = document.getElementById('generateButton');
  copyButton = document.getElementById('copyButton');
  newEmailButton = document.getElementById('newEmailButton');

  statusMessage = document.getElementById('statusMessage');
  errorMessage = document.getElementById('errorMessage');
  authError = document.getElementById('authError');

  emailDisplay = document.getElementById('emailDisplay');
  emailContent = document.getElementById('emailContent');
  hintMessage = document.getElementById('hintMessage');

  userEmailDisplay = document.getElementById('userEmail');
  dashboardLink = document.getElementById('dashboardLink');
  userActions = document.getElementById('userActions');

  // Email type elements
  emailTypeSelect = document.getElementById('emailTypeSelect');
  customPromptContainer = document.getElementById('customPromptContainer');
  customPromptTextarea = document.getElementById('customPromptTextarea');
  guestButton = document.getElementById('guestButton');

  // Add event listeners
  loginTab.addEventListener('click', showLoginForm);
  registerTab.addEventListener('click', showRegisterForm);

  loginButton.addEventListener('click', handleLogin);
  registerButton.addEventListener('click', handleRegister);
  guestButton.addEventListener('click', handleGuestMode);
  logoutButton.addEventListener('click', handleLogout);

  generateButton.addEventListener('click', handleGenerateEmail);
  copyButton.addEventListener('click', handleCopyEmail);
  newEmailButton.addEventListener('click', resetEmailDisplay);

  dashboardLink.addEventListener('click', openDashboard);

  // Email type change handler
  emailTypeSelect.addEventListener('change', handleEmailTypeChange);

  // Allow Enter key to submit forms
  loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  registerPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
  });

  // Check authentication status
  await checkAuthStatus();
}

/**
 * Check if user is authenticated
 */
async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.TOKEN, CONFIG.STORAGE_KEYS.USER_EMAIL, 'is_guest']);

    if (result.is_guest) {
      // Guest mode
      showMainSection('Guest');
    } else if (result[CONFIG.STORAGE_KEYS.TOKEN]) {
      // Logged in
      showMainSection(result[CONFIG.STORAGE_KEYS.USER_EMAIL]);
    } else {
      showAuthSection();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showAuthSection();
  }
}

/**
 * Show auth section and hide main section
 */
function showAuthSection() {
  authSection.style.display = 'block';
  mainSection.style.display = 'none';
  if (userActions) userActions.style.display = 'none';
}

/**
 * Show main section and hide auth section
 */
function showMainSection(email) {
  authSection.style.display = 'none';
  mainSection.style.display = 'block';
  if (userEmailDisplay) userEmailDisplay.textContent = email;
  if (userActions) userActions.style.display = 'flex';
}

/**
 * Show login form
 */
function showLoginForm() {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';
  authError.textContent = '';
  authError.style.display = 'none';
}

/**
 * Show register form
 */
function showRegisterForm() {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.style.display = 'flex';
  loginForm.style.display = 'none';
  authError.textContent = '';
  authError.style.display = 'none';
}

/**
 * Handle user login
 */
async function handleLogin() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Logging in...';

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON parse error during login:', parseError);
      showAuthError('Server error. Please try again later.');
      return;
    }

    if (response.ok) {
      // Store auth data
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.TOKEN]: data.token,
        [CONFIG.STORAGE_KEYS.USER_EMAIL]: data.email,
        [CONFIG.STORAGE_KEYS.USER_ID]: data.userId
      });

      showMainSection(data.email);
      loginEmail.value = '';
      loginPassword.value = '';
    } else {
      showAuthError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showAuthError('Network error. Please check your connection and ensure the API is running.');
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
  }
}

/**
 * Handle user registration
 */
async function handleRegister() {
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  registerButton.disabled = true;
  registerButton.textContent = 'Registering...';

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON parse error during registration:', parseError);
      showAuthError('Server error. Please try again later.');
      return;
    }

    if (response.ok) {
      // Store auth data
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.TOKEN]: data.token,
        [CONFIG.STORAGE_KEYS.USER_EMAIL]: data.email,
        [CONFIG.STORAGE_KEYS.USER_ID]: data.userId
      });

      showMainSection(data.email);
      registerEmail.value = '';
      registerPassword.value = '';
    } else {
      showAuthError(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showAuthError('Network error. Please check your connection and ensure the API is running.');
  } finally {
    registerButton.disabled = false;
    registerButton.textContent = 'Register';
  }
}

/**
 * Handle email type selection change
 */
function handleEmailTypeChange() {
  const selectedType = emailTypeSelect.value;

  if (selectedType === 'Custom') {
    customPromptContainer.style.display = 'block';
  } else {
    customPromptContainer.style.display = 'none';
    customPromptTextarea.value = '';
  }
}

/**
 * Start the loading state with animated Zzz button and static message
 */
function startLoadingAnimation() {
  let zzzState = 0;
  const zzzTexts = ['Z', 'Zz', 'Zzz'];

  // Set random loading message in the hint area (pick once and keep it)
  if (hintMessage) {
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    hintMessage.textContent = randomMessage;
    hintMessage.classList.add('loading-message');
  }

  // Disable button and show initial state
  generateButton.disabled = true;
  generateButton.classList.add('loading');
  generateButton.textContent = 'Z';

  // Start animation cycle for button text only
  zzzAnimationInterval = setInterval(() => {
    zzzState = (zzzState + 1) % zzzTexts.length;
    generateButton.textContent = zzzTexts[zzzState];
  }, 400);
}

/**
 * Stop the loading state and animation
 */
function stopLoadingAnimation() {
  // Clear the animation interval
  if (zzzAnimationInterval) {
    clearInterval(zzzAnimationInterval);
    zzzAnimationInterval = null;
  }

  // Reset button
  generateButton.disabled = false;
  generateButton.classList.remove('loading');
  generateButton.textContent = 'Generate Cold Email';

  // Reset hint message styling
  if (hintMessage) {
    hintMessage.textContent = 'Make sure you\'re on a LinkedIn profile page';
    hintMessage.classList.remove('loading-message');
    hintMessage.style.color = '';
    hintMessage.style.fontWeight = '';
    hintMessage.style.fontStyle = '';
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  await chrome.storage.local.remove([
    CONFIG.STORAGE_KEYS.TOKEN,
    CONFIG.STORAGE_KEYS.USER_EMAIL,
    CONFIG.STORAGE_KEYS.USER_ID
  ]);

  // Clear user email display
  if (userEmailDisplay) userEmailDisplay.textContent = '';

  resetEmailDisplay();
  showAuthSection();
}

/**
 * Handle generate email button click
 */
async function handleGenerateEmail() {
  hideMessages();

  try {
    // Get selected email type and custom prompt
    const emailType = emailTypeSelect.value;
    const customPrompt = customPromptTextarea.value.trim();

    // Validate custom prompt if Custom type is selected
    if (emailType === 'Custom' && !customPrompt) {
      showError('Please enter your custom instructions for the email');
      return;
    }

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('linkedin.com/in/')) {
      showError('Please navigate to a LinkedIn profile page first');
      return;
    }

    // Show loading with animated Zzz
    startLoadingAnimation();
    emailDisplay.style.display = 'none';

    // Extract profile data from content script
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' });
    } catch (chromeError) {
      // Check for content script connection error
      if (chromeError.message &&
        (chromeError.message.includes('Receiving end does not exist') ||
          chromeError.message.includes('Could not establish connection'))) {
        throw new Error('CONTENT_SCRIPT_ERROR');
      }
      throw chromeError;
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to extract profile data');
    }

    const profileData = response.data.fullText;

    if (!profileData || profileData.trim().length < 50) {
      throw new Error('Could not extract enough profile data. Make sure the profile is fully loaded.');
    }

    // Get auth token
    const storage = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.TOKEN]);
    const token = storage[CONFIG.STORAGE_KEYS.TOKEN];

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Build request body with email type
    const requestBody = {
      linkedInProfileData: profileData,
      emailType: emailType
    };

    // Add custom prompt if Custom type is selected
    if (emailType === 'Custom') {
      requestBody.customPrompt = customPrompt;
    }

    // Call API to generate email
    const apiResponse = await fetch(`${CONFIG.API_BASE_URL}/email/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check for authentication errors (expired token)
    if (apiResponse.status === 401) {
      // Token expired or invalid - logout and show friendly message
      stopLoadingAnimation();
      await handleLogout();
      showAuthError('Your session has expired. Please log in again.');
      return;
    }

    if (!apiResponse.ok) {
      let errorMessage = 'Failed to generate email';
      try {
        const errorData = await apiResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        // Use default error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    let emailData;
    try {
      emailData = await apiResponse.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Received invalid response from server. Please try again.');
    }

    // Display the generated email
    displayGeneratedEmail(emailData.generatedEmail);
    showStatus('Email generated successfully!');

  } catch (error) {
    console.error('Generate email error:', error);

    // Stop loading animation first
    stopLoadingAnimation();

    // Show friendly message for content script connection error
    if (error.message === 'CONTENT_SCRIPT_ERROR') {
      showWarning('Please refresh the LinkedIn page and try again');
    } else {
      showError(error.message);
    }

    // Make sure button is visible on error
    generateButton.style.display = 'block';
  }
}

/**
 * Display the generated email
 */
function displayGeneratedEmail(email) {
  emailContent.textContent = email;
  emailDisplay.style.display = 'block';
  generateButton.style.display = 'none';

  // Hide hint message when showing results
  if (hintMessage) {
    hintMessage.style.display = 'none';
  }
}

/**
 * Handle copy email to clipboard
 */
async function handleCopyEmail() {
  try {
    const text = emailContent.textContent;
    await navigator.clipboard.writeText(text);

    copyButton.textContent = '✓ Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy to Clipboard';
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Reset email display and show generate button
 */
function resetEmailDisplay() {
  emailDisplay.style.display = 'none';
  emailContent.textContent = '';

  // Stop any running animation and show button
  stopLoadingAnimation();
  generateButton.style.display = 'block';

  // Show hint message again
  if (hintMessage) {
    hintMessage.style.display = 'block';
    hintMessage.textContent = 'Make sure you\'re on a LinkedIn profile page';
    hintMessage.classList.remove('loading-message');
    hintMessage.style.color = '';
    hintMessage.style.fontWeight = '';
    hintMessage.style.fontStyle = '';
  }

  // Reset email type selection
  if (emailTypeSelect) {
    emailTypeSelect.value = 'Default';
    customPromptContainer.style.display = 'none';
    customPromptTextarea.value = '';
  }

  hideMessages();
}

/**
 * Open dashboard in new tab
 */
function openDashboard(e) {
  e.preventDefault();
  // Get the absolute path to the dashboard
  const dashboardPath = chrome.runtime.getURL('dashboard.html');
  chrome.tabs.create({ url: dashboardPath });
}

/**
 * Show status message
 */
function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = 'block';
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

/**
 * Show error message in red
 */
function showError(message) {
  if (hintMessage) {
    hintMessage.textContent = message;
    hintMessage.classList.remove('loading-message');
    hintMessage.style.color = '#991b1b';
    hintMessage.style.fontWeight = '500';
    hintMessage.style.fontStyle = 'normal';
    hintMessage.style.display = 'block';
  }
}

/**
 * Show warning message in amber/yellow (less scary than error)
 */
function showWarning(message) {
  if (hintMessage) {
    hintMessage.textContent = message;
    hintMessage.classList.remove('loading-message');
    hintMessage.style.color = '#d97706';
    hintMessage.style.fontWeight = '500';
    hintMessage.style.fontStyle = 'normal';
    hintMessage.style.display = 'block';
  }
}

/**
 * Show auth error
 */
function showAuthError(message) {
  authError.textContent = message;
  authError.style.display = 'block';
}

/**
 * Hide all messages
 */
function hideMessages() {
  statusMessage.style.display = 'none';
  errorMessage.style.display = 'none';
  statusMessage.textContent = '';
  errorMessage.textContent = '';
}

// ============== GUEST MODE FUNCTIONS ==============

/**
 * Handle guest mode - allow users to generate emails without an account
 */
async function handleGuestMode() {
  try {
    await chrome.storage.local.set({
      is_guest: true,
      guest_count: 0,
      guest_reset_date: new Date().toDateString()
    });

    showMainSection('Guest');
  } catch (error) {
    console.error('Guest mode error:', error);
    showAuthError('Failed to enter guest mode. Please try again.');
  }
}

/**
 * Check and update guest rate limit
 * @returns {boolean} - Returns true if within limit, false if exceeded
 */
async function checkGuestLimit() {
  const { is_guest, guest_count, guest_reset_date } = await chrome.storage.local.get(['is_guest', 'guest_count', 'guest_reset_date']);

  if (!is_guest) return true; // Not a guest, no limit

  // Check if date needs reset
  const today = new Date().toDateString();
  let currentCount = guest_count || 0;

  if (guest_reset_date !== today) {
    // Reset counter for new day
    currentCount = 0;
    await chrome.storage.local.set({
      guest_count: 0,
      guest_reset_date: today
    });
  }

  // Check guest limit
  if (currentCount >= 5) {
    showError('Daily limit of 5 emails reached. Please create an account for unlimited access.');
    setTimeout(() => promptGuestToRegister(), 1500);
    return false;
  }

  return true;
}

/**
 * Increment guest counter after successful generation
 */
async function incrementGuestCounter() {
  const { is_guest, guest_count } = await chrome.storage.local.get(['is_guest', 'guest_count']);

  if (is_guest) {
    const newCount = (guest_count || 0) + 1;
    await chrome.storage.local.set({ guest_count: newCount });

    // Show remaining count
    const remaining = 5 - newCount;
    if (remaining > 0) {
      showStatus(`✨ ${remaining} email${remaining === 1 ? '' : 's'} remaining today. Create an account for unlimited access!`);
    } else {
      showStatus('🎉 You\'ve used all 5 free emails! Create an account for unlimited access.');
      setTimeout(() => promptGuestToRegister(), 2000);
    }
  }
}

/**
 * Prompt guest user to create an account
 */
function promptGuestToRegister() {
  if (confirm('Create an account for unlimited email generation and to save your history?')) {
    showAuthSection();
    showRegisterForm();
  }
}
