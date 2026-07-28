import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habla con tus datos | Pregunta, verifica, decide",
  description: "Convertí un CSV o Excel en respuestas verificables con SQL y gráficos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
