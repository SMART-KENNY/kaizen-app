// SQL Generator Logic
const fieldContainer = document.getElementById('fieldContainer');
const selectOutput = document.getElementById('selectOutput');
const createOutput = document.getElementById('createOutput');
const jsonOutput = document.getElementById('jsonOutput');
const fullConfigOutput = document.getElementById('fullConfigOutput');
const errorMessage = document.getElementById('errorMessage');

// Standardization rules storage
let standardizationRules = [];

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

function addStandardizationRule(type = 'timestamp', sourceColumn = '', format = '', targetColumn = '') {
  const container = document.getElementById('standardizationContainer');
  const ruleDiv = document.createElement('div');
  ruleDiv.className = 'standardization-rule';

  const typeSelect = document.createElement('select');
  typeSelect.innerHTML = `
    <option value="timestamp" ${type === 'timestamp' ? 'selected' : ''}>Standardize Timestamp</option>
    <option value="date" ${type === 'date' ? 'selected' : ''}>Standardize Date</option>
  `;

  const sourceInput = document.createElement('input');
  sourceInput.placeholder = 'Source Column (e.g., uploaddate)';
  sourceInput.value = sourceColumn;

  const formatInput = document.createElement('input');
  formatInput.placeholder = type === 'timestamp' ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';
  formatInput.value = format || (type === 'timestamp' ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd');

  const targetInput = document.createElement('input');
  targetInput.placeholder = 'Target Column';
  targetInput.value = targetColumn;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove';
  removeBtn.textContent = '🗑️';
  removeBtn.onclick = () => {
    ruleDiv.remove();
    updateOutputs();
  };

  // Update format placeholder when type changes
  typeSelect.addEventListener('change', () => {
if (typeSelect.value === 'timestamp') {
      formatInput.placeholder = 'yyyy-MM-dd HH:mm:ss';
      if (!formatInput.value) formatInput.value = 'yyyy-MM-dd HH:mm:ss';
    } else {
      formatInput.placeholder = 'yyyy-MM-dd';
      if (!formatInput.value) formatInput.value = 'yyyy-MM-dd';
    }
    updateOutputs();
  });

  [typeSelect, sourceInput, formatInput, targetInput].forEach(input => {
    input.addEventListener('input', updateOutputs);
    input.addEventListener('change', updateOutputs);
  });

  ruleDiv.appendChild(typeSelect);
  ruleDiv.appendChild(sourceInput);
  ruleDiv.appendChild(formatInput);
  ruleDiv.appendChild(targetInput);
  ruleDiv.appendChild(removeBtn);

  container.appendChild(ruleDiv);
  updateOutputs();
}

function getStandardizationRules() {
  const rules = [];
  const container = document.getElementById('standardizationContainer');
  const ruleElements = container.querySelectorAll('.standardization-rule');

  ruleElements.forEach(ruleEl => {
    const inputs = ruleEl.querySelectorAll('select, input');
    const type = inputs[0].value;
    const sourceColumn = inputs[1].value.trim();
    const format = inputs[2].value.trim();
    const targetColumn = inputs[3].value.trim();

    if (type === 'timestamp' && sourceColumn && format && targetColumn) {
      rules.push({
        standardize_function: 'standardize_timestamp',
        source_column_name: sourceColumn,
        additional_parameters: {
          timestamp_format: format,
          target_column_name: targetColumn
        }
      });
    } else if (type === 'date' && format && targetColumn) {
      rules.push({
        standardize_function: 'standardize_date',
        additional_parameters: {
          date_format: format,
          target_column_name: targetColumn
        }
      });
    }
  });

  return rules;
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
    fullConfigOutput.textContent = '';
    return;
  }

  const tableName = document.getElementById('table_name').value.trim() || 'table_name';

  // Generate SELECT Statement
  const selectLines = fields.map(f => `  cast(${f.name} as string) as ${f.name}`);
  selectOutput.textContent = `select\n${selectLines.join(',\n')}\nfrom ${tableName};`;

  // Generate CREATE TABLE Statement
  const ddlLines = fields.map(f => `  ${f.name} ${f.type} '${f.desc}'`);
  createOutput.textContent = `create table ${tableName} (\n${ddlLines.join(',\n')}\n)\nusing delta;`

  // Generate Simple JSON Config
  generateSimpleJsonConfig(fields);

  // Generate Full Configuration
  generateFullConfig(fields);
}

function generateSimpleJsonConfig(fields) {
  const config = {
    rule_name: "check_schema_consistency",
    parameters: {
      expected_schema: fields.map(f => ({
        column_name: f.name.toLowerCase(),
        data_type: f.type
      }))
    }
  };

  jsonOutput.textContent = JSON.stringify(config, null, 2);
}

function generateFullConfig(fields) {
  const applicationName = document.getElementById('application_name').value.trim() || 'application_name';
  const tableName = document.getElementById('table_name').value.trim() || 'table_name';
  const falloutTableName = document.getElementById('fallout_table_name').value.trim() || `wde.cu_b.${tableName}`;
  const s3DataPrefix = document.getElementById('s3_data_prefix').value.trim() || 's3://bucket/path/to/data';
  const s3ManifestPrefix = document.getElementById('s3_manifest_prefix').value.trim() || 's3://bucket/path/to/manifest';
  const sqlFilePath = document.getElementById('sql_file_path').value.trim() || 'path/to/sql/file.sql';
  const fileFormat = document.getElementById('file_format').value;
  const delimiter = document.getElementById('delimiter').value.trim();
  const logLevel = document.getElementById('log_level').value;

  // Boolean flags
  const allowDuplicateFiles = document.getElementById('allow_duplicate_files_flag').checked;
  const headerFlag = document.getElementById('header_flag').checked;
  const ignoreCorruptFiles = document.getElementById('ignoreCorruptFiles').checked;
  const fileTimestampPartition = document.getElementById('file_timestamp_partition_flag').checked;
  const partitionOverwrite = document.getElementById('partition_overwrite_flag').checked;
  const compositeKeyLevelFallout = document.getElementById('composite_key_level_fallout').checked;

  // Downstream configuration
  const downstreamJobTriggers = parseInt(document.getElementById('number_of_downstream_job_run_triggers').value) || 3;
  const partitionSetsToPass = parseInt(document.getElementById('number_of_partition_sets_to_pass_in_downstream').value) || 4;

  // Get standardization rules
  const standardizationConfig = getStandardizationRules();

  // Build expected schema
  const expectedSchema = fields.map(f => ({
    column_name: f.name.toLowerCase(),
    data_type: f.type
  }));

  // Calculate expected column count (total fields + metadata columns)
  const expectedColumnCount = fields.length;

  // Build full configuration
  const fullConfig = {
    application_name: applicationName,
    logger_configuration: {
      log_level: logLevel
    },
    task_configuration: {
      datasource_configuration: {
        s3_data_prefix: s3DataPrefix,
        s3_manifest_prefix: s3ManifestPrefix,
        sql_file_path: sqlFilePath,
        allow_duplicate_files_flag: allowDuplicateFiles,
        file_format: fileFormat,
        spark_read_options: {
          delimiter: delimiter,
          header_flag: headerFlag,
          read_mode: "FAILFAST",
          ignoreCorruptFiles: ignoreCorruptFiles
        },
        file_timestamp_partition_flag: fileTimestampPartition,
        source_partition_list: []
      },
      endpoint_configuration: {
        table_name: tableName,
        target_partition_list: [
          {
            partition_name: "file_date",
            data_type: "date",
            format: "%Y-%m-%d",
            metadata_table_column_ref: "transaction_timestamp",
            order: 2
          }
        ],
        data_refresh_column_list: ["file_date"],
        save_mode: "append",
        partition_overwrite_flag: partitionOverwrite,
        fallout_table_name: falloutTableName,
        composite_key_level_fallout: compositeKeyLevelFallout,
        number_of_downstream_job_run_triggers: downstreamJobTriggers,
        number_of_partition_sets_to_pass_in_downstream: partitionSetsToPass
      },
      data_standardization_configuration: standardizationConfig,
      data_quality_configuration: [
        {
          rule_name: "compare_file_sizes_in_bytes",
          parameters: {
            manifest_stats_df: null,
            manifest_file_name_column: "datafilename",
            manifest_file_size_column: "filesize"
          },
          action: "log",
          execution_stage: "raw",
          send_email_notifications: false,
          send_teams_notifications: true,
          raise_servicenow_tickets: false
        },
        {
          rule_name: "reconcile_file_set",
          parameters: {
            file_name_column: "file_name",
            manifest_file_set: null
          },
          action: "log",
          execution_stage: "raw",
          send_email_notifications: false,
          send_teams_notifications: true,
          raise_servicenow_tickets: false
        },
        {
          rule_name: "check_column_count",
          parameters: {
            expected_count: expectedColumnCount
          },
          action: "log",
          execution_stage: "transformed",
          send_email_notifications: false,
          send_teams_notifications: true,
          raise_servicenow_tickets: false
        },
        {
          rule_name: "check_schema_consistency",
          parameters: {
            expected_schema: expectedSchema
          },
          action: "log",
          execution_stage: "transformed",
          send_email_notifications: false,
          send_teams_notifications: true,
          raise_servicenow_tickets: false
        },
        {
          rule_name: "check_null",
          target_column: "file_name",
          parameters: {},
          action: "log",
          execution_stage: "transformed",
          send_email_notifications: false,
          send_teams_notifications: true,
          raise_servicenow_tickets: false
        }
      ]
    },
    utility_configuration: {}
  };

  fullConfigOutput.textContent = JSON.stringify(fullConfig, null, 2);
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
  } else if (tabName === 'fullconfig') {
    document.getElementById('fullconfigTab').classList.add('active');
  }
}

// Collapsible Section Toggle
function toggleSection(sectionId) {
  const content = document.getElementById(sectionId);
  const header = content.previousElementSibling;
  
  content.classList.toggle('active');
  header.classList.toggle('active');
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
  const fullConfig = fullConfigOutput.textContent;
  const allContent = `-- SQL STATEMENTS --\n${sqlContent}\n\n-- SIMPLE JSON CONFIG --\n${jsonContent}\n\n-- FULL CONFIGURATION --\n${fullConfig}`;
  
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
  
  // Download Simple JSON
  const jsonContent = jsonOutput.textContent;
  downloadFile(jsonContent, `${tableName}_simple_config.json`, 'application/json');
  
  // Download Full Config
  const fullConfig = fullConfigOutput.textContent;
  downloadFile(fullConfig, `${tableName}_full_config.json`, 'application/json');
  
  showToast('⬇️ All files downloaded!', 'success');
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
    application_name: document.getElementById('application_name').value,
    workspace: document.getElementById('workspace').value,
    pipeline: document.getElementById('pipeline').value,
    data_domain: document.getElementById('data_domain').value,
    select_sql: selectOutput.textContent,
    ddl_sql: createOutput.textContent,
    simple_json_config: jsonOutput.textContent,
    full_config: fullConfigOutput.textContent
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
      uploadStatus.className = 'upload-status error';
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

// Initialize
addField();

// Add event listeners for all configuration inputs to trigger updates
document.querySelectorAll('input, select').forEach(element => {
  if (element.id && !element.id.includes('fileInput')) {
    element.addEventListener('input', updateOutputs);
    element.addEventListener('change', updateOutputs);
  }
});

// Initialize with default standardization rules
addStandardizationRule('timestamp', 'uploaddate', 'yyyy-MM-dd HH:mm:ss', 'uploaddate');
addStandardizationRule('date', '', 'yyyy-MM-dd', 'file_date');