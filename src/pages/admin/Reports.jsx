import { useState } from "react";
import ExportButtons from "../../components/shared/ExportButtons";
import StatusBadge from "../../components/shared/StatusBadge";

const reportData = [
  { project: "Mangrove Restoration – TN", year: 2025, credits: 120, type: "Mangrove", status: "minted" },
  { project: "Mangrove Restoration – TN", year: 2026, credits: 85, type: "Mangrove", status: "approved" },
  { project: "Seagrass Revival – Kerala", year: 2025, credits: 45, type: "Seagrass", status: "minted" },
  { project: "Saltmarsh Recovery – Gujarat", year: 2025, credits: 85, type: "Salt Marsh", status: "minted" },
  { project: "Saltmarsh Recovery – Gujarat", year: 2026, credits: 55, type: "Salt Marsh", status: "pending" },
  { project: "Mangrove Belt – Odisha", year: 2025, credits: 200, type: "Mangrove", status: "minted" },
  { project: "Coastal Wetland – WB", year: 2025, credits: 310, type: "Mangrove", status: "minted" },
  { project: "Delta Mangrove – Sundarbans", year: 2026, credits: 180, type: "Mangrove", status: "approved" },
  { project: "Tidal Flat Restoration – AP", year: 2026, credits: 55, type: "Salt Marsh", status: "pending" },
];

const officerPerformance = [
  { name: "Arun Kumar", submissions: 24, approved: 20, rejected: 2, pending: 2, rate: "83%" },
  { name: "Vikram Singh", submissions: 18, approved: 16, rejected: 1, pending: 1, rate: "89%" },
  { name: "Lakshmi Nair", submissions: 15, approved: 13, rejected: 1, pending: 1, rate: "87%" },
  { name: "Priya Devi", submissions: 12, approved: 10, rejected: 0, pending: 2, rate: "83%" },
  { name: "Ravi Kumar", submissions: 8, approved: 6, rejected: 1, pending: 1, rate: "75%" },
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState("ledger");
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [filterEcosystem, setFilterEcosystem] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const filteredData = reportData.filter((d) => {
    if (filterEcosystem !== "ALL" && d.type !== filterEcosystem) return false;
    if (filterYear !== "ALL" && d.year !== parseInt(filterYear)) return false;
    return true;
  });

  const totalCredits = filteredData.reduce((sum, d) => sum + d.credits, 0);

  return (
    <>
      <h1>Reports & Exports</h1>
      <p className="page-subtitle">Generate and export compliance reports</p>


      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { key: "ledger", label: "Credit Ledger" },
          { key: "ndc", label: "NDC Compliance" },
          { key: "performance", label: "Officer Performance" },
        ].map((r) => (
          <button
            key={r.key}
            className={activeReport === r.key ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveReport(r.key)}
            style={{ fontSize: "13px" }}
          >
            {r.label}
          </button>
        ))}
      </div>


      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "12px", marginRight: "4px" }}>From:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: "auto", padding: "4px 8px" }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", marginRight: "4px" }}>To:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: "auto", padding: "4px 8px" }} />
        </div>
        {activeReport !== "performance" && (
          <>
            <div>
              <label style={{ fontSize: "12px", marginRight: "4px" }}>Ecosystem:</label>
              <select value={filterEcosystem} onChange={(e) => setFilterEcosystem(e.target.value)} style={{ width: "auto", padding: "4px 8px" }}>
                <option value="ALL">All</option>
                <option value="Mangrove">Mangrove</option>
                <option value="Seagrass">Seagrass</option>
                <option value="Salt Marsh">Salt Marsh</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", marginRight: "4px" }}>Year:</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: "auto", padding: "4px 8px" }}>
                <option value="ALL">All</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </>
        )}
        <ExportButtons />
      </div>


      {activeReport === "ledger" && (
        <div>
          <div className="card" style={{ display: "inline-block", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px" }}>Total Credits (Filtered)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0f766e" }}>{totalCredits} tCO₂e</p>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Year</th>
                <th>Ecosystem</th>
                <th>Credits (tCO₂e)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((d, i) => (
                <tr key={i}>
                  <td>{d.project}</td>
                  <td>{d.year}</td>
                  <td>{d.type}</td>
                  <td>{d.credits}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {activeReport === "ndc" && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>NDC Compliance Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Total Verified CO₂</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>6,720 tCO₂e</div>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>NDC Target Progress</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0f766e" }}>67.2%</div>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Projects Contributing</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>24</div>
              </div>
            </div>
          </div>

          <table className="table mt-20">
            <thead>
              <tr>
                <th>State</th>
                <th>Projects</th>
                <th>Hectares</th>
                <th>Credits (tCO₂e)</th>
                <th>Contribution %</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Tamil Nadu</td><td>8</td><td>120.5</td><td>2,400</td><td>35.7%</td></tr>
              <tr><td>Kerala</td><td>5</td><td>75.2</td><td>1,200</td><td>17.9%</td></tr>
              <tr><td>Gujarat</td><td>4</td><td>95.0</td><td>1,400</td><td>20.8%</td></tr>
              <tr><td>Odisha</td><td>4</td><td>80.0</td><td>1,100</td><td>16.4%</td></tr>
              <tr><td>West Bengal</td><td>3</td><td>55.7</td><td>620</td><td>9.2%</td></tr>
            </tbody>
          </table>
        </div>
      )}


      {activeReport === "performance" && (
        <table className="table">
          <thead>
            <tr>
              <th>Field Officer</th>
              <th>Total Submissions</th>
              <th>Approved</th>
              <th>Rejected</th>
              <th>Pending</th>
              <th>Approval Rate</th>
            </tr>
          </thead>
          <tbody>
            {officerPerformance.map((o, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{o.name}</td>
                <td>{o.submissions}</td>
                <td style={{ color: "#047857" }}>{o.approved}</td>
                <td style={{ color: "#b91c1c" }}>{o.rejected}</td>
                <td style={{ color: "#b45309" }}>{o.pending}</td>
                <td><strong>{o.rate}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default Reports;
