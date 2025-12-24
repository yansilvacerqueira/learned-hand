import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Link } from "react-router-dom";
import { getDocuments } from "../api";
import { formatFileSize } from "../utils/formatters";

const DocumentList = forwardRef(function DocumentList(props, ref) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: loadDocuments,
  }));

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="document-list">
      <h2>Documents</h2>

      {documents.length === 0 ? (
        <div className="empty-state">
          No documents uploaded yet. Upload a PDF to get started.
        </div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <div>
              <Link to={`/documents/${doc.id}`}>{doc.filename}</Link>

              <div className="document-meta">
                {doc.page_count} pages | {formatFileSize(doc.file_size)} |{" "}
                {doc.status}
              </div>
            </div>

            <div className="document-meta">
              {new Date(doc.created_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

DocumentList.displayName = "DocumentList";

export default DocumentList;
