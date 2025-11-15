document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById('ddlEditor');
    const formatBtn = document.getElementById('formatSqlBtn');
    const copyBtn = document.getElementById('copySqlBtn');
    const downloadBtn = document.getElementById('downloadSqlBtn');

    // TAB key support
    editor.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault();

            const start = this.selectionStart;
            const end = this.selectionEnd;

            // Set textarea value to: text before caret + tab + text after caret
            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

            // Put caret at right position again
            this.selectionStart = this.selectionEnd = start + 1;
        }
    });

    // Copy SQL to clipboard
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(editor.value)
            .then(() => {
                alert('SQL copied to clipboard!');
            })
            .catch(err => alert('Failed to copy: ' + err));
    });

    // Download as .sql file
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([editor.value], { type: 'text/sql' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'query.sql';
        link.click();
    });

    // Basic SQL formatter (just indenting keywords)
    formatBtn.addEventListener('click', () => {
        const keywords = [
            "SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
            "GROUP BY", "ORDER BY", "HAVING", "UNION", "ON", "AS", "INTO", "VALUES", "INSERT INTO",
            "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "DROP", "ALTER", "ADD"
        ];

        let sql = editor.value;

        keywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            sql = sql.replace(regex, `\n${word}`);
        });

        // Basic cleanup
        sql = sql.replace(/\n{2,}/g, '\n').trim();

        editor.value = sql;
    });
});
