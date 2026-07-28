---
name: Habla con tus datos
description: Una interfaz explicadora para convertir archivos cotidianos en respuestas verificables.
colors:
  ink: "#17211F"
  paper: "#F7F2E7"
  teal: "#007F7B"
  coral: "#E35D46"
  highlighter: "#FFE34E"
  soft-teal: "#D8F0E7"
  line: "#1F2C29"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: "8px"
  md: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
---

# Design System: Habla con tus datos

## Overview

**Creative North Star: "La libreta de una persona que por fin entendió su planilla"**

La interfaz explica una capacidad compleja con la franqueza de una nota bien hecha: ideas grandes, anotaciones breves y evidencia concreta. La tecnología se ve en el SQL y el gráfico; la personalidad vive en los subrayados, flechas y cortes editoriales, no en efectos de moda.

**Key Characteristics:** tinta firme, papel cálido, alto contraste, diagramas explicativos y datos que se pueden inspeccionar.

## Colors

Teal es la acción y la señal de confianza; coral llama la atención sobre lo verificable; amarillo sólo subraya la idea que importa. El papel nunca se convierte en beige tenue: el texto debe conservar contraste fuerte.

**The Evidence Rule.** El color acompaña una evidencia, un paso o una acción; no decora áreas sin función.

## Typography

El display es compacto, expresivo y humano; el cuerpo es sobrio y fácil de leer. El monoespaciado sólo aparece dentro de SQL, métricas y muestras de datos.

En vistas operativas, botones, etiquetas, columnas y navegación usan la familia de cuerpo y una escala fija; el display no se usa para controles ni tablas.

## Layout

La landing se construye como una secuencia editorial: declaración, demostración, cuatro pasos y cierre. En escritorio el demo ocupa una doble columna; en móvil los elementos se vuelven una sola historia vertical sin perder el orden del flujo.

Las vistas operativas usan una barra superior, navegación de flujo y una columna de contexto del dataset. La identidad editorial queda en los títulos y en la evidencia visual; tablas, campos, navegación y estados preservan patrones de producto claros y compactos.

## Elevation & Depth

No hay tarjetas flotantes genéricas. Los paneles son hojas delimitadas por líneas de tinta; la profundidad aparece en sombras desplazadas cortas, como papel sobre una mesa.

## Shapes

Rectángulos con esquinas discretamente redondeadas, contornos de 2px y subrayados imperfectos hechos con SVG. Los pills quedan reservados para etiquetas y estado.

## Do's and Don'ts

### Do:
- **Do** mostrar el flujo real archivo → pregunta → SQL → resultado desde el primer viewport.
- **Do** usar símbolos y diagramas inline SVG con etiquetas accesibles.
- **Do** mantener acciones claras y color de foco visible.

### Don't:
- **Don't** usar estética de dashboard sci-fi, vidrio, neón o gradientes decorativos.
- **Don't** inventar clientes, métricas o promesas de privacidad absoluta.
- **Don't** usar el dibujo como sustituto de jerarquía o legibilidad.
