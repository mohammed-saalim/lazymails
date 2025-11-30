/**
 * Configuration for the Cold Email Generator extension
 */
const CONFIG = {
  // API base URL - update this when deploying to production
  API_BASE_URL: 'http://localhost:5148/api',
  
  // Alternate URL for HTTPS (if configured)
  // API_BASE_URL: 'https://localhost:7000/api',
  
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

