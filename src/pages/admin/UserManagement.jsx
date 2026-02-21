import { useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";

const initialUsers = [
  { id: 1, name: "Arun Kumar", email: "arun@coastal-ngo.org", wallet: "0x7a3B...9f2E", role: "FIELD", org: "Coastal NGO", status: "Active", joined: "15 Jan 2026" },
  { id: 2, name: "Priya Sharma", email: "priya@nccr.gov.in", wallet: "0x8b4C...3a4B", role: "VALIDATOR", org: "NCCR", status: "Active", joined: "10 Jan 2026" },
  { id: 3, name: "Meera Patel", email: "meera@community.org", wallet: "0x9c5D...5a6D", role: "VIEWER", org: "Community Trust", status: "Active", joined: "12 Jan 2026" },
  { id: 4, name: "Vikram Singh", email: "vikram@green-ngo.org", wallet: "0x0d6E...7a8E", role: "FIELD", org: "Green India NGO", status: "Active", joined: "20 Jan 2026" },
  { id: 5, name: "Lakshmi Nair", email: "lakshmi@eco.org", wallet: "0x1e7F...8b9F", role: "FIELD", org: "EcoRestore", status: "Active", joined: "22 Jan 2026" },
  { id: 6, name: "Ravi Shankar", email: "ravi@pending.org", wallet: "0x2f8G...9c0G", role: "USER", org: "Pending Org", status: "Pending", joined: "20 Feb 2026" },
  { id: 7, name: "Neha Gupta", email: "neha@newreg.org", wallet: "0x3g9H...0d1H", role: "USER", org: "New Registration", status: "Pending", joined: "21 Feb 2026" },
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const filteredUsers = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (filterStatus !== "ALL" && u.status !== filterStatus) return false;
    return true;
  });

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole, status: "Active" } : u));
  };
  const handleApprove = (userId) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "Active" } : u));
  };
  const handleReject = (userId) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "Rejected" } : u));
  };
  const handleRevoke = (userId) => {
    if (confirm("Revoke this user's access?")) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "Revoked" } : u));
    }
  };
  const toggleSelect = (userId) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };
  const handleBulkApprove = () => {
    setUsers((prev) => prev.map((u) => selectedUsers.includes(u.id) ? { ...u, status: "Active" } : u));
    setSelectedUsers([]);
  };

  return (
    <>
      <h1>User Management</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" }}>
        <div>
          <label style={{ fontSize: "13px", marginRight: "6px" }}>Role:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="FIELD">Field Officer</option>
            <option value="VALIDATOR">Validator</option>
            <option value="VIEWER">Viewer</option>
            <option value="USER">Pending User</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "13px", marginRight: "6px" }}>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>
        {selectedUsers.length > 0 && (
          <button className="primary-btn" onClick={handleBulkApprove} style={{ fontSize: "13px" }}>
            Bulk Approve ({selectedUsers.length})
          </button>
        )}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "30px" }}>
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) setSelectedUsers(filteredUsers.map((u) => u.id));
                  else setSelectedUsers([]);
                }}
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Wallet</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>
                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleSelect(u.id)} />
              </td>
              <td>{u.name}</td>
              <td style={{ fontSize: "13px" }}>{u.email}</td>
              <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{u.wallet}</td>
              <td>
                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}>
                  <option value="USER">Pending</option>
                  <option value="FIELD">Field Officer</option>
                  <option value="VALIDATOR">Validator</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>{u.org}</td>
              <td><StatusBadge status={u.status.toLowerCase()} /></td>
              <td>{u.joined}</td>
              <td>
                <div style={{ display: "flex", gap: "6px" }}>
                  {u.status === "Pending" && (
                    <>
                      <button className="primary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={() => handleApprove(u.id)}>Approve</button>
                      <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={() => handleReject(u.id)}>Reject</button>
                    </>
                  )}
                  {u.status === "Active" && (
                    <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px", color: "#b91c1c" }} onClick={() => handleRevoke(u.id)}>Revoke</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default UserManagement;
