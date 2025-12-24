import { useCallback, useEffect, useState } from "react";
import { deleteTag, getAllTags } from "../api";

function TagManager({ onTagDeleted }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingTagId, setDeletingTagId] = useState(null);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTags();
      setTags(data);
    } catch (err) {
      console.error("Failed to load tags:", err);
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

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

        setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId));
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

  return (
    <div className="tag-manager">
      <h3>Manage Tags</h3>
      {tags.length === 0 ? (
        <p className="no-tags">No tags in the system</p>
      ) : (
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
      )}
    </div>
  );
}

export default TagManager;
