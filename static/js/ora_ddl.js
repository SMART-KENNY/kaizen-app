let lastParsedData = []; // store parsed results for export
let f_table_name = "";

const typeSelector = document.getElementById('typeSelector');
let ingest_freq = "";
typeSelector.addEventListener('change', () => {
    ingest_freq = typeSelector.value;
    console.log('Selected ingest frequency:', ingest_freq);
});

// ---------------------------------------------
// Parse Button
// ---------------------------------------------
document.getElementById("parse_btn").addEventListener("click", async () => {
    const ddlText = document.getElementById("ddl_input").value.trim();
    if (!ddlText) return alert("Please paste DDL first.");

    try {
        const response = await fetch("/ora_parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ddl: ddlText })
        });

        const data = await response.json();
        lastParsedData = data; // store parsed results

        // Determine extra columns based on ingest frequency
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

        // Append extraCols to each table in parsed data
        lastParsedData.forEach(table => {
            table.allCols = [
                ...(table.columns || []),
                ...(table.partitions || []),
                ...extraCols
            ];
        });

        displayResult(lastParsedData);

        // Show download button if data exists
        document.getElementById("download_btn").style.display = lastParsedData.length ? "inline-block" : "none";

    } catch (err) {
        console.error("Error parsing DDL:", err);
        alert("Failed to parse DDL. Check console for details.");
    }
});

// ---------------------------------------------
// Datatype Transformer (Oracle → Databricks)
// ---------------------------------------------
function transformToDatabricksType(type) {
    if (!type) return "string"; // fallback for extraCols

    const t = type.toUpperCase().trim();

    if (/^(VARCHAR2|VARCHAR|NVARCHAR2|CHAR|NCHAR)/.test(t)) return "string";
    if (/^TIMESTAMP/.test(t)) return "timestamp";
    if (/^(TINYINT|SMALLINT)$/.test(t)) return "int";
    if (/^NUMBER/.test(t)) return "bigint";

    const decimalMatch = t.match(/^DECIMAL\s*\((\d+),\s*(\d+)\)/);
    if (decimalMatch) {
        const scale = parseInt(decimalMatch[2]);
        return scale === 0 ? "bigint" : t;
    }

    return t.toLowerCase();
}

// ---------------------------------------------
// UI Display (includes original + transformed)
// ---------------------------------------------
function displayResult(data) {
    const container = document.getElementById("result");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<p>No CREATE TABLE statements found.</p>";
        return;
    }

    data.forEach(table => {
        const block = document.createElement("div");
        block.classList.add("table-block");

        f_table_name = `${table.schema}.${table.table}`;

        block.innerHTML = `
            <h3>${f_table_name}</h3>
            <table>
                <tr>
                    <th>Column Name</th>
                    <th>Original Datatype</th>
                    <th>Databricks Datatype</th>
                </tr>
                ${table.allCols.map(c => `
                    <tr>
                        <td>${c.column || c.field}</td>
                        <td>${c.type || c.original_type || ""}</td>
                        <td>${transformToDatabricksType(c.type || c.original_type)}</td>
                    </tr>
                `).join('')}
            </table>
        `;

        container.appendChild(block);
    });
}

// ---------------------------------------------
// DOWNLOAD — ONLY TRANSFORMED DATATYPE
// ---------------------------------------------
document.getElementById("download_btn").addEventListener("click", () => {
    if (!lastParsedData.length) return;

    let output = "iterator|fieldname|datatype\n";
    let counter = 0;

    lastParsedData.forEach(table => {
        (table.allCols || []).forEach(col => {
            const transformed = transformToDatabricksType(col.type || col.original_type);
            output += `_c${counter}|${(col.column || col.field).toLowerCase()}|${transformed}|\n`;
            counter++;
        });
    });

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = f_table_name
        ? `${f_table_name.replace(/\./g, "_")}.txt`
        : "ddl_columns.txt";

    a.click();
    URL.revokeObjectURL(url);
});
