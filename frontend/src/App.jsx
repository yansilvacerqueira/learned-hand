import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { getAllTags } from "./api";
import DocumentDetail from "./components/DocumentDetail";
import DocumentList from "./components/DocumentList";
import SearchBar from "./components/SearchBar";
import TagManager from "./components/TagManager";
import UploadForm from "./components/UploadForm";

function App() {
  const documentListRef = useRef(null);
  const [hasTags, setHasTags] = useState(false);

  const checkTags = useCallback(async () => {
    try {
      const data = await getAllTags(null, 0, 1);
      const tags = data.items || data;
      setHasTags(Array.isArray(tags) ? tags.length > 0 : false);
    } catch (err) {
      console.error("Failed to check tags:", err);
      setHasTags(false);
    }
  }, []);

  useEffect(() => {
    checkTags();

    const handleTagAdded = () => checkTags();
    window.addEventListener("tagAdded", handleTagAdded);

    return () => window.removeEventListener("tagAdded", handleTagAdded);
  }, [checkTags]);

  const handleUploadSuccess = useCallback(() => {
    documentListRef.current?.refresh();
  }, []);

  const handleTagDeleted = useCallback(() => {
    documentListRef.current?.refresh();
    documentListRef.current?.refreshTags();
    checkTags();
  }, [checkTags]);

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          <h1>DocProc</h1>
        </Link>
        <nav>
          <SearchBar />
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <UploadForm onUploadSuccess={handleUploadSuccess} />
                <DocumentList ref={documentListRef} />
                {hasTags && (
                  <div className="tag-manager-container">
                    <TagManager onTagDeleted={handleTagDeleted} />
                  </div>
                )}
              </>
            }
          />
          <Route path="/documents/:id" element={<DocumentDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
