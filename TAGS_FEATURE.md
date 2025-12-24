# Document Tagging Feature - Usage Guide and Testing

## 📋 Overview

The tagging feature allows users to organize documents by adding custom tags and filtering the document list by those tags.

## 🔧 How It Works

### Backend

#### Data Model

- **`tags` Table**: Stores all tags in the system

  - `id`: Unique identifier
  - `name`: Tag name (unique, case-insensitive)
  - `created_at`: Creation date

- **`document_tags` Table**: Many-to-many association table
  - Relates documents to tags
  - Allows multiple tags per document and multiple documents per tag

#### API Endpoints

1. **POST `/documents/{document_id}/tags`**

   - Adds a tag to a document
   - Automatically creates the tag if it doesn't exist
   - Normalizes the name (lowercase, trim)
   - Returns the created/associated tag

2. **DELETE `/documents/{document_id}/tags/{tag_id}`**

   - Removes a tag from a document
   - Does not delete the tag from the system (only removes the association)

3. **GET `/documents/{document_id}/tags`**

   - Lists all tags for a specific document

4. **GET `/tags`**

   - Lists all available tags in the system
   - Optional `search` parameter to search tags by name (case-insensitive)
   - Example: `GET /tags?search=test` returns tags containing "test"

5. **DELETE `/tags/{tag_id}`**

   - Deletes a tag from the system
   - Removes the tag from all associated documents
   - Returns a message with the number of affected documents

6. **GET `/documents?tag={tag_name}`**
   - Filters documents by tag
   - Optional parameter in document listing

### Frontend

#### Components

1. **DocumentList**

   - Displays tags below each document
   - Shows tag filter at the top
   - Clickable buttons to filter by tag
   - "All" button to remove filter

2. **DocumentDetail**

   - Displays all document tags
   - Form to add new tags with **autocomplete/search**
   - While typing, shows suggestions of existing tags that match the text
   - Automatically filters out tags already associated with the document
   - "×" button on each tag to remove

3. **TagManager**
   - Component that automatically appears on the main page when there are tags in the system
   - Lists all available tags
   - Allows deleting tags from the system (removes from all documents)
   - Appears only on the main page (not on the detail page)

#### Usage Flow

1. **Add Tag**:

   - User accesses document details
   - Types tag name in the field (with autocomplete)
   - While typing, suggestions of existing tags appear
   - Can select a suggestion or create a new tag
   - Clicks "Add Tag"
   - Tag is created/associated and displayed immediately

2. **Remove Tag from Document**:

   - User clicks the "×" next to the tag
   - Tag is removed from the document (but remains in the system)

3. **Delete Tag from System**:

   - User accesses the main page
   - If there are tags, the TagManager component appears automatically
   - Clicks "Delete" next to the desired tag
   - Confirms deletion
   - Tag is removed from the system and all associated documents

4. **Filter by Tag**:
   - User sees list of available tags at the top of the list
   - Clicks on a tag to filter
   - List shows only documents with that tag
   - Clicks "All" to remove filter

## 🧪 How to Test

### Prerequisites

1. Backend running at `http://localhost:8000`
2. Frontend running at `http://localhost:5173`
3. PostgreSQL database configured

### Test 1: Add Tag to a Document

**Steps:**

1. Access `http://localhost:5173`
2. Upload a PDF document (if you don't have one yet)
3. Click on the document to view details
4. In the "Tags" section, type a tag (e.g., "important")
5. Click "Add Tag"
6. Verify that the tag appears in the tag list

**Expected Result:**

- Tag is added and displayed immediately
- Tag appears in blue with "×" button to remove

### Test 2: Add Multiple Tags

**Steps:**

1. In the same document, add more tags:
   - "urgent"
   - "financial"
   - "2024"
2. Verify that all appear in the list

**Expected Result:**

- All tags are displayed side by side
- Each tag can be removed individually

### Test 3: Tag Normalization

**Steps:**

1. Add tags with different formatting:
   - " IMPORTANT " (with spaces and uppercase)
   - "important" (lowercase)
   - "Important" (first letter uppercase)
2. Verify the behavior

**Expected Result:**

- All are normalized to "important" (lowercase, trim)
- System recognizes it's the same tag
- Does not create duplicate tags

### Test 4: Remove Tag from Document

**Steps:**

1. In a document with tags, click the "×" on a tag
2. Verify that the tag disappears

**Expected Result:**

- Tag is removed immediately
- Document still exists
- Tag still exists in the system (can be reused)

### Test 4b: Autocomplete When Adding Tag

**Steps:**

1. Access a document
2. In the tags section, start typing "test"
3. If a tag "test" or "test2" exists, they should appear as suggestions
4. Click on a suggestion or continue typing to create a new tag

**Expected Result:**

- Suggestions appear while typing
- Tags already associated with the document don't appear in suggestions
- Can select suggestion or create new tag

### Test 4c: Delete Tag from System

**Steps:**

1. Access the main page
2. If there are tags, TagManager should appear automatically
3. Click "Delete" next to a tag
4. Confirm deletion
5. Verify that the tag was removed from all documents

**Expected Result:**

- TagManager appears only on the main page
- Tag is deleted from the system
- Tag is removed from all associated documents
- TagManager disappears if there are no more tags

### Test 5: Filter Documents by Tag

**Steps:**

1. Go back to the document list
2. Add different tags to different documents:
   - Document 1: "important", "urgent"
   - Document 2: "important", "financial"
   - Document 3: "financial", "2024"
3. In the list, see the filter buttons at the top
4. Click on "important"
5. Verify which documents appear

**Expected Result:**

- Only Document 1 and Document 2 appear
- "important" button is highlighted (blue)
- Message shows how many documents were found

### Test 6: Remove Filter

**Steps:**

1. With an active filter, click "All"
2. Verify the list

**Expected Result:**

- All documents appear again
- "All" button is highlighted

### Test 7: Empty Tag

**Steps:**

1. Try to add an empty tag (spaces only)
2. Verify the behavior

**Expected Result:**

- "Add Tag" button is disabled
- Or shows error if trying to submit

### Test 8: Multiple Documents with Same Tag

**Steps:**

1. Add the tag "project-x" to 3 different documents
2. Filter by "project-x"
3. Verify that all 3 appear

**Expected Result:**

- All documents with the tag appear
- Tag is shared between documents

### Test 9: Direct API (Optional)

**Using curl or Postman:**

```bash
# List all documents
curl http://localhost:8000/documents

# Add tag to a document (ID 1)
curl -X POST http://localhost:8000/documents/1/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'

# List tags for a document
curl http://localhost:8000/documents/1/tags

# Filter documents by tag
curl http://localhost:8000/documents?tag=test

# List all tags
curl http://localhost:8000/tags

# Remove tag from a document
curl -X DELETE http://localhost:8000/documents/1/tags/1

# Search tags by name (autocomplete)
curl http://localhost:8000/tags?search=test

# Delete tag from system
curl -X DELETE http://localhost:8000/tags/1
```

## 🐛 Expected Error Cases

1. **Empty tag**: Should show error or disable button
2. **Document not found**: Should return 404
3. **Tag already associated**: Should return existing tag (not error)
4. **Remove non-existent tag**: Should return 404

## 📊 Database Verification

To verify directly in the database:

```sql
-- View all tags
SELECT * FROM tags;

-- View document-tag associations
SELECT d.filename, t.name
FROM documents d
JOIN document_tags dt ON d.id = dt.document_id
JOIN tags t ON dt.tag_id = t.id;

-- Count documents per tag
SELECT t.name, COUNT(dt.document_id) as document_count
FROM tags t
LEFT JOIN document_tags dt ON t.id = dt.tag_id
GROUP BY t.name
ORDER BY document_count DESC;
```

## 🎯 Main Features

1. ✅ **Automatic tag creation**: Tags are created when added for the first time
2. ✅ **Normalization**: Tags are normalized (lowercase, trim) to avoid duplicates
3. ✅ **Filtering**: Document list can be filtered by tag
4. ✅ **Reusability**: Tags can be shared across multiple documents
5. ✅ **Intuitive interface**: Clear UI to add, remove, and filter tags
6. ✅ **Autocomplete/Search**: When adding tags, shows suggestions of existing tags
7. ✅ **Tag management**: TagManager allows deleting tags from the system
8. ✅ **Automatic display**: TagManager appears automatically when there are tags

## 📝 Important Notes

- Tags are **case-insensitive**: "Important" and "important" are the same tag
- Tags are **normalized**: Extra spaces are removed
- Removing tag from document **does not delete** the tag from the system (use TagManager to delete)
- Deleting tag from system **removes** the tag from all associated documents
- Tags can be **reused** across multiple documents
- Tag filter is **optional** in document listing
- **Autocomplete** automatically filters out tags already associated with the document
- **TagManager** appears automatically on the main page when there are tags
- When deleting a document, tag associations are automatically removed
