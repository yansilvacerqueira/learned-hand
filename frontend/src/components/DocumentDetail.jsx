import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addTagToDocument,
  deleteDocument,
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

  useEffect(() => {
    loadDocument();
  }, [id]);

  async function loadDocument() {
    try {
      setLoading(true);
      const data = await getDocument(id);
      setDocument(data);
    } catch (err) {
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }
    try {
      await deleteDocument(id);
      navigate("/");
    } catch (err) {
      setError("Failed to delete document");
    }
  }

  async function handleAddTag(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setAddingTag(true);
      const tag = await addTagToDocument(id, newTagName.trim());
      setDocument((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setNewTagName("");
    } catch (err) {
      setError(err.message || "Failed to add tag");
    } finally {
      setAddingTag(false);
    }
  }

  async function handleRemoveTag(tagId) {
    try {
      await removeTagFromDocument(id, tagId);
      setDocument((prev) => ({
        ...prev,
        tags: prev.tags.filter((tag) => tag.id !== tagId),
      }));
    } catch (err) {
      setError(err.message || "Failed to remove tag");
    }
  }

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
        {document.tags && document.tags.length > 0 ? (
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
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Add a tag..."
            disabled={addingTag}
            maxLength={100}
          />
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
