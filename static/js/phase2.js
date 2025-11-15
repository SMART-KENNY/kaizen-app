// Phase 2 Configuration Fields
const phase2Fields = [
    { 
        key: 'application_name', 
        label: 'Application Name', 
        type: 'text', 
        placeholder: 'e.g., OPTIMA - opt_dly_cb_accountdocument',
        path: 'application_name'
    },
    
    // Logger Configuration
    { 
        key: 'logger_log_level', 
        label: 'Log Level', 
        type: 'select', 
        options: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        path: 'logger_configuration.log_level',
        group: 'Logger Configuration'
    },
    
    // Datasource Configuration - Phase 2
    { 
        key: 'datasource_s3_data_prefix', 
        label: 'S3 Data Prefix', 
        type: 'text', 
        placeholder: 'optima/opt_dly_cb_accountdocument/',
        path: 'task_configuration.datasource_configuration.s3_data_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_manifest_prefix', 
        label: 'S3 Manifest Prefix', 
        type: 'text', 
        placeholder: 'manifests/source_manifest/optima/opt_dly_cb_accountdocument/',
        path: 'task_configuration.datasource_configuration.s3_manifest_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_sql_file_path', 
        label: 'SQL File Path', 
        type: 'text', 
        placeholder: './cu/sql/opt_dly_cb_accountdocument.sql',
        path: 'task_configuration.datasource_configuration.sql_file_path',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_allow_duplicate_files_flag', 
        label: 'Allow Duplicate Files Flag', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.datasource_configuration.allow_duplicate_files_flag',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_file_format', 
        label: 'File Format', 
        type: 'select', 
        options: ['parquet', 'csv', 'json', 'avro', 'orc'],
        path: 'task_configuration.datasource_configuration.file_format',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_spark_delimiter', 
        label: 'Spark Read Options - Delimiter', 
        type: 'text', 
        placeholder: 'Leave empty for parquet',
        path: 'task_configuration.datasource_configuration.spark_read_options.delimiter',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_spark_header_flag', 
        label: 'Spark Read Options - Header Flag', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.datasource_configuration.spark_read_options.header_flag',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_spark_read_mode', 
        label: 'Spark Read Options - Read Mode', 
        type: 'select', 
        options: ['FAILFAST', 'PERMISSIVE', 'DROPMALFORMED'],
        path: 'task_configuration.datasource_configuration.spark_read_options.read_mode',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_spark_ignore_corrupt_files', 
        label: 'Spark Read Options - Ignore Corrupt Files', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.datasource_configuration.spark_read_options.ignoreCorruptFiles',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_file_timestamp_partition_flag', 
        label: 'File Timestamp Partition Flag', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.datasource_configuration.file_timestamp_partition_flag',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_source_partition_list', 
        label: 'Source Partition List (JSON Array)', 
        type: 'textarea', 
        placeholder: '[]',
        path: 'task_configuration.datasource_configuration.source_partition_list',
        group: 'Datasource Configuration',
        isArray: true
    },
    
    // Endpoint Configuration - Phase 2
    { 
        key: 'endpoint_table_name', 
        label: 'Table Name', 
        type: 'text', 
        placeholder: 'wde.cu_b.opt_dly_cb_accountdocument',
        path: 'task_configuration.endpoint_configuration.table_name',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_target_partition_list', 
        label: 'Target Partition List (JSON Array)', 
        type: 'textarea', 
        placeholder: 'Enter JSON array for partitions',
        path: 'task_configuration.endpoint_configuration.target_partition_list',
        group: 'Endpoint Configuration',
        isArray: true
    },
    { 
        key: 'endpoint_data_refresh_column_list', 
        label: 'Data Refresh Column List (comma-separated)', 
        type: 'text', 
        placeholder: 'file_date',
        path: 'task_configuration.endpoint_configuration.data_refresh_column_list',
        group: 'Endpoint Configuration',
        isArray: true
    },
    { 
        key: 'endpoint_save_mode', 
        label: 'Save Mode', 
        type: 'select', 
        options: ['append', 'overwrite', 'error', 'ignore'],
        path: 'task_configuration.endpoint_configuration.save_mode',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_partition_overwrite_flag', 
        label: 'Partition Overwrite Flag', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.endpoint_configuration.partition_overwrite_flag',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_fallout_table_name', 
        label: 'Fallout Table Name', 
        type: 'text', 
        placeholder: 'wde.cu_b.opt_dly_cb_accountdocument',
        path: 'task_configuration.endpoint_configuration.fallout_table_name',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_composite_key_level_fallout', 
        label: 'Composite Key Level Fallout', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.endpoint_configuration.composite_key_level_fallout',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_number_of_downstream_job_run_triggers', 
        label: 'Number of Downstream Job Run Triggers', 
        type: 'number', 
        placeholder: '3',
        path: 'task_configuration.endpoint_configuration.number_of_downstream_job_run_triggers',
        group: 'Endpoint Configuration'
    },
    { 
        key: 'endpoint_number_of_partition_sets_to_pass_in_downstream', 
        label: 'Number of Partition Sets to Pass in Downstream', 
        type: 'number', 
        placeholder: '4',
        path: 'task_configuration.endpoint_configuration.number_of_partition_sets_to_pass_in_downstream',
        group: 'Endpoint Configuration'
    },
    
    // Data Standardization - Phase 2
    { 
        key: 'data_standardization_configuration', 
        label: 'Data Standardization Configuration (JSON Array)', 
        type: 'textarea', 
        placeholder: 'Enter JSON array for standardization rules',
        path: 'task_configuration.data_standardization_configuration',
        group: 'Data Standardization',
        isArray: true,
        standardizeFunctions: ['standardize_date', 'standardize_timestamp', 'trim_whitespace', 'uppercase', 'lowercase']
    },
    
    // Data Quality Configuration - Phase 2
    { 
        key: 'dq_compare_file_sizes', 
        label: 'DQ Rule: Compare File Sizes in Bytes', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'compare_file_sizes_in_bytes',
            parameters: {
                manifest_stats_df: null,
                manifest_file_name_column: 'datafilename',
                manifest_file_size_column: 'filesize'
            },
            action: 'log',
            execution_stage: 'raw',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_compare_file_sizes_manifest_stats_df', 
        label: '  └─ Manifest Stats DF', 
        type: 'text',
        placeholder: 'Leave empty for null',
        path: 'task_configuration.data_quality_configuration.compare_file_sizes_in_bytes.parameters.manifest_stats_df',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_sizes',
        indent: true
    },
    { 
        key: 'dq_compare_file_sizes_manifest_file_name_column', 
        label: '  └─ Manifest File Name Column', 
        type: 'text',
        placeholder: 'datafilename',
        path: 'task_configuration.data_quality_configuration.compare_file_sizes_in_bytes.parameters.manifest_file_name_column',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_sizes',
        indent: true
    },
    { 
        key: 'dq_compare_file_sizes_manifest_file_size_column', 
        label: '  └─ Manifest File Size Column', 
        type: 'text',
        placeholder: 'filesize',
        path: 'task_configuration.data_quality_configuration.compare_file_sizes_in_bytes.parameters.manifest_file_size_column',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_sizes',
        indent: true
    },
    { 
        key: 'dq_compare_file_sizes_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.compare_file_sizes_in_bytes.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_sizes',
        indent: true
    },
    { 
        key: 'dq_compare_file_sizes_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.compare_file_sizes_in_bytes.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_sizes',
        indent: true
    },
    
    { 
        key: 'dq_reconcile_file_set', 
        label: 'DQ Rule: Reconcile File Set', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'reconcile_file_set',
            parameters: {
                file_name_column: 'file_name',
                manifest_file_set: null
            },
            action: 'log',
            execution_stage: 'raw',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_reconcile_file_set_file_name_column', 
        label: '  └─ File Name Column', 
        type: 'text',
        placeholder: 'file_name',
        path: 'task_configuration.data_quality_configuration.reconcile_file_set.parameters.file_name_column',
        group: 'Data Quality Configuration',
        parentRule: 'dq_reconcile_file_set',
        indent: true
    },
    { 
        key: 'dq_reconcile_file_set_manifest_file_set', 
        label: '  └─ Manifest File Set', 
        type: 'text',
        placeholder: 'Leave empty for null',
        path: 'task_configuration.data_quality_configuration.reconcile_file_set.parameters.manifest_file_set',
        group: 'Data Quality Configuration',
        parentRule: 'dq_reconcile_file_set',
        indent: true
    },
    { 
        key: 'dq_reconcile_file_set_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.reconcile_file_set.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_reconcile_file_set',
        indent: true
    },
    { 
        key: 'dq_reconcile_file_set_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.reconcile_file_set.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_reconcile_file_set',
        indent: true
    },
    
    { 
        key: 'dq_check_column_count', 
        label: 'DQ Rule: Check Column Count', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'check_column_count',
            parameters: {
                expected_count: 0
            },
            action: 'log',
            execution_stage: 'transformed',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_check_column_count_expected_count', 
        label: '  └─ Expected Count', 
        type: 'number',
        placeholder: 'Enter expected column count',
        path: 'task_configuration.data_quality_configuration.check_column_count.parameters.expected_count',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_column_count',
        indent: true
    },
    {key: 'dq_check_column_count_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.check_column_count.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_column_count',
        indent: true
    },
    { 
        key: 'dq_check_column_count_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.check_column_count.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_column_count',
        indent: true
    },
    
    { 
        key: 'dq_check_schema_consistency', 
        label: 'DQ Rule: Check Schema Consistency', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'check_schema_consistency',
            parameters: {
                expected_schema: "<schema>"
            },
            action: 'log',
            execution_stage: 'transformed',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_check_schema_consistency_expected_schema', 
        label: '  └─ Expected Schema (JSON Array)', 
        type: 'textarea',
        placeholder: '[{"column_name": "col1", "data_type": "string"}]',
        path: 'task_configuration.data_quality_configuration.check_schema_consistency.parameters.expected_schema',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_schema_consistency',
        indent: true,
        isArray: true
    },
    { 
        key: 'dq_check_schema_consistency_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.check_schema_consistency.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_schema_consistency',
        indent: true
    },
    { 
        key: 'dq_check_schema_consistency_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.check_schema_consistency.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_schema_consistency',
        indent: true
    },
    
    { 
        key: 'dq_check_null', 
        label: 'DQ Rule: Check Null', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'check_null',
            target_column: '<column>',
            parameters: {},
            action: 'log',
            execution_stage: 'transformed',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_check_null_target_column', 
        label: '  └─ Target Column', 
        type: 'text',
        placeholder: 'Enter column name',
        path: 'task_configuration.data_quality_configuration.check_null.target_column',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_null',
        indent: true
    },
    { 
        key: 'dq_check_null_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.check_null.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_null',
        indent: true
    },
    { 
        key: 'dq_check_null_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.check_null.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_check_null',
        indent: true
    },
];

// Phase 2 specific key ordering
const phase2DatasourceConfigOrder = [
    's3_data_prefix',
    's3_manifest_prefix',
    'sql_file_path',
    'allow_duplicate_files_flag',
    'file_format',
    'spark_read_options',
    'file_timestamp_partition_flag',
    'source_partition_list'
];

const sparkReadOptionsOrder = [
    'delimiter',
    'header_flag',
    'read_mode',
    'ignoreCorruptFiles'
];

const phase2EndpointConfigOrder = [
    'table_name',
    'target_partition_list',
    'data_refresh_column_list',
    'save_mode',
    'partition_overwrite_flag',
    'fallout_table_name',
    'composite_key_level_fallout',
    'number_of_downstream_job_run_triggers',
    'number_of_partition_sets_to_pass_in_downstream'
];

const phase2DQRuleOrder = [
    'compare_file_sizes_in_bytes',
    'reconcile_file_set',
    'check_column_count',
    'check_schema_consistency',
    'check_null'
];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        phase2Fields,
        phase2DatasourceConfigOrder,
        sparkReadOptionsOrder,
        phase2EndpointConfigOrder,
        phase2DQRuleOrder
    };
}