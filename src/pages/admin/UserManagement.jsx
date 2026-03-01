import { useState, useEffect } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import { adminAPI } from "../../services/api";




const roleDisplayMap = { FIELD_OFFICER: "FIELD", USER: "USER", VALIDATOR: "VALIDATOR", ADMIN: "ADMIN" };

const emptyStaffForm = { walletAddress: "", userName: "", email: "", phone: "", organization: "", role: "FIELD_OFFICER" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ ...emptyStaffForm });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffMsg, setStaffMsg] = useState({ type: "", text: "" });

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.getUsers()
      .then((res) => setUsers(res.data.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((u) => {
    const role = roleDisplayMap[u.role] || u.role;
    if (filterRole !== "ALL" && role !== filterRole) return false;
    if (filterStatus !== "ALL" && u.status !== filterStatus) return false;
    return true;
  });

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole, status: "Approved" } : u));
    } catch {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole, status: "Approved" } : u));
    }
  };

  const handleApprove = (userId) => {
    handleRoleChange(userId, users.find(u => u._id === userId)?.role || "USER");
  };

  const handleReject = async (userId) => {
    try {
      await adminAPI.updateRole(userId, "USER");
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: "Rejected" } : u));
    } catch {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: "Rejected" } : u));
    }
  };

  const handleRevoke = (userId) => {
    if (confirm("Revoke this user's access?")) {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: "Rejected" } : u));
    }
  };

  const toggleSelect = (userId) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const handleBulkApprove = () => {
    selectedUsers.forEach((id) => handleApprove(id));
    setSelectedUsers([]);
  };

  const handleStaffChange = (e) => setStaffForm({ ...staffForm, [e.target.name]: e.target.value });

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffMsg({ type: "", text: "" });
    if (!staffForm.walletAddress || !staffForm.userName) {
      setStaffMsg({ type: "error", text: "Wallet address and name are required." });
      return;
    }
    setStaffSubmitting(true);
    try {
      await adminAPI.createStaffUser(staffForm);
      setStaffMsg({ type: "success", text: `${staffForm.role === "FIELD_OFFICER" ? "Field Officer" : "Validator"} created successfully!` });
      setStaffForm({ ...emptyStaffForm });
      fetchUsers();
      setTimeout(() => { setShowAddForm(false); setStaffMsg({ type: "", text: "" }); }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to create user.";
      setStaffMsg({ type: "error", text: msg });
    } finally {
      setStaffSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–";

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading users…</div>;

  return (
    <>
      <h1>User Management</h1>


      <div style={{ marginBottom: "20px", marginTop: "12px" }}>
        <button
          className="primary-btn"
          onClick={() => { setShowAddForm(!showAddForm); setStaffMsg({ type: "", text: "" }); }}
          style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {showAddForm ? "✕ Cancel" : "+ Add Field Officer / Validator"}
        </button>

        {showAddForm && (
          <form onSubmit={handleStaffSubmit} style={{
            marginTop: "14px", padding: "20px", background: "#f9fafb",
            border: "1px solid #e5e7eb", borderRadius: "10px",
          }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e", marginBottom: "14px" }}>Add Staff Member</h3>

            {staffMsg.text && (
              <div style={{
                padding: "8px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px",
                background: staffMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${staffMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                color: staffMsg.type === "success" ? "#166534" : "#b91c1c",
              }}>{staffMsg.text}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Wallet Address *</label>
                <input type="text" name="walletAddress" placeholder="0x..." value={staffForm.walletAddress} onChange={handleStaffChange} required style={{ fontFamily: "monospace", fontSize: "13px" }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full Name *</label>
                <input type="text" name="userName" placeholder="Arun Kumar" value={staffForm.userName} onChange={handleStaffChange} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email</label>
                <input type="email" name="email" placeholder="arun@ngo.org" value={staffForm.email} onChange={handleStaffChange} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Phone</label>
                <input type="tel" name="phone" placeholder="+91 98765 43210" value={staffForm.phone} onChange={handleStaffChange} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Organization</label>
                <input type="text" name="organization" placeholder="Sundarbans NGO" value={staffForm.organization} onChange={handleStaffChange} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0, minWidth: "180px" }}>
                <label>Role *</label>
                <select name="role" value={staffForm.role} onChange={handleStaffChange} required>
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="VALIDATOR">Validator</option>
                </select>
              </div>
              <button type="submit" className="primary-btn" disabled={staffSubmitting} style={{ fontSize: "13px", padding: "9px 24px", whiteSpace: "nowrap" }}>
                {staffSubmitting ? "Creating…" : "Create Staff User"}
              </button>
            </div>
          </form>
        )}
      </div>


      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <label style={{ fontSize: "13px", marginRight: "6px" }}>Role:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="FIELD">Field Officer</option>
            <option value="VALIDATOR">Validator</option>
            <option value="USER">User</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "13px", marginRight: "6px" }}>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
            <option value="ALL">All Status</option>
            <option value="Approved">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
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
                  if (e.target.checked) setSelectedUsers(filteredUsers.map((u) => u._id));
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
            <tr key={u._id}>
              <td>
                <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleSelect(u._id)} />
              </td>
              <td>{u.userName}</td>
              <td style={{ fontSize: "13px" }}>{u.email}</td>
              <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{u.walletAddress?.slice(0, 6)}...{u.walletAddress?.slice(-4)}</td>
              <td>
                <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}>
                  <option value="USER">User</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="VALIDATOR">Validator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>{u.organization}</td>
              <td><StatusBadge status={u.status?.toLowerCase()} /></td>
              <td>{formatDate(u.createdAt)}</td>
              <td>
                <div style={{ display: "flex", gap: "6px" }}>
                  {u.status === "Pending" && (
                    <>
                      <button className="primary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={() => handleApprove(u._id)}>Approve</button>
                      <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={() => handleReject(u._id)}>Reject</button>
                    </>
                  )}
                  {u.status === "Approved" && (
                    <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px", color: "#b91c1c" }} onClick={() => handleRevoke(u._id)}>Revoke</button>
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

