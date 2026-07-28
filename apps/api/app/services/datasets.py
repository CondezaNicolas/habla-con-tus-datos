from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath
import re
import threading
import time
import unicodedata
import uuid
from zipfile import BadZipFile, ZipFile

import duckdb
from fastapi import HTTPException
import polars as pl

from app.config import settings
from app.schemas import ColumnProfile, DatasetProfile


ALLOWED_EXTENSIONS = {".csv", ".xlsx"}


@dataclass
class DatasetSession:
    session_id: str
    dataset_name: str
    connection: duckdb.DuckDBPyConnection
    columns: set[str]
    source_columns: dict[str, str]
    profile: DatasetProfile
    last_accessed_at: float


class DatasetStore:
    """Ephemeral, process-local dataset storage for the demo API."""

    def __init__(self) -> None:
        self._sessions: dict[str, DatasetSession] = {}
        self._lock = threading.Lock()

    def create_from_upload(self, filename: str, content: bytes) -> DatasetProfile:
        if len(content) > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="El archivo supera el límite de 10 MB.")
        extension = self._extension(filename)
        frame = self._read_frame(extension, content)
        return self._create(filename, frame)

    def create_example(self) -> DatasetProfile:
        frame = pl.DataFrame(
            {
                "fecha": ["2025-01-10", "2025-02-18", "2025-03-04", "2025-04-22", "2025-05-12", "2025-06-07"] * 2,
                "producto": ["Auriculares", "Lámpara", "Teclado", "Silla", "Monitor", "Mochila"] * 2,
                "categoría": ["Tecnología", "Hogar", "Tecnología", "Oficina", "Tecnología", "Deportes"] * 2,
                "región": ["Norte", "Centro", "Centro", "Sur", "Norte", "Sur"] * 2,
                "unidades": [12000, 9000, 16500, 7500, 14200, 6200, 11800, 8200, 17100, 7200, 14820, 5900],
                "ventas": [420000, 210000, 650000, 340000, 710000, 180000, 400000, 195000, 690000, 320000, 740000, 165000],
            }
        ).with_columns(pl.col("fecha").str.to_date())
        return self._create("ventas_ejemplo_2025.xlsx", frame)

    def get(self, session_id: str) -> DatasetSession:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(session_id)
            if session is not None:
                session.last_accessed_at = time.monotonic()
        if session is None:
            raise HTTPException(status_code=404, detail="La sesión no existe o ya expiró.")
        return session

    @staticmethod
    def _extension(filename: str) -> str:
        extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=415, detail="Solo se aceptan archivos CSV o XLSX.")
        return extension

    @staticmethod
    def _read_frame(extension: str, content: bytes) -> pl.DataFrame:
        try:
            if extension == ".csv":
                if b"\x00" in content:
                    raise ValueError("CSV con bytes nulos")
                return pl.read_csv(BytesIO(content), try_parse_dates=True, infer_schema_length=2_000)
            _validate_xlsx_archive(content)
            return pl.read_excel(BytesIO(content), raise_if_empty=True)
        except Exception as error:
            raise HTTPException(status_code=422, detail="No fue posible leer el archivo.") from error

    def _create(self, dataset_name: str, frame: pl.DataFrame) -> DatasetProfile:
        if frame.is_empty():
            raise HTTPException(status_code=422, detail="El archivo no contiene filas para analizar.")
        if frame.height > settings.max_rows:
            raise HTTPException(status_code=413, detail=f"El archivo supera el límite de {settings.max_rows:,} filas.")
        if frame.width > settings.max_columns:
            raise HTTPException(status_code=413, detail=f"El archivo supera el límite de {settings.max_columns} columnas.")

        normalized, source_columns = normalize_columns(frame)
        connection = duckdb.connect(":memory:")
        _materialize_frame(connection, normalized)
        _harden_connection(connection)
        session_id = str(uuid.uuid4())
        safe_dataset_name = _safe_filename(dataset_name)
        profiles = [
            ColumnProfile(
                name=column,
                source_name=source_columns[column],
                dtype=str(normalized.schema[column]),
                null_count=int(normalized[column].null_count()),
                unique_count=int(normalized[column].n_unique()),
            )
            for column in normalized.columns
        ]
        profile = DatasetProfile(
            session_id=session_id,
            dataset_name=safe_dataset_name,
            row_count=normalized.height,
            columns=profiles,
            preview=normalized.head(8).to_dicts(),
            suggested_questions=suggest_questions(normalized.columns),
        )
        session = DatasetSession(
            session_id,
            safe_dataset_name,
            connection,
            set(normalized.columns),
            source_columns,
            profile,
            time.monotonic(),
        )
        with self._lock:
            self._cleanup_locked()
            while len(self._sessions) >= settings.max_dataset_sessions:
                oldest_id = min(self._sessions, key=lambda key: self._sessions[key].last_accessed_at)
                self._close_locked(oldest_id)
            self._sessions[session_id] = session
        return profile

    def reset(self) -> None:
        with self._lock:
            for session_id in list(self._sessions):
                self._close_locked(session_id)

    def _cleanup_locked(self) -> None:
        cutoff = time.monotonic() - settings.dataset_session_ttl_seconds
        for session_id, session in list(self._sessions.items()):
            if session.last_accessed_at <= cutoff:
                self._close_locked(session_id)

    def _close_locked(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session is not None:
            session.connection.close()


def _safe_filename(filename: str) -> str:
    basename = PurePath(filename.replace("\\", "/")).name
    cleaned = "".join(character for character in basename if character.isprintable()).strip()
    return (cleaned or "archivo")[:255]


def _validate_xlsx_archive(content: bytes) -> None:
    try:
        with ZipFile(BytesIO(content)) as archive:
            entries = archive.infolist()
            if len(entries) > settings.max_excel_entries:
                raise ValueError("Demasiadas entradas en el XLSX")
            total_size = sum(entry.file_size for entry in entries)
            if total_size > settings.max_excel_uncompressed_bytes:
                raise ValueError("XLSX demasiado grande al descomprimir")
            if any(entry.flag_bits & 0x1 for entry in entries):
                raise ValueError("XLSX cifrado")
    except BadZipFile as error:
        raise ValueError("XLSX inválido") from error


def _harden_connection(connection: duckdb.DuckDBPyConnection) -> None:
    connection.execute("SET allow_community_extensions = false")
    connection.execute("SET autoinstall_known_extensions = false")
    connection.execute("SET autoload_known_extensions = false")
    connection.execute("SET enable_external_access = false")
    connection.execute("SET threads = 1")
    connection.execute("SET memory_limit = '256MB'")
    connection.execute("SET max_temp_directory_size = '64MB'")
    connection.execute("SET lock_configuration = true")


def _materialize_frame(connection: duckdb.DuckDBPyConnection, frame: pl.DataFrame) -> None:
    definitions = ", ".join(
        f'"{column}" {_duckdb_type(frame.schema[column])}' for column in frame.columns
    )
    connection.execute(f"CREATE TABLE dataset ({definitions})")
    placeholders = ", ".join("?" for _ in frame.columns)
    connection.executemany(
        f"INSERT INTO dataset VALUES ({placeholders})",  # nosec B608
        frame.iter_rows(),
    )


def _duckdb_type(dtype: pl.DataType) -> str:
    name = str(dtype)
    if name.startswith("UInt"):
        return "UBIGINT"
    if name.startswith("Int"):
        return "BIGINT"
    if name.startswith(("Float", "Decimal")):
        return "DOUBLE"
    if name == "Boolean":
        return "BOOLEAN"
    if name == "Date":
        return "DATE"
    if name.startswith("Datetime"):
        return "TIMESTAMP"
    if name == "Time":
        return "TIME"
    if name in {"String", "Categorical", "Enum", "Null"}:
        return "VARCHAR"
    raise HTTPException(status_code=422, detail=f"El tipo de columna {name} no es compatible.")


def normalize_columns(frame: pl.DataFrame) -> tuple[pl.DataFrame, dict[str, str]]:
    names: list[str] = []
    seen: dict[str, int] = {}
    source_columns: dict[str, str] = {}
    for index, original in enumerate(frame.columns, start=1):
        ascii_name = unicodedata.normalize("NFKD", original).encode("ascii", "ignore").decode("ascii")
        normalized = re.sub(r"[^a-z0-9]+", "_", ascii_name.strip().lower()).strip("_") or f"columna_{index}"
        count = seen.get(normalized, 0) + 1
        seen[normalized] = count
        if count > 1:
            normalized = f"{normalized}_{count}"
        names.append(normalized)
        source_columns[normalized] = original
    return frame.rename(dict(zip(frame.columns, names, strict=True))), source_columns


def suggest_questions(columns: list[str]) -> list[str]:
    suggestions = ["¿Cuántas filas contiene este archivo?", "¿Qué columnas tienen valores faltantes?"]
    if "categoría" in columns or "categoria" in columns:
        suggestions.append("¿Qué categoría acumula más ventas?")
    if "región" in columns or "region" in columns:
        suggestions.append("Compara las ventas por región.")
    return suggestions[:4]


dataset_store = DatasetStore()
