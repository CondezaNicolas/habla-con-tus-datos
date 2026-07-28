from __future__ import annotations

from fastapi import HTTPException
from sqlglot import exp, parse

from app.config import settings
from app.schemas import ChartSpec, QueryResult
from app.services.datasets import DatasetSession


ALLOWED_FUNCTIONS = {
    "ABS",
    "AVG",
    "CAST",
    "CEIL",
    "COALESCE",
    "COUNT",
    "DATE_TRUNC",
    "DAY",
    "EXTRACT",
    "FLOOR",
    "LENGTH",
    "LOWER",
    "MAX",
    "MIN",
    "MONTH",
    "NULLIF",
    "ROUND",
    "STRFTIME",
    "SUBSTRING",
    "SUM",
    "TIMESTAMP_TRUNC",
    "TRY_CAST",
    "UPPER",
    "YEAR",
}
FORBIDDEN_NODES = (exp.Join, exp.Union, exp.Intersect, exp.Except, exp.Subquery, exp.With)


def validate_and_execute(session: DatasetSession, sql: str, provider: str = "direct-sql") -> QueryResult:
    expression = _validate_sql(session, sql)
    normalized_sql = expression.sql(dialect="duckdb")
    try:
        cursor = session.connection.execute(
            # normalized_sql has already passed the strict SQLGlot AST allowlist.
            f"SELECT * FROM ({normalized_sql}) AS guarded_query LIMIT {settings.max_result_rows}"  # nosec B608
        )
        column_names = [column[0] for column in cursor.description]
        rows = [dict(zip(column_names, row, strict=True)) for row in cursor.fetchall()]
    except Exception as error:
        raise HTTPException(status_code=422, detail="La consulta no pudo ejecutarse sobre este archivo.") from error
    return QueryResult(
        sql=normalized_sql,
        rows=rows,
        row_count=len(rows),
        chart_spec=_chart_spec(rows),
        explanation=f"La consulta devolvió {len(rows)} fila(s) verificables.",
        provider=provider,
    )


def _validate_sql(session: DatasetSession, sql: str) -> exp.Expression:
    try:
        statements = parse(sql, read="duckdb")
    except Exception as error:
        raise HTTPException(status_code=422, detail="El SQL no tiene una sintaxis válida.") from error
    if len(statements) != 1 or not isinstance(statements[0], exp.Select):
        raise HTTPException(status_code=422, detail="Solo se permite una consulta SELECT de solo lectura.")
    expression = statements[0]
    if any(expression.find(node_type) is not None for node_type in FORBIDDEN_NODES):
        raise HTTPException(status_code=422, detail="La consulta contiene una operación no permitida.")
    tables = list(expression.find_all(exp.Table))
    if not tables:
        raise HTTPException(status_code=422, detail="La consulta debe leer la tabla dataset.")
    aliases = {alias.alias.lower() for alias in expression.find_all(exp.Alias) if alias.alias}
    for table in tables:
        if table.name.lower() != "dataset" or not isinstance(table.this, exp.Identifier):
            raise HTTPException(status_code=422, detail="La consulta solo puede leer la tabla dataset.")
    for function in expression.find_all(exp.Func):
        function_name = function.name if isinstance(function, exp.Anonymous) else function.sql_name()
        if function_name.upper() not in ALLOWED_FUNCTIONS:
            raise HTTPException(status_code=422, detail="La consulta usa una función no permitida.")
    for column in expression.find_all(exp.Column):
        if column.name != "*" and column.name.lower() not in session.columns and column.name.lower() not in aliases:
            raise HTTPException(status_code=422, detail=f"La columna {column.name} no existe en el archivo.")
    return expression


def _chart_spec(rows: list[dict[str, object]]) -> ChartSpec:
    if not rows:
        return ChartSpec(kind="table", title="Sin resultados")
    keys = list(rows[0])
    numeric = next((key for key in keys if isinstance(rows[0][key], (int, float))), None)
    dimension = next((key for key in keys if key != numeric), None)
    if numeric and dimension:
        return ChartSpec(kind="bar", x=dimension, y=numeric, title=f"{numeric} por {dimension}")
    return ChartSpec(kind="table", title="Resultado de la consulta")
