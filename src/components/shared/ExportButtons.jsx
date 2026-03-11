const ExportButtons = ({ data, filename = "export.csv" }) => {
    const handleCSV = () => {
        if (!data || data.length === 0) {
            alert("No data to export");
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        csvRows.push(headers.map(header => `"${header}"`).join(","));
        
        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                const escaped = (val === null || val === undefined) ? "" : String(val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }
        
        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary-btn" onClick={handleCSV} style={{ fontSize: "12px" }}>
                Export CSV
            </button>
        </div>
    );
};

export default ExportButtons;
