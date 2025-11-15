const ddlInput = document.getElementById('ddlInput');
const parseBtn = document.getElementById('parseBtn');
const downloadBtn = document.getElementById('downloadBtn');
const columnsTbody = document.querySelector('#columnsTable tbody');

let parsedData = null;




const typeSelector = document.getElementById('typeSelector');
let ingest_freq = ""
// Listen for changes
typeSelector.addEventListener('change', () => {
    const selectedValue = typeSelector.value;       // e.g., "databricks"
    const selectedText = typeSelector.options[typeSelector.selectedIndex].text; // e.g., "Databricks"
    
    console.log('Selected Value:', selectedValue);
    console.log('Selected Text:', selectedText);
    ingest_freq = selectedValue;
    // You can call a function here to update your parser logic based on the selection
    // updateParser(selectedValue);
});



// Function to clean a line: remove special chars but keep commas inside parentheses
function cleanLine(line) {
    let result = '';
    let parens = 0;
    for (let char of line) {
        if (char === '(') parens++;
        if (char === ')') parens--;
        if (/[a-zA-Z0-9_\s]/.test(char) || (char === ',' && parens > 0) || char === '(' || char === ')') {
            result += char;
        }
        // everything else is skipped
    }
    return result.trim();
}

parseBtn.addEventListener('click', () => {
    const fieldsText = ddlInput.value.trim();
    if (!fieldsText) return alert("Please paste fields first.");

    const cleanedFields = fieldsText
        .split('\n')
        .map(line => cleanLine(line))
        .filter(line => line.length > 0)
        .join('\n');

    fetch('/ddl_only_formatter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: cleanedFields })
    })
    .then(resp => resp.json())
    .then(data => {
        parsedData = data;
        columnsTbody.innerHTML = '';

        // Add user-pasted columns first
        (data.columns || []).forEach((col, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${col.field}</td><td>${col.original_type}</td><td>${col.databricks_type}</td>`;
            columnsTbody.appendChild(row);
        });

        // Add additional system columns based on ingest_freq
        const extraCols = (ingest_freq === "hourly")
            ? [
                { field: "file_timestamp_bucket", type: "timestamp" },
                { field: "dbx_process_dttm", type: "timestamp" },
                { field: "file_name", type: "string" },
                { field: "file_id", type: "string" }
            ]
            : [
                { field: "file_date", type: "date" },
                { field: "dbx_process_dttm", type: "timestamp" },
                { field: "file_name", type: "string" },
                { field: "file_id", type: "string" }
            ];

        extraCols.forEach(col => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${col.field}</td><td>${col.type}</td><td>${col.type}</td>`;
            columnsTbody.appendChild(row);
        });
    })
    .catch(err => console.error('Parsing error:', err));
});


// downloadBtn.addEventListener('click', () => {
//     if (!parsedData || !parsedData.columns.length) return alert('Please parse first.');

//     let csvContent = '';
//     parsedData.columns.forEach((col, idx) => {
//         csvContent += `_c${idx}|${col.field}|${col.databricks_type}\n`;
//     });

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `ddl_only.txt`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// });



downloadBtn.addEventListener('click', () => {
    if (!parsedData || !parsedData.columns.length) return alert('Please parse first.');

    let csvContent = '';
    const allColumns = [...parsedData.columns];

    // Add extra system columns based on ingest_freq
    const extraCols = (ingest_freq === "hourly")
        ? [
            { field: "file_timestamp_bucket", type: "timestamp" },
            { field: "dbx_process_dttm", type: "timestamp" },
            { field: "file_name", type: "string" },
            { field: "file_id", type: "string" }
        ]
        : [
            { field: "file_date", type: "date" },
            { field: "dbx_process_dttm", type: "timestamp" },
            { field: "file_name", type: "string" },
            { field: "file_id", type: "string" }
        ];

    allColumns.push(...extraCols.map(c => ({ field: c.field, databricks_type: c.type })));

    // Build CSV
    allColumns.forEach((col, idx) => {
        csvContent += `_c${idx}|${col.field}|${col.databricks_type}|\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ddl_only.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
