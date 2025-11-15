let phase2_config = `{
    KENNY: applicationName,
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
`
;

window.variable1_from_file2 = phase2_config;
