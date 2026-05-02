import React, { useEffect, useState } from "react";

export default function ViewFollowUps() {
  const [followUps, setFollowUps] = useState([]);

  const fetchFollowUps = async () => {
    const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const res = await fetch(`${base.replace(/\/$/, "")}/api/followups`);
    const data = await res.json();
    setFollowUps(data);
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  return (
    <div className="followup-container p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📅 All Follow-Ups</h2>
        <button
          className="bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-400"
          onClick={fetchFollowUps}  
        >
          Refresh
        </button>
      </div>

      <table className="followup-table min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border-b text-left">Module</th>
            <th className="py-2 px-4 border-b text-left">Entry ID</th>
            <th className="py-2 px-4 border-b text-left">Follow-Up Date</th>
            <th className="py-2 px-4 border-b text-left">Remark</th>
          </tr>
        </thead>
        <tbody>
          {followUps.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">
                No follow-ups found
              </td>
            </tr>
          ) : (
            followUps.map((f, idx) => (
              <tr key={f._id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{f.module}</td>
                <td className="py-2 px-4 border-b">{f.entryId}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(f.followUpAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b">{f.remark}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
