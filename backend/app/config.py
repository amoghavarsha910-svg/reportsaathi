from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    allowed_origins: str = "http://localhost:5173"
    max_upload_mb: int = 10
    tesseract_cmd: str | None = None
    poppler_path: str | None = None
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3-flash-preview"
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def TESSERACT_CMD(self) -> str | None:
        return self.tesseract_cmd

    @property
    def GEMINI_API_KEY(self) -> str:
        return self.gemini_api_key

    @property
    def GEMINI_MODEL(self) -> str:
        return self.gemini_model

    @property
    def SUPABASE_URL(self) -> str:
        return self.supabase_url

    @property
    def SUPABASE_PUBLISHABLE_KEY(self) -> str:
        return self.supabase_publishable_key

    @property
    def SUPABASE_SECRET_KEY(self) -> str:
        return self.supabase_secret_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
