const ddlInput = document.getElementById('ddlInput');
const parseBtn = document.getElementById('parseBtn');
const downloadBtn = document.getElementById('downloadBtn');

const columnsTbody = document.querySelector('#columnsTable tbody');
const partitionsTbody = document.querySelector('#partitionsTable tbody');

let parsedData = null; // store last parsed result

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



// parseBtn.addEventListener('click', () => {
//     const ddl = ddlInput.value;

//     fetch('/hive_parse', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ddl })
//     })
//     .then(response => response.json())
//     .then(data => {
//         parsedData = data; // save parsed data for download

//         columnsTbody.innerHTML = '';
//         (data.columns || []).forEach(col => {
//             const row = document.createElement('tr');
//             row.innerHTML = `<td>${col.field}</td><td>${col.original_type.toLowerCase()}</td><td>${col.databricks_type.toLowerCase()}</td>`;
//             columnsTbody.appendChild(row);
//         });

//     })
//     .catch(err => { console.error('Error parsing DDL:', err); });
// });

// downloadBtn.addEventListener('click', () => {
//     if (!parsedData) return alert('Please parse DDL first.');

//     let csvContent = '';
//     let iterator = 0;

//     const allCols = [...(parsedData.columns || []), ...(parsedData.partitions || [])];
//     allCols.forEach(col => {
//         csvContent += `_c${iterator}|${col.field}|${col.databricks_type.toLowerCase()}|\n`;
//         iterator++;
//     });

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${parsedData.table_name || 'table'}_columns.csv`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// });

parseBtn.addEventListener('click', () => {
    const ddl = ddlInput.value.trim();
    if (!ddl) return alert("Please paste DDL first.");

    fetch('/hive_parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ddl })
    })
    .then(response => response.json())
    .then(data => {
        parsedData = data; // save parsed data for download

        columnsTbody.innerHTML = '';

        // Extra system columns based on ingest frequency
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

        // Combine user columns + partitions + extra system columns
        const allCols = [
            ...(parsedData.columns || []),
            ...(parsedData.partitions || []),
            ...extraCols
        ];

        // Render all columns to table
        allCols.forEach(col => {
            const field = col.field || col.column; // support different property names
            const original_type = col.original_type || col.type || "string";
            const databricks_type = col.databricks_type || col.type || original_type;

            const row = document.createElement('tr');
            row.innerHTML = `<td>${field}</td><td>${original_type}</td><td>${databricks_type}</td>`;
            columnsTbody.appendChild(row);
        });

        // Save the full list for download
        parsedData.allCols = allCols;
    })
    .catch(err => { console.error('Error parsing DDL:', err); });
});


downloadBtn.addEventListener('click', () => {
    if (!parsedData || !parsedData.allCols || !parsedData.allCols.length) 
        return alert('Please parse DDL first.');

    let csvContent = 'iterator|fieldname|datatype\n';
    
    parsedData.allCols.forEach((col, idx) => {
        const field = col.field || col.column; // support different property names
        // Prefer databricks_type, fallback to type or original_type
        const datatype = col.databricks_type || col.type || col.original_type || 'string';

        csvContent += `_c${idx}|${field}|${datatype}|\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${parsedData.table_name || 'table'}_columns.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
