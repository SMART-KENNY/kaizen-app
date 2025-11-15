// Phase 1 Configuration Fields
const phase1Fields = [
    { 
        key: 'application_name', 
        label: 'Application Name', 
        type: 'text', 
        placeholder: 'e.g., OPTIMA - opt_dly_descriptions',
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
    
    // Datasource Configuration - Phase 1
    { 
        key: 'datasource_s3_data_bucket_key', 
        label: 'S3 Data Bucket Key', 
        type: 'text', 
        placeholder: 'landing_bucket_name',
        path: 'task_configuration.datasource_configuration.s3_data_bucket_key',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_in_process_data_prefix', 
        label: 'S3 In-Process Data Prefix', 
        type: 'text', 
        placeholder: 'opt_dly_descriptions/in_process/',
        path: 'task_configuration.datasource_configuration.s3_in_process_data_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_reprocessing_data_prefix', 
        label: 'S3 Reprocessing Data Prefix', 
        type: 'text', 
        placeholder: 'opt_dly_descriptions/reprocessing/',
        path: 'task_configuration.datasource_configuration.s3_reprocessing_data_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_manifest_bucket_key', 
        label: 'S3 Manifest Bucket Key', 
        type: 'text', 
        placeholder: 'monitoring_bucket_name',
        path: 'task_configuration.datasource_configuration.s3_manifest_bucket_key',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_in_process_manifest_prefix', 
        label: 'S3 In-Process Manifest Prefix', 
        type: 'text', 
        placeholder: 'manifests/source_manifest/opt_dly_descriptions/in_process/',
        path: 'task_configuration.datasource_configuration.s3_in_process_manifest_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_s3_reprocessing_manifest_prefix', 
        label: 'S3 Reprocessing Manifest Prefix', 
        type: 'text', 
        placeholder: 'manifests/source_manifest/opt_dly_descriptions/reprocessing/',
        path: 'task_configuration.datasource_configuration.s3_reprocessing_manifest_prefix',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_sql_file_path', 
        label: 'SQL File Path', 
        type: 'text', 
        placeholder: './cu/sql/opt_dly_descriptions.sql',
        path: 'task_configuration.datasource_configuration.sql_file_path',
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
        key: 'datasource_delimiter', 
        label: 'Delimiter', 
        type: 'text', 
        placeholder: 'Leave empty for parquet',
        path: 'task_configuration.datasource_configuration.delimiter',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_header_flag', 
        label: 'Header Flag', 
        type: 'select', 
        options: ['true', 'false'],
        path: 'task_configuration.datasource_configuration.header_flag',
        group: 'Datasource Configuration'
    },
    { 
        key: 'datasource_read_mode', 
        label: 'Read Mode', 
        type: 'select', 
        options: ['FAILFAST', 'PERMISSIVE', 'DROPMALFORMED'],
        path: 'task_configuration.datasource_configuration.read_mode',
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
    
    // Endpoint Configuration - Phase 1
    { 
        key: 'endpoint_table_name', 
        label: 'Table Name', 
        type: 'text', 
        placeholder: 'wde.cu_b.opt_dly_descriptions',
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
        placeholder: 'txn_date, file_date, file_name',
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
    
    // Data Standardization - Phase 1
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
    
    // Data Quality Configuration - Phase 1
    { 
        key: 'dq_compare_row_count', 
        label: 'DQ Rule: Compare Row Count', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'compare_row_count',
            parameters: {
                expected_value: null
            },
            action: 'log',
            execution_stage: 'raw',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_compare_row_count_expected_value', 
        label: '  └─ Expected Value', 
        type: 'number',
        placeholder: 'Enter expected row count or leave empty for null',
        path: 'task_configuration.data_quality_configuration.compare_row_count.parameters.expected_value',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_row_count',
        indent: true
    },
    { 
        key: 'dq_compare_row_count_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.compare_row_count.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_row_count',
        indent: true
    },
    { 
        key: 'dq_compare_row_count_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.compare_row_count.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_row_count',
        indent: true
    },

    { 
        key: 'dq_compare_file_size', 
        label: 'DQ Rule: Compare File Size in Bytes', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'compare_file_size_in_bytes',
            parameters: {
                actual_size: null,
                expected_size: null
            },
            action: 'log',
            execution_stage: 'raw',
            send_email_notifications: false,
            send_teams_notifications: true,
            raise_servicenow_tickets: false
        }
    },
    { 
        key: 'dq_compare_file_size_actual', 
        label: '  └─ Actual Size', 
        type: 'number',
        placeholder: 'Leave empty for null',
        path: 'task_configuration.data_quality_configuration.compare_file_size_in_bytes.parameters.actual_size',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_size',
        indent: true
    },
    { 
        key: 'dq_compare_file_size_expected', 
        label: '  └─ Expected Size', 
        type: 'number',
        placeholder: 'Leave empty for null',
        path: 'task_configuration.data_quality_configuration.compare_file_size_in_bytes.parameters.expected_size',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_size',
        indent: true
    },
    { 
        key: 'dq_compare_file_size_action', 
        label: '  └─ Action', 
        type: 'select',
        options: ['log', 'warn', 'fail'],
        path: 'task_configuration.data_quality_configuration.compare_file_size_in_bytes.action',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_size',
        indent: true
    },
    { 
        key: 'dq_compare_file_size_execution_stage', 
        label: '  └─ Execution Stage', 
        type: 'select',
        options: ['raw', 'transformed', 'final'],
        path: 'task_configuration.data_quality_configuration.compare_file_size_in_bytes.execution_stage',
        group: 'Data Quality Configuration',
        parentRule: 'dq_compare_file_size',
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
        key: 'dq_check_column_count', 
        label: 'DQ Rule: Check Column Count', 
        type: 'checkbox-group',
        path: 'task_configuration.data_quality_configuration',
        group: 'Data Quality Configuration',
        ruleTemplate: {
            rule_name: 'check_column_count',
            parameters: {
                expected_count: "<expected_count>"
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
    { 
        key: 'dq_check_column_count_action', 
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

// Phase 1 specific key ordering
const phase1DatasourceConfigOrder = [
    's3_data_bucket_key',
    's3_in_process_data_prefix',
    's3_reprocessing_data_prefix',
    's3_manifest_bucket_key',
    's3_in_process_manifest_prefix',
    's3_reprocessing_manifest_prefix',
    'sql_file_path',
    'file_format',
    'delimiter',
    'header_flag',
    'read_mode',
    'file_timestamp_partition_flag',
    'source_partition_list'
];

const phase1EndpointConfigOrder = [
    'table_name',
    'target_partition_list',
    'data_refresh_column_list',
    'save_mode',
    'partition_overwrite_flag'
];

const phase1DQRuleOrder = [
    'compare_row_count',
    'compare_file_size_in_bytes',
    'reconcile_file_set',
    'check_schema_consistency',
    'check_column_count',
    'check_null'
];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        phase1Fields,
        phase1DatasourceConfigOrder,
        phase1EndpointConfigOrder,
        phase1DQRuleOrder
    };
}