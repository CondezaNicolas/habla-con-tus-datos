# Seguridad de Habla con tus datos

Fecha de revisión: 2026-07-28

Este documento describe los controles implementados y los límites conocidos. No equivale a una certificación ni a una auditoría independiente.

## Modelo de amenazas

El servicio acepta archivos CSV/XLSX y preguntas anónimas que un proveedor de IA convierte en SQL. Las amenazas prioritarias son:

- prompt injection y extracción de instrucciones;
- SQL generado o enviado con acceso a archivos, red, extensiones o configuración;
- consumo abusivo de tokens, memoria, CPU y sesiones;
- archivos comprimidos maliciosos o cargas excesivas;
- exposición accidental de claves;
- XSS, clickjacking y dependencias vulnerables.

## Controles implementados

### IA y consumo

- La instrucción del sistema y la pregunta del usuario se envían en roles separados.
- Gemini recibe un esquema JSON estricto; Groq recibe modo JSON. Toda salida se vuelve a analizar localmente.
- Los intentos evidentes de prompt injection se rechazan antes de llamar a un proveedor.
- Las preguntas tienen un máximo de 500 caracteres y se rechazan caracteres invisibles o nulos.
- Hay límites por IP, por sesión y un presupuesto global de 250 preguntas válidas cada 24 horas por proceso.
- Las respuestas repetidas se conservan durante cinco minutos para evitar llamadas duplicadas.
- Un circuito pausa durante 60 segundos a un proveedor tras tres fallos consecutivos.
- Gemini se limita a 160 tokens con razonamiento mínimo; Groq se limita a 256 tokens con razonamiento bajo.

### SQL y DuckDB

- Solo se admite un único nodo `SELECT` analizado con SQLGlot.
- La consulta debe leer exclusivamente la tabla materializada `dataset`.
- Se bloquean joins, CTE, subconsultas, uniones y funciones fuera de una lista explícita.
- Se limita la salida a 500 filas y el texto SQL a 5.000 caracteres.
- DuckDB no puede acceder a archivos o red, cargar/instalar extensiones ni modificar su configuración.
- Cada sesión usa un hilo, 256 MB de memoria y 64 MB de almacenamiento temporal como máximo.
- El conjunto de entrada se limita a 100.000 filas y 100 columnas.

### Archivos y sesiones

- La carga se lee por fragmentos y se detiene al superar 10 MB.
- Los XLSX se inspeccionan antes de analizarlos: máximo 1.000 entradas y 50 MB descomprimidos; no se aceptan archivos cifrados.
- Los CSV con bytes nulos y los tipos de columna complejos se rechazan.
- Los nombres de archivo se reducen a un nombre base imprimible de 255 caracteres.
- Se conservan como máximo 100 sesiones durante 30 minutos; las conexiones se cierran al vencer o ser desplazadas.

### Aplicación y secretos

- CORS solo permite el origen configurado del frontend.
- La API responde con `no-store`, `nosniff` y política de referencia restrictiva.
- El frontend declara CSP, bloqueo de marcos, permisos restringidos y aislamiento de ventana.
- La CSP permite `unsafe-eval` únicamente en desarrollo, porque React/Turbopack lo necesita para depuración; el build de producción lo excluye.
- La imagen final usa un runtime mínimo Chainguard/Wolfi, fijado por digest, y se ejecuta como el usuario `nonroot` (UID 65532).
- El runtime no contiene shell ni gestor de paquetes; `pip`, `setuptools` y `wheel` se eliminan después del build.
- El contexto de build usa una allowlist en `.dockerignore`; `.env`, tests y entornos locales no se envían al motor.
- La imagen declara un healthcheck y funciona con filesystem de solo lectura, todas las capabilities eliminadas y `no-new-privileges`.
- Docker Compose reproduce esos controles, limita el proceso a 512 MB, 1 CPU y 100 PID y publica la API sólo en `127.0.0.1`.
- `.env` está excluido del control de versiones y la búsqueda automática no encontró claves en el código.

## Verificación ejecutada

- 33 pruebas de API y seguridad: todas aprobadas.
- Smoke tests reales de Gemini y Groq: ambos produjeron SQL válido y el validador local lo ejecutó.
- Bandit sobre el código Python: sin hallazgos explotables; los usos dinámicos de SQL están parametrizados o protegidos por el validador AST.
- `pip-audit`: sin vulnerabilidades conocidas en dependencias Python.
- `pnpm audit --prod`: sin vulnerabilidades conocidas después de fijar `sharp 0.35.0` y `postcss 8.5.18`.
- ESLint, TypeScript y compilación de producción de Next.js: aprobados.
- Escaneo local de patrones de claves: sin coincidencias fuera de archivos `.env` excluidos.
- Build Docker multietapa aprobado con Chainguard Python/Wolfi y contexto restringido a `pyproject.toml` + `app/`.
- Prueba de la imagen final aprobada como UID 65532, 512 MB, 1 CPU y 100 PID; rechazó escritura en `/app`, prompt injection, SQL apilado y lectura mediante funciones externas de DuckDB.
- El runtime no permite ejecutar `/bin/sh` ni `python -m pip`.
- Trivy, sin omitir vulnerabilidades no corregidas, reportó cero vulnerabilidades altas o críticas en Wolfi y en todas las dependencias Python.
- Se eliminaron `pyarrow` y los extras de Uvicorn porque ya no eran necesarios, reduciendo dependencias y superficie de ataque.

## Riesgos residuales antes de publicar

- El rate limiting y la caché son locales al proceso. En varias réplicas deben moverse a Redis o al proveedor de borde.
- Una aplicación anónima puede recibir tráfico distribuido. En producción se recomienda WAF, límite de gasto/cuota en Gemini y Groq y un desafío antibot en la ruta de preguntas.
- DuckDB advierte que ejecutar SQL no confiable debe aislarse también a nivel de sistema operativo. El contenedor debe desplegarse sin privilegios, con sistema de archivos de solo lectura, límites de CPU/RAM y sin volúmenes sensibles.
- No existe autenticación porque el producto fue definido sin registro. Si se almacenan datos o historiales, será necesario agregar identidad, autorización y aislamiento por usuario.
- Las detecciones textuales de prompt injection son eludibles por sí solas; la seguridad depende de las capas deterministas posteriores, no del filtro ni del comportamiento del modelo.
