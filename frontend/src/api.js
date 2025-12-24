const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Ignore if response is not JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

export async function getDocuments(tag = null, skip = 0, limit = 5) {
  const params = new URLSearchParams();
  if (tag) params.append("tag", tag);
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());
  const response = await fetch(`${API_BASE}/documents?${params.toString()}`);
  return handleResponse(response);
}

export async function getDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}`);
  return handleResponse(response);
}

export async function deleteDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function searchDocuments(query) {
  const response = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query)}`
  );
  return handleResponse(response);
}

export async function addTagToDocument(documentId, tagName) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: tagName }),
  });
  return handleResponse(response);
}

export async function removeTagFromDocument(documentId, tagId) {
  const response = await fetch(
    `${API_BASE}/documents/${documentId}/tags/${tagId}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(response);
}

export async function getDocumentTags(documentId) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/tags`);
  return handleResponse(response);
}

export async function getAllTags(search = null, skip = 0, limit = 5) {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append("search", search.trim());
  }
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());
  const response = await fetch(`${API_BASE}/tags?${params.toString()}`);
  return handleResponse(response);
}

export async function deleteTag(tagId) {
  const response = await fetch(`${API_BASE}/tags/${tagId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}
