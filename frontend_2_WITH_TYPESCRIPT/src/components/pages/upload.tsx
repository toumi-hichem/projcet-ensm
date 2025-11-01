import React, { useEffect, useState } from "react";
import type {
  UploadListResponse,
  UploadMetaData,
  BagUploadMetaData,
} from "../../types";
import { toast } from "sonner";

type UploadItem = (UploadMetaData | BagUploadMetaData) & {
  type: "package" | "bag";
};

export function UploadPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
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
        if (data.success) {
          const merged: UploadItem[] = [
            ...data.packages.map((p) => ({ ...p, type: "package" as const })),
            ...data.bags.map((b) => ({ ...b, type: "bag" as const })),
          ];
          merged.sort(
            (a, b) =>
              new Date(b.upload_timestamp).getTime() -
              new Date(a.upload_timestamp).getTime(),
          );
          setUploads(merged);
        }
      })
      .catch((err) => console.error("Failed to fetch uploads:", err));
  }, []);

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.info("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_type", uploadType);

    setUploading(true);
    toast.info("Uploading...");
    try {
      const endpoint =
        uploadType === "receptacle"
          ? `${import.meta.env.VITE_BACKEND_URL}bag-upload/`
          : `${import.meta.env.VITE_BACKEND_URL}upload/`;

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.info("File uploaded successfully!");

        const refreshed = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}upload/`,
        ).then((r) => r.json());

        if (refreshed.success) {
          const merged: UploadItem[] = [
            ...refreshed.packages.map((p) => ({ ...p, type: "package" })),
            ...refreshed.bags.map((b) => ({ ...b, type: "bag" })),
          ];
          merged.sort(
            (a, b) =>
              new Date(b.upload_timestamp).getTime() -
              new Date(a.upload_timestamp).getTime(),
          );
          setUploads(merged);
        }
      } else {
        toast.error(`Error: ${result.error || "Failed to upload"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const formatKB = (bytes: number) => (bytes / 1024).toFixed(1) + " KB";

  return (
    <div className="upload-grid">
      {/* Left Side - Upload Form */}
      <div className="upload-section">
        <h2 className="upload-title">Upload CSV File</h2>

        <form onSubmit={handleUpload} className="upload-form">
          <label className="upload-label">
            Select Upload Type
            <select
              value={uploadType}
              onChange={(e) =>
                setUploadType(e.target.value as "package" | "receptacle")
              }
              className="upload-select"
            >
              <option value="package">Package </option>
              <option value="receptacle">Receptacle </option>
            </select>
          </label>

          <label className="upload-label">
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="upload-input"
            />
          </label>

          <button
            type="submit"
            disabled={uploading}
            className={`upload-btn ${uploading ? "disabled" : ""}`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {message && <p className="upload-message">{message}</p>}

        <style>{`
          .upload-section {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
            color: black;
          }

          .upload-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #111;
            margin-bottom: 0.5rem;
          }

          .upload-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .upload-label {
            display: flex;
            flex-direction: column;
            font-weight: 500;
            color: #222;
            gap: 0.5rem;
          }

          .upload-select, .upload-input {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
            background-color: #fafafa;
            color: #111;
            transition: border 0.2s ease, background 0.2s ease;
          }

          .upload-select:focus, .upload-input:focus {
            border-color: #0078d7;
            background-color: white;
            outline: none;
          }

          .upload-btn {
            background-color: #0078d7;
            color: white;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            padding: 0.8rem 1.2rem;
            cursor: pointer;
            transition: background 0.25s ease, transform 0.1s ease;
            width: fit-content;
            align-self: flex-start;
          }

          .upload-btn:hover {
            background-color: #005fa3;
            transform: translateY(-1px);
          }

          .upload-btn.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .upload-message {
            color: ${message?.startsWith("Error") ? "red" : "green"};
            font-weight: 500;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>

      {/* Right Side - Upload History */}
      <div className="history-section">
        <h2>Upload History</h2>
        <div className="card-container">
          {uploads.length > 0 ? (
            uploads.map((u) => (
              <div
                className={`upload-card ${u.type === "bag" ? "bag-card" : "package-card"}`}
                key={u.id}
              >
                <div className="card-header">
                  {u.type === "bag" ? "👜 BAG Upload" : "📦 PACKAGE Upload"} —{" "}
                  {u.filename}
                </div>
                <div className="card-body">
                  <p>
                    <strong>Uploaded:</strong>{" "}
                    {new Date(u.upload_timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>Rows inserted:</strong> {u.n_rows ?? 0}
                  </p>

                  {"rows_removed_duplicates" in u &&
                    u.rows_removed_duplicates != null && (
                      <p>
                        <strong>Duplicates removed:</strong>{" "}
                        {u.rows_removed_duplicates}
                      </p>
                    )}

                  {"rows_removed_invalid" in u &&
                    u.rows_removed_invalid != null && (
                      <p>
                        <strong>Invalid rows removed:</strong>{" "}
                        {u.rows_removed_invalid}
                      </p>
                    )}

                  <button
                    className="details-btn"
                    onClick={() =>
                      setSelectedId(selectedId === u.id ? null : (u.id ?? null))
                    }
                  >
                    {selectedId === u.id ? "Hide details" : "See more details"}
                  </button>

                  {/* Hidden by default */}
                  {selectedId === u.id && (
                    <div className="details show">
                      <p>
                        <strong>File size:</strong>{" "}
                        {(u.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                      <p>
                        <strong>Type:</strong> {u.file_type}
                      </p>

                      {"unique_packages_count" in u && (
                        <p>
                          <strong>Unique packages:</strong>{" "}
                          {u.unique_packages_count}
                        </p>
                      )}
                      {"unique_bags_count" in u && (
                        <p>
                          <strong>Unique bags:</strong> {u.unique_bags_count}
                        </p>
                      )}
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
                          <strong>Top event types:</strong>
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
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No uploads yet.</p>
          )}
        </div>

        <style>{`
          .history-section {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            color: black;
            display: flex;
            flex-direction: column;
            height: 550px; /* Fixed height */
          }

          .card-container {
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem; /* ✅ Adds space between cards */
            padding-right: 0.5rem;
          }

          .card-container::-webkit-scrollbar {
            width: 8px;
          }

          .card-container::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 6px;
          }

          .upload-card {
            background-color: #fefefe;
            border-radius: 10px;
            border: 1px solid #ddd;
            padding: 1rem;
            color: black;
          }

          .package-card {
            border-left: 6px solid #0078d7;
          }

          .bag-card {
            border-left: 6px solid #00b36b;
          }

          .card-header {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }

          .details-btn {
            background-color: #f0f0f0;
            color: black;
            border: none;
            border-radius: 8px;
            padding: 0.4rem 0.8rem;
            margin-top: 0.4rem;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s ease;
          }

          .details-btn:hover {
            background-color: #ddd;
          }

          .details {
            margin-top: 0.6rem;
            padding-top: 0.4rem;
            border-top: 1px solid #eee;
          }

          .details.show {
            display: block;
          }

          .details.hide {
            display: none;
          }

          .card-body p,
          .details p {
            color: black;
            margin: 0.2rem 0;
          }

          .details ul {
            color: black;
            padding-left: 1.2rem;
          }
        `}</style>
      </div>

      {/* --- CSS --- */}
      <style>{`
              .upload-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                padding: 1.5rem;
                background-color: #fff;
                color: black;
              }

              h2 {
                color: black;
              }

              .upload-section,
              .history-section {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
              }

              .upload-form input[type="file"] {
                color: black;
              }

              .upload-card {
                background-color: #fefefe;
                border-radius: 10px;
                border: 1px solid #ddd;
                padding: 1rem;
                color: black;
              }

              .package-card {
                border-left: 6px solid #0078d7;
              }

              .bag-card {
                border-left: 6px solid #00b36b;
              }

              .card-header {
                font-weight: bold;
                font-size: 1.1rem;
                margin-bottom: 0.5rem;
              }

              .card-body p,
              .details p {
                color: black;
                margin: 0.2rem 0;
              }

              .details ul {
                color: black;
              }

              .details-btn {
                background-color: #f0f0f0;
                color: black;
                border: none;
              }

              .details-btn:hover {
                background-color: #ddd;
              }
              .details {
                max-height: 0;
                overflow: hidden;
                opacity: 0;
                transition: all 0.3s ease;
              }

              .details.show {
                max-height: 800px; /* enough to show content */
                opacity: 1;
                overflow: visible;
              }

              .details.hide {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
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
