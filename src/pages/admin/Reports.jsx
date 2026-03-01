import { useState, useEffect } from "react";
import ExportButtons from "../../components/shared/ExportButtons";
import StatusBadge from "../../components/shared/StatusBadge";
import { reportsAPI } from "../../services/api";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("ledger");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterEcosystem, setFilterEcosystem] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const [reportData, setReportData] = useState([]);
  const [ndcData, setNdcData] = useState(null);
  const [officerPerformance, setOfficerPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsAPI.getLedger().catch(() => ({ data: { data: [] } })),
      reportsAPI.getNDC().catch(() => ({ data: { data: null } })),
      reportsAPI.getPerformance().catch(() => ({ data: { data: [] } }))
    ])
      .then(([ledgerRes, ndcRes, perfRes]) => {
        setReportData(ledgerRes.data.data || []);
        setNdcData(ndcRes.data.data || null);
        setOfficerPerformance(perfRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredData = reportData.filter((d) => {
    if (filterEcosystem !== "ALL" && d.projectType !== filterEcosystem) return false;
    if (filterYear !== "ALL" && String(d.year) !== filterYear) return false;
    return true;
  });

  const totalCredits = filteredData.reduce((sum, d) => sum + (d.credits || 0), 0);

  return (
    <>
      <h1>Reports & Exports</h1>

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
                <option value="MANGROVE">Mangrove</option>
                <option value="SEAGRASS">Seagrass</option>
                <option value="SALTMARSH">Salt Marsh</option>
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

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Generating reports...</div>
      ) : activeReport === "ledger" && (
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
              {filteredData.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>No ledger data found</td></tr>
              ) : filteredData.map((d, i) => (
                <tr key={i}>
                  <td>{d.projectName}</td>
                  <td>{d.year}</td>
                  <td>{d.projectType}</td>
                  <td>{d.credits}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeReport === "ndc" && ndcData && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>NDC Compliance Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Total Verified CO₂</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{ndcData.tokens?.totalMinted || 0} tCO₂e</div>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Contributions Tracked</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0f766e" }}>{ndcData.submissions?.approved || 0} sub.</div>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Ecosystems</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{ndcData.byEcosystem?.length || 0}</div>
              </div>
            </div>
          </div>

          <table className="table mt-20">
            <thead>
              <tr>
                <th>Ecosystem Type</th>
                <th>Projects</th>
                <th>Hectares</th>
                <th>Credits (tCO₂e)</th>
              </tr>
            </thead>
            <tbody>
              {ndcData.byEcosystem?.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No NDC data available</td></tr>
              ) : ndcData.byEcosystem?.map((e, index) => (
                <tr key={index}>
                  <td>{e._id}</td>
                  <td>{e.totalProjects}</td>
                  <td>{e.totalAreaHa}</td>
                  <td>{e.totalCredits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeReport === "performance" && (
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
            {officerPerformance.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center" }}>No performance data found</td></tr>
            ) : officerPerformance.map((o, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{o.name} <br /><span style={{ fontSize: "10px", color: "gray" }}>{o.wallet?.slice(0, 10)}...</span></td>
                <td>{o.totalSubmissions}</td>
                <td style={{ color: "#047857" }}>{o.approved}</td>
                <td style={{ color: "#b91c1c" }}>{o.rejected}</td>
                <td style={{ color: "#b45309" }}>{o.pending}</td>
                <td><strong>{Math.round(o.approvalRate)}%</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default Reports;
