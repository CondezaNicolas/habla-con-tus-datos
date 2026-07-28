# Arquitectura v1

```text
Next.js (3000) ── HTTP ──> FastAPI (8000)
                               │
                      Polars ──┼── perfilado y preview
                               │
                      DuckDB ──┴── SQL de solo lectura
```

## Sesión y datos

- La API crea un `session_id` por dataset y conserva conexión DuckDB sólo en memoria del proceso.
- No se persisten archivos ni filas; reiniciar la API elimina las sesiones.
- Upload acepta CSV/XLSX, máximo 10 MB, 100.000 filas y 100 columnas.

## Consulta segura

- `sqlglot` acepta una única consulta `SELECT`.
- Sólo permite leer la tabla virtual `dataset` y columnas perfiladas.
- DuckDB ejecuta el SQL dentro de un subquery con límite de 500 filas.

## IA

Sin configuración, el endpoint utiliza `demo-rules` para que el recorrido de ejemplo funcione sin
credenciales. Con `GEMINI_API_KEY`, Gemini genera SQL estructurado en JSON; si Gemini no está
disponible y existe `GROQ_API_KEY`, Groq actúa como respaldo. Ningún proveedor recibe las filas del
archivo, sólo los nombres normalizados de sus columnas y la pregunta. La consulta nunca se ejecuta
directamente: atraviesa el mismo validador SQLGlot y el límite de filas que una consulta manual.
