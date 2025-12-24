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
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 5,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments(
        selectedTag,
        pagination.skip,
        pagination.limit
      );
      setDocuments(data.items || []);
      setPagination({
        skip: data.skip || 0,
        limit: data.limit || 5,
        total: data.total || 0,
        hasNext: data.has_next || false,
        hasPrev: data.has_prev || false,
      });
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [selectedTag, pagination.skip, pagination.limit]);

  const loadTags = useCallback(async () => {
    try {
      const data = await getAllTags(null, 0, 1000);
      const tags = data.items || data;
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
  }, [loadDocuments]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useImperativeHandle(
    ref,
    () => ({
      refresh: loadDocuments,
      refreshTags: loadTags,
    }),
    [loadDocuments, loadTags]
  );

  const handleTagFilter = useCallback((tagName) => {
    setSelectedTag((current) => {
      const newTag = current === tagName ? null : tagName;
      setPagination((prev) => ({ ...prev, skip: 0 }));
      return newTag;
    });
  }, []);

  const handleNextPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
  }, []);

  const handlePrevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.limit),
    }));
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
      <h2>Documents</h2>
      <div className="document-list-header">
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
        <>
          {documents.map((doc) => (
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
          ))}
          {pagination.total > 0 && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={!pagination.hasPrev}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Showing {pagination.skip + 1}-
                {Math.min(pagination.skip + pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNext}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

DocumentList.displayName = "DocumentList";

export default DocumentList;
