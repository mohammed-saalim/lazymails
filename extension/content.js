/**
 * Content script that runs on LinkedIn profile pages
 * Extracts profile data and makes it available to the popup
 */

(function() {
  'use strict';

  /**
   * Checks if the current page is a LinkedIn profile page
   * @returns {boolean} True if on a profile page
   */
  function isProfilePage() {
    const url = window.location.href;
    return url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/');
  }

  /**
   * Extracts text content from a selector, handling cases where element might not exist
   * @param {string} selector - CSS selector
   * @returns {string} Extracted text or empty string
   */
  function extractText(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  /**
   * Extracts all visible text from multiple sections
   * @param {string[]} selectors - Array of CSS selectors
   * @returns {string} Combined text from all sections
   */
  function extractTextFromSections(selectors) {
    let text = '';
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const elementText = element.textContent.trim();
        if (elementText) {
          text += elementText + '\n\n';
        }
      });
    });
    return text;
  }

  /**
   * Scrolls down the page to load all lazy-loaded content
   */
  async function scrollToLoadContent() {
    console.log('Scrolling to load all content...');
    
    const scrollStep = 800;
    const scrollDelay = 300;
    const maxScrolls = 15;
    
    for (let i = 0; i < maxScrolls; i++) {
      window.scrollBy(0, scrollStep);
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
    }
    
    // Scroll back to top
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Finished scrolling, content should be loaded');
  }

  /**
   * Extracts comprehensive profile data from the LinkedIn page
   * Simple approach: scroll to load content, then copy all visible text
   * @returns {object} Profile data object
   */
  async function extractProfileData() {
    console.log('=== LINKEDIN PROFILE EXTRACTION ===');
    
    // First, scroll down to load all lazy-loaded content
    await scrollToLoadContent();
    
    // Now get all the text
    let mainSection = document.querySelector('main');
    
    if (!mainSection) {
      mainSection = document.querySelector('.scaffold-layout__main') || 
                    document.querySelector('#main-content') ||
                    document.body;
    }
    
    // Get ALL visible text from the main section
    let profileText = '';
    if (mainSection) {
      profileText = mainSection.innerText || mainSection.textContent;
    }
    
    // Clean up the text (remove excessive whitespace)
    profileText = profileText
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    // Try to extract name
    const name = extractText('h1.text-heading-xlarge') || 
                 extractText('h1') ||
                 '';
    
    // Try to extract headline
    const headline = extractText('.text-body-medium') || '';
    
    console.log('Extraction complete');
    console.log('Name found:', name ? 'Yes' : 'No');
    console.log('Headline found:', headline ? 'Yes' : 'No');
    console.log('Total text length:', profileText.length, 'characters');
    console.log('=== END EXTRACTION ===');
    
    return {
      url: window.location.href,
      name: name,
      headline: headline,
      fullText: profileText,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Listens for messages from the popup or background script
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProfile') {
      // Handle async extraction
      (async () => {
        try {
          const profileData = await extractProfileData();
          sendResponse({ success: true, data: profileData });
        } catch (error) {
          console.error('Error extracting profile:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // Required for async sendResponse
    } else if (request.action === 'isProfilePage') {
      sendResponse({ success: true, isProfilePage: isProfilePage() });
    }
    return true; // Required for async sendResponse
  });

  // Log when on LinkedIn profile page
  if (isProfilePage()) {
    console.log('On LinkedIn profile page - ready for extraction');
  }

  console.log('LinkedIn Cold Email Generator: Content script loaded');
})();

