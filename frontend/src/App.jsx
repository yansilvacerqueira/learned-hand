import { useRef } from "react";
import { Link, Route, Routes } from "react-router-dom";
import DocumentDetail from "./components/DocumentDetail";
import DocumentList from "./components/DocumentList";
import SearchBar from "./components/SearchBar";
import UploadForm from "./components/UploadForm";

function App() {
  const documentListRef = useRef(null);

  function handleUploadSuccess() {
    if (documentListRef.current) {
      documentListRef.current.refresh();
    }
  }

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
