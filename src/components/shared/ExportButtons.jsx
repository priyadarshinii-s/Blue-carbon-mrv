const ExportButtons = ({ data, filename = "export" }) => {
    const handleCSV = () => {
        alert("CSV export: Would generate CSV from filtered data and download. (PapaParse integration pending)");
    };

    const handlePDF = () => {
        alert("PDF export: Would generate formatted PDF report using jsPDF + html2canvas. (Integration pending)");
    };

    return (
        <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary-btn" onClick={handleCSV} style={{ fontSize: "12px" }}>
                Export CSV
            </button>
            <button className="secondary-btn" onClick={handlePDF} style={{ fontSize: "12px" }}>
                Export PDF
            </button>
        </div>
    );
};

export default ExportButtons;
