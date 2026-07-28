from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ColumnProfile(BaseModel):
    name: str
    source_name: str
    dtype: str
    null_count: int
    unique_count: int


class DatasetProfile(BaseModel):
    session_id: str
    dataset_name: str
    row_count: int
    columns: list[ColumnProfile]
    preview: list[dict[str, object]]
    suggested_questions: list[str]


class SqlRequest(BaseModel):
    session_id: str = Field(min_length=36, max_length=36, pattern=r"^[0-9a-f-]{36}$")
    sql: str = Field(min_length=1, max_length=5_000)


class QuestionRequest(BaseModel):
    session_id: str = Field(min_length=36, max_length=36, pattern=r"^[0-9a-f-]{36}$")
    question: str = Field(min_length=3, max_length=500)


class ChartSpec(BaseModel):
    kind: Literal["bar", "line", "table"]
    x: str | None = None
    y: str | None = None
    title: str


class QueryResult(BaseModel):
    sql: str
    rows: list[dict[str, object]]
    row_count: int
    chart_spec: ChartSpec
    explanation: str
    provider: str
