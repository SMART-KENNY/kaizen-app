// SQL Generator Logic
const fieldContainer = document.getElementById('fieldContainer');
const selectOutput = document.getElementById('selectOutput');
const createOutput = document.getElementById('createOutput');
const jsonOutput = document.getElementById('jsonOutput');
const errorMessage = document.getElementById('errorMessage');

function addField(name = '', type = '', desc = '') {
  const group = document.createElement('div');
  group.className = 'field-group';

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Field Name (e.g., customer_id)';
  nameInput.value = name;

  const typeInput = document.createElement('input');
  typeInput.placeholder = 'Data Type (e.g., string, bigint)';
  typeInput.value = type;

  const descInput = document.createElement('input');
  descInput.placeholder = 'Field Description';
  descInput.value = desc;

  [nameInput, typeInput, descInput].forEach(input => {
    input.addEventListener('input', updateOutputs);
  });

  group.appendChild(nameInput);
  group.appendChild(typeInput);
  group.appendChild(descInput);
  fieldContainer.appendChild(group);

  updateOutputs();
}

function updateOutputs() {
  const rows = fieldContainer.querySelectorAll('.field-group');
  const fields = [];
  const namesSet = new Set();
  let duplicateFound = false;

  errorMessage.textContent = '';

  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const [name, type, desc] = [...inputs].map(i => i.value.trim());

    if (name && type) {
      if (namesSet.has(name)) {
        duplicateFound = true;
      }
      namesSet.add(name);
      fields.push({ name, type, desc });
    }
  });

  if (duplicateFound) {
    errorMessage.textContent = '⚠️ Error: Duplicate field names are not allowed.';
    selectOutput.textContent = '';
    createOutput.textContent = '';
    jsonOutput.textContent = '';
    return;
  }

  const tableName = document.getElementById('table_name').value.trim() || 'table_name';

  // Generate SELECT Statement
  const selectLines = fields.map(f => `  cast(${f.name} as string) as ${f.name}`);
  selectOutput.textContent = `select\n${selectLines.join(',\n')}\nfrom ${tableName};`;

  // Generate CREATE TABLE Statement
  const ddlLines = fields.map(f => `  ${f.name} ${f.type} '${f.desc}'`);
  createOutput.textContent = `create table ${tableName} (\n${ddlLines.join(',\n')}\n)\nusing delta;`;

  // Generate JSON Config
  generateJsonConfig(fields);
}

function generateJsonConfig(fields) {
  const config = {
    rule_name: "check_schema_consistency",
    parameters: {
      expected_schema: fields.map(f => ({
        column_name: f.name.toLowerCase(),
        data_type: f.type
      }))
    }
  };

  // Pretty print JSON with syntax highlighting
  const jsonString = JSON.stringify(config, null, 2);
  jsonOutput.textContent = jsonString;
}

// Tab Switching
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  if (tabName === 'sql') {
    document.getElementById('sqlTab').classList.add('active');
  } else if (tabName === 'json') {
    document.getElementById('jsonTab').classList.add('active');
  }
}

// Copy Functions
function copyOutput(outputId) {
  const content = document.getElementById(outputId).textContent;
  navigator.clipboard.writeText(content).then(() => {
    showToast('✅ Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('❌ Failed to copy', 'error');
  });
}

function copyAll() {
  const sqlContent = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  const jsonContent = jsonOutput.textContent;
  const allContent = `-- SQL STATEMENTS --\n${sqlContent}\n\n-- JSON CONFIG --\n${jsonContent}`;
  
  navigator.clipboard.writeText(allContent).then(() => {
    showToast('✅ All outputs copied to clipboard!', 'success');
  }).catch(() => {
    showToast('❌ Failed to copy', 'error');
  });
}

function downloadAll() {
  const tableName = document.getElementById('table_name').value.trim() || 'table';
  
  // Download SQL
  const sqlContent = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  downloadFile(sqlContent, `${tableName}_schema.sql`, 'text/sql');
  
  // Download JSON
  const jsonContent = jsonOutput.textContent;
  downloadFile(jsonContent, `${tableName}_config.json`, 'application/json');
  
  showToast('⬇️ Files downloaded!', 'success');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function downloadSQL() {
  const content = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  const tableName = document.getElementById('table_name').value.trim() || 'table';
  downloadFile(content, `${tableName}_schema.sql`, 'text/sql');
  showToast('⬇️ SQL file downloaded!', 'success');
}

function copySQL() {
  const content = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  navigator.clipboard.writeText(content).then(() => {
    showToast('✅ SQL copied to clipboard!', 'success');
  }).catch(() => {
    showToast('❌ Failed to copy', 'error');
  });
}

function saveToBackend() {
  const payload = {
    table_name: document.getElementById('table_name').value,
    workspace: document.getElementById('workspace').value,
    pipeline: document.getElementById('pipeline').value,
    data_domain: document.getElementById('data_domain').value,
    select_sql: selectOutput.textContent,
    ddl_sql: createOutput.textContent,
    json_config: jsonOutput.textContent
  };

  fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message || '💾 Saved successfully!', 'success');
  })
  .catch(err => {
    showToast('❌ Failed to save', 'error');
    console.error(err);
  });
}

// Toast Notification System
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// File Upload Functionality
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) uploadFile(file);
});

function uploadFile(file) {
  // Show loading state
  uploadStatus.className = 'upload-status';
  uploadStatus.textContent = '⏳ Processing file...';
  uploadStatus.style.display = 'block';

  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload_fields', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.fields) {
      fieldContainer.innerHTML = ''; // Clear old inputs
      data.fields.forEach(f => {
        addField(f.name, f.type, f.comment || '');
      });
      updateOutputs();
      
      uploadStatus.className = 'upload-status success';
      uploadStatus.textContent = `✅ Successfully loaded ${data.count} fields from ${file.name}`;
      
      showToast(`✅ ${data.count} fields loaded successfully!`, 'success');
      
      // Hide status after 5 seconds
      setTimeout(() => {
        uploadStatus.style.display = 'none';
      }, 5000);
    } else if (data.error) {
      uploadStatus.textContent = `❌ ${data.error}`;
      showToast(`❌ ${data.error}`, 'error');
    } else {
      uploadStatus.className = 'upload-status error';
      uploadStatus.textContent = '⚠️ Failed to parse file';
      showToast('⚠️ Failed to parse file', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    uploadStatus.className = 'upload-status error';
    uploadStatus.textContent = '❌ Error uploading file';
    showToast('❌ Error uploading file', 'error');
  });
}

// Initialize with one empty field
addField();

// Auto-update table name in outputs
document.getElementById('table_name').addEventListener('input', updateOutputs);