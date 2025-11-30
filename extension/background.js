/**
 * Background service worker for the LinkedIn Cold Email Generator extension
 * Handles background tasks and extension lifecycle events
 */

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LinkedIn Cold Email Generator installed');
    
    // Open welcome page or setup instructions
    chrome.tabs.create({
      url: 'https://github.com' // Replace with your actual documentation URL
    });
  } else if (details.reason === 'update') {
    console.log('LinkedIn Cold Email Generator updated');
  }
});

// Message handler for communication between content script, popup, and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthToken') {
    // Retrieve auth token from storage
    chrome.storage.local.get(['auth_token'], (result) => {
      sendResponse({ token: result.auth_token });
    });
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'clearAuthData') {
    // Clear all authentication data
    chrome.storage.local.remove(['auth_token', 'user_email', 'user_id'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'log') {
    // Logging from content scripts
    console.log('[Content Script]:', request.message);
  }
});

// Listen for tab updates to check if user is on LinkedIn
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('linkedin.com/in/')) {
      // User is on a LinkedIn profile page
      chrome.action.setBadgeText({ text: '✓', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId });
    } else {
      // Clear badge
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});

// Handle extension icon click (optional additional functionality)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire when popup is defined, but kept for reference
  console.log('Extension icon clicked on tab:', tab.id);
});

// Periodic token validation (optional)
// Check token validity every hour
const TOKEN_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

setInterval(async () => {
  const result = await chrome.storage.local.get(['auth_token']);
  if (result.auth_token) {
    // You could validate the token with the backend here
    console.log('Token check: Token exists');
  }
}, TOKEN_CHECK_INTERVAL);

console.log('LinkedIn Cold Email Generator: Background service worker loaded');

