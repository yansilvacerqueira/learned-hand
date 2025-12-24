# DocProc

A simple document processing system for uploading, viewing, and searching PDF documents.

## Features

- Upload PDF documents
- View list of uploaded documents
- Search across document content
- View individual document details with extracted text
- Delete documents

- **Document tagging**: Add custom tags to organize documents
- **Tag filtering**: Filter documents by tags
- **Tag autocomplete**: Search existing tags when adding to documents
- **Tag management**: Delete tags from the system

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 (async), PostgreSQL
- **Frontend:** React 18, Vite, React Router
- **Infrastructure:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd docproc
   ```

2. Start all services:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development

To run services individually for development:

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Documents

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| POST   | `/documents`      | Upload a PDF document |
| GET    | `/documents`      | List all documents    |
| GET    | `/documents/{id}` | Get document details  |
| DELETE | `/documents/{id}` | Delete a document     |

### Search

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| GET    | `/search?q={query}` | Search documents by content |

### Tags

| Method | Endpoint                        | Description                            |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | `/tags`                         | List all tags (optional `?search={q}`) |
| DELETE | `/tags/{tag_id}`                | Delete a tag from the system           |
| POST   | `/documents/{id}/tags`          | Add a tag to a document                |
| GET    | `/documents/{id}/tags`          | Get all tags for a document            |
| DELETE | `/documents/{id}/tags/{tag_id}` | Remove a tag from a document           |
| GET    | `/documents?tag={tag_name}`     | Filter documents by tag                |

### Health

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Health check endpoint |

## Project Structure

```
docproc/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # Database setup
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── api.js           # API client
│   │   └── App.jsx          # Main application
│   ├── Dockerfile
│   └── package.json
├── scripts/
│   └── seed_data.py         # Test data seeding
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend

| Variable       | Description                  | Default                |
| -------------- | ---------------------------- | ---------------------- |
| `DATABASE_URL` | PostgreSQL connection string | See docker-compose.yml |

### Frontend

| Variable       | Description     | Default                 |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
