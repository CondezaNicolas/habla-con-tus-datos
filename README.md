# Habla con tus datos

Demo de análisis conversacional para archivos CSV y Excel. Carga un archivo, formula una pregunta en español y recibe una respuesta basada en una consulta SQL ejecutada realmente, con tabla, gráfico y SQL verificable.

El proyecto fue construido como pieza de portafolio para demostrar desarrollo full-stack con IA aplicada y guardrails de seguridad.

## Qué incluye

- Carga temporal de CSV/XLSX (primera hoja, hasta 10 MB).
- Perfilado de columnas con Polars y consultas sobre DuckDB.
- Preguntas en español convertidas a SQL por Gemini, con Groq como respaldo.
- Modo determinista de demostración cuando no hay claves configuradas.
- Gráficos y tabla como respaldo visible de cada respuesta.
- Página de SQL para revisar la consulta ejecutada.
- Defensa contra prompt injection, presupuesto/rate limits y validación AST estricta de SQL.

## Arquitectura

```text
Next.js ── HTTP ──> FastAPI ──> Polars + DuckDB
                         └──> Gemini / Groq (solo esquema + pregunta)
```

La API no envía las filas del archivo a los proveedores de IA. El modelo devuelve SQL estructurado; luego SQLGlot valida que sea una única consulta de solo lectura sobre la tabla virtual autorizada antes de ejecutarla.

Más detalle en [la arquitectura](docs/architecture.md) y [el informe de seguridad](docs/SECURITY.md).

## Ejecutar localmente

Requisitos: Node.js 20+, pnpm y Python 3.12+.

```bash
# Terminal 1: API
cd apps/api
python -m venv .venv
.venv/Scripts/pip install -e .
copy .env.example .env
.venv/Scripts/uvicorn app.main:app --reload --port 8000

# Terminal 2: web
cd apps/web
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Para consultas con IA, agrega `GEMINI_API_KEY` y, opcionalmente, `GROQ_API_KEY` en `apps/api/.env`. Sin claves, la demo sigue funcionando con reglas deterministas.

## Verificación

```bash
cd apps/web
pnpm lint
pnpm exec tsc --noEmit

cd ../api
.venv/Scripts/python -m pytest -q
```

## Despliegue

El repositorio incluye `render.yaml` para la API Docker. En Render configura `FRONTEND_ORIGIN` con la URL final de Vercel y carga las claves de Gemini/Groq como variables privadas. En Vercel selecciona `apps/web` como directorio raíz y configura `NEXT_PUBLIC_API_URL` con la URL HTTPS de Render antes de desplegar.

## Límites del MVP

- Las sesiones viven en memoria y expiran; reiniciar la API las elimina.
- No hay cuentas ni historial.
- No está diseñado para archivos con información sensible o regulada.
