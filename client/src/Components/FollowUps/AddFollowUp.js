// src/pages/AddFollowUps.jsx
import React, { useState, useEffect } from "react";
import "./AddFollowUp.css"; // Make sure CSS file exists

const modules = ["Leads", "Quotations"]; // Add more modules if needed

export default function FollowUpPage({ onCustomerAdded }) {
  const [selectedModule, setSelectedModule] = useState("");
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");

  // Fetch entries when module changes
  useEffect(() => {
    if (selectedModule) fetchEntries(selectedModule);
  }, [selectedModule]);

  const fetchEntries = async (module) => {
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base.replace(/\/$/, '')}/api/${module.toLowerCase()}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  const handleAddFollowUp = (entry) => {
    setSelectedEntry(entry); // Open modal
  };

  const submitFollowUp = async () => {
    if (!followUpNote || !followUpDate || !followUpTime) {
      alert("Please enter remark, date, and time");
      return;
    }

    const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);

    try {
      const base2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await fetch(`${base2.replace(/\/$/, '')}/api/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: selectedEntry._id,
          module: selectedModule,
          remark: followUpNote,
          followUpAt: followUpDateTime.toISOString(),
        }),
      });

      alert("Follow-up added successfully!");
      setSelectedEntry(null);
      setFollowUpNote("");
      setFollowUpDate("");
      setFollowUpTime("");
      if (onCustomerAdded) onCustomerAdded(); // Refresh counts if needed
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="followup-page p-5">
      <h1 className="text-xl font-bold mb-4">Select Module to Add follow up</h1>

      {/* Module Dropdown */}
      <select
        value={selectedModule}
        onChange={(e) => setSelectedModule(e.target.value)}
        className="border p-2 rounded mb-4"
      >
        <option value="">Select Module</option>
        {modules.map((mod, idx) => (
          <option key={idx} value={mod}>
            {mod}
          </option>
        ))}
      </select>

      {/* Entries Table: always render */}
      <div className="followup-table-wrapper overflow-x-auto mt-4">
        <table className="followup-table min-w-full border border-gray-300 rounded">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b text-left">#</th>
              <th className="py-2 px-4 border-b text-left">Name / Title</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              <th className="py-2 px-4 border-b text-left">Phone</th>
              <th className="py-2 px-4 border-b text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedModule === "" ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Please select a module to view entries
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No entries found for {selectedModule}
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <tr key={entry._id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{idx + 1}</td>
                  <td className="py-2 px-4 border-b">{entry.name || entry.title}</td>
                  <td className="py-2 px-4 border-b">{entry.email || "-"}</td>
                  <td className="py-2 px-4 border-b">{entry.phone || "-"}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      className="followup-button bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => handleAddFollowUp(entry)}
                    >
                      Add Follow-Up
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedEntry && (
        <div className="modal-bg fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-box bg-white p-5 rounded w-96">
            <h2 className="font-bold mb-2">
              Add Follow-Up for {selectedEntry.name || selectedEntry.title}
            </h2>



            <div className="flex gap-2 mb-4">
              <div className="flex flex-col w-1/2">
                <label className="text-sm font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="border p-2 rounded"
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label className="text-sm font-semibold mb-1">Time</label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="border p-2 rounded"
                />

              </div>

            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex flex-col w-1/2">
                <label className="text-sm font-semibold mb-5">Remark</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="border w-full p-2 rounded mb-2"
                  placeholder="Enter follow-up remark"
                />
              </div>
            </div>


            <div className="flex justify-end gap-2">
              <button
                onClick={submitFollowUp}
                className="save-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedEntry(null)}
                className="cancel-btn bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
