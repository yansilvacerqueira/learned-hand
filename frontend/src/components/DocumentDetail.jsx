import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addTagToDocument,
  deleteDocument,
  getAllTags,
  getDocument,
  removeTagFromDocument,
} from "../api";
import { formatFileSize } from "../utils/formatters";

function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocument(id);
      setDocument(data);
    } catch (err) {
      console.error("Failed to load document:", err);
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }
    try {
      await deleteDocument(id);
      navigate("/");
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError("Failed to delete document");
    }
  }, [id, navigate]);

  const searchTags = useCallback(
    async (query) => {
      const trimmedQuery = query?.trim() || "";

      if (trimmedQuery.length < 1) {
        setTagSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await getAllTags(trimmedQuery, 0, 50);
        const tags = data.items || data;
        const existingTagNames = new Set(
          (document?.tags || []).map((t) => t.name.toLowerCase())
        );

        const filtered = tags.filter(
          (tag) => !existingTagNames.has(tag.name.toLowerCase())
        );

        setTagSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (err) {
        console.error("Tag search failed:", err);
        setTagSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [document?.tags]
  );

  const handleTagInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewTagName(value);
      searchTags(value);
    },
    [searchTags]
  );

  const handleSelectSuggestion = useCallback((tagName) => {
    setNewTagName(tagName);
    setShowSuggestions(false);
    setTagSuggestions([]);
    tagInputRef.current?.focus();
  }, []);

  const handleAddTag = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmedTag = newTagName.trim();
      if (!trimmedTag) return;

      try {
        setAddingTag(true);
        setShowSuggestions(false);
        const tag = await addTagToDocument(id, trimmedTag);

        setDocument((prev) => ({
          ...prev,
          tags: [...(prev?.tags || []), tag],
        }));
        setNewTagName("");
        setTagSuggestions([]);

        window.dispatchEvent(new CustomEvent("tagAdded"));
      } catch (err) {
        console.error("Failed to add tag:", err);
        setError(err.message || "Failed to add tag");
      } finally {
        setAddingTag(false);
      }
    },
    [id, newTagName]
  );

  const handleRemoveTag = useCallback(
    async (tagId) => {
      try {
        await removeTagFromDocument(id, tagId);
        setDocument((prev) => ({
          ...prev,
          tags: prev.tags.filter((tag) => tag.id !== tagId),
        }));
      } catch (err) {
        console.error("Failed to remove tag:", err);
        setError(err.message || "Failed to remove tag");
      }
    },
    [id]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    window.document.addEventListener("mousedown", handleClickOutside);
    return () =>
      window.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="loading">Loading document...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!document) {
    return <div className="error">Document not found</div>;
  }

  return (
    <div className="document-detail">
      <h2>{document.filename}</h2>

      <div className="meta">
        <p>Status: {document.status}</p>
        <p>Pages: {document.page_count || "Unknown"}</p>
        <p>Size: {formatFileSize(document.file_size)}</p>
        <p>Uploaded: {new Date(document.created_at).toLocaleString()}</p>
      </div>

      <div className="tags-section">
        <h3>Tags</h3>
        {document.tags?.length > 0 ? (
          <div className="tags-list">
            {document.tags.map((tag) => (
              <span key={tag.id} className="tag">
                {tag.name}
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag.id)}
                  aria-label={`Remove tag ${tag.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="no-tags">No tags yet</p>
        )}

        <form onSubmit={handleAddTag} className="tag-form">
          <div className="tag-input-wrapper">
            <input
              ref={tagInputRef}
              type="text"
              value={newTagName}
              onChange={handleTagInputChange}
              onFocus={() => {
                if (tagSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Add a tag... (type to search existing tags)"
              disabled={addingTag}
              maxLength={100}
              autoComplete="off"
            />
            {showSuggestions && tagSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <div
                    key={tag.id}
                    className="tag-suggestion-item"
                    onClick={() => handleSelectSuggestion(tag.name)}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={addingTag || !newTagName.trim()}>
            {addingTag ? "Adding..." : "Add Tag"}
          </button>
        </form>
      </div>

      <h3>Extracted Content</h3>
      <div className="content">
        {document.content || "No content extracted"}
      </div>

      <div className="actions">
        <button className="back-btn" onClick={() => navigate("/")}>
          Back to List
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          Delete Document
        </button>
      </div>
    </div>
  );
}

export default DocumentDetail;
