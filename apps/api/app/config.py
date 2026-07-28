from __future__ import annotations

from dataclasses import dataclass
import os

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    max_upload_bytes: int = 10 * 1024 * 1024
    max_excel_uncompressed_bytes: int = 50 * 1024 * 1024
    max_excel_entries: int = 1_000
    max_rows: int = 100_000
    max_columns: int = 100
    max_result_rows: int = 500
    max_dataset_sessions: int = 100
    dataset_session_ttl_seconds: int = 30 * 60
    question_rate_limit_per_minute: int = 12
    question_rate_limit_per_session_hour: int = 60
    global_question_rate_limit_per_day: int = 250
    upload_rate_limit_per_minute: int = 5
    sql_rate_limit_per_minute: int = 30
    question_cache_ttl_seconds: int = 5 * 60
    question_cache_entries: int = 200
    provider_failure_threshold: int = 3
    provider_cooldown_seconds: int = 60
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


settings = Settings()
