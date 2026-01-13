/**
 * Configuration for the Cold Email Generator extension
 */
const CONFIG = {
  // API base URL - Production (Render)
  API_BASE_URL: 'https://lazymails-1.onrender.com/api',
  
  // For local development, use:
  // API_BASE_URL: 'http://localhost:5148/api',
  
  // Storage keys
  STORAGE_KEYS: {
    TOKEN: 'auth_token',
    USER_EMAIL: 'user_email',
    USER_ID: 'user_id'
  }
};

// Make config available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

