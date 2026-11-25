"use client";

import { useState } from "react";

interface Tecnologia {
  id: string;
  emoji: string;
  nombre: string;
  nivel: number;
  nota: string;
  tono: "sea" | "gold";
}

const TECHS_INICIALES: Tecnologia[] = [
  { id: "nextjs", emoji: "⚡", nombre: "Next.js", nivel: 75, nota: "App Router", tono: "sea" },
  { id: "tailwind", emoji: "🎨", nombre: "Tailwind", nivel: 85, nota: "Utilidades", tono: "gold" },
  { id: "ts", emoji: "🧩", nombre: "TypeScript", nivel: 70, nota: "Tipos claros", tono: "sea" },
  { id: "ia", emoji: "🤖", nombre: "IA + Prompts", nivel: 90, nota: "Modo creativo", tono: "gold" },
];

const ESTADOS = [
  { emoji: "✨", texto: "Creative" },
  { emoji: "☕", texto: "Con café" },
  { emoji: "🎧", texto: "En la zona" },
  { emoji: "🚀", texto: "Listo pal PR" },
];

const PISTAS = [
  { titulo: "chill tunes", subtitulo: "Lo-Fi Sketchbook · 2:45" },
  { titulo: "midnight deploy", subtitulo: "Synth suave · 3:12" },
  { titulo: "pixel coffee", subtitulo: "Chillhop · 2:18" },
];

export function ComponenteV0() {
  const [techs, setTechs] = useState<Tecnologia[]>(TECHS_INICIALES);
  const [estadoIdx, setEstadoIdx] = useState<number>(0);
  const [pistaIdx, setPistaIdx] = useState<number>(0);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);

  const estadoActual = ESTADOS[estadoIdx];
  const pistaActual = PISTAS[pistaIdx];

  const subirNivel = (id: string) => {
    setTechs((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const siguiente = item.nivel >= 100 ? 10 : Math.min(100, item.nivel + 10);
        return { ...item, nivel: siguiente };
      })
    );
  };

  const cambiarEstado = () => {
    setEstadoIdx((prev) => (prev + 1) % ESTADOS.length);
  };

  const detener = () => {
    setReproduciendo(false);
    setPistaIdx((prev) => (prev + 1) % PISTAS.length);
  };

  return (
    <div
      className="rounded-3xl border-2 border-dashed border-[#123850]/20 bg-[#FEFEFA] p-4 sm:p-6"
      style={{
        backgroundImage: "radial-gradient(#12385026 1.3px, transparent 1.3px)",
        backgroundSize: "16px 16px",
      }}
    >
      <section className="relative mx-auto w-full max-w-2xl rounded-2xl border-[3px] border-[#123850] bg-[#FEFEFA] p-5 text-[#123850] shadow-[8px_8px_0px_#123850] sm:p-7">
        {/* Estrellas y garabatos decorativos en esquinas */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 text-lg text-[#D69A3F]"
        >
          ★
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-3 text-lg text-[#D69A3F]"
        >
          ★
        </span>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-10 top-3 h-4 w-4 text-[#123850]"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M8 1v4M8 11v4M1 8h4M11 8h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Encabezado estilo Daily Doodle Dash */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 pt-2">
          <div className="flex items-start gap-4">
            {/* Nota adhesiva inclinada "today" con cinta Gold Coast */}
            <div className="relative -rotate-6 rounded-md border-[2.5px] border-[#123850] bg-[#FEFEFA] px-3 py-2.5 shadow-[3px_3px_0px_#123850]">
              <span
                aria-hidden="true"
                className="absolute -top-2.5 left-1/2 h-4 w-3 -translate-x-1/2 rotate-3 border-2 border-[#123850] bg-[#D69A3F]"
              />
              <span className="font-mono text-xs font-extrabold tracking-tight text-[#123850]">
                today
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-[#123850] sm:text-2xl">
                MI DAILY DOODLE STACK
              </h2>
              {/* Subrayado garabateado en Gold Coast */}
              <svg
                aria-hidden="true"
                className="mt-1 h-3 w-44 text-[#D69A3F]"
                viewBox="0 0 180 12"
                fill="none"
              >
                <path
                  d="M2 8 C 48 2, 115 2, 176 5 M 40 10 C 82 7, 128 7, 152 9"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Pill clickable "Feeling: ✨ Creative ✨" */}
          <button
            type="button"
            onClick={cambiarEstado}
            title="Haz clic para cambiar tu estado"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-[#123850] bg-[#FEFEFA] px-4 py-1.5 text-xs font-extrabold text-[#123850] shadow-[3px_3px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-sm"
          >
            <span>Feeling:</span>
            <span aria-hidden="true">{estadoActual.emoji}</span>
            <span className="text-[#123850]">{estadoActual.texto}</span>
            <span aria-hidden="true" className="text-[#D69A3F]">
              ✦
            </span>
          </button>
        </header>

        {/* Cuadrícula 2x2 de tecnologías con barras estilo sketch */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {techs.map((tech) => {
            const esSea = tech.tono === "sea";
            return (
              <button
                key={tech.id}
                type="button"
                onClick={() => subirNivel(tech.id)}
                title="Clic para subir nivel (+10%)"
                className="group flex cursor-pointer flex-col gap-3 rounded-xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-4 text-left shadow-[4px_4px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#123850] bg-[#D69A3F]/15 text-2xl transition-transform group-hover:rotate-6"
                      aria-hidden="true"
                    >
                      {tech.emoji}
                    </span>
                    <div>
                      <p className="text-base font-black leading-tight text-[#123850]">
                        {tech.nombre}
                      </p>
                      <p className="text-xs font-semibold text-[#123850]/75">
                        {tech.nota}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-[#123850]/80">
                    {tech.nivel}%
                  </span>
                </div>

                {/* Barra de progreso sketch: rayado Gibraltar Sea o relleno Gold Coast */}
                <div
                  className="h-4 w-full overflow-hidden rounded-full border-2 border-[#123850] bg-[#FEFEFA]"
                  role="progressbar"
                  aria-valuenow={tech.nivel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Nivel de ${tech.nombre}`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${tech.nivel}%`,
                      background: esSea
                        ? "repeating-linear-gradient(-55deg, #123850, #123850 4px, #2b5470 4px, #2b5470 6px)"
                        : "repeating-linear-gradient(-55deg, #D69A3F, #D69A3F 6px, #e3b264 6px, #e3b264 8px)",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Barra inferior estilo reproductor doodle: ▶ ⏸ ⏹ + chill tunes + onda SVG */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReproduciendo(true)}
              aria-label="Reproducir"
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] transition-transform hover:-translate-y-0.5 active:translate-y-0 ${
                reproduciendo
                  ? "bg-[#D69A3F] text-[#FEFEFA] shadow-[2px_2px_0px_#123850]"
                  : "bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F]"
              }`}
            >
              <svg className="h-4 w-4 translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5 L13.5 8 L4 13.5 Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setReproduciendo(false)}
              aria-label="Pausar"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <rect x="4" y="3" width="3" height="10" rx="1" />
                <rect x="9" y="3" width="3" height="10" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={detener}
              aria-label="Detener y cambiar pista"
              title="Detener / cambiar pista"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <rect x="4" y="4" width="8" height="8" rx="1.5" />
              </svg>
            </button>
          </div>

          <div className="min-w-[180px] flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-[#123850]">
                {pistaActual.titulo} ♫{" "}
                <span className="text-xs font-normal text-[#123850]/65">
                  ({pistaActual.subtitulo})
                </span>
              </p>
              {reproduciendo && (
                <span className="rounded-full border border-[#123850] bg-[#D69A3F]/25 px-2 py-0.5 font-mono text-[10px] font-bold text-[#123850]">
                  ON AIR
                </span>
              )}
            </div>

            {/* Onda garabateada estilo libreta */}
            <svg
              aria-hidden="true"
              className={`mt-1.5 h-4 w-full text-[#123850] ${reproduciendo ? "animate-pulse" : ""}`}
              viewBox="0 0 260 16"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 10 Q 14 2, 26 10 T 50 10 T 74 10 T 98 10 T 122 10 T 146 10 T 170 10 T 194 10 T 218 10 T 242 10 L 258 9"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] font-semibold text-[#123850]/65">
          💡 Toca cualquier tarjeta para subir su nivel (+10%), cambia tu estado arriba o cambia de pista con ⏹.
        </p>
      </section>
    </div>
  );
}
