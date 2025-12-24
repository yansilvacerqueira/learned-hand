import { useCallback, useEffect, useState } from "react";
import { deleteTag, getAllTags } from "../api";

function TagManager({ onTagDeleted }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingTagId, setDeletingTagId] = useState(null);
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 5,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTags(null, pagination.skip, pagination.limit);
      setTags(data.items || []);
      setPagination({
        skip: data.skip || 0,
        limit: data.limit || 5,
        total: data.total || 0,
        hasNext: data.has_next || false,
        hasPrev: data.has_prev || false,
      });
    } catch (err) {
      console.error("Failed to load tags:", err);
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, [pagination.skip, pagination.limit]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleDeleteTag = useCallback(
    async (tagId, tagName) => {
      if (
        !window.confirm(
          `Are you sure you want to delete the tag "${tagName}"? This will remove it from all documents.`
        )
      ) {
        return;
      }

      try {
        setDeletingTagId(tagId);
        await deleteTag(tagId);

        loadTags();
        onTagDeleted?.(tagId);
      } catch (err) {
        console.error("Failed to delete tag:", err);
        setError(err.message || "Failed to delete tag");
      } finally {
        setDeletingTagId(null);
      }
    },
    [onTagDeleted]
  );

  if (loading) {
    return <div className="loading">Loading tags...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleNextPage = () => {
    setPagination((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.limit),
    }));
  };

  return (
    <div className="tag-manager">
      <h3>Manage Tags</h3>
      {tags.length === 0 ? (
        <p className="no-tags">No tags in the system</p>
      ) : (
        <>
          <div className="tags-manager-list">
            {tags.map((tag) => (
              <div key={tag.id} className="tag-manager-item">
                <span className="tag-manager-name">{tag.name}</span>
                <button
                  className="tag-manager-delete"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  disabled={deletingTagId === tag.id}
                  aria-label={`Delete tag ${tag.name}`}
                >
                  {deletingTagId === tag.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
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
}

export default TagManager;
