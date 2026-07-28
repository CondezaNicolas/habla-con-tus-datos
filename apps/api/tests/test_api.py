from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.services.datasets import dataset_store
from app.services.questions import DemoQuestionProvider, GroqQuestionProvider

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def use_demo_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "question_provider", DemoQuestionProvider())


def create_example() -> str:
    response = client.post("/api/v1/datasets/example")
    assert response.status_code == 200
    return response.json()["session_id"]


def test_example_dataset_profiles_columns() -> None:
    response = client.post("/api/v1/datasets/example")
    body = response.json()
    assert response.status_code == 200
    assert body["row_count"] == 12
    assert {column["name"] for column in body["columns"]} >= {"categoria", "ventas", "unidades"}


def test_csv_upload_normalizes_accented_columns() -> None:
    csv = "Categoría,Ventas\nTecnología,150\nHogar,90\n".encode("utf-8")
    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("ventas.csv", csv, "text/csv")},
    )
    body = response.json()
    assert response.status_code == 200
    assert [column["name"] for column in body["columns"]] == ["categoria", "ventas"]


def test_question_returns_real_sql_and_rows() -> None:
    session_id = create_example()
    response = client.post("/api/v1/queries/question", json={"session_id": session_id, "question": "¿Qué categoría acumula más ventas?"})
    body = response.json()
    assert response.status_code == 200
    assert body["provider"] == "demo-rules"
    assert "GROUP BY" in body["sql"].upper()
    assert body["rows"][0]["categoria"] == "Tecnología"


def test_sql_rejects_mutations_and_unknown_columns() -> None:
    session_id = create_example()
    mutation = client.post("/api/v1/queries/sql", json={"session_id": session_id, "sql": "DELETE FROM dataset"})
    missing_column = client.post("/api/v1/queries/sql", json={"session_id": session_id, "sql": "SELECT secreto FROM dataset"})
    assert mutation.status_code == 422
    assert missing_column.status_code == 422


def test_groq_provider_validates_sql_returned_in_structured_json() -> None:
    provider = GroqQuestionProvider("test-key", "openai/gpt-oss-20b")
    provider.client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **_: SimpleNamespace(
                    choices=[SimpleNamespace(message=SimpleNamespace(content='{"sql":"SELECT categoria, SUM(ventas) AS total FROM dataset GROUP BY categoria ORDER BY total DESC"}'))]
                )
            )
        )
    )
    dataset = dataset_store.create_example()
    result = provider.answer(dataset_store.get(dataset.session_id), "¿Qué categoría tiene más ventas?")
    assert result.provider == "groq"
    assert result.rows[0]["categoria"] == "Tecnología"
