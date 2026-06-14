/**
 * admin.js - CyberSafe Admin Panel JavaScript
 * Handles CRUD operations, dashboard stats, custom dialogs, and validation.
 */

const API_URL = 'http://localhost:3000/threats';

// State
let allThreats = [];
let deleteTargetId = null;

// DOM Elements
const adminTableTarget = document.getElementById('admin-table-target');
const adminCategoryFilter = document.getElementById('admin-category-filter');
const adminSearchInput = document.getElementById('admin-search-input');
const adminGlobalStatus = document.getElementById('admin-global-status');

// Stat Elements
const statTotalValue = document.getElementById('stat-total-value');
const statCriticalValue = document.getElementById('stat-critical-value');
const statCategoryValue = document.getElementById('stat-category-value');

// Dialog Elements - Delete
const deleteDialog = document.getElementById('delete-dialog');
const deleteThreatTitle = document.getElementById('delete-threat-title');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Dialog Elements - Edit
const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editTitle = document.getElementById('edit-title');
const editCategory = document.getElementById('edit-category');
const editSeverity = document.getElementById('edit-severity');
const editStatus = document.getElementById('edit-status');
const editDate = document.getElementById('edit-date');
const editDescription = document.getElementById('edit-description');
const editName = document.getElementById('edit-name');
const editEmail = document.getElementById('edit-email');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSubmitEdit = document.getElementById('btn-submit-edit');

// Inline Error Elements (Edit Form)
const editTitleError = document.getElementById('edit-title-error');
const editCategoryError = document.getElementById('edit-category-error');
const editSeverityError = document.getElementById('edit-severity-error');
const editStatusError = document.getElementById('edit-status-error');
const editDateError = document.getElementById('edit-date-error');
const editDescriptionError = document.getElementById('edit-description-error');
const editNameError = document.getElementById('edit-name-error');
const editEmailError = document.getElementById('edit-email-error');

// --- Helper Functions ---

/**
 * Debounce helper to limit search fetch intervals.
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
 * Escapes HTML characters to prevent XSS.
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Displays status feedback messages in the admin panel.
 */
function showAdminStatus(message, isSuccess = true) {
  adminGlobalStatus.className = `status-msg ${isSuccess ? 'status-success' : 'status-error'}`;
  adminGlobalStatus.textContent = message;
  adminGlobalStatus.style.display = 'flex';
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    adminGlobalStatus.style.display = 'none';
  }, 4000);
}

// --- Dynamic Stats Computation ---

/**
 * Calculates and updates dashboard stats widgets dynamically from threat entries array.
 * Requirement: At least 3 summary statistics.
 */
function calculateStats(threats) {
  const total = threats.length;
  statTotalValue.textContent = total;

  if (total === 0) {
    statCriticalValue.textContent = '0%';
    statCategoryValue.textContent = 'N/A';
    return;
  }

  // Stat 2: High/Critical severity percentage
  const criticalOrHighCount = threats.filter(t => t.severity === 'High' || t.severity === 'Critical').length;
  const percentage = Math.round((criticalOrHighCount / total) * 100);
  statCriticalValue.textContent = `${percentage}%`;

  // Stat 3: Most targeted category (Top Vector)
  const categoryFreq = {};
  threats.forEach(t => {
    categoryFreq[t.category] = (categoryFreq[t.category] || 0) + 1;
  });

  let maxCategory = 'N/A';
  let maxCount = 0;
  for (const cat in categoryFreq) {
    if (categoryFreq[cat] > maxCount) {
      maxCount = categoryFreq[cat];
      maxCategory = cat;
    }
  }
  statCategoryValue.textContent = maxCategory;
}

// --- Inline Form Validation (Edit Form) ---

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

function validateEditField(input) {
  let errorMessage = '';
  const val = input.value.trim();

  if (input === editTitle) {
    if (!val) errorMessage = 'Title is required.';
    else if (val.length < 5) errorMessage = 'Title must be at least 5 characters.';
  } 
  
  else if (input === editCategory) {
    if (!val) errorMessage = 'Category is required.';
  } 
  
  else if (input === editSeverity) {
    if (!val) errorMessage = 'Severity is required.';
  }

  else if (input === editStatus) {
    if (!val) errorMessage = 'Status is required.';
  }
  
  else if (input === editDate) {
    if (!val) {
      errorMessage = 'Date spotted is required.';
    } else {
      const selectedDate = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errorMessage = 'Date spotted cannot be in the future.';
      }
    }
  } 
  
  else if (input === editDescription) {
    if (!val) errorMessage = 'Description is required.';
    else if (val.length < 20) errorMessage = 'Description must be at least 20 characters.';
  } 
  
  else if (input === editName) {
    if (!val) errorMessage = 'Reporter name is required.';
    else if (val.length < 2) errorMessage = 'Name must be at least 2 characters.';
  } 
  
  else if (input === editEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) errorMessage = 'Reporter email is required.';
    else if (!emailRegex.test(val)) errorMessage = 'Please enter a valid email address.';
  }

  let errorEl;
  if (input === editTitle) errorEl = editTitleError;
  else if (input === editCategory) errorEl = editCategoryError;
  else if (input === editSeverity) errorEl = editSeverityError;
  else if (input === editStatus) errorEl = editStatusError;
  else if (input === editDate) errorEl = editDateError;
  else if (input === editDescription) errorEl = editDescriptionError;
  else if (input === editName) errorEl = editNameError;
  else if (input === editEmail) errorEl = editEmailError;

  setFieldError(input, errorEl, errorMessage);
  return errorMessage === '';
}

function validateEditForm() {
  const inputs = [
    editTitle,
    editCategory,
    editSeverity,
    editStatus,
    editDate,
    editDescription,
    editName,
    editEmail
  ];
  
  let isFormValid = true;
  inputs.forEach(input => {
    const isFieldValid = validateEditField(input);
    if (!isFieldValid) {
      isFormValid = false;
    }
  });
  return isFormValid;
}

// --- Fetch and Table Rendering Operations ---

function showTableLoading() {
  adminTableTarget.innerHTML = `
    <div class="loading-skeleton">
      <div class="spinner"></div>
      <p style="color: var(--text-sub); font-size: 0.95rem;">Refreshing admin metrics database...</p>
    </div>
  `;
}

function showTableError(errorMsg) {
  adminTableTarget.innerHTML = `
    <div class="error-state">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
          <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T208-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q167 0 283.5-116.5T800-480q0-167-116.5-283.5T480-800q-167 0-283.5 116.5T80-480q0 167 116.5 283.5T480-160Zm0-320Z"/>
        </svg>
      </div>
      <h3>Control database unreachable</h3>
      <p>${errorMsg}. Check JSON Server status.</p>
    </div>
  `;
}

function showTableEmpty() {
  adminTableTarget.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
          <path d="M480-417q-15 0-25-10t-10-25q0-15 10-25t25-10q15 0 25 10t10 25q0 15-10 25t-25 10Zm-80 177h160v-80H400v80Zm80 200q-83 0-156-31.5T197-167q-54-54-85.5-127T80-450q0-83 31.5-156T208-733q54-54 127-85.5T480-850q83 0 156 31.5T763-733q54 54 85.5 127T880-450q0 83-31.5 156T763-167q-54 54-127 85.5T480-40Zm0-80q136 0 233-97t97-233q0-136-97-233t-233-97q-136 0-233 97t-97 233q0 136 97 233t233 97Zm0-330Z"/>
        </svg>
      </div>
      <h3>No Management Entries Found</h3>
      <p>No threat entries match the filters. Try a different query.</p>
    </div>
  `;
}

/**
 * Loads all threats and builds statistics.
 * We fetch all threats to calculate statistics globally, then do filtering.
 */
async function fetchAdminThreats() {
  showTableLoading();
  
  const category = adminCategoryFilter.value;
  const searchVal = adminSearchInput.value.trim().toLowerCase();
  
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Failed to load database. Server status: ${res.status}`);
    }
    
    allThreats = await res.json();
    
    // Always compute statistics on the full dataset
    calculateStats(allThreats);
    
    // Filter locally to avoid redundant REST requests for stats
    let filtered = [...allThreats];
    
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (searchVal) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchVal) ||
        t.description.toLowerCase().includes(searchVal) ||
        t.reporterEmail.toLowerCase().includes(searchVal) ||
        t.reporterName.toLowerCase().includes(searchVal)
      );
    }
    
    renderAdminTable(filtered);
  } catch (error) {
    showTableError(error.message);
  }
}

/**
 * Render lists as an admin management table.
 */
function renderAdminTable(threats) {
  if (threats.length === 0) {
    showTableEmpty();
    return;
  }

  // Create table element
  const container = document.createElement('div');
  container.className = 'admin-table-container';
  
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Threat Details</th>
          <th>Category</th>
          <th>Severity</th>
          <th>Spotted Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  threats.forEach(threat => {
    let statusClass = 'badge-status-review';
    if (threat.status === 'Verified Alert') statusClass = 'badge-status-verified';
    if (threat.status === 'Resolved') statusClass = 'badge-status-resolved';

    const severityClass = `badge-severity-${threat.severity.toLowerCase()}`;

    tableHTML += `
      <tr id="row-${threat.id}">
        <td>
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.2rem;">
            ${escapeHTML(threat.title)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Reported by: ${escapeHTML(threat.reporterName)} (${escapeHTML(threat.reporterEmail)})
          </div>
        </td>
        <td><span class="badge badge-category">${escapeHTML(threat.category)}</span></td>
        <td><span class="badge ${severityClass}">${threat.severity}</span></td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${threat.dateSpotted}</td>
        <td><span class="badge ${statusClass}">${threat.status}</span></td>
        <td>
          <div class="table-actions">
            <!-- Edit Button -->
            <button class="icon-btn edit-btn" onclick="openEditModal('${threat.id}')" title="Edit Alert" aria-label="Edit Alert">
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px">
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
              </svg>
            </button>
            <!-- Delete Button -->
            <button class="icon-btn delete-btn" onclick="openDeleteModal('${threat.id}', \`${escapeJSString(threat.title)}\`)" title="Delete Alert" aria-label="Delete Alert">
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
  adminTableTarget.innerHTML = '';
  adminTableTarget.appendChild(container);
}

/**
 * Escapes single quotes for use in dynamically generated inline JavaScript function parameters.
 */
function escapeJSString(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// --- CRUD Actions: DELETE Flow ---

/**
 * Triggered by edit/delete button clicks. Open the confirm dialog.
 */
window.openDeleteModal = function(id, title) {
  deleteTargetId = id;
  deleteThreatTitle.textContent = title;
  deleteDialog.showModal();
};

btnCancelDelete.addEventListener('click', () => {
  deleteDialog.close();
  deleteTargetId = null;
});

btnConfirmDelete.addEventListener('click', async () => {
  if (!deleteTargetId) return;

  btnConfirmDelete.disabled = true;
  btnConfirmDelete.textContent = 'Deleting...';

  try {
    const res = await fetch(`${API_URL}/${deleteTargetId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`Failed to delete record. Server status: ${res.status}`);
    }

    showAdminStatus('Cyber threat record successfully purged.');
    deleteDialog.close();
    await fetchAdminThreats();
  } catch (error) {
    showAdminStatus(`Error deleting: ${error.message}`, false);
    deleteDialog.close();
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.textContent = 'Delete Record';
    deleteTargetId = null;
  }
});

// --- CRUD Actions: EDIT Flow (PUT) ---

/**
 * Pre-populates the update form input elements and opens the edit dialog modal.
 */
window.openEditModal = function(id) {
  const threat = allThreats.find(t => t.id === id);
  if (!threat) {
    showAdminStatus('Failed to locate target record.', false);
    return;
  }

  // Clear previous validation states
  const errorElements = [
    editTitleError, editCategoryError, editSeverityError, editStatusError,
    editDateError, editDescriptionError, editNameError, editEmailError
  ];
  errorElements.forEach(el => {
    el.textContent = '';
    el.classList.remove('active');
  });

  const controlElements = [
    editTitle, editCategory, editSeverity, editStatus,
    editDate, editDescription, editName, editEmail
  ];
  controlElements.forEach(ctrl => {
    ctrl.style.borderColor = 'var(--border)';
  });

  // Pre-load values
  editId.value = threat.id;
  editTitle.value = threat.title;
  editCategory.value = threat.category;
  editSeverity.value = threat.severity;
  editStatus.value = threat.status;
  editDate.value = threat.dateSpotted;
  editDescription.value = threat.description;
  editName.value = threat.reporterName;
  editEmail.value = threat.reporterEmail;

  editDialog.showModal();
};

btnCancelEdit.addEventListener('click', () => {
  editDialog.close();
  editForm.reset();
});

/**
 * Handles Edit form submission. Saves changes back to server using PUT.
 */
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateEditForm()) {
    return;
  }

  const id = editId.value;
  const updatedData = {
    id: id,
    title: editTitle.value.trim(),
    category: editCategory.value,
    severity: editSeverity.value,
    status: editStatus.value,
    dateSpotted: editDate.value,
    description: editDescription.value.trim(),
    reporterName: editName.value.trim(),
    reporterEmail: editEmail.value.trim()
  };

  btnSubmitEdit.disabled = true;
  btnSubmitEdit.textContent = 'Saving changes...';

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) {
      throw new Error(`Failed to save changes. Server status: ${res.status}`);
    }

    showAdminStatus('Record successfully updated and published.');
    editDialog.close();
    editForm.reset();
    await fetchAdminThreats();
  } catch (error) {
    showAdminStatus(`Error updating: ${error.message}`, false);
  } finally {
    btnSubmitEdit.disabled = false;
    btnSubmitEdit.textContent = 'Save Changes';
  }
});

// --- Event Listeners ---

// Inline editing validation on input blur & changes
const editFormInputs = [
  editTitle, editCategory, editSeverity, editStatus,
  editDate, editDescription, editName, editEmail
];

editFormInputs.forEach(input => {
  input.addEventListener('blur', () => validateEditField(input));
  input.addEventListener('input', () => {
    validateEditField(input);
  });
});

// Category selector changes
adminCategoryFilter.addEventListener('change', () => {
  fetchAdminThreats();
});

// Debounced filter search input for admin
const handleAdminSearch = debounce(() => {
  fetchAdminThreats();
}, 300);

adminSearchInput.addEventListener('input', handleAdminSearch);

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  fetchAdminThreats();
});
