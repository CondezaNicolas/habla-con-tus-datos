# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Profesionales, pymes y potenciales clientes freelance que necesitan entender rápidamente un CSV o Excel sin escribir SQL. La landing también la evaluarán clientes que revisan el portafolio de Nicolás antes de contratarlo.

## Product Purpose

Habla con tus datos permite cargar un CSV/XLSX, hacer una pregunta en español y recibir una respuesta basada en una consulta SQL ejecutada de verdad, con tabla y gráfico. El éxito es una demo pública comprensible y convincente sin registro.

## Positioning

No calcula ni inventa números en el prompt: convierte la pregunta en SQL de solo lectura, lo valida y ejecuta sobre DuckDB; muestra la consulta para que el resultado sea verificable.

## Operating Context

El visitante llega desde un CV, GitHub o una propuesta freelance. Debe comprender el valor y probar un dataset de ejemplo en menos de dos minutos; puede cargar su propio CSV/XLSX de hasta 10 MB, primera hoja en Excel.

## Capabilities and Constraints

La primera versión no tiene cuentas ni historial. Los archivos son efímeros. Incluye dataset de ejemplo, preguntas en español, SQL visible, gráfico, tabla y límites de seguridad. El proyecto usa Next.js en web y FastAPI/Python, Polars y DuckDB en API. La demo busca costo operativo mensual de USD 0 y no debe prometer privacidad absoluta ni admitir datos sensibles.

## Brand Commitments

Nombre de trabajo: “Habla con tus datos”. Voz directa, clara y profesional en español neutro. Debe sentirse como un producto serio y construido, no como una maqueta genérica de IA.

## Evidence on Hand

Existe el SDD del proyecto en `C:\Users\User\Documents\Memoria\proyecto-habla-con-tus-datos.md`. Aún no existen métricas, clientes, testimonios ni imágenes de producto reales; no se deben inventar. La interfaz de demostración puede usar datos sintéticos claramente identificables como tales.

## Product Principles

- La confianza proviene de resultados ejecutados y SQL visible.
- El camino a la primera respuesta debe ser corto y sin registro.
- La complejidad técnica se demuestra sin exigir conocimiento técnico al visitante.
- Los datos del visitante se tratan como temporales y potencialmente sensibles.

## Accessibility & Inclusion

Cumplir contraste WCAG AA, navegación por teclado, estados de foco visibles y una experiencia móvil completa.
