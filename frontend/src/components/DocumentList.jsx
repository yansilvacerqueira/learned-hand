import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { getAllTags, getDocuments } from "../api";
import { formatFileSize } from "../utils/formatters";

const DocumentList = forwardRef(function DocumentList(props, ref) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments(selectedTag);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  const loadTags = useCallback(async () => {
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);

      if (selectedTag && !tags.some((tag) => tag.name === selectedTag)) {
        setSelectedTag(null);
      }
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  }, [selectedTag]);

  useEffect(() => {
    loadDocuments();
    loadTags();
  }, [loadDocuments, loadTags]);

  useImperativeHandle(
    ref,
    () => ({
      refresh: loadDocuments,
      refreshTags: loadTags,
    }),
    [loadDocuments, loadTags]
  );

  const handleTagFilter = useCallback((tagName) => {
    setSelectedTag((current) => (current === tagName ? null : tagName));
  }, []);

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const emptyMessage = selectedTag
    ? `No documents found with tag "${selectedTag}"`
    : "No documents uploaded yet. Upload a PDF to get started.";

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Documents</h2>
        {availableTags.length > 0 && (
          <div className="tag-filter">
            <span>Filter by tag: </span>
            <button
              className={`tag-filter-btn ${
                selectedTag === null ? "active" : ""
              }`}
              onClick={() => handleTagFilter(null)}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                className={`tag-filter-btn ${
                  selectedTag === tag.name ? "active" : ""
                }`}
                onClick={() => handleTagFilter(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <div>
              <Link to={`/documents/${doc.id}`}>{doc.filename}</Link>
              <div className="document-meta">
                {doc.page_count} pages | {formatFileSize(doc.file_size)} |{" "}
                {doc.status}
              </div>
              {doc.tags?.length > 0 && (
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
