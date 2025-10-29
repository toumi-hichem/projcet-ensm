import React, { useEffect, useState } from "react";
import type { UploadListResponse, UploadMetaData } from "../../types";

export function UploadPage() {
  const [uploads, setUploads] = useState<UploadMetaData[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<"package" | "receptacle">(
    "package",
  );

  // Fetch upload history
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}upload/`)
      .then((res) => res.json())
      .then((data: UploadListResponse) => {
        if (data.success) setUploads(data.data);
      })
      .catch((err) => console.error("Failed to fetch uploads:", err));
  }, []);

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_type", uploadType); // ✅ Send type to backend
    setUploading(true);
    setMessage(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload/`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setMessage("File uploaded successfully!");
        const refreshed = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}upload/`,
        ).then((r) => r.json());
        if (refreshed.success) setUploads(refreshed.data);
      } else {
        setMessage(`Error: ${result.error || "Failed to upload"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-grid">
      {/* Left Side - Upload Form */}
      <div className="upload-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between", // puts them at opposite ends
            alignItems: "center", // vertically centers
            width: "100%", // full width of parent
            marginBottom: "1rem", // spacing below
          }}
        >
          <h2 style={{ margin: 0 }}>Upload a File</h2>
          <select
            value={uploadType}
            onChange={(e) =>
              setUploadType(e.target.value as "package" | "receptacle")
            }
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "0.45rem 0.6rem",
              backgroundColor: "#fff",
              color: "black",
              fontSize: "1rem",
            }}
          >
            <option value="package">Package Data</option>
            <option value="receptacle">Receptacle Data</option>
          </select>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <div
            className="upload-row"
            style={{
              display: "flex",
              paddingTop: "30px",
              justifyContent: "space-between", // puts them at opposite ends
              alignItems: "center", // vertically centers
              width: "100%", // full width of parent
              marginBottom: "1rem", // spacing below
            }}
          >
            {/* Select upload type */}

            {/* File input */}
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {/* Submit button */}
            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
        {message && <p className="message">{message}</p>}
      </div>

      {/* Right Side - Upload History */}
      <div className="history-section">
        <h2>Upload History</h2>
        <div className="card-container">
          {uploads.length > 0 ? (
            uploads.map((u) => (
              <div className="upload-card" key={u.id}>
                <div className="card-header">{u.filename}</div>
                <div className="card-body">
                  <p>
                    <strong>Uploaded:</strong>{" "}
                    {new Date(u.upload_timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>Rows inserted:</strong> {u.n_rows ?? 0}
                  </p>
                  {u.rows_removed_duplicates != null && (
                    <p>
                      <strong>Duplicates removed:</strong>{" "}
                      {u.rows_removed_duplicates}
                    </p>
                  )}
                  {u.rows_removed_invalid != null && (
                    <p>
                      <strong>Invalid IDs removed:</strong>{" "}
                      {u.rows_removed_invalid}
                    </p>
                  )}

                  <button
                    className="details-btn"
                    onClick={() =>
                      setSelectedId(selectedId === u.id ? null : u.id)
                    }
                  >
                    {selectedId === u.id ? "Hide details" : "See more details"}
                  </button>

                  <div
                    className={`details ${
                      selectedId === u.id ? "show" : "hide"
                    }`}
                  >
                    <p>
                      <strong>File size:</strong>{" "}
                      {(u.file_size_bytes / 1024).toFixed(1)} KB
                    </p>
                    <p>
                      <strong>Type:</strong> {u.file_type}
                    </p>
                    <p>
                      <strong>Unique packages:</strong>{" "}
                      {u.unique_packages_count}
                    </p>
                    <p>
                      <strong>Unique event types:</strong>{" "}
                      {u.unique_event_types}
                    </p>
                    {u.earliest_date && u.latest_date && (
                      <p>
                        <strong>Date range:</strong>{" "}
                        {new Date(u.earliest_date).toLocaleDateString()} →{" "}
                        {new Date(u.latest_date).toLocaleDateString()} (
                        {u.time_range_days} days)
                      </p>
                    )}
                    {u.top_event_types && (
                      <div>
                        <strong style={{ color: "black" }}>
                          Top event types:
                        </strong>
                        <ul>
                          {Object.entries(u.top_event_types)
                            .slice(0, 5)
                            .map(([event, count]) => (
                              <li key={event}>
                                {event}: {count}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {u.notes && (
                      <p>
                        <strong>Notes:</strong> {u.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No uploads yet.</p>
          )}
        </div>
      </div>

      <style>{`
        .upload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding: 1.5rem;
          height: 100%;
          background-color: #fafafa;
          box-sizing: border-box;
        }

        h2 {
          color: #333;
          margin-bottom: 1rem;
        }

        .upload-section,
        .history-section {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        input[type="file"] {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 0.5rem;
        }

        button {
          background-color: #0078d7;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background-color: #005fa3;
        }

        button:disabled {
          background-color: #999;
          cursor: not-allowed;
        }

        .message {
          margin-top: 0.75rem;
          font-size: 0.9rem;
          color: #333;
        }

        .card-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .upload-card {
          background-color: #f7f7f7;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .upload-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          font-weight: bold;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: #0078d7;
        }

        .card-body p {
          margin: 0.2rem 0;
          color: #444;
          font-size: 0.95rem;
        }

        .details-btn {
          margin-top: 0.5rem;
          background-color: #eee;
          color: #333;
          border: none;
          border-radius: 6px;
          padding: 0.4rem 0.8rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .details-btn:hover {
          background-color: #ddd;
        }

        .details {
          margin-top: 0.5rem;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .details.show {
          max-height: 400px;
          opacity: 1;
        }

        .details ul {
          margin: 0.3rem 0 0.3rem 1rem;
          font-size: 0.9rem;
          color: #555;
        }

        @media (max-width: 900px) {
          .upload-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
