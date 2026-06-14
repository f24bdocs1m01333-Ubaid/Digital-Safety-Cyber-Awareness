/**
 * app.js - CyberSafe User Panel JavaScript
 * Implements GET, POST, debounced search, filtering, and form validation.
 */

const API_URL = 'http://localhost:3000/threats';

// DOM Elements
const threatsContainer = document.getElementById('threats-container');
const categoryFilter = document.getElementById('category-filter');
const searchInput = document.getElementById('search-input');

const reportForm = document.getElementById('report-form');
const reportTitle = document.getElementById('report-title');
const reportCategory = document.getElementById('report-category');
const reportSeverity = document.getElementById('report-severity');
const reportDate = document.getElementById('report-date');
const reportDescription = document.getElementById('report-description');
const reportName = document.getElementById('report-name');
const reportEmail = document.getElementById('report-email');
const formStatus = document.getElementById('form-status');
const btnSubmitThreat = document.getElementById('btn-submit-threat');

// Inline Error Elements
const titleError = document.getElementById('title-error');
const categoryError = document.getElementById('category-error');
const severityError = document.getElementById('severity-error');
const dateError = document.getElementById('date-error');
const descriptionError = document.getElementById('description-error');
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');

// --- Helper Functions ---

/**
 * Debounce function to limit the execution rate of a function.
 * Essential for the search bar input handler to prevent flooding the server.
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Helper to display validation error messages in the DOM.
 */
function setFieldError(inputElement, errorElement, errorMessage) {
  if (errorMessage) {
    errorElement.textContent = errorMessage;
    errorElement.classList.add('active');
    inputElement.style.borderColor = 'var(--danger)';
  } else {
    errorElement.textContent = '';
    errorElement.classList.remove('active');
    inputElement.style.borderColor = 'var(--border)';
  }
}

/**
 * Validates a single input field.
 */
function validateField(input) {
  let errorMessage = '';
  const val = input.value.trim();

  if (input === reportTitle) {
    if (!val) errorMessage = 'Threat title is required.';
    else if (val.length < 5) errorMessage = 'Title must be at least 5 characters.';
  } 
  
  else if (input === reportCategory) {
    if (!val) errorMessage = 'Please select a threat category.';
  } 
  
  else if (input === reportSeverity) {
    if (!val) errorMessage = 'Please select a severity level.';
  } 
  
  else if (input === reportDate) {
    if (!val) {
      errorMessage = 'Date spotted is required.';
    } else {
      const selectedDate = new Date(val);
      const today = new Date();
      // Reset hours to allow selecting today
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errorMessage = 'Date spotted cannot be in the future.';
      }
    }
  } 
  
  else if (input === reportDescription) {
    if (!val) errorMessage = 'Detailed description is required.';
    else if (val.length < 20) errorMessage = 'Description must be at least 20 characters.';
  } 
  
  else if (input === reportName) {
    if (!val) errorMessage = 'Your name is required.';
    else if (val.length < 2) errorMessage = 'Name must be at least 2 characters.';
  } 
  
  else if (input === reportEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) errorMessage = 'Email address is required.';
    else if (!emailRegex.test(val)) errorMessage = 'Please enter a valid email address.';
  }

  // Bind error selector based on the field
  let errorEl;
  if (input === reportTitle) errorEl = titleError;
  else if (input === reportCategory) errorEl = categoryError;
  else if (input === reportSeverity) errorEl = severityError;
  else if (input === reportDate) errorEl = dateError;
  else if (input === reportDescription) errorEl = descriptionError;
  else if (input === reportName) errorEl = nameError;
  else if (input === reportEmail) errorEl = emailError;

  setFieldError(input, errorEl, errorMessage);
  return errorMessage === '';
}

/**
 * Validates all fields in the form.
 */
function validateForm() {
  const inputs = [
    reportTitle,
    reportCategory,
    reportSeverity,
    reportDate,
    reportDescription,
    reportName,
    reportEmail
  ];
  
  let isFormValid = true;
  inputs.forEach(input => {
    const isFieldValid = validateField(input);
    if (!isFieldValid) {
      isFormValid = false;
    }
  });
  return isFormValid;
}

// --- Fetch and Render Operations ---

/**
 * Shows loading skeleton structure in the container.
 */
function showLoading() {
  threatsContainer.innerHTML = `
    <div class="loading-skeleton">
      <div class="spinner"></div>
      <p style="color: var(--text-sub); font-size: 0.95rem;">Scanning active threats feed...</p>
    </div>
    <div class="pulse-card"></div>
    <div class="pulse-card"></div>
  `;
}

/**
 * Shows server error container if JSON Server is down or returns error.
 */
function showErrorState(errorMsg) {
  threatsContainer.innerHTML = `
    <div class="error-state">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
          <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T208-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q167 0 283.5-116.5T800-480q0-167-116.5-283.5T480-800q-167 0-283.5 116.5T80-480q0 167 116.5 283.5T480-160Zm0-320Z"/>
        </svg>
      </div>
      <h3>Threat Database Unreachable</h3>
      <p>${errorMsg}. Please verify that the local backend JSON Server is active by running <code>npx json-server --watch db.json</code> inside the project root.</p>
    </div>
  `;
}

/**
 * Renders empty state when search filters return no entries.
 */
function showEmptyState() {
  threatsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
          <path d="M480-417q-15 0-25-10t-10-25q0-15 10-25t25-10q15 0 25 10t10 25q0 15-10 25t-25 10Zm-80 177h160v-80H400v80Zm80 200q-83 0-156-31.5T197-167q-54-54-85.5-127T80-450q0-83 31.5-156T208-733q54-54 127-85.5T480-850q83 0 156 31.5T763-733q54 54 85.5 127T880-450q0 83-31.5 156T763-167q-54 54-127 85.5T480-40Zm0-80q136 0 233-97t97-233q0-136-97-233t-233-97q-136 0-233 97t-97 233q0 136 97 233t233 97Zm0-330Z"/>
        </svg>
      </div>
      <h3>No Active Threats Spotted</h3>
      <p>No reports match your current search query or category filter. Try clearing filters or submit a new threat to report it.</p>
    </div>
  `;
}

/**
 * Fetches threat listings from JSON Server using GET method.
 * Handles parameters for category filters and debounced query searches.
 */
async function fetchThreats() {
  showLoading();
  
  const category = categoryFilter.value;
  const searchVal = searchInput.value.trim();
  
  let fetchUrl = API_URL;
  const queryParams = [];
  
  if (category) {
    queryParams.push(`category=${encodeURIComponent(category)}`);
  }
  
  if (searchVal) {
    // JSON Server 'q' parameter searches all text fields.
    queryParams.push(`q=${encodeURIComponent(searchVal)}`);
  }
  
  if (queryParams.length > 0) {
    fetchUrl += `?${queryParams.join('&')}`;
  }

  try {
    const res = await fetch(fetchUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch database. Status Code: ${res.status}`);
    }
    
    const threats = await res.json();
    renderThreats(threats);
  } catch (error) {
    showErrorState(error.message);
  }
}

/**
 * Builds threat cards and inserts them into the DOM threats-container.
 */
function renderThreats(threats) {
  if (threats.length === 0) {
    showEmptyState();
    return;
  }
  
  threatsContainer.innerHTML = '';
  
  threats.forEach(threat => {
    // Check status values to map CSS class
    let statusClass = 'badge-status-review';
    if (threat.status === 'Verified Alert') statusClass = 'badge-status-verified';
    if (threat.status === 'Resolved') statusClass = 'badge-status-resolved';

    // Map severity to severity badge styles
    const severityClass = `badge-severity-${threat.severity.toLowerCase()}`;

    // Create container card
    const card = document.createElement('article');
    card.className = 'threat-card';
    card.id = `threat-${threat.id}`;
    
    // Format date nicely
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateFormatted = new Date(threat.dateSpotted).toLocaleDateString('en-US', options);

    card.innerHTML = `
      <div class="threat-header">
        <h3 class="threat-title">${escapeHTML(threat.title)}</h3>
        <div class="badge-group">
          <span class="badge ${severityClass}">${threat.severity}</span>
          <span class="badge badge-category">${escapeHTML(threat.category)}</span>
          <span class="badge ${statusClass}">${threat.status}</span>
        </div>
      </div>
      <p class="threat-desc">${escapeHTML(threat.description)}</p>
      <div class="threat-footer">
        <span class="threat-date">
          <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" style="vertical-align: middle;">
            <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T780-80H200Zm0-80h580v-400H200v400Zm0-480h580v-80H200v80Zm0 0v-80 80Z"/>
          </svg>
          Spotted: ${dateFormatted}
        </span>
        <span class="threat-reporter">Reported by: ${escapeHTML(threat.reporterName)}</span>
      </div>
    `;
    
    threatsContainer.appendChild(card);
  });
}

/**
 * Escapes user input to protect against XSS injections.
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Submit Threat Operation (POST) ---

/**
 * Form Submission handler
 */
async function handleSubmit(e) {
  e.preventDefault();
  
  // Clean previous global status messages
  formStatus.style.display = 'none';
  formStatus.className = 'status-msg';

  // Perform client-side validations
  if (!validateForm()) {
    formStatus.textContent = 'Please correct the highlighted fields before submitting.';
    formStatus.classList.add('status-error');
    formStatus.style.display = 'flex';
    return;
  }

  // Package field inputs
  const threatData = {
    title: reportTitle.value.trim(),
    category: reportCategory.value,
    severity: reportSeverity.value,
    dateSpotted: reportDate.value,
    description: reportDescription.value.trim(),
    reporterName: reportName.value.trim(),
    reporterEmail: reportEmail.value.trim(),
    status: 'Under Review' // Default status for new public reports
  };

  btnSubmitThreat.disabled = true;
  btnSubmitThreat.innerHTML = '<span class="spinner" style="width:16px; height:16px; margin:0; border-width:2px; display:inline-block; vertical-align:middle; margin-right:6px;"></span> Submitting report...';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(threatData)
    });

    if (!response.ok) {
      throw new Error(`Failed to save report. Server returned status: ${response.status}`);
    }

    // Success response
    formStatus.textContent = 'Threat reported successfully! Thank you for raising digital safety awareness.';
    formStatus.classList.add('status-success');
    formStatus.style.display = 'flex';
    
    // Clear the form
    reportForm.reset();
    
    // Refresh lists
    await fetchThreats();

    // Auto-hide success alert
    setTimeout(() => {
      formStatus.style.display = 'none';
    }, 5000);

  } catch (error) {
    formStatus.textContent = `Error: ${error.message}`;
    formStatus.classList.add('status-error');
    formStatus.style.display = 'flex';
  } finally {
    btnSubmitThreat.disabled = false;
    btnSubmitThreat.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
        <path d="M440-160v-326L336-382l-56-58 200-200 200 200-56 58-104-104v326h-80ZM160-600v-120q0-33 23.5-56.5T240-800h480q33 0 56.5 23.5T800-720v120h-80v-120H240v120h-80Z"/>
      </svg>
      Submit Threat Alert
    `;
  }
}

// --- Event Listeners ---

// Realtime validation trigger on input fields blur & input events
const formInputs = [
  reportTitle,
  reportCategory,
  reportSeverity,
  reportDate,
  reportDescription,
  reportName,
  reportEmail
];

formInputs.forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    // Only clear validation error if user fixes it
    validateField(input);
  });
});

// Category Filter Change
categoryFilter.addEventListener('change', () => {
  fetchThreats();
});

// Debounced Search Input
const handleSearchInput = debounce(() => {
  fetchThreats();
}, 300);

searchInput.addEventListener('input', handleSearchInput);

// Form Submit Event
reportForm.addEventListener('submit', handleSubmit);

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  fetchThreats();
});
