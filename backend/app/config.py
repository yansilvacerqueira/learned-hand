import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/tmp/docproc_uploads")
    # CORS: comma-separated list of allowed origins, or "*" for all (development only)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    def __init__(self):
        # Validate required environment variables
        if not self.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL environment variable must be set. "
                "Example: postgresql+asyncpg://user:password@localhost:5432/dbname"
            )
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY environment variable must be set. "
                "Generate a secure random key for production use."
            )

    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from environment variable."""
        if self.CORS_ORIGINS == "*":
            return ["*"]  # Development only - not recommended for production
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
