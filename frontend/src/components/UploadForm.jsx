import { useState } from "react";
import { uploadDocument } from "../api";

function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file");
      setFile(null);
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(
        `File too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(
          1
        )}MB`
      );
      setFile(null);
      e.target.value = "";
      return;
    }

    setError(null);
    setFile(selectedFile);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await uploadDocument(file);
      setFile(null);
      e.target.reset();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-form">
      <h2>Upload Document</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
