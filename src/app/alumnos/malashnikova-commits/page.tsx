import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlumno } from "@/lib/alumnos";
import { ComponenteV0 } from "./ComponenteV0";

const USUARIO = "malashnikova-commits";

export default function PaginaAlumno() {
  const alumno = getAlumno(USUARIO);
  if (!alumno) notFound();

  return (
    <div className="min-h-screen bg-[#FEFEFA] text-[#123850] selection:bg-[#D69A3F]/30">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-4 py-1.5 font-mono text-sm font-semibold text-[#123850] shadow-[3px_3px_0px_#123850] transition hover:-translate-y-0.5 hover:bg-[#D69A3F]/20"
        >
          ← volver al muro
        </Link>

        {/* ───────── MISIÓN 2 · Next.js + Tailwind ─────────
            RETO 2.1  md:flex-row md:items-center
            RETO 2.2  rounded-2xl (tras explorar rounded-none y rounded-full)
            RETO 2.3  hover:scale-[1.02] transition
        */}
        <div className="relative mt-8 flex flex-col gap-5 rounded-2xl border-2 border-[#123850] bg-[#FEFEFA] p-6 shadow-[6px_6px_0px_#123850] transition hover:scale-[1.02] md:flex-row md:items-center">
          {/* Doodle corner sticker */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-3 rotate-6 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-[#FEFEFA] shadow-[2px_2px_0px_#123850]"
          >
            ✦ sketch mode
          </span>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#123850] bg-[#D69A3F]/15 shadow-[3px_3px_0px_#D69A3F]">
            <span className="text-5xl">{alumno.emoji}</span>
          </div>

          <div className="space-y-1">
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: "#123850" }}
            >
              {alumno.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-block rounded-full border border-[#123850]/30 bg-[#123850]/5 px-2.5 py-0.5 font-mono text-xs font-medium text-[#123850]">
                @{alumno.usuario}
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[#123850] px-2.5 py-0.5 font-mono text-xs font-semibold"
                style={{ color: alumno.color }}
              >
                ● Gold Coast &amp; Gibraltar Sea
              </span>
            </div>
          </div>
        </div>

        {/* Frase con estética doodle / notebook */}
        <blockquote className="relative mt-8 rounded-2xl border-2 border-dashed border-[#123850] bg-[#D69A3F]/10 p-5 shadow-[4px_4px_0px_#D69A3F]">
          <svg
            aria-hidden="true"
            className="mb-2 h-3 w-24 text-[#D69A3F]"
            viewBox="0 0 120 12"
            fill="none"
          >
            <path
              d="M2 8 C 18 2, 32 12, 48 6 C 64 0, 78 12, 94 6 C 104 2, 112 8, 118 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-lg font-medium leading-relaxed text-[#123850]">
            “{alumno.frase}”
          </p>
        </blockquote>

        {/* RETO 2.4  Sección "Lo que aprendí hoy" con lista <ul> de 3 cosas */}
        <section className="mt-8 rounded-2xl border-2 border-[#123850] bg-[#FEFEFA] p-6 shadow-[5px_5px_0px_#123850]">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#123850] bg-[#D69A3F] text-sm shadow-[2px_2px_0px_#123850]">
              ✏️
            </span>
            <h2 className="text-xl font-bold text-[#123850]">
              Lo que aprendí hoy
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-[#123850]/90 marker:text-[#D69A3F]">
            <li>
              Cómo ejecutar JavaScript fuera del navegador con Node.js para leer
              archivos y automatizar tareas del proyecto.
            </li>
            <li>
              Que en Next.js cada carpeta dentro de{" "}
              <code className="rounded bg-[#123850]/10 px-1.5 py-0.5 font-mono text-xs text-[#123850]">
                src/app
              </code>{" "}
              define una ruta automática y cómo distinguir Server Components de
              Client Components.
            </li>
            <li>
              Diseñar interfaces responsivas y con personalidad usando clases
              utilitarias de Tailwind CSS sin romper estilos dinámicos.
            </li>
          </ul>
        </section>

        {/* ───────── MISIÓN 3 · v0 ─────────
            Pega el componente que generaste en v0 dentro de ComponenteV0.tsx (misma carpeta). */}
        <section className="mt-10">
          <ComponenteV0 />
        </section>

        {/* ───────── MISIÓN 4 · OpenCode + NVIDIA ─────────
            Pídele a OpenCode que cree un componente y lo agregue debajo de este comentario.
            Ejemplo de prompt en el README. */}
      </main>
    </div>
  );
}
