import Link from "next/link";
import styles from "./prototype.module.css";

type Screen = "upload" | "analysis" | "sql" | "states";

const Arrow = () => <span aria-hidden="true">→</span>;

const nav = [
  ["upload", "Cargar datos", "/demo"],
  ["analysis", "Análisis", "/demo/analysis"],
  ["sql", "SQL", "/demo/sql"],
  ["states", "Estados", "/demo/states"],
] as const;

function Logo() {
  return <Link className={styles.logo} href="/"><span>Habla</span><small>con tus datos</small></Link>;
}

function Shell({ screen, children }: { screen: Screen; children: React.ReactNode }) {
  return <main className={styles.page}>
    <header className={styles.header}>
      <Logo />
      <nav className={styles.nav} aria-label="Navegación de la demostración">
        {nav.map(([key, label, href]) => <Link className={screen === key ? styles.active : ""} href={href} key={key}>{label}</Link>)}
      </nav>
      <Link className={styles.exit} href="/">Salir de la demo <Arrow /></Link>
    </header>
    {children}
  </main>;
}

function ContextBar({ screen }: { screen: Screen }) {
  const title = screen === "upload" ? "Nuevo análisis" : "ventas_2025.xlsx";
  return <div className={styles.context}><div><span className={styles.kicker}>Análisis</span><h1>{title}</h1></div>{screen !== "upload" && <div className={styles.datasetMeta}><span className={styles.statusDot} /> 2.184 filas <i /> 6 columnas <i /> Sesión temporal</div>}</div>;
}

export function UploadView() {
  return <Shell screen="upload"><ContextBar screen="upload" />
    <section className={styles.uploadGrid}>
      <div className={styles.uploadCopy}><p className={styles.sectionTag}>Empieza aquí</p><h2>Convierte una hoja de cálculo en una conversación.</h2><p>Selecciona un CSV o Excel. Revisaremos sus columnas antes de permitir preguntas, para que cada respuesta se apoye en datos reales.</p><dl><div><dt>Formatos</dt><dd>CSV · XLSX</dd></div><div><dt>Tamaño máximo</dt><dd>10 MB</dd></div><div><dt>Conservación</dt><dd>Temporal</dd></div></dl></div>
      <div className={styles.dropZone}><div className={styles.fileIcon} aria-hidden="true">↥</div><h3>Arrastra un archivo aquí</h3><p>o selecciónalo desde tu equipo</p><button type="button" disabled>Elegir archivo</button><span className={styles.help}>La carga real se habilitará al conectar el backend.</span><div className={styles.or}><span />o<span /></div><Link className={styles.example} href="/demo/analysis">Usar el conjunto de datos de ejemplo <Arrow /></Link></div>
    </section>
    <section className={styles.reassurance}><div><b>Tu archivo es temporal</b><span>Se elimina al expirar la sesión.</span></div><div><b>Sin registro</b><span>Prueba el flujo sin crear una cuenta.</span></div><div><b>Consulta verificable</b><span>Siempre podrás revisar el SQL generado.</span></div></section>
  </Shell>;
}

const columns = ["fecha", "producto", "categoría", "región", "unidades", "ventas"];

function Schema() { return <aside className={styles.schema}><div className={styles.sideTitle}><span>Archivo activo</span><b>ventas_2025.xlsx</b><small>2.184 filas · 6 columnas</small></div><div className={styles.columns}><span>Columnas detectadas</span>{columns.map((column, index) => <div key={column}><i className={index === 0 || index === 4 || index === 5 ? styles.number : ""} />{column}<small>{index === 0 ? "fecha" : index > 3 ? "número" : "texto"}</small></div>)}</div><Link className={styles.newDataset} href="/demo">+ Cargar otro archivo</Link></aside>; }

function Chart() { return <div className={styles.chartBox}><div className={styles.chartTop}><div><span className={styles.kicker}>Resultado</span><h3>Ventas por categoría</h3></div><span className={styles.period}>Ene – Jun 2025</span></div><div className={styles.chart} role="img" aria-label="Gráfico de barras de ventas por categoría. Tecnología lidera con 78.420 unidades."><div className={styles.axis}><span>80k</span><span>60k</span><span>40k</span><span>20k</span><span>0</span></div><div className={styles.chartBars}><div><i style={{height:"94%"}} /><span>Tecnología</span></div><div><i style={{height:"69%"}} /><span>Hogar</span></div><div><i style={{height:"51%"}} /><span>Oficina</span></div><div><i style={{height:"39%"}} /><span>Deportes</span></div></div></div><p className={styles.chartConclusion}><strong>Tecnología</strong> concentra el mayor volumen de ventas: 78.420 unidades.</p></div>; }

function ResultTable() { return <div className={styles.tableBox}><div className={styles.tableHeader}><span>Resultado de la consulta</span><button type="button" disabled>Exportar · Próximamente</button></div><table><thead><tr><th>Categoría</th><th>Unidades vendidas</th><th>Participación</th></tr></thead><tbody><tr><td><i className={styles.legendTeal} />Tecnología</td><td>78.420</td><td>31,1%</td></tr><tr><td><i className={styles.legendCoral} />Hogar</td><td>54.230</td><td>21,5%</td></tr><tr><td><i className={styles.legendYellow} />Oficina</td><td>39.870</td><td>15,8%</td></tr></tbody></table></div>; }

function Conversation() { return <section className={styles.conversation}><div className={styles.conversationTop}><div><span className={styles.kicker}>Pregunta actual</span><h2>¿Qué categoría acumuló más ventas este año?</h2></div><Link href="/demo/sql">Ver SQL <Arrow /></Link></div><div className={styles.answer}><span className={styles.aiLabel}>Respuesta basada en la consulta ejecutada</span><p><strong>Tecnología</strong> lidera las ventas acumuladas en 2025 con <strong>78.420 unidades</strong>, seguida por Hogar con 54.230.</p></div><Chart /><ResultTable /><div className={styles.ask}><div><span>Haz otra pregunta sobre este archivo</span><small>Las preguntas se habilitarán al conectar el backend.</small></div><button type="button" disabled aria-label="Enviar pregunta">↑</button></div><div className={styles.suggestions}><span>Prueba con:</span><button type="button" disabled>Compara las ventas por región</button><button type="button" disabled>¿Qué producto cayó más?</button></div></section>; }

export function AnalysisView() { return <Shell screen="analysis"><ContextBar screen="analysis" /><div className={styles.workspace}><Schema /><Conversation /></div></Shell>; }

export function SqlView() { return <Shell screen="sql"><ContextBar screen="sql" /><div className={styles.workspace}><Schema /><section className={styles.sqlPage}><div className={styles.sqlIntro}><div><p className={styles.sectionTag}>Consulta verificable</p><h2>El resultado tiene una consulta que puedes revisar.</h2><p>Antes de ejecutarse, el SQL se restringe a lectura, una sola sentencia y las columnas detectadas en tu archivo.</p></div><Link href="/demo/analysis" className={styles.backLink}>← Volver al análisis</Link></div><div className={styles.sqlLayout}><div className={styles.sqlPanel}><div className={styles.sqlToolbar}><span>Consulta generada</span><button type="button" disabled>Copiar · Próximamente</button></div><pre><code><b>SELECT</b> categoría,<br />&nbsp;&nbsp;&nbsp;&nbsp;<b>SUM</b>(unidades) <em>AS</em> unidades_vendidas<br /><b>FROM</b> ventas<br /><b>WHERE</b> fecha &gt;= <em>&apos;2025-01-01&apos;</em><br /><b>GROUP BY</b> categoría<br /><b>ORDER BY</b> unidades_vendidas <b>DESC</b>;</code></pre><div className={styles.validation}><span>✓ Una sola consulta</span><span>✓ Solo lectura</span><span>✓ Columnas válidas</span></div></div><div className={styles.sqlExplanation}><span className={styles.kicker}>Cómo leerla</span><ol><li><b>Filtra</b> las filas desde el 1 de enero de 2025.</li><li><b>Agrupa</b> las ventas por categoría.</li><li><b>Ordena</b> el total de mayor a menor.</li></ol><p>La explicación se genera después de ejecutar el resultado.</p></div></div><ResultTable /></section></div></Shell>; }

export function StatesView() { const states = [{kind:"loading",title:"Analizando el archivo",text:"Detectando columnas y preparando una vista previa.",action:"Procesando…"},{kind:"error",title:"No se pudo leer el archivo",text:"El archivo debe ser CSV o XLSX y pesar menos de 10 MB.",action:"Elegir otro archivo"},{kind:"expired",title:"La sesión expiró",text:"Por seguridad, el archivo temporal ya no está disponible.",action:"Cargar nuevamente"},{kind:"limit",title:"Límite temporal alcanzado",text:"La demostración recibió muchas preguntas. Inténtalo de nuevo en unos minutos.",action:"Volver al inicio"}]; return <Shell screen="states"><ContextBar screen="upload" /><section className={styles.statesIntro}><p className={styles.sectionTag}>Estados previstos</p><h2>Una interfaz clara también explica lo que está ocurriendo.</h2><p>Estas vistas quedan preparadas para la integración de API, carga de archivos y límites de uso.</p></section><section className={styles.states}>{states.map((state) => <article className={`${styles.state} ${styles[state.kind]}`} key={state.kind}><div className={styles.stateGlyph} aria-hidden="true">{state.kind === "loading" ? "···" : state.kind === "error" ? "!" : state.kind === "expired" ? "⌛" : "↺"}</div><span className={styles.kicker}>{state.kind === "loading" ? "Procesando" : state.kind === "error" ? "Archivo inválido" : state.kind === "expired" ? "Sesión temporal" : "Demostración"}</span><h3>{state.title}</h3><p>{state.text}</p>{state.kind === "loading" ? <div className={styles.skeleton}><i /><i /><i /></div> : <Link href={state.kind === "limit" ? "/" : "/demo"}>{state.action} <Arrow /></Link>}</article>)}</section></Shell>; }
