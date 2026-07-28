/*
THESIS: La IA se vuelve confiable cuando se puede seguir con el dedo: archivo, pregunta, SQL y resultado.
OWN-WORLD: Papel cálido, tinta oscura, teal operativo y anotaciones editoriales coral/amarillas.
STORY: Un visitante entiende que puede preguntar en español y comprobar de dónde sale cada número.
FIRST VIEWPORT: Declaración a la izquierda; demostración viva del flujo a la derecha; CTA bajo el argumento.
FORM: Zine técnico explicador, con demo editorial como foco y secuencia vertical como continuidad (seed 859188d3).
*/

const Arrow = () => (
  <svg aria-hidden="true" className="arrow" viewBox="0 0 30 18" fill="none">
    <path d="M1 9h24M18 2l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Mark = ({ children }: { children: React.ReactNode }) => <span className="mark">{children}</span>;

export default function Home() {
  return (
    <main>
      <section className="hero-shell" id="inicio">
        <nav className="nav" aria-label="Navegación principal">
          <a className="brand" href="#inicio" aria-label="Habla con tus datos, inicio">
            <span>Habla</span>
            <small>con tus datos</small>
          </a>
          <div className="nav-links">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#por-que">Por qué confiar</a>
          </div>
          <a className="nav-cta" href="/demo">Analizar mis datos <Arrow /></a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="dot" /> Datos sin rodeos</p>
            <h1>Pregunta en español.<br />Entiende tus datos <Mark>de verdad.</Mark></h1>
            <p className="lede">Sube un Excel o CSV, escribe tu pregunta como se la harías a alguien de tu equipo y obtén una respuesta, un gráfico y el SQL que la respalda.</p>
            <div className="hero-actions">
              <a className="button primary" href="/demo">Analizar mis datos <Arrow /></a>
              <a className="button text" href="#como-funciona">Ver cómo funciona <span aria-hidden="true">↓</span></a>
            </div>
            <p className="microcopy">Sin registro para probar. Pensado para archivos no sensibles.</p>
          </div>

          <div className="hero-art" id="demo" aria-label="Ejemplo ilustrativo del producto">
            <div className="scribble top-scribble">pruébalo con un clic ↘</div>
            <div className="demo-window">
              <div className="demo-topbar"><span /><span /><span /><b>ventas_2025.xlsx</b><i>Ejemplo ilustrativo</i></div>
              <div className="demo-content">
                <aside className="source-panel">
                  <span className="panel-kicker">01 · archivo</span>
                  <div className="file-card">
                    <svg viewBox="0 0 48 56" aria-hidden="true"><path d="M8 2h22l10 10v40a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#d8f0e7" stroke="currentColor" strokeWidth="2"/><path d="M30 2v11h10" stroke="currentColor" strokeWidth="2"/><path d="M13 25h20M13 34h20M13 43h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <b>ventas.csv</b><small>2.184 filas · 6 columnas</small>
                  </div>
                  <p className="side-note">Tus columnas se leen para entender el contexto.</p>
                </aside>
                <div className="analysis-panel">
                  <span className="panel-kicker">02 · tu pregunta</span>
                  <div className="question">¿Qué categoría acumuló más ventas este año?<span aria-hidden="true">↗</span></div>
                  <div className="generated-label"><span /> SQL generado <em>puedes revisarlo</em></div>
                  <pre><code><span>SELECT</span> categoria, SUM(ventas) <i>AS</i> total<br /><span>FROM</span> ventas<br /><span>WHERE</span> fecha &gt;= <i>&apos;2025-01-01&apos;</i><br /><span>GROUP BY</span> categoria<br /><span>ORDER BY</span> total <i>DESC</i>;</code></pre>
                  <div className="answer"><b>Resultado</b><p><strong>Tecnología</strong> lidera las ventas acumuladas en 2025 con <strong>78.420 unidades</strong>.</p></div>
                </div>
                <div className="chart-panel">
                  <span className="panel-kicker">03 · gráfico</span>
                  <div className="chart-title">Ventas por categoría</div>
                  <div className="bars" role="img" aria-label="Gráfico de barras: Tecnología 78, Hogar 54, Oficina 39, Deportes 32">
                    <div><i style={{ height: "100%" }} /><span>Tec.</span></div><div><i style={{ height: "69%" }} /><span>Hogar</span></div><div><i style={{ height: "50%" }} /><span>Oficina</span></div><div><i style={{ height: "41%" }} /><span>Deportes</span></div>
                  </div>
                  <div className="chart-note">Los números se calculan en la consulta, no se adivinan.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" id="por-que" aria-label="Principios del producto">
        <p><strong>Una respuesta útil</strong> no es una caja negra.</p>
        <div><span className="check">✓</span> consulta ejecutada <span className="check">✓</span> SQL visible <span className="check">✓</span> gráfico entendible</div>
      </section>

      <section className="how" id="como-funciona">
        <div className="section-heading"><p className="eyebrow"><span className="dot coral" /> Cuatro pasos, sin ceremonia</p><h2>Del archivo a una <Mark>decisión más clara.</Mark></h2></div>
        <div className="steps">
          <article className="step file-step"><div className="step-number">1</div><div><h3>Carga tu archivo</h3><p>CSV o la primera hoja de un Excel. Revisamos las columnas y una muestra; no necesitas preparar nada adicional.</p></div><svg viewBox="0 0 96 72" aria-hidden="true"><path d="M35 7h28l16 16v40a4 4 0 0 1-4 4H35a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M63 7v17h16M40 37h28M40 47h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></article>
          <article className="step question-step"><div className="step-number">2</div><div><h3>Pregunta con tus palabras</h3><p>“¿Qué producto cayó este mes?” o “compara regiones”. El contexto de tu tabla guía la consulta.</p></div><div className="speech">¿Dónde se redujo el margen?<span>↘</span></div></article>
          <article className="step sql-step"><div className="step-number">3</div><div><h3>Revisa el SQL</h3><p>La IA propone la consulta; el sistema solo ejecuta SQL de lectura y permite inspeccionarlo.</p></div><code>SELECT<br />&nbsp;region, SUM(margen)<br />FROM ventas…</code></article>
          <article className="step result-step"><div className="step-number">4</div><div><h3>Consulta el resultado</h3><p>La respuesta viene de los datos ejecutados, junto a una tabla y un gráfico para comparar.</p></div><div className="mini-chart"><i /><i /><i /><i /></div></article>
        </div>
      </section>

      <section className="proof">
        <div className="proof-copy"><p className="eyebrow"><span className="dot" /> Construido para confiar</p><h2>La IA traduce.<br />Tu base de datos <Mark>comprueba.</Mark></h2><p>No pedimos a un modelo que haga aritmética ni que invente una explicación. Genera una consulta controlada, DuckDB la ejecuta y solo entonces se construye la respuesta.</p><a className="inline-link" href="/demo">Iniciar un análisis <Arrow /></a></div>
        <div className="proof-diagram" aria-label="Diagrama del flujo: pregunta pasa a SQL validado, se ejecuta en DuckDB y devuelve un resultado verificable">
          <div className="diagram-node question-node">Tu pregunta <span>¿Qué región…?</span></div><Arrow /><div className="diagram-node sql-node">SQL validado <span>SELECT …</span></div><Arrow /><div className="diagram-node duck-node">DuckDB <span>ejecuta de verdad</span></div><Arrow /><div className="diagram-node result-node">Respuesta <span>gráfico + tabla</span></div>
          <p>La explicación se escribe <em>después</em> de calcular.</p>
        </div>
      </section>

      <section className="closing"><div><p className="eyebrow"><span className="dot coral" /> Hablemos de tus datos</p><h2>Una hoja de cálculo puede responder<br />más de lo que parece.</h2></div><a className="button primary light" href="/demo">Analizar mis datos <Arrow /></a></section>

      <footer><a className="brand" href="#inicio"><span>Habla</span><small>con tus datos</small></a><p>Proyecto de portafolio de Nicolás Condeza · datos de ejemplo ilustrativos</p><a href="#inicio">Volver arriba ↑</a></footer>
    </main>
  );
}
