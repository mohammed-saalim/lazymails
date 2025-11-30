/**
 * LazyMails Dashboard
 * Handles authentication, data fetching, and UI interactions
 */

// Configuration
const API_BASE_URL = 'http://localhost:5148/api';

// State
let authToken = null;
let userEmail = null;
let currentFilter = 'all';
let allEmails = [];
let currentEmailId = null;
let currentEmail = null;
let isEditingEmail = false;
let userProfileComplete = false;

// DOM Elements
let authSection, mainContent, loginForm;
let loginEmail, loginPassword, authError;
let logoutBtn, userEmailDisplay, profileBanner;
let loadingIndicator, emptyState, emailHistory;
let emailTableBody, emailModal, closeModal;
let modalProfileData, modalEmail, modalEmailEdit, modalCreatedAt, modalUpdatedAt;
let copyEmailBtn, deleteEmailBtn;
let editEmailToggle, editEmailActions, saveEmailBtn, cancelEmailBtn;
let filterTabs;
let totalEmailsEl, workedCountEl, didntWorkCountEl, unknownCountEl;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the dashboard
 */
function init() {
  // Get DOM elements
  authSection = document.getElementById('authSection');
  mainContent = document.getElementById('mainContent');
  loginForm = document.getElementById('loginForm');
  
  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  authError = document.getElementById('authError');
  
  logoutBtn = document.getElementById('logoutBtn');
  userEmailDisplay = document.getElementById('userEmail');
  profileBanner = document.getElementById('profileBanner');
  
  loadingIndicator = document.getElementById('loadingIndicator');
  emptyState = document.getElementById('emptyState');
  emailHistory = document.getElementById('emailHistory');
  emailTableBody = document.getElementById('emailTableBody');
  
  emailModal = document.getElementById('emailModal');
  closeModal = document.getElementById('closeModal');
  modalProfileData = document.getElementById('modalProfileData');
  modalEmail = document.getElementById('modalEmail');
  modalEmailEdit = document.getElementById('modalEmailEdit');
  modalCreatedAt = document.getElementById('modalCreatedAt');
  modalUpdatedAt = document.getElementById('modalUpdatedAt');
  copyEmailBtn = document.getElementById('copyEmailBtn');
  deleteEmailBtn = document.getElementById('deleteEmailBtn');
  
  // Edit elements
  editEmailToggle = document.getElementById('editEmailToggle');
  editEmailActions = document.getElementById('editEmailActions');
  saveEmailBtn = document.getElementById('saveEmailBtn');
  cancelEmailBtn = document.getElementById('cancelEmailBtn');
  
  filterTabs = document.querySelectorAll('.filter-tab');
  
  totalEmailsEl = document.getElementById('totalEmails');
  workedCountEl = document.getElementById('workedCount');
  didntWorkCountEl = document.getElementById('didntWorkCount');
  unknownCountEl = document.getElementById('unknownCount');
  
  // Event listeners
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  closeModal.addEventListener('click', closeEmailModal);
  copyEmailBtn.addEventListener('click', copyEmailToClipboard);
  deleteEmailBtn.addEventListener('click', deleteEmail);
  
  // Edit email listeners
  if (editEmailToggle) {
    editEmailToggle.addEventListener('click', toggleEmailEdit);
  }
  if (saveEmailBtn) {
    saveEmailBtn.addEventListener('click', saveEmailEdit);
  }
  if (cancelEmailBtn) {
    cancelEmailBtn.addEventListener('click', cancelEmailEdit);
  }
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => handleFilterChange(tab.dataset.status));
  });
  
  // Status buttons in modal
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => updateEmailStatus(btn.dataset.status));
  });
  
  // Close modal when clicking backdrop
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeEmailModal);
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && emailModal.classList.contains('active')) {
      closeEmailModal();
    }
  });
  
  // Initialize icons
  refreshIcons();
  
  // Check if running in extension context
  if (typeof chrome !== 'undefined' && chrome.storage) {
    checkExtensionAuth();
  } else {
    checkLocalStorageAuth();
  }
}

/**
 * Check authentication from Chrome extension storage
 */
async function checkExtensionAuth() {
  try {
    const result = await chrome.storage.local.get(['auth_token', 'user_email']);
    if (result.auth_token) {
      authToken = result.auth_token;
      userEmail = result.user_email;
      showMainContent();
      loadEmailHistory();
    } else {
      showAuthSection();
    }
  } catch (error) {
    console.error('Error checking extension auth:', error);
    showAuthSection();
  }
}

/**
 * Check authentication from localStorage
 */
function checkLocalStorageAuth() {
  authToken = localStorage.getItem('auth_token');
  userEmail = localStorage.getItem('user_email');
  
  if (authToken) {
    showMainContent();
    loadEmailHistory();
  } else {
    showAuthSection();
  }
}

/**
 * Show auth section
 */
function showAuthSection() {
  authSection.style.display = 'flex';
  mainContent.style.display = 'none';
  refreshIcons();
}

/**
 * Show main content
 */
function showMainContent() {
  authSection.style.display = 'none';
  mainContent.style.display = 'block';
  userEmailDisplay.textContent = userEmail;
  refreshIcons();
  
  // Check if user profile is complete
  checkUserProfile();
}

/**
 * Check if user profile is complete and show banner if not
 */
async function checkUserProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      userProfileComplete = profile.isComplete;
      
      if (profileBanner) {
        profileBanner.style.display = profile.isComplete ? 'none' : 'flex';
      }
    }
  } catch (error) {
    console.error('Error checking profile:', error);
    // Don't show banner on error
    if (profileBanner) {
      profileBanner.style.display = 'none';
    }
  }
}

/**
 * Placeholder for icon refresh (icons are now inline SVGs)
 */
function refreshIcons() {
  // Icons are now inline SVGs, no refresh needed
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  
  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      userEmail = data.email;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          auth_token: authToken,
          user_email: userEmail,
          user_id: data.userId
        });
      } else {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_email', userEmail);
        localStorage.setItem('user_id', data.userId);
      }
      
      showMainContent();
      loadEmailHistory();
    } else {
      showAuthError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showAuthError('Network error. Please ensure the API is running.');
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.remove(['auth_token', 'user_email', 'user_id']);
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
  }
  
  // Clear all state
  authToken = null;
  userEmail = null;
  allEmails = [];
  currentEmailId = null;
  currentEmail = null;
  
  // Clear the user email display in header
  if (userEmailDisplay) {
    userEmailDisplay.textContent = '';
  }
  
  showAuthSection();
}

/**
 * Load email history from API
 */
async function loadEmailHistory() {
  try {
    loadingIndicator.style.display = 'block';
    emailHistory.style.display = 'none';
    emptyState.style.display = 'none';
    
    const url = currentFilter === 'all' 
      ? `${API_BASE_URL}/history`
      : `${API_BASE_URL}/history?status=${currentFilter}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load email history');
    }
    
    const data = await response.json();
    allEmails = data;
    
    updateStats(data);
    displayEmailHistory(data);
    
  } catch (error) {
    console.error('Error loading email history:', error);
    showError('Failed to load email history');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Update statistics
 */
function updateStats(emails) {
  totalEmailsEl.textContent = emails.length;
  workedCountEl.textContent = emails.filter(e => e.workedStatus === 1).length;
  didntWorkCountEl.textContent = emails.filter(e => e.workedStatus === 2).length;
  unknownCountEl.textContent = emails.filter(e => e.workedStatus === 0).length;
}

/**
 * Display email history in table
 */
function displayEmailHistory(emails) {
  if (emails.length === 0) {
    emptyState.style.display = 'block';
    emailHistory.style.display = 'none';
    refreshIcons();
    return;
  }
  
  emptyState.style.display = 'none';
  emailHistory.style.display = 'block';
  
  emailTableBody.innerHTML = '';
  
  emails.forEach(email => {
    const row = createEmailRow(email);
    emailTableBody.appendChild(row);
  });
  
  // Refresh icons after adding new elements
  refreshIcons();
}

/**
 * Extract name from LinkedIn profile data
 */
function extractNameFromProfile(profileData) {
  if (!profileData) return '—';
  
  const lines = profileData.split('\n').filter(l => l.trim());
  
  // Check first few lines for a name-like string
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Skip lines that look like badges or metadata
    if (line.includes('badge') || line.includes('degree') || line.length > 50) continue;
    if (line.includes('has a') || line.includes('account')) continue;
    
    // Check if line looks like a name (2-4 capitalized words)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const looksLikeName = words.every(w => /^[A-Z][a-zA-Z'-]*$/.test(w));
      if (looksLikeName) {
        return line;
      }
    }
  }
  
  return '—';
}

/**
 * Extract company from LinkedIn profile data
 */
function extractCompanyFromProfile(profileData) {
  if (!profileData) return '—';
  
  const patterns = [
    /(?:@|at)\s+([A-Za-z0-9][A-Za-z0-9\s&.,'-]+?)(?:\s*[|\n]|$)/i,
    /(?:Software Engineer|Developer|Manager|Director|Engineer|Analyst|Designer|Consultant|Full Stack)\s+(?:@|at)\s+([A-Za-z0-9][A-Za-z0-9\s&.,'-]+?)(?:\s*[|\n]|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = profileData.match(pattern);
    if (match && match[1]) {
      let company = match[1].trim().replace(/[.,]+$/, '');
      if (company.length > 25) {
        company = company.substring(0, 25) + '...';
      }
      return company;
    }
  }
  
  return '—';
}

/**
 * Create a table row for an email
 */
function createEmailRow(email) {
  const row = document.createElement('tr');
  row.dataset.id = email.id;
  
  const date = new Date(email.createdAt).toLocaleDateString();
  const name = extractNameFromProfile(email.linkedInProfileData);
  const company = extractCompanyFromProfile(email.linkedInProfileData);
  const emailPreview = truncateText(email.generatedEmail, 40);
  const statusText = getStatusText(email.workedStatus);
  const statusClass = getStatusClass(email.workedStatus);
  const statusIcon = getStatusIcon(email.workedStatus);
  
  row.innerHTML = `
    <td>${date}</td>
    <td><span class="cell-name">${escapeHtml(name)}</span></td>
    <td>
      <div class="cell-editable">
        <span class="cell-company" data-field="company">${escapeHtml(company)}</span>
        <button class="edit-cell-btn" data-field="company" title="Edit Company">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
        </button>
      </div>
    </td>
    <td><span class="cell-preview">${escapeHtml(emailPreview)}</span></td>
    <td>
      <span class="status-badge ${statusClass}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${getStatusSvgPath(email.workedStatus)}
        </svg>
        ${statusText}
      </span>
    </td>
    <td>
      <div class="table-actions">
        <button class="action-btn view" data-id="${email.id}" title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="action-btn copy" title="Copy Email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="action-btn delete" data-id="${email.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </td>
  `;
  
  // Add event listeners
  row.querySelector('.action-btn.view').addEventListener('click', () => showEmailDetail(email.id));
  row.querySelector('.action-btn.copy').addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(email.generatedEmail);
  });
  row.querySelector('.action-btn.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteEmailDirect(email.id);
  });
  
  // Company edit button
  const editCompanyBtn = row.querySelector('.edit-cell-btn[data-field="company"]');
  if (editCompanyBtn) {
    editCompanyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startInlineEdit(row, 'company', company, email.id);
    });
  }
  
  return row;
}

/**
 * Get SVG path for status icon
 */
function getStatusSvgPath(status) {
  switch(status) {
    case 1: // Worked - check circle
      return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>';
    case 2: // Didn't work - x circle
      return '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
    default: // Unknown - help circle
      return '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
  }
}

/**
 * Start inline editing for a cell
 */
function startInlineEdit(row, field, currentValue, emailId) {
  const cellSpan = row.querySelector(`.cell-${field}`);
  const editBtn = row.querySelector(`.edit-cell-btn[data-field="${field}"]`);
  
  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell-edit-input';
  input.value = currentValue === '—' ? '' : currentValue;
  
  // Hide span and button, show input
  cellSpan.style.display = 'none';
  editBtn.style.display = 'none';
  cellSpan.parentNode.insertBefore(input, cellSpan);
  input.focus();
  input.select();
  
  // Handle save on Enter or blur
  const saveEdit = async () => {
    const newValue = input.value.trim() || '—';
    input.remove();
    cellSpan.style.display = '';
    editBtn.style.display = '';
    cellSpan.textContent = newValue;
    
    // Save to local state (we don't have a backend endpoint for this, so it's UI only)
    showToast('Company updated');
  };
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      input.remove();
      cellSpan.style.display = '';
      editBtn.style.display = '';
    }
  });
  
  input.addEventListener('blur', saveEdit);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get status icon name
 */
function getStatusIcon(status) {
  switch(status) {
    case 0: return 'help-circle';
    case 1: return 'check-circle';
    case 2: return 'x-circle';
    default: return 'help-circle';
  }
}

/**
 * Copy text to clipboard with feedback
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Email copied to clipboard!');
  } catch (error) {
    console.error('Copy error:', error);
    showToast('Failed to copy', 'error');
  }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#10B981' : '#EF4444'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Delete email directly from table
 */
async function deleteEmailDirect(emailId) {
  if (!confirm('Are you sure you want to delete this email?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/history/${emailId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
    
    showToast('Email deleted');
    loadEmailHistory();
    
  } catch (error) {
    console.error('Error deleting email:', error);
    showToast('Failed to delete', 'error');
  }
}

/**
 * Show email detail modal
 */
async function showEmailDetail(emailId) {
  currentEmailId = emailId;
  isEditingEmail = false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/history/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load email details');
    }
    
    currentEmail = await response.json();
    
    modalProfileData.textContent = currentEmail.linkedInProfileData;
    modalEmail.textContent = currentEmail.generatedEmail;
    modalEmailEdit.value = currentEmail.generatedEmail;
    modalCreatedAt.textContent = new Date(currentEmail.createdAt).toLocaleString();
    modalUpdatedAt.textContent = new Date(currentEmail.updatedAt).toLocaleString();
    
    // Reset edit state
    modalEmail.style.display = 'block';
    modalEmailEdit.style.display = 'none';
    editEmailActions.style.display = 'none';
    
    emailModal.classList.add('active');
    refreshIcons();
    
  } catch (error) {
    console.error('Error loading email details:', error);
    showToast('Failed to load email details', 'error');
  }
}

/**
 * Toggle email edit mode
 */
function toggleEmailEdit() {
  isEditingEmail = !isEditingEmail;
  
  if (isEditingEmail) {
    modalEmail.style.display = 'none';
    modalEmailEdit.style.display = 'block';
    editEmailActions.style.display = 'flex';
    modalEmailEdit.focus();
  } else {
    modalEmail.style.display = 'block';
    modalEmailEdit.style.display = 'none';
    editEmailActions.style.display = 'none';
  }
}

/**
 * Save email edit
 */
async function saveEmailEdit() {
  const newEmailText = modalEmailEdit.value.trim();
  
  if (!newEmailText) {
    showToast('Email cannot be empty', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/history/${currentEmailId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        generatedEmail: newEmailText
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save email');
    }
    
    // Update display
    modalEmail.textContent = newEmailText;
    currentEmail.generatedEmail = newEmailText;
    
    // Exit edit mode
    isEditingEmail = false;
    modalEmail.style.display = 'block';
    modalEmailEdit.style.display = 'none';
    editEmailActions.style.display = 'none';
    
    showToast('Email saved successfully');
    loadEmailHistory(); // Refresh the table
    
  } catch (error) {
    console.error('Error saving email:', error);
    showToast('Failed to save email', 'error');
  }
}

/**
 * Cancel email edit
 */
function cancelEmailEdit() {
  isEditingEmail = false;
  modalEmailEdit.value = currentEmail.generatedEmail;
  modalEmail.style.display = 'block';
  modalEmailEdit.style.display = 'none';
  editEmailActions.style.display = 'none';
}

/**
 * Close email modal
 */
function closeEmailModal() {
  emailModal.classList.remove('active');
  currentEmailId = null;
  currentEmail = null;
  isEditingEmail = false;
}

/**
 * Update email status
 */
async function updateEmailStatus(status) {
  if (!currentEmailId) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/history/${currentEmailId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ workedStatus: parseInt(status) })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    showToast('Status updated');
    closeEmailModal();
    loadEmailHistory();
    
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status', 'error');
  }
}

/**
 * Copy email to clipboard from modal
 */
async function copyEmailToClipboard() {
  const text = isEditingEmail ? modalEmailEdit.value : modalEmail.textContent;
  await copyToClipboard(text);
}

/**
 * Delete email from modal
 */
async function deleteEmail() {
  if (!currentEmailId) return;
  
  if (!confirm('Are you sure you want to delete this email?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/history/${currentEmailId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
    
    showToast('Email deleted');
    closeEmailModal();
    loadEmailHistory();
    
  } catch (error) {
    console.error('Error deleting email:', error);
    showToast('Failed to delete', 'error');
  }
}

/**
 * Handle filter change
 */
function handleFilterChange(status) {
  currentFilter = status;
  
  filterTabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.status === status) {
      tab.classList.add('active');
    }
  });
  
  loadEmailHistory();
}

/**
 * Get status text
 */
function getStatusText(status) {
  switch(status) {
    case 0: return 'Unknown';
    case 1: return 'Worked';
    case 2: return "Didn't Work";
    default: return 'Unknown';
  }
}

/**
 * Get status CSS class
 */
function getStatusClass(status) {
  switch(status) {
    case 0: return 'status-unknown';
    case 1: return 'status-worked';
    case 2: return 'status-didnt-work';
    default: return 'status-unknown';
  }
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Show auth error
 */
function showAuthError(message) {
  authError.textContent = message;
  authError.style.display = 'block';
}

/**
 * Show error
 */
function showError(message) {
  showToast(message, 'error');
}
