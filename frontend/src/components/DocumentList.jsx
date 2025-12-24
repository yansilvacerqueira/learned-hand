import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Link } from "react-router-dom";
import { getAllTags, getDocuments } from "../api";
import { formatFileSize } from "../utils/formatters";

const DocumentList = forwardRef(function DocumentList(props, ref) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    loadDocuments();
    loadTags();
  }, [selectedTag]);

  useImperativeHandle(ref, () => ({
    refresh: loadDocuments,
  }));

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await getDocuments(selectedTag);
      setDocuments(data);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);
    } catch (err) {}
  }

  function handleTagFilter(tagName) {
    setSelectedTag(tagName === selectedTag ? null : tagName);
  }

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Documents</h2>
        {availableTags.length > 0 && (
          <div className="tag-filter">
            <span>Filter by tag: </span>
            <button
              className={
                selectedTag === null
                  ? "tag-filter-btn active"
                  : "tag-filter-btn"
              }
              onClick={() => handleTagFilter(null)}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                className={
                  selectedTag === tag.name
                    ? "tag-filter-btn active"
                    : "tag-filter-btn"
                }
                onClick={() => handleTagFilter(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          {selectedTag
            ? `No documents found with tag "${selectedTag}"`
            : "No documents uploaded yet. Upload a PDF to get started."}
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

              {doc.tags && doc.tags.length > 0 && (
                <div className="document-tags">
                  {doc.tags.map((tag) => (
                    <span key={tag.id} className="tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
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
