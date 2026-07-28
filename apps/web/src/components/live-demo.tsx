"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import styles from "./prototype.module.css";
import live from "./live-demo.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY = "habla-con-tus-datos.session";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
let cachedDatasetRaw: string | null | undefined;
let cachedDataset: Dataset | null = null;
let cachedQueryRaw: string | null | undefined;
let cachedQuery: Query | null = null;

type Column = { name: string; source_name?: string; dtype?: string; data_type?: string };
type Dataset = { session_id: string; dataset_name?: string; filename?: string; row_count: number; column_count?: number; columns?: Column[] };
type Query = { sql: string; explanation: string; columns?: string[]; rows?: Record<string, unknown>[]; chart_spec: { kind: "bar" | "line" | "table"; x?: string | null; y?: string | null; title: string }; provider?: string };

const Arrow = () => <span aria-hidden="true">→</span>;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible comunicarse con la API local.";
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail ?? "La consulta no pudo completarse.");
  return payload as T;
}

async function upload(file: File): Promise<Dataset> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/api/v1/datasets/upload`, { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail ?? "No se pudo procesar el archivo.");
  return payload as Dataset;
}

function saveDataset(dataset: Dataset) {
  const serialized = JSON.stringify(dataset);
  localStorage.setItem(STORAGE_KEY, serialized);
  cachedDatasetRaw = serialized;
  cachedDataset = dataset;
}
function readDataset(): Dataset | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === cachedDatasetRaw) return cachedDataset;
    cachedDatasetRaw = stored;
    cachedDataset = stored ? JSON.parse(stored) as Dataset : null;
    return cachedDataset;
  } catch { return null; }
}
function saveQuery(query: Query) {
  const serialized = JSON.stringify(query);
  sessionStorage.setItem(`${STORAGE_KEY}.query`, serialized);
  cachedQueryRaw = serialized;
  cachedQuery = query;
}
function readQuery(): Query | null {
  try {
    const stored = sessionStorage.getItem(`${STORAGE_KEY}.query`);
    if (stored === cachedQueryRaw) return cachedQuery;
    cachedQueryRaw = stored;
    cachedQuery = stored ? JSON.parse(stored) as Query : null;
    return cachedQuery;
  } catch { return null; }
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function emptyStorageSnapshot() { return null; }

function datasetName(dataset: Dataset) { return dataset.dataset_name ?? dataset.filename ?? "Archivo sin nombre"; }
function datasetColumns(dataset: Dataset) { return Array.isArray(dataset.columns) ? dataset.columns : []; }
function datasetColumnCount(dataset: Dataset) { return dataset.column_count ?? datasetColumns(dataset).length; }
function columnType(column: Column) { return column.dtype ?? column.data_type ?? "sin tipo"; }
function isNumericColumn(column: Column) { return /int|float|decimal|double|numeric/i.test(columnType(column)); }
function queryRows(query: Query) { return Array.isArray(query.rows) ? query.rows : []; }
function queryColumns(query: Query) {
  if (Array.isArray(query.columns) && query.columns.every((column) => typeof column === "string")) return query.columns;
  const firstRow = queryRows(query).find((row) => row && typeof row === "object");
  return firstRow ? Object.keys(firstRow) : [];
}

function Header({ active }: { active: "upload" | "analysis" | "sql" }) {
  return <header className={styles.header}>
    <Link className={styles.logo} href="/"><span>Habla</span><small>con tus datos</small></Link>
    <nav className={styles.nav} aria-label="Navegación del análisis">
      <Link className={active === "upload" ? styles.active : ""} href="/demo">Cargar datos</Link>
      <Link className={active === "analysis" ? styles.active : ""} href="/demo/analysis">Análisis</Link>
      <Link className={active === "sql" ? styles.active : ""} href="/demo/sql">SQL</Link>
    </nav>
    <Link className={styles.exit} href="/">Volver al inicio <Arrow /></Link>
  </header>;
}

function Shell({ active, children }: { active: "upload" | "analysis" | "sql"; children: React.ReactNode }) {
  return <main className={styles.page}><Header active={active} />{children}</main>;
}

function DatasetContext({ dataset }: { dataset: Dataset }) {
  return <div className={styles.context}>
    <div><span className={styles.kicker}>Análisis activo</span><h1>{datasetName(dataset)}</h1></div>
    <div className={styles.datasetMeta}><span className={styles.statusDot} /> {dataset.row_count.toLocaleString("es-CL")} filas <i /> {datasetColumnCount(dataset)} columnas <i /> Sesión temporal</div>
  </div>;
}

export function LiveUpload() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openFilePicker = () => fileInput.current?.click();
  const goToAnalysis = (dataset: Dataset) => { saveDataset(dataset); router.push("/demo/analysis"); };
  const loadExample = async () => {
    setLoading(true); setError("");
    try { goToAnalysis(await request<Dataset>("/api/v1/datasets/example", {})); }
    catch (cause) { setError(`${errorMessage(cause)} Verifica que FastAPI esté iniciado en el puerto 8000.`); }
    finally { setLoading(false); }
  };
  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") { setError("Selecciona un archivo CSV o XLSX."); return; }
    if (file.size > MAX_FILE_BYTES) { setError("El archivo supera el límite de 10 MB. Elige uno más pequeño."); return; }
    setLoading(true); setError("");
    try { goToAnalysis(await upload(file)); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  };

  return <Shell active="upload">
    <div className={styles.context}><div><span className={styles.kicker}>Analiza tus datos</span><h1>Nuevo análisis</h1></div></div>
    <section className={styles.uploadGrid}>
      <div className={styles.uploadCopy}>
        <p className={styles.sectionTag}>Empieza aquí</p><h2>Convierte una hoja de cálculo en una conversación.</h2>
        <p>Selecciona un CSV o Excel. Revisaremos sus columnas antes de permitir preguntas, para que cada respuesta se apoye en datos reales.</p>
        <dl><div><dt>Formatos</dt><dd>CSV · XLSX</dd></div><div><dt>Tamaño máximo</dt><dd>10 MB</dd></div><div><dt>Conservación</dt><dd>Temporal</dd></div></dl>
      </div>
      <div className={styles.dropZone} aria-busy={loading}>
        <div className={styles.fileIcon} aria-hidden="true">↥</div>
        <h3>{loading ? "Preparando el archivo" : "Carga un archivo"}</h3>
        <p>{loading ? "Detectando columnas y creando una sesión temporal." : "CSV o XLSX, primera hoja de Excel."}</p>
        <input ref={fileInput} className={live.fileInput} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} tabIndex={-1} />
        <button className={live.primaryButton} type="button" onClick={openFilePicker} disabled={loading}>{loading ? "Procesando…" : "Elegir archivo"}</button>
        {error ? <p className={live.error} role="alert">{error}</p> : <span className={styles.help}>El archivo se procesa de forma temporal en esta sesión.</span>}
        <div className={styles.or}><span />o<span /></div>
        <button className={live.exampleButton} type="button" onClick={loadExample} disabled={loading}>Usar el conjunto de datos de ejemplo <Arrow /></button>
      </div>
    </section>
    <section className={styles.reassurance}><div><b>Tu archivo es temporal</b><span>Se elimina al expirar la sesión.</span></div><div><b>Sin registro</b><span>Prueba el flujo sin crear una cuenta.</span></div><div><b>Consulta verificable</b><span>Siempre podrás revisar el SQL generado.</span></div></section>
  </Shell>;
}

function Schema({ dataset }: { dataset: Dataset }) {
  const columns = datasetColumns(dataset);
  return <aside className={styles.schema}><div className={styles.sideTitle}><span>Archivo activo</span><b>{datasetName(dataset)}</b><small>{dataset.row_count.toLocaleString("es-CL")} filas · {datasetColumnCount(dataset)} columnas</small></div><div className={styles.columns}><span>Columnas detectadas</span>{columns.map((column) => <div key={column.name}><i className={isNumericColumn(column) ? styles.number : ""} />{column.source_name ?? column.name}<small>{columnType(column)}</small></div>)}</div><Link className={styles.newDataset} href="/demo">+ Cargar otro archivo</Link></aside>;
}

function Table({ query }: { query: Query }) {
  const columns = queryColumns(query);
  const rows = queryRows(query);
  if (!columns.length) return <div className={styles.tableBox}><div className={styles.tableHeader}><span>Resultado de la consulta</span></div><p>No se encontraron filas para mostrar.</p></div>;
  return <div className={styles.tableBox}><div className={styles.tableHeader}><span>Resultado de la consulta</span><button type="button" disabled>Exportar · Próximamente</button></div><table><thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div>;
}

function ResultChart({ query }: { query: Query }) {
  const { chart_spec: chart } = query;
  const x = chart.x;
  const y = chart.y;
  if (chart.kind !== "bar" || !x || !y) return null;
  const values = queryRows(query).map((row) => ({ label: String(row[x] ?? "Sin etiqueta"), value: Number(row[y]) })).filter((item) => Number.isFinite(item.value)).slice(0, 12);
  const maximum = Math.max(...values.map((item) => item.value), 1);
  if (!values.length) return null;
  return <section className={live.chartBox} aria-labelledby="chart-title"><div className={live.chartHeading}><div><span className={styles.kicker}>Visualización</span><h3 id="chart-title">{chart.title}</h3></div><span>{values.length} categorías</span></div><div className={live.bars} role="img" aria-label={`${chart.title}. ${values.map((item) => `${item.label}: ${item.value}`).join(", ")}`}>{values.map((item, index) => <div className={live.barRow} key={`${item.label}-${index}`}><span>{item.label}</span><div className={live.track}><i style={{ width: `${Math.max((item.value / maximum) * 100, 2)}%` }} /></div><b>{new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(item.value)}</b></div>)}</div></section>;
}

export function LiveAnalysis() {
  const dataset = useSyncExternalStore(subscribeToStorage, readDataset, emptyStorageSnapshot); const [query, setQuery] = useState<Query | null>(null); const [question, setQuestion] = useState("¿Qué categoría acumuló más ventas?"); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const run = async (active: Dataset, nextQuestion: string) => { setLoading(true); setError(""); try { const result = await request<Query>("/api/v1/queries/question", { session_id: active.session_id, question: nextQuestion }); setQuery(result); saveQuery(result); } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); } };
  useEffect(() => { if (!dataset) return; const timer = window.setTimeout(() => { void run(dataset, "¿Qué categoría acumuló más ventas?"); }, 0); return () => window.clearTimeout(timer); }, [dataset]);
  if (!dataset) return <Shell active="analysis"><div className={styles.statesIntro}><p className={styles.sectionTag}>Preparando sesión</p><h2>Abriendo tus datos.</h2></div></Shell>;
  return <Shell active="analysis"><DatasetContext dataset={dataset} /><div className={styles.workspace}><Schema dataset={dataset} /><section className={styles.conversation}><div className={styles.conversationTop}><div><span className={styles.kicker}>Pregunta actual</span><h2>{question}</h2></div><Link href="/demo/sql">Ver SQL <Arrow /></Link></div>{loading && <div className={styles.answer}><span className={styles.aiLabel}>Consultando datos</span><p>Ejecutando una consulta segura sobre tu archivo…</p></div>}{error && <div className={styles.answer}><span className={live.error} role="alert">{error}</span></div>}{query && <><div className={styles.answer}><span className={styles.aiLabel}>Respuesta basada en la consulta ejecutada</span><p>{query.explanation}</p></div><ResultChart query={query} /><Table query={query} /></>}<form className={styles.ask} onSubmit={(event) => { event.preventDefault(); void run(dataset, question); }}><div><label className={live.questionLabel} htmlFor="question">Haz otra pregunta sobre este archivo</label><input className={live.questionInput} id="question" value={question} onChange={(event) => setQuestion(event.target.value)} /></div><button className={live.sendButton} type="submit" disabled={loading} aria-label="Enviar pregunta">↑</button></form><div className={styles.suggestions}><span>Prueba con:</span><button className={live.suggestion} type="button" onClick={() => { setQuestion("Muestra las ventas por región"); void run(dataset, "Muestra las ventas por región"); }}>Ventas por región</button><button className={live.suggestion} type="button" onClick={() => { setQuestion("¿Cuántos registros hay?"); void run(dataset, "¿Cuántos registros hay?"); }}>¿Cuántos registros hay?</button></div></section></div></Shell>;
}

export function LiveSql() {
  const dataset = useSyncExternalStore(subscribeToStorage, readDataset, emptyStorageSnapshot); const query = useSyncExternalStore(subscribeToStorage, readQuery, emptyStorageSnapshot);
  if (!dataset) return <Shell active="sql"><div className={styles.statesIntro}><p className={styles.sectionTag}>Preparando sesión</p><h2>Cargando la consulta.</h2></div></Shell>;
  return <Shell active="sql"><DatasetContext dataset={dataset} /><div className={styles.workspace}><Schema dataset={dataset} /><section className={styles.sqlPage}><div className={styles.sqlIntro}><div><p className={styles.sectionTag}>Consulta verificable</p><h2>El resultado tiene una consulta que puedes revisar.</h2><p>Antes de ejecutarse, el SQL se restringe a lectura, una sola sentencia y las columnas detectadas en tu archivo.</p></div><Link href="/demo/analysis" className={styles.backLink}>← Volver al análisis</Link></div>{query ? <><div className={styles.sqlLayout}><div className={styles.sqlPanel}><div className={styles.sqlToolbar}><span>Consulta generada</span><button type="button" disabled>Copiar · Próximamente</button></div><pre><code>{query.sql}</code></pre><div className={styles.validation}><span>✓ Una sola consulta</span><span>✓ Solo lectura</span><span>✓ Columnas válidas</span></div></div><div className={styles.sqlExplanation}><span className={styles.kicker}>Cómo leerla</span><p>{query.explanation}</p><p>Proveedor actual: {query.provider ?? "API local"}.</p></div></div><Table query={query} /></> : <div className={styles.answer}><span className={styles.aiLabel}>Sin consulta todavía</span><p>Vuelve al análisis y realiza una pregunta para ver el SQL ejecutado.</p></div>}</section></div></Shell>;
}
