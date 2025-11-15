
// import { variable1_from_file1 } from 'file1.js';

// SQL Generator Logic
const fieldContainer = document.getElementById('fieldContainer');
const selectOutput = document.getElementById('selectOutput');
const createOutput = document.getElementById('createOutput');
const fullConfigOutput = document.getElementById('fullConfigOutput');
const yamlOutput = document.getElementById('yamlOutput');
const errorMessage = document.getElementById('errorMessage');


// console.log(window.variable1_from_file2); // Outputs: kennysss



function addField(name = '', type = '', desc = '', iterator = '') {
  const group = document.createElement('div');
  group.className = 'field-group';

  // Create iterator input but keep it hidden
  const iteratorInput = document.createElement('input');
  iteratorInput.placeholder = 'Iterator (e.g., _c0)';
  iteratorInput.value = iterator;
  iteratorInput.className = 'iterator-input';
  iteratorInput.style.display = 'none'; // Hide the iterator input
  iteratorInput.type = 'hidden'; // Make it a hidden input

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Field Name (e.g., customer_id)';
  nameInput.value = name;

  const typeInput = document.createElement('input');
  typeInput.placeholder = 'Data Type (e.g., string, bigint)';
  typeInput.value = type;

  const descInput = document.createElement('input');
  descInput.placeholder = 'Field Description';
  descInput.value = desc;

  [iteratorInput, nameInput, typeInput, descInput].forEach(input => {
    input.addEventListener('input', updateOutputs);
  });

  group.appendChild(iteratorInput);
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

  rows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input');
    const iterator = inputs[0].value.trim();
    const name = inputs[1].value.trim();
    const type = inputs[2].value.trim();
    const desc = inputs[3].value.trim();

    if (name && type) {
      if (namesSet.has(name)) {
        duplicateFound = true;
      }
      namesSet.add(name);
      fields.push({ 
        iterator: iterator || `_c${index}`,
        name, 
        type, 
        desc 
      });
    }
  });

  if (duplicateFound) {
    errorMessage.textContent = '⚠️ Error: Duplicate field names are not allowed.';
    selectOutput.textContent = '';
    createOutput.textContent = '';
    fullConfigOutput.textContent = '';
    yamlOutput.textContent = '';
    return;
  }

  const pipeLine = document.getElementById('pipeline').value.trim() || 'pipeline';
  const workSpace = document.getElementById('workspace').value.trim() || 'workspace';
  const dataDomain = document.getElementById('data_domain').value.trim() || 'data_domain';
  const tierSuffix = document.getElementById('tier_suffix').value.trim() || 'tier_suffix';
  const headerFlag = document.getElementById('header_flag').checked;

  // Generate SELECT Statement based on header flag
  generateSelectStatement(fields, pipeLine, headerFlag);

  // Generate CREATE TABLE Statement with lowercase
  const ddlLines = fields.map(f => `  ${f.name.toLowerCase()} ${f.type} comment '${f.desc}'`);
  createOutput.textContent = `CREATE TABLE IF NOT EXISTS ${workSpace}_dev.${dataDomain}${tierSuffix}.${pipeLine} (\n${ddlLines.join(',\n')}\n)\nusing delta\nPARTITIONED BY (file_timestamp_bucket, txn_date)\nCOMMENT ''\nTBLPROPERTIES (\n 'delta.enableChangeDataFeed' = 'true',\n 'retentionKey' = 'txn_dt');`;


    p1_generateFullConfig(fields);
    p1_generateYAMLConfig();

  // Update standardization display
  updateStandardizationDisplay(fields);
}

function shouldSkipCast(fieldName) {
  // Check if field name is msisdn, imsi, or imei (case-insensitive)
  const noCastFields = ['msisdn', 'imsi', 'imei'];
  return noCastFields.includes(fieldName.toLowerCase());
}



// 
const domainSelect = document.getElementById('tier');
const tier_suffix = document.getElementById('tier_suffix');
domainSelect.addEventListener('change', function () {
    const selectedValue = this.value;

    // Map domain to code
    const domainCodeMap = {
        bronze: '_b',
        silver: '_s',
        gold: '_g'
    };

    // Update input based on selection
    tier_suffix.value = domainCodeMap[selectedValue] || '';
    // tier_suffix.readOnly = true;
    // c_tier_suffix_p = tier_suffix.value;
});





function generateSelectStatement(fields, pipeLine, headerFlag) {
  const selectLines = fields.map((f, index) => {
    const dataType = f.type.toLowerCase();
    const fieldName = f.name;
    const fieldNameLower = fieldName.toLowerCase();
    
    // Check if this field should skip casting (msisdn, imsi, imei)
    if (shouldSkipCast(fieldName)) {
      if (headerFlag) {
        return `  ${fieldNameLower}`;
      } else {
        // No cast, just use field name in lowercase (no iterator)
        return `  ${fieldNameLower}`;
      }
    }
    
    // Check if field is date or timestamp - use as-is without casting
    if (dataType === 'date' || dataType === 'timestamp') {
      return `  ${fieldNameLower}`;
    }
    
    // For other types, cast to string
    if (headerFlag) {
      // Header is true: use actual column names in lowercase
      return `  cast(${fieldNameLower} as string) as ${fieldNameLower}`;
    } else {
      // Header is false: use iterator (_c0, _c1, _c2, etc.) with lowercase alias
      return `  cast(${f.iterator} as string) as ${fieldNameLower}`;
    }
  });

  selectOutput.textContent = `select\n${selectLines.join(',\n')}\nfrom ${pipeLine};`;
}

function getAutoStandardizationRules(fields) {
  const rules = [];
  
  fields.forEach(field => {
    const dataType = field.type.toLowerCase();
    const fieldNameLower = field.name.toLowerCase();
    
    // Auto-add timestamp standardization
    if (dataType === 'timestamp') {
      rules.push({
        standardize_function: 'standardize_timestamp',
        source_column_name: fieldNameLower,
        additional_parameters: {
          timestamp_format: 'yyyy-MM-dd HH:mm:ss',
          target_column_name: fieldNameLower
        }
      });
    }
    
    // Auto-add date standardization
    if (dataType === 'date') {
      rules.push({
        standardize_function: 'standardize_date',
        source_column_name: fieldNameLower,
        additional_parameters: {
          date_format: 'yyyy-MM-dd',
          target_column_name: fieldNameLower
        }
      });
    }
  });
  
  return rules;
}


function getAutoTargetPartitionList(fields) {
  const targetPartitionList = [];
  
  fields.forEach(field => {
    const dataType = field.type.toLowerCase();
    const fieldNameLower = field.name.toLowerCase();

    // Auto-add date standardization
    if (fieldNameLower === 'txn_date') {
      targetPartitionList.push({
        partition_name: "txn_date",
        data_type: dataType,
        format: "%Y-%m-%d",
        metadata_table_column_ref: "transaction_timestamp",
        order: 1
      });
    }

    // Auto-add date standardization
    if (fieldNameLower === 'file_date') {
      targetPartitionList.push({
        partition_name: "file_date",
        data_type: dataType,
        format: "%Y-%m-%d",
        metadata_table_column_ref: "transaction_timestamp",
        order: 2
      });
    }

    // Auto-add date standardization
    if (fieldNameLower === 'file_timestamp_bucket') {
      targetPartitionList.push({
        partition_name: "timestamp",
        data_type: dataType,
        format: "%Y-%m-%d %H:%M:%S",
        metadata_table_column_ref: "file_timestamp",
        order: 2
      });
    }

  });

  return targetPartitionList;
}


function updateStandardizationDisplay(fields) {
  const container = document.getElementById('standardizationContainer');
  
  // Clear existing display
  container.innerHTML = '';
  
  // Get auto-generated rules
  const autoRules = getAutoStandardizationRules(fields);
  
  if (autoRules.length === 0) {
    container.innerHTML = '<p class="info-text">No date or timestamp fields detected. Standardization rules will be auto-generated when you add date/timestamp fields.</p>';
    return;
  }
  
  // Display auto-generated rules (read-only)
  const displayDiv = document.createElement('div');
  displayDiv.className = 'standardization-display';
  displayDiv.innerHTML = '<p class="info-text">✅ Auto-generated standardization rules based on date/timestamp fields:</p>';
  
  autoRules.forEach(rule => {
    const ruleCard = document.createElement('div');
    ruleCard.className = 'standardization-card';
    
    if (rule.standardize_function === 'standardize_timestamp') {
      ruleCard.innerHTML = `
        <div class="rule-icon">🕐</div>
        <div class="rule-details">
          <strong>Timestamp Standardization</strong>
          <p>Source: <code>${rule.source_column_name}</code></p>
          <p>Format: <code>${rule.additional_parameters.timestamp_format}</code></p>
          <p>Target: <code>${rule.additional_parameters.target_column_name}</code></p>
        </div>
      `;
    } else if (rule.standardize_function === 'standardize_date') {
      ruleCard.innerHTML = `
        <div class="rule-icon">📅</div>
        <div class="rule-details">
          <strong>Date Standardization</strong>
          <p>Source: <code>${rule.source_column_name}</code></p>
          <p>Format: <code>${rule.additional_parameters.date_format}</code></p>
          <p>Target: <code>${rule.additional_parameters.target_column_name}</code></p>
        </div>
      `;
    }
    
    displayDiv.appendChild(ruleCard);
  });
  
  container.appendChild(displayDiv);
}

function formatS3Prefix(value) {
  if (!value) return '';
  
  let formatted = value.trim();
  
  // Remove leading slash, add trailing slash
  formatted = formatted.replace(/^\/+/, ''); // Remove leading slashes
  
  if (!formatted.endsWith('/')) {
    formatted += '/';
  }
  
  return formatted;
}

// PHASE 1
function p1_generateFullConfig(fields) {
  const applicationName = document.getElementById('application_name').value.trim() || 'application_name';
  const workSpace = document.getElementById('workspace').value.trim() || 'workspace';
  const pipeLine = document.getElementById('pipeline').value.trim().toLowerCase() || 'pipeline';
  const dataDomain = document.getElementById('data_domain').value.trim().toLowerCase() || 'data_domain';
  const tierSuffix = document.getElementById('tier_suffix').value.trim().toLowerCase() || 'tier_suffix';
  let s3DataPrefix = document.getElementById('s3_data_prefix').value.trim() || 's3://bucket/path/to/data';
  s3DataPrefix = formatS3Prefix(s3DataPrefix);
  let s3ManifestPrefix = document.getElementById('s3_manifest_prefix').value.trim() || 's3://bucket/path/to/manifest';
  s3ManifestPrefix = formatS3Prefix(s3ManifestPrefix);

  const endpoint_configuration_tbl = `${workSpace}.${dataDomain}${tierSuffix}.${pipeLine}`
  const sqlFilePath = document.getElementById('sql_file_path').value.trim() || `./${dataDomain}/sql/${pipeLine}.sql`;
  const fileFormat = document.getElementById('file_format').value;
  const delimiter = document.getElementById('delimiter').value.trim();
  const logLevel = document.getElementById('log_level').value;

  // Boolean flags
  // const allowDuplicateFiles = document.getElementById('allow_duplicate_files_flag').checked;
  const headerFlag = document.getElementById('header_flag').checked;
  // const ignoreCorruptFiles = document.getElementById('ignoreCorruptFiles').checked;
  const fileTimestampPartition = document.getElementById('file_timestamp_partition_flag').checked;
  const partitionOverwrite = document.getElementById('partition_overwrite_flag').checked;
  // const compositeKeyLevelFallout = document.getElementById('composite_key_level_fallout').checked;

  // Downstream configuration
  const downstreamJobTriggers = parseInt(document.getElementById('number_of_downstream_job_run_triggers').value) || 3;
  const partitionSetsToPass = parseInt(document.getElementById('number_of_partition_sets_to_pass_in_downstream').value) || 4;
  let partitionFields = 'file_date';
  let partitionFilename = 'filename';
  let dataRefreshColumnList = [partitionFields, partitionFilename];
  // Get auto-generated standardization rules based on date/timestamp fields
  const standardizationConfig = getAutoStandardizationRules(fields);
  const targetPartitionList = getAutoTargetPartitionList(fields);

  // Build expected schema - ALWAYS use actual field names (second column) in lowercase
  // Regardless of header flag setting
  const expectedSchema = fields.map((f) => {
    return {
      column_name: f.name.toLowerCase(),
      data_type: f.type
    };
  });

  // Calculate expected column count
  const expectedColumnCount = fields.length;

  // Build full configuration
  const fullConfig = {
    KENNY: applicationName,
    logger_configuration: {
      log_level: logLevel
    },
    task_configuration: {
      datasource_configuration: {
        s3_data_prefix: s3DataPrefix,
        s3_manifest_prefix: s3ManifestPrefix,
        sql_file_path: sqlFilePath,
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
        table_name: endpoint_configuration_tbl,
        target_partition_list: targetPartitionList,
        data_refresh_column_list: dataRefreshColumnList,
        save_mode: "append",
        partition_overwrite_flag: partitionOverwrite,
        fallout_table_name: endpoint_configuration_tbl,
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

function p1_generateYAMLConfig() {
  // Get YAML-specific inputs
  const tier = document.getElementById('tier').value.trim() || 'tier';
  const workspace = document.getElementById('workspace').value.trim() || 'workspace';
  let s3_data_prefix = document.getElementById('s3_data_prefix').value.trim() || 's3_data_prefix';
  let s3_manifest_prefix = document.getElementById('s3_manifest_prefix').value.trim() || 's3_manifest_prefix';
  const data_domain = document.getElementById('data_domain').value.trim() || 'data_domain';
  const pipeline = document.getElementById('pipeline').value.trim() || 'pipeline';
  const frequency = document.getElementById('frequency').value.trim() || 'frequency';


  s3_data_prefix = formatS3Prefix(s3_data_prefix);
  s3_manifest_prefix = formatS3Prefix(s3_manifest_prefix);


  const jobCategory = document.getElementById('yaml_job_category').value.trim() || 'batch';
  const taskKey = `${pipeline}_${tier}_task`;

  const jobName = `${workspace}_${pipeline}_${tier}_job`;
  const s3JobTriggerPath = `manifests/source_manifest/${s3_data_prefix}`;
  const configFilePath = `./${data_domain}/etc/${pipeline}_config.json`
  let pipeline_tier = `${pipeline}_${tier}_job`;
  

  const yamlContent = `resources:
  jobs:
    ${jobName}:
      name: ${jobName}
      webhook_notifications: \${var.webhook_notifications_config}
      tags:
        owner: Wireless Data Engineering
        layer: ${tier}
        job_type: ${frequency}
        job_category: ${jobCategory}

      permissions:
        - group_name: "GSG PLDT GDM Databricks Developers WDE \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "GSG SMART GDM Databricks Developers WDE \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "GSG PLDT GDM Databricks Workspace Admins WDE \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "GSG SMART GDM Databricks Workspace Admins WDE \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "GSG PLDT GDM Databricks Operations \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "GSG SMART GDM Databricks Operations \${var.group_postfix}"
          level: CAN_MANAGE_RUN
        - group_name: "users"
          level: CAN_MANAGE_RUN

      timeout_seconds: 7200
      health:
        rules:
          - metric: RUN_DURATION_SECONDS
            op: GREATER_THAN
            value: 3600
      max_concurrent_runs: 1
      tasks:
        - task_key: landing_to_in_process_file_movement_task
          job_cluster_key: cluster
          notebook_task:
            notebook_path: ../../common_file_movement.ipynb
            base_parameters:
              workspace_id: \${var.job_reference.workspace_id}
              workspace_url: \${var.job_reference.workspace_url}
              job_id: \${var.job_reference.job_id}
              job_name: \${var.job_reference.job_name}
              job_trigger_type: \${var.job_reference.job_trigger_type}
              job_run_id: \${var.job_reference.job_run_id}
              job_start_time: \${var.job_reference.job_start_time}
              task_run_id: \${var.job_reference.task_run_id}
              task_name: \${var.job_reference.task_name}
              task_notebook_path: \${var.job_reference.task_notebook_path}
              execution_env: \${var.job_reference.execution_env}
              execution_type: "bau"
              data_source_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}raw"
              data_destination_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}in_process"
              manifest_source_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}raw"
              manifest_destination_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}in_process"
              reprocessing_data_source_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}archive/failed/"
              reprocessing_data_destination_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}reprocessing/"
              reprocessing_manifest_source_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}archive/failed/"
              reprocessing_manifest_destination_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}reprocessing/"
              aws_profile: \${var.aws_profile_name}
              landing_bucket_name: \${var.wde_bucket_name}
              monitoring_bucket_name: \${var.wde_monitoring_bucket_name}
          # libraries:
          #   - whl: \${var.common_package_wheel_path}

        - task_key: ${taskKey}
          depends_on:
            - task_key: landing_to_in_process_file_movement_task
          job_cluster_key: cluster
          notebook_task:
            notebook_path: ../../common_s3_loader_v2.ipynb
            base_parameters:
              workspace_id: \${var.job_reference.workspace_id}
              workspace_url: \${var.job_reference.workspace_url}
              job_id: \${var.job_reference.job_id}
              job_name: \${var.job_reference.job_name}
              job_trigger_type: \${var.job_reference.job_trigger_type}
              job_run_id: \${var.job_reference.job_run_id}
              job_start_time: \${var.job_reference.job_start_time}
              task_run_id: \${var.job_reference.task_run_id}
              task_name: \${var.job_reference.task_name}
              task_type: ${tier}
              workspace_name: \${var.workspace_name}
              task_notebook_path: \${var.job_reference.task_notebook_path}
              execution_env: \${var.job_reference.execution_env}
              execution_type: "bau"
              reprocess_partition: ""
              s3_dbx_job_trigger_event_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}raw/"
              config_file_path: "${configFilePath}"
              aws_profile: \${var.aws_profile_name}
              landing_bucket_name: \${var.wde_bucket_name}
              monitoring_bucket_name: \${var.wde_monitoring_bucket_name}
              upstream_task_name: "landing_to_in_process_file_movement_task"
          # libraries:
          #   - whl: \${var.common_package_wheel_path}

        - task_key: in_process_to_archive_file_movement_task
          depends_on:
            - task_key: ${taskKey}
          job_cluster_key: cluster
          notebook_task:
            notebook_path: ../../common_file_movement.ipynb
            base_parameters:
              workspace_id: \${var.job_reference.workspace_id}
              workspace_url: \${var.job_reference.workspace_url}
              job_id: \${var.job_reference.job_id}
              job_name: \${var.job_reference.job_name}
              job_trigger_type: \${var.job_reference.job_trigger_type}
              job_run_id: \${var.job_reference.job_run_id}
              job_start_time: \${var.job_reference.job_start_time}
              task_run_id: \${var.job_reference.task_run_id}
              task_name: \${var.job_reference.task_name}
              task_notebook_path: \${var.job_reference.task_notebook_path}
              execution_env: \${var.job_reference.execution_env}
              execution_type: "bau"
              upstream_task_name: "${taskKey}"
              data_source_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}in_process/"
              data_destination_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}archive/"
              manifest_source_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}in_process/"
              manifest_destination_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}archive/"
              reprocessing_data_source_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}reprocessing/"
              reprocessing_data_destination_base_path: "s3://\${var.wde_bucket_name}/${s3_data_prefix}archive/"
              reprocessing_manifest_source_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}reprocessing/"
              reprocessing_manifest_destination_base_path: "s3://\${var.wde_monitoring_bucket_name}/${s3_manifest_prefix}archive/"
              aws_profile: \${var.aws_profile_name}
              landing_bucket_name: \${var.wde_bucket_name}
              monitoring_bucket_name: \${var.wde_monitoring_bucket_name}
          # libraries:
          #   - whl: \${var.common_package_wheel_path}

        - task_key: trigger_downstream_task
          depends_on:
            - task_key: ${taskKey}
          job_cluster_key: cluster
          notebook_task:
            notebook_path: ../../common_pipeline_trigger.ipynb
            base_parameters:
              workspace_id: \${var.job_reference.workspace_id}
              workspace_url: \${var.job_reference.workspace_url}
              job_id: \${var.job_reference.job_id}
              job_name: \${var.job_reference.job_name}
              job_trigger_type: \${var.job_reference.job_trigger_type}
              job_run_id: \${var.job_reference.job_run_id}
              job_start_time: \${var.job_reference.job_start_time}
              task_run_id: \${var.job_reference.task_run_id}
              task_name: \${var.job_reference.task_name}
              task_notebook_path: \${var.job_reference.task_notebook_path}
              execution_env: \${var.job_reference.execution_env}
              upstream_task_name: "${taskKey}"
              config_file_path: "${configFilePath}"
              is_active: "false"
              aws_profile: \${var.aws_profile_name}
              landing_bucket_name: \${var.wde_bucket_name}
              monitoring_bucket_name: \${var.wde_monitoring_bucket_name}
              task_type: "trigger_downstream"
              workspace_name: \${var.workspace_name}
          # libraries:
          #   - whl: \${var.common_package_wheel_path}

      job_clusters:
        - job_cluster_key: cluster
          new_cluster:
            spark_version: \${var.spark_version}
            node_type_id: i3.xlarge
            aws_attributes:
              first_on_demand: 3
              zone_id: auto
            spark_conf: \${var.default_spark_conf}
            spark_env_vars: \${var.default_spark_env_vars}
            num_workers: 1
            autoscale:
              min_workers: 1
              max_workers: 2
            cluster_log_conf:
              dbfs:
                destination: dbfs:/cluster-logs/${pipeline_tier}
            custom_tags:
              "Environment": \${bundle.target}`;

  yamlOutput.textContent = yamlContent;
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
  } else if (tabName === 'fullconfig') {
    document.getElementById('fullconfigTab').classList.add('active');
  } else if (tabName === 'yaml') {
    document.getElementById('yamlTab').classList.add('active');
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


// const saveFilepipeline = document.getElementById('pipeline').value.trim() || 'pipeline';

function downloadOutput(outputId, filename = 'output') {
  const content = document.getElementById(outputId).textContent;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  showToast('✅ Downloaded successfully!', 'success');
}

function copyAll() {
  const sqlContent = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  const fullConfig = fullConfigOutput.textContent;
  const yamlConfig = yamlOutput.textContent;
  const allContent = `-- SQL STATEMENTS --\n${sqlContent}\n\n-- FULL CONFIGURATION --\n${fullConfig}\n\n-- YAML CONFIGURATION --\n${yamlConfig}`;
  
  navigator.clipboard.writeText(allContent).then(() => {
    showToast('✅ All outputs copied to clipboard!', 'success');
  }).catch(() => {
    showToast('❌ Failed to copy', 'error');
  });
}

function downloadAll() {
  // const tableName = document.getElementById('table_name').value.trim() || 'table';
  const pipeLine = document.getElementById('pipeline').value.trim() || 'pipeline';
  
  // Download SQL
  const sqlContent = `${selectOutput.textContent}\n\n${createOutput.textContent}`;
  downloadFile(sqlContent, `${pipeLine}.sql`, 'text/sql');
  
  // Download Full Config
  const fullConfig = fullConfigOutput.textContent;
  downloadFile(fullConfig, `${pipeLine}_config.json`, 'application/json');
  
  // Download YAML
  const yamlConfig = yamlOutput.textContent;
  downloadFile(yamlConfig, `${pipeLine}_job.yaml`, 'text/yaml');
  
  showToast('⬇️ Files downloaded!', 'success');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function saveToBackend() {
  const payload = {
    // table_name: document.getElementById('table_name').value,
    application_name: document.getElementById('application_name').value,
    workspace: document.getElementById('workspace').value,
    pipeline: document.getElementById('pipeline').value,
    data_domain: document.getElementById('data_domain').value,
    select_sql: selectOutput.textContent,
    ddl_sql: createOutput.textContent,
    full_config: fullConfigOutput.textContent,
    yaml_config: yamlOutput.textContent
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
        addField(f.name, f.type, f.comment || '', f.iterator || '');
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

// Add this function for downloading YAML separately
function downloadYAML() {
  const jobName = document.getElementById('yaml_job_name').value.trim() || 'job';
  const yamlContent = yamlOutput.textContent;
  
  if (!yamlContent) {
    showToast('⚠️ No YAML content to download', 'error');
    return;
  }
  
  downloadFile(yamlContent, `${jobName}_config.yaml`, 'text/yaml');
  showToast('⬇️ YAML file downloaded!', 'success');
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