from flask import Flask, request, jsonify, render_template
import os
import pandas as pd
import re
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import sqlparse

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'csv', 'txt', 'xlsx', 'xls', 'ddl', 'sql'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_delimiter(file_path):
    """Detect delimiter from file content"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            first_line = f.readline().strip()
            
        # Count occurrences of common delimiters
        delimiters = {
            '|': first_line.count('|'),
            '~': first_line.count('~'),
            ',': first_line.count(','),
            '\t': first_line.count('\t'),
            ';': first_line.count(';')
        }
        
        # Return delimiter with highest count (must have at least 1)
        max_delim = max(delimiters, key=delimiters.get)
        return max_delim if delimiters[max_delim] > 0 else ','
    except:
        return ','

def parse_ddl_format(file_path, delimiter):
    """Parse DDL format files - supports both 3-column and 4-column formats"""
    fields = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Split by delimiter
                parts = [p.strip() for p in line.split(delimiter)]
                
                # Check if it's 4-column format (iterator, field_name, data_type, description)
                if len(parts) >= 4:
                    iterator = parts[0]
                    field_name = parts[1]
                    data_type = parts[2]
                    comment = parts[3] if len(parts) > 3 else ''
                    
                    # Skip if field name is empty
                    if not field_name or not data_type:
                        continue
                    
                    fields.append({
                        'iterator': iterator,
                        'name': field_name,
                        'type': data_type,
                        'comment': comment
                    })
                
                # Handle 3-column format (field_name, data_type, description)
                elif len(parts) >= 2:
                    field_name = parts[0]
                    data_type = parts[1]
                    comment = parts[2] if len(parts) > 2 else ''
                    
                    # Skip if field name is empty
                    if not field_name:
                        continue
                    
                    # If data type is empty, default to string
                    if not data_type:
                        data_type = 'string'
                    
                    fields.append({
                        'iterator': None,  # No iterator in 3-column format
                        'name': field_name,
                        'type': data_type,
                        'comment': comment
                    })
                    
    except Exception as e:
        print(f"Error parsing DDL format: {str(e)}")
        return None
    
    return fields

def parse_csv_format(file_path, delimiter):
    """Parse CSV format files with header detection"""
    try:
        # Try reading with pandas
        df = pd.read_csv(file_path, sep=delimiter, nrows=5, encoding='utf-8', 
                        on_bad_lines='skip', header=None)
        
        # Check if first row looks like a header
        first_row = df.iloc[0].tolist()
        has_header = all(isinstance(val, str) and not str(val).replace('.', '').isdigit() 
                        for val in first_row if pd.notna(val))
        
        if has_header:
            df = pd.read_csv(file_path, sep=delimiter, nrows=5, encoding='utf-8', 
                           on_bad_lines='skip')
        
        fields = []
        for col in df.columns:
            # Infer data type from sample data
            dtype = infer_data_type(df[col])
            fields.append({
                'iterator': None,
                'name': str(col).strip(),
                'type': dtype,
                'comment': ''
            })
        
        return fields
    
    except Exception as e:
        print(f"Error parsing CSV format: {str(e)}")
        return None

def parse_uploaded_file(file_path, filename):
    """Parse uploaded file and extract field information"""
    try:
        # Handle Excel files
        if filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path, nrows=100)  # Read more rows to detect format
            
            # Check if it's 4-column format (iterator, field_name, type, description)
            if len(df.columns) >= 4:
                first_row = df.iloc[0].tolist()
                
                # Check if first column looks like iterator (_c0, _c1, etc.)
                if pd.notna(first_row[0]) and str(first_row[0]).strip().startswith('_c'):
                    # It's 4-column format
                    fields = []
                    for _, row in df.iterrows():
                        values = row.tolist()
                        if len(values) >= 4 and pd.notna(values[1]) and pd.notna(values[2]):
                            iterator = str(values[0]).strip() if pd.notna(values[0]) else ''
                            field_name = str(values[1]).strip()
                            data_type = str(values[2]).strip()
                            comment = str(values[3]).strip() if pd.notna(values[3]) else ''
                            
                            fields.append({
                                'iterator': iterator,
                                'name': field_name,
                                'type': data_type,
                                'comment': comment
                            })
                    return fields
            
            # Check if it's 3-column DDL format (name, type, description)
            if len(df.columns) >= 2:
                first_row = df.iloc[0].tolist()
                
                # Check if it looks like DDL format (column names are generic)
                if all(str(col).startswith('Unnamed') or isinstance(col, int) 
                      for col in df.columns[:2]):
                    # It's 3-column DDL format without headers
                    fields = []
                    for _, row in df.iterrows():
                        values = row.tolist()
                        if len(values) >= 2 and pd.notna(values[0]) and pd.notna(values[1]):
                            comment = values[2] if len(values) > 2 and pd.notna(values[2]) else ''
                            fields.append({
                                'iterator': None,
                                'name': str(values[0]).strip(),
                                'type': str(values[1]).strip(),
                                'comment': str(comment).strip()
                            })
                    return fields
            
            # Regular CSV format with headers
            fields = []
            for col in df.columns:
                dtype = infer_data_type(df[col])
                fields.append({
                    'iterator': None,
                    'name': str(col).strip(),
                    'type': dtype,
                    'comment': ''
                })
            return fields
        
        # Handle text files (CSV, TXT, DDL, SQL)
        delimiter = detect_delimiter(file_path)
        
        # First, try parsing as DDL format (handles both 3 and 4 column)
        fields = parse_ddl_format(file_path, delimiter)
        
        # If DDL parsing failed or returned empty, try CSV format
        if not fields:
            fields = parse_csv_format(file_path, delimiter)
        
        return fields
    
    except Exception as e:
        print(f"Error parsing file: {str(e)}")
        return None

def infer_data_type(series):
    """Infer SQL data type from pandas series"""
    try:
        # Remove null values
        series = series.dropna()
        
        if len(series) == 0:
            return 'string'
        
        # Check if all values are numeric
        if pd.api.types.is_integer_dtype(series):
            max_val = series.max()
            if max_val <= 2147483647:  # int max
                return 'int'
            else:
                return 'bigint'
        elif pd.api.types.is_float_dtype(series):
            return 'double'
        elif pd.api.types.is_bool_dtype(series):
            return 'boolean'
        elif pd.api.types.is_datetime64_any_dtype(series):
            return 'timestamp'
        else:
            # Try to infer from string patterns
            sample = str(series.iloc[0])
            
            # Check for date patterns
            if re.match(r'^\d{4}-\d{2}-\d{2}', sample):
                return 'date'
            # Check for timestamp patterns
            elif re.match(r'^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', sample):
                return 'timestamp'
            # Check for decimal patterns
            elif re.match(r'^-?\d+\.\d+$', sample):
                return 'decimal(18,2)'
            # Check for integer patterns
            elif re.match(r'^-?\d+$', sample):
                return 'bigint'
            else:
                return 'string'
    except:
        return 'string'



def ora_extract_columns_from_text(content):
    """Extract columns from Oracle CREATE TABLE DDL text"""

    results = []
    table_pattern = re.compile(
        r'CREATE\s+TABLE\s+"?([^"\s]+)"?\."?([^"\s(]+)"?\s*\((.*?)\)\s*(?:SEGMENT|PCTFREE|STORAGE|TABLESPACE|STORED|LOCATION|TBLPROPERTIES|;)',
        re.IGNORECASE | re.DOTALL
    )

    for match in table_pattern.finditer(content):
        schema = match.group(1)
        table_name = match.group(2)
        table_definition = match.group(3)

        columns = []

        parts = []
        current_part = ""
        paren_count = 0

        for char in table_definition:
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
            elif char == ',' and paren_count == 0:
                parts.append(current_part.strip())
                current_part = ""
                continue
            current_part += char

        if current_part.strip():
            parts.append(current_part.strip())

        for part in parts:
            if re.match(r'\s*CONSTRAINT\s+', part, re.IGNORECASE):
                continue

            # column_match = re.match(r'"([^"]+)"\s+([A-Z0-9_().,\s]+)', part, re.IGNORECASE)
            column_match = re.match(r'"?([\w\d_]+)"?\s+([A-Z0-9_().,]+)', part.strip(), re.IGNORECASE)
            if column_match:
                name = column_match.group(1).strip()
                data_type_raw = column_match.group(2).strip()

                data_type_match = re.match(
                    r'((?:NUMBER|VARCHAR2|CHAR|DATE|TIMESTAMP|CLOB|BLOB|RAW|LONG|ROWID|UROWID|'
                    r'BINARY_FLOAT|BINARY_DOUBLE|NVARCHAR2|NCHAR|NCLOB|XMLTYPE|BFILE)\s*(?:\([^)]+\))?)',
                    data_type_raw,
                    re.IGNORECASE
                )

                if data_type_match:
                    data_type = data_type_match.group(1).strip()
                else:
                    data_type = data_type_raw.split()[0]

                columns.append({
                    "column": name.lower(),
                    "type": data_type.lower()
                })

        results.append({
            "schema": schema.lower(),
            "table": table_name.lower(),
            "columns": columns
        })

    return results



def hive_to_databricks_type(hive_type: str) -> str:
    """
    Convert Hive data types to Databricks-friendly data types.
    """
    t = hive_type.lower().strip()

    # Map decimal(precision, scale)
    decimal_match = re.match(r'decimal\((\d+),\s*(\d+)\)', t)
    if decimal_match:
        precision, scale = decimal_match.groups()
        if scale == '0':
            return 'bigint'
        return f'decimal({precision},{scale})'

    # Map string-like types
    if re.match(r'(varchar|char)', t):
        return 'string'

    # Map numeric types
    if re.match(r'(integer|bigint|smallint|tinyint|number|numeric)', t):
        return 'bigint'

    # Keep everything else as-is
    return t

def parse_hive_ddl(ddl_text):
    """
    Parse Hive DDL including complex types and table options.
    """
    result = {
        "columns": [],
        "partitions": [],
        "table_type": "MANAGED",
        "table_name": "",
        "stored_as": "",
        "location": "",
        "input_format": "",
        "output_format": ""
    }

    ddl_text = ddl_text.strip()

    # Detect table type
    if re.search(r'CREATE\s+EXTERNAL\s+TABLE', ddl_text, re.IGNORECASE):
        result["table_type"] = "EXTERNAL"

    # Extract table name
    table_name_match = re.search(
        r'CREATE\s+(EXTERNAL\s+)?TABLE\s+(IF\s+NOT\s+EXISTS\s+)?`?([\w.]+)`?',
        ddl_text, re.IGNORECASE
    )
    if table_name_match:
        result["table_name"] = table_name_match.group(3)

    # Extract columns block by balancing parentheses
    start = ddl_text.find('(')
    if start != -1:
        parens = 0
        end = start
        for i, c in enumerate(ddl_text[start:]):
            if c == '(':
                parens += 1
            elif c == ')':
                parens -= 1
            if parens == 0:
                end = start + i
                break
        columns_block = ddl_text[start+1:end].strip()
        table_options = ddl_text[end+1:].strip()

        # Split by commas outside parentheses
        def split_columns(text):
            cols = []
            parens = 0
            current = ''
            for c in text:
                if c == '(':
                    parens += 1
                elif c == ')':
                    parens -= 1
                if c == ',' and parens == 0:
                    cols.append(current.strip())
                    current = ''
                else:
                    current += c
            if current.strip():
                cols.append(current.strip())
            return cols

        # Parse columns
        for line in split_columns(columns_block):
            line = re.sub(r'--.*', '', line)
            line = re.sub(r'/\*.*?\*/', '', line)
            col_match = re.match(r'`?(\w+)`?\s+([^\s]+.*)', line)
            if col_match:
                col_name, col_type = col_match.groups()
                db_type = hive_to_databricks_type(col_type.strip())
                result["columns"].append({
                    "field": col_name.strip(),
                    "original_type": col_type.strip(),
                    "databricks_type": db_type
                })

        # Table options
        stored_as_match = re.search(r'STORED AS\s+(\w+)', table_options, re.IGNORECASE)
        if stored_as_match:
            result["stored_as"] = stored_as_match.group(1).upper()

        location_match = re.search(r"LOCATION\s+'([^']+)'", table_options, re.IGNORECASE)
        if location_match:
            result["location"] = location_match.group(1)

        inputformat_match = re.search(r"INPUTFORMAT\s+'([^']+)'", table_options, re.IGNORECASE)
        if inputformat_match:
            result["input_format"] = inputformat_match.group(1)

        outputformat_match = re.search(r"OUTPUTFORMAT\s+'([^']+)'", table_options, re.IGNORECASE)
        if outputformat_match:
            result["output_format"] = outputformat_match.group(1)

        # Partitioned by
        partition_match = re.search(r'PARTITIONED BY\s*\((.*?)\)', table_options, re.IGNORECASE | re.DOTALL)
        if partition_match:
            partition_block = partition_match.group(1)
            for line in split_columns(partition_block):
                line = re.sub(r'--.*', '', line)
                line = re.sub(r'/\*.*?\*/', '', line)
                col_match = re.match(r'`?(\w+)`?\s+([^\s]+.*)', line)
                if col_match:
                    col_name, col_type = col_match.groups()
                    db_type = hive_to_databricks_type(col_type.strip())
                    result["partitions"].append({
                        "field": col_name.strip(),
                        "original_type": col_type.strip(),
                        "databricks_type": db_type
                    })

    return result






def ddl_databricks_type(orig_type):
    mapping = {
        'string': 'STRING',
        'int': 'INT',
        'bigint': 'BIGINT',
        'double': 'DOUBLE',
        'float': 'FLOAT',
        'boolean': 'BOOLEAN',
        'timestamp': 'TIMESTAMP'
    }
    return mapping.get(orig_type.lower(), orig_type.upper())



@app.route('/')
def index():
    return render_template('main_page.html')

@app.route('/daily')
def phase2():
    return render_template('app_5.html')

@app.route('/notfound')
def notfound():
    return render_template('notfound.html')

@app.route('/hourly')
def phase2Houry():
    return render_template('hourly.html')

@app.route('/reference')
def reference():
    return render_template('reference.html')

@app.route('/app_phase1')
def phase1():
    return render_template('app_phase1.html')

@app.route('/upload_fields', methods=['POST'])
def upload_fields():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload CSV, TXT, XLSX, DDL, or SQL files.'}), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = 'temp_uploads'
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        # Parse the file
        fields = parse_uploaded_file(temp_path, filename)
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
        
        if fields and len(fields) > 0:
            return jsonify({
                'fields': fields, 
                'count': len(fields),
                'message': f'Successfully parsed {len(fields)} fields'
            })
        else:
            return jsonify({'error': 'No valid fields found in file. Please check the file format.'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500


@app.route('/save', methods=['POST'])
def save():
    data = request.get_json()

    table_name = data.get('table_name', 'unnamed_table')
    application_name = data.get('application_name', 'application')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    save_dir = 'saved_sql'
    os.makedirs(save_dir, exist_ok=True)

    saved_files = []

    # Save SQL file
    sql_filename = f'{table_name}_{timestamp}.sql'
    sql_content = f"-- Application: {application_name}\n" \
                  f"-- Workspace: {data.get('workspace')}\n" \
                  f"-- Pipeline: {data.get('pipeline')}\n" \
                  f"-- Data Domain: {data.get('data_domain')}\n\n" \
                  f"{data.get('select_sql')}\n\n{data.get('ddl_sql')}"

    with open(os.path.join(save_dir, sql_filename), 'w') as f:
        f.write(sql_content)
    saved_files.append(sql_filename)

    # Save Simple JSON config file
    simple_json_filename = f'{table_name}_{timestamp}_simple_config.json'
    simple_json_content = data.get('simple_json_config', '')
    
    if simple_json_content:
        try:
            json_obj = json.loads(simple_json_content)
            with open(os.path.join(save_dir, simple_json_filename), 'w') as f:
                json.dump(json_obj, f, indent=2)
            saved_files.append(simple_json_filename)
        except json.JSONDecodeError:
            with open(os.path.join(save_dir, simple_json_filename), 'w') as f:
                f.write(simple_json_content)
            saved_files.append(simple_json_filename)

    # Save Full config file
    full_config_filename = f'{table_name}_{timestamp}_full_config.json'
    full_config_content = data.get('full_config', '')
    
    if full_config_content:
        try:
            json_obj = json.loads(full_config_content)
            with open(os.path.join(save_dir, full_config_filename), 'w') as f:
                json.dump(json_obj, f, indent=2)
            saved_files.append(full_config_filename)
        except json.JSONDecodeError:
            with open(os.path.join(save_dir, full_config_filename), 'w') as f:
                f.write(full_config_content)
            saved_files.append(full_config_filename)

    return jsonify({
        "message": f"✅ Successfully saved {len(saved_files)} files",
        "files": saved_files
    })





# ADDITIONAL FUNCTIONALITY TO UI BELOW
@app.route("/oracle_ddl_formatter")
def ora_dll():
    return render_template("oracle_ddl_formatter.html")

@app.route("/ora_parse", methods=["POST"])
def ora_dll_parse():
    ddl_text = request.json.get("ddl", "")
    parsed = ora_extract_columns_from_text(ddl_text)
    return jsonify(parsed)

@app.route('/hive_ddl_formatter')
def hive_dll():
    return render_template('hive_ddl_formatter.html')

@app.route('/hive_parse', methods=['POST'])
def hive_parse():
    ddl_text = request.json.get('ddl', '')
    parsed_result = parse_hive_ddl(ddl_text)
    return jsonify(parsed_result)




@app.route('/ddl_only_formatter')
def ddl_formatter():
    return render_template('ddl_only_formatter.html')

@app.route('/ddl_only_formatter', methods=['POST'])
def ddl_only_formatter():
    data = request.get_json(force=True) or {}
    fields_text = data.get('fields', '')
    columns = []
    for line in fields_text.strip().split('\n'):
        parts = line.strip().split()
        if len(parts) >= 2:
            field, orig_type = parts[0], parts[1]
            db_type = hive_to_databricks_type(orig_type)
            columns.append({
                'field': field,
                'original_type': orig_type,
                'databricks_type': db_type.lower()
            })
    return jsonify(columns=columns)


if __name__ == '__main__':
    app.run(debug=True)