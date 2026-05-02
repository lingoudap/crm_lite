// client/src/Components/Leads/ViewLeads.js
import React, { useEffect, useState, useCallback } from "react";
import DateFilter from "./datefilter";

const ViewLeads = ({ refreshTrigger }) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const base = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ Fetch all leads with useCallback to prevent re-creation
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${base.replace(/\/$/, "")}/api/leads`;
      console.log("🔍 Fetching from URL:", url);
      const res = await fetch(url);
      console.log("🔍 Response Status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      console.log("📊 Fetched Leads Data:", data);
      console.log("📊 Number of leads:", Array.isArray(data) ? data.length : "Not an array");
      console.log("📊 First lead:", data[0]);
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [base]);

  // ✅ Fetch on mount
  useEffect(() => {
    console.log("🎯 ViewLeads component mounted, fetching data...");
    fetchData();
  }, [fetchData]);

  // ✅ Search filter
  useEffect(() => {
    const input = document.getElementById("global-search");
    const handler = (e) => setQuery(e.target.value);
    if (input) input.addEventListener("input", handler);
    return () => input && input.removeEventListener("input", handler);
  }, []);

  // ✅ Filter leads
  const visibleLeads = filteredLeads
    .filter((l) => JSON.stringify(l).toLowerCase().includes(query.toLowerCase()))
    .filter((l) => (filterStatus === "all" ? true : l.status === filterStatus));

  // ✅ Pagination
  const pageCount = Math.max(1, Math.ceil(visibleLeads.length / perPage));
  const pageData = visibleLeads.slice((page - 1) * perPage, page * perPage);

  // ✅ Date filter
  const handleDateFilter = (start, end) => {
    if (!start || !end) {
      setFilteredLeads(leads);
      return;
    }
    const filtered = leads.filter((item) => {
      const date = new Date(item.createdAt);
      return date >= start && date <= end;
    });
    setFilteredLeads(filtered);
    setPage(1);
  };

  return (
    <div>
      {/* 🔹 Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          background: "#f5f5f5",
          padding: "10px 15px",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: 0 }}>Leads</h3>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All</option>
            <option value="New">New</option>
            <option value="Active">Active</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Date Filter */}
          <DateFilter onFilter={handleDateFilter} />

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 🔹 Leads Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No leads found.
                </td>
              </tr>
            )}
            {pageData.map((l, i) => (
              <tr key={l._id || i}>
                <td>{(page - 1) * perPage + i + 1}</td>
                <td>{l.name || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>{l.email || "-"}</td>
                <td>{l.Source || "-"}</td>
                <td>{l.status || "New"}</td>
                <td>
                  {l.createdAt
                    ? new Date(l.createdAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(1)} disabled={page === 1}>
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span>
          Page {page} / {pageCount}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
        >
          Next
        </button>
        <button
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default ViewLeads;