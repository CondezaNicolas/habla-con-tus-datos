from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import settings
from app.schemas import DatasetProfile, QuestionRequest, QueryResult, SqlRequest
from app.services.datasets import dataset_store
from app.services.questions import question_provider
from app.services.security import global_budget_limiter, rate_limiter, validate_question
from app.services.sql import validate_and_execute

app = FastAPI(title="Habla con tus datos API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


async def _read_limited_upload(file: UploadFile) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(1024 * 1024):
        total += len(chunk)
        if total > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="El archivo supera el límite de 10 MB.")
        chunks.append(chunk)
    return b"".join(chunks)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/datasets/upload", response_model=DatasetProfile)
async def upload_dataset(request: Request, file: UploadFile = File(...)) -> DatasetProfile:
    rate_limiter.check(
        f"upload:{_client_key(request)}",
        settings.upload_rate_limit_per_minute,
        60,
    )
    return dataset_store.create_from_upload(file.filename or "archivo", await _read_limited_upload(file))


@app.post("/api/v1/datasets/example", response_model=DatasetProfile)
def create_example_dataset(request: Request) -> DatasetProfile:
    rate_limiter.check(
        f"example:{_client_key(request)}",
        settings.upload_rate_limit_per_minute,
        60,
    )
    return dataset_store.create_example()


@app.post("/api/v1/queries/sql", response_model=QueryResult)
def execute_sql(payload: SqlRequest, request: Request) -> QueryResult:
    rate_limiter.check(f"sql:{_client_key(request)}", settings.sql_rate_limit_per_minute, 60)
    return validate_and_execute(dataset_store.get(payload.session_id), payload.sql)


@app.post("/api/v1/queries/question", response_model=QueryResult)
def ask_question(payload: QuestionRequest, request: Request) -> QueryResult:
    rate_limiter.check(
        f"question-ip:{_client_key(request)}",
        settings.question_rate_limit_per_minute,
        60,
    )
    question = validate_question(payload.question)
    session = dataset_store.get(payload.session_id)
    global_budget_limiter.check(
        "question-global",
        settings.global_question_rate_limit_per_day,
        24 * 60 * 60,
    )
    rate_limiter.check(
        f"question-session:{payload.session_id}",
        settings.question_rate_limit_per_session_hour,
        60 * 60,
    )
    return question_provider.answer(session, question)
