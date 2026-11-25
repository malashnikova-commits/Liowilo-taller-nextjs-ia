"use client";

import { useEffect, useRef, useState } from "react";
import {
  isMuted,
  playHoverTick,
  playLevelUp,
  playPop,
  playToggle,
  setMuted,
  startLoFiLoop,
  stopLoFiLoop,
  subscribeMuted,
} from "./sonidos";

interface Tecnologia {
  id: string;
  emoji: string;
  nombre: string;
  nivel: number;
  nota: string;
  tono: "sea" | "gold";
}

const TECHS_INICIALES: Tecnologia[] = [
  { id: "nextjs", emoji: "⚡", nombre: "Next.js", nivel: 80, nota: "App Router", tono: "sea" },
  { id: "tailwind", emoji: "🎨", nombre: "Tailwind", nivel: 90, nota: "Utilidades", tono: "gold" },
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
  { emoji: "📻", titulo: "chill tunes", subtitulo: "Lo-Fi Sketchbook · Cmaj7" },
  { emoji: "🌙", titulo: "midnight deploy", subtitulo: "Synth suave · Dm9" },
  { emoji: "📼", titulo: "pixel coffee", subtitulo: "Chillhop · Fmaj7" },
];

export function ComponenteV0() {
  const [techs, setTechs] = useState<Tecnologia[]>(TECHS_INICIALES);
  const [estadoIdx, setEstadoIdx] = useState<number>(0);
  const [pistaIdx, setPistaIdx] = useState<number>(0);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);
  const [silenciado, setSilenciado] = useState<boolean>(false);

  // Micro-interacciones y preferencias kidcore
  const [destelloMood, setDestelloMood] = useState<boolean>(false);
  const [toastCelebracion, setToastCelebracion] = useState<string | null>(null);
  const [modoCuadricula, setModoCuadricula] = useState<boolean>(false);
  const [animacionesExtra, setAnimacionesExtra] = useState<boolean>(true);

  const toastTimerRef = useRef<number | null>(null);
  const moodTimerRef = useRef<number | null>(null);

  // Sincronizar estado global de mute con sonidos.ts
  useEffect(() => {
    setSilenciado(isMuted());
    const unsub = subscribeMuted((nuevoEstado) => {
      setSilenciado(nuevoEstado);
    });
    return () => {
      unsub();
      stopLoFiLoop();
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (moodTimerRef.current !== null) window.clearTimeout(moodTimerRef.current);
    };
  }, []);

  // Sincronizar el loop procedural Lo-Fi con Play/Pausa, pista y silencio
  useEffect(() => {
    if (reproduciendo && !silenciado) {
      startLoFiLoop(pistaIdx);
    } else {
      stopLoFiLoop();
    }
    return () => {
      stopLoFiLoop();
    };
  }, [reproduciendo, pistaIdx, silenciado]);

  const estadoActual = ESTADOS[estadoIdx];
  const pistaActual = PISTAS[pistaIdx];

  const alternarSilencioGlobal = () => {
    if (silenciado) {
      setMuted(false);
      playToggle(true);
    } else {
      setMuted(true);
    }
  };

  const cambiarEstado = () => {
    playPop();
    setEstadoIdx((prev) => (prev + 1) % ESTADOS.length);
    setDestelloMood(true);
    if (moodTimerRef.current !== null) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setDestelloMood(false), 420);
  };

  const subirNivel = (techActual: Tecnologia) => {
    const siguiente = techActual.nivel >= 100 ? 10 : Math.min(100, techActual.nivel + 10);
    playLevelUp(siguiente);

    setTechs((prev) =>
      prev.map((item) => (item.id === techActual.id ? { ...item, nivel: siguiente } : item))
    );

    if (siguiente === 100) {
      setToastCelebracion(`🎉 ¡100% dominado en ${techActual.nombre}! Acorde desbloqueado ✦`);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToastCelebracion(null), 2600);
    }
  };

  const alternarCuadricula = () => {
    const siguiente = !modoCuadricula;
    setModoCuadricula(siguiente);
    playToggle(siguiente);
  };

  const alternarAnimaciones = () => {
    const siguiente = !animacionesExtra;
    setAnimacionesExtra(siguiente);
    playToggle(siguiente);
  };

  const cambiarPista = (direccion: -1 | 1) => {
    playPop();
    setPistaIdx((prev) => (prev + direccion + PISTAS.length) % PISTAS.length);
  };

  const detenerReproductor = () => {
    playPop();
    setReproduciendo(false);
    setPistaIdx((prev) => (prev + 1) % PISTAS.length);
  };

  const alternarPlayPausa = () => {
    const siguiente = !reproduciendo;
    if (!siguiente) {
      playToggle(false);
    }
    setReproduciendo(siguiente);
  };

  return (
    <section
      aria-label="Mi stack, preferencias y reproductor Lo-Fi interactivo"
      className="relative mx-auto w-full overflow-hidden rounded-3xl border-[3px] border-[#123850] bg-[#FEFEFA] p-5 text-[#123850] shadow-[8px_8px_0px_#123850] sm:p-7"
      style={
        modoCuadricula
          ? {
              backgroundImage:
                "linear-gradient(to right, rgba(18,56,80,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(18,56,80,0.09) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }
          : {
              backgroundImage: "radial-gradient(rgba(18,56,80,0.16) 1.3px, transparent 1.3px)",
              backgroundSize: "18px 18px",
            }
      }
    >
      {/* Estrellas decorativas en esquinas (respetan animacionesExtra y motion-reduce) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-3.5 top-3 text-lg text-[#D69A3F] motion-reduce:animate-none ${
          animacionesExtra ? "animate-pulse" : ""
        }`}
      >
        ★
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-4 top-3 text-lg text-[#D69A3F] motion-reduce:animate-none ${
          animacionesExtra ? "animate-pulse" : ""
        }`}
      >
        ★
      </span>

      {/* Toast doodle fugaz de celebración al alcanzar 100% */}
      {toastCelebracion && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center justify-between gap-2 rounded-2xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-2 text-xs font-black text-[#123850] shadow-[3px_3px_0px_#123850] transition-all motion-reduce:transition-none sm:text-sm"
          style={{ borderRadius: "225px 16px 205px 16px / 16px 205px 16px 225px" }}
        >
          <span>{toastCelebracion}</span>
          <button
            type="button"
            onClick={() => setToastCelebracion(null)}
            aria-label="Cerrar aviso de celebración"
            className="cursor-pointer rounded-full border border-[#123850] bg-[#FEFEFA] px-2 py-0.5 font-mono text-[10px] font-black text-[#123850]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera: Post-it + Título "Mi stack & vibes" + Control Global de Sonido + Botón Mood */}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-[#123850]/30 pb-4 pt-2">
        <div className="flex items-start gap-3.5">
          {/* Post-it inclinado con cinta Gold Coast */}
          <div className="relative -rotate-6 select-none rounded-md border-[2.5px] border-[#123850] bg-[#FEFEFA] px-3 py-2.5 shadow-[3px_3px_0px_#123850]">
            <span
              aria-hidden="true"
              className="absolute -top-2.5 left-1/2 h-3.5 w-3 -translate-x-1/2 rotate-3 border-2 border-[#123850] bg-[#D69A3F]"
            />
            <span className="font-mono text-xs font-black tracking-tight text-[#123850]">
              today
            </span>
          </div>

          <div>
            <span className="inline-block -rotate-1 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-[#123850] shadow-[2px_2px_0px_#123850]">
              ✏️ Sketch Audio Card
            </span>
            <h2 className="mt-1.5 text-xl font-black uppercase tracking-wide text-[#123850] sm:text-2xl">
              Mi stack &amp; vibes
            </h2>
            <svg
              aria-hidden="true"
              className="mt-0.5 h-3 w-40 text-[#D69A3F]"
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

        {/* Controles superiores: Audio Global + Mood interactivo con rebote/destello */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={alternarSilencioGlobal}
            onMouseEnter={playHoverTick}
            aria-pressed={!silenciado}
            aria-label={silenciado ? "Activar efectos de sonido" : "Silenciar efectos de sonido"}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#123850] px-3 py-1.5 font-mono text-xs font-black shadow-[3px_3px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${
              silenciado
                ? "bg-[#FEFEFA] text-[#123850]"
                : "bg-[#D69A3F] text-[#123850]"
            }`}
          >
            <span aria-hidden="true">{silenciado ? "🔇" : "🔊"}</span>
            <span>{silenciado ? "Silencio" : "Sonido ON"}</span>
          </button>

          <button
            type="button"
            onClick={cambiarEstado}
            onMouseEnter={playHoverTick}
            aria-label={`Estado actual: ${estadoActual.texto}. Haz clic para cambiar de estado`}
            title="Haz clic para cambiar tu estado"
            className={`relative flex cursor-pointer items-center gap-1.5 border-[2.5px] border-[#123850] px-3.5 py-1.5 text-xs font-extrabold text-[#123850] shadow-[3px_3px_0px_#123850] transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none sm:text-sm ${
              destelloMood
                ? "-translate-y-1 scale-105 bg-[#D69A3F]/35 ring-2 ring-[#D69A3F]"
                : "bg-[#FEFEFA]"
            }`}
            style={{ borderRadius: "255px 18px 225px 18px / 18px 225px 18px 255px" }}
          >
            <span>Feeling:</span>
            <span aria-hidden="true">{estadoActual.emoji}</span>
            <span aria-live="polite">{estadoActual.texto}</span>
            <span
              aria-hidden="true"
              className={`text-[#D69A3F] transition-transform motion-reduce:transition-none ${
                destelloMood ? "scale-150 rotate-45" : ""
              }`}
            >
              ✦
            </span>
          </button>
        </div>
      </header>

      {/* Interruptores rápidos estilo Kidcore (cambian la libreta visualmente + playToggle) */}
      <div
        role="group"
        aria-label="Preferencias visuales de la libreta"
        className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-[#123850]/45 bg-[#FEFEFA]/90 px-3.5 py-2.5"
      >
        <span className="font-mono text-xs font-extrabold text-[#123850]">
          🎛️ Modo libreta:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={alternarCuadricula}
            aria-pressed={modoCuadricula}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#123850] px-3 py-1 font-mono text-xs font-extrabold shadow-[2px_2px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${
              modoCuadricula ? "bg-[#123850] text-[#FEFEFA]" : "bg-[#FEFEFA] text-[#123850]"
            }`}
          >
            <span aria-hidden="true">{modoCuadricula ? "📐" : "⠿"}</span>
            <span>{modoCuadricula ? "Cuadrícula ON" : "Papel punteado"}</span>
          </button>

          <button
            type="button"
            onClick={alternarAnimaciones}
            aria-pressed={animacionesExtra}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#123850] px-3 py-1 font-mono text-xs font-extrabold shadow-[2px_2px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${
              animacionesExtra ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
            }`}
          >
            <span aria-hidden="true">{animacionesExtra ? "✨" : "⏸"}</span>
            <span>{animacionesExtra ? "Animaciones ON" : "Modo quieto"}</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula 2x2 de tecnologías ("Mi stack & vibes") */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {techs.map((tech, idx) => {
          const esSea = tech.tono === "sea";
          const alMaximo = tech.nivel === 100;
          const inclinacionHover =
            animacionesExtra && idx % 2 === 0
              ? "hover:-rotate-1"
              : animacionesExtra
                ? "hover:rotate-1"
                : "";

          return (
            <button
              key={tech.id}
              type="button"
              onClick={() => subirNivel(tech)}
              onMouseEnter={playHoverTick}
              aria-label={`${tech.nombre}, nivel actual ${tech.nivel} por ciento. Toca para subir nivel`}
              title="Clic para subir nivel (+10%)"
              className={`group flex cursor-pointer flex-col gap-3 rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-4 text-left shadow-[4px_4px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${inclinacionHover}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#123850] bg-[#D69A3F]/20 text-2xl transition-transform motion-reduce:transition-none ${
                      animacionesExtra ? "group-hover:rotate-6 group-hover:scale-105" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {tech.emoji}
                  </span>
                  <div>
                    <p className="text-base font-black leading-tight text-[#123850]">
                      {tech.nombre}
                    </p>
                    <p className="text-xs font-bold text-[#123850]/75">{tech.nota}</p>
                  </div>
                </div>

                <span
                  className={`rounded-lg border-2 border-[#123850] px-2 py-0.5 font-mono text-xs font-black ${
                    alMaximo ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
                  }`}
                >
                  {alMaximo ? "★ 100%" : `${tech.nivel}%`}
                </span>
              </div>

              <div
                className="h-4 w-full overflow-hidden rounded-full border-2 border-[#123850] bg-[#FEFEFA] p-0.5"
                role="progressbar"
                aria-valuenow={tech.nivel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Nivel de ${tech.nombre}`}
              >
                <div
                  className="h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
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

      {/* Mini reproductor Lo-Fi interactivo con ecualizador y notas flotantes */}
      <div className="relative rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-4 shadow-[4px_4px_0px_#123850]">
        {/* Notas musicales flotando suavemente al reproducir */}
        {reproduciendo && !silenciado && animacionesExtra && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-2 flex items-center gap-2 font-sans text-sm font-black text-[#D69A3F]"
          >
            <span className="animate-bounce motion-reduce:animate-none">♪</span>
            <span
              className="animate-bounce text-[#123850] motion-reduce:animate-none"
              style={{ animationDelay: "180ms" }}
            >
              ♫
            </span>
            <span
              className="animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: "340ms" }}
            >
              ♬
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cambiarPista(-1)}
              onMouseEnter={playHoverTick}
              aria-label="Pista anterior"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] bg-[#FEFEFA] text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
            >
              ⏮
            </button>

            <button
              type="button"
              onClick={alternarPlayPausa}
              onMouseEnter={playHoverTick}
              aria-pressed={reproduciendo}
              aria-label={reproduciendo ? "Pausar sintetizador Lo-Fi" : "Reproducir sintetizador Lo-Fi"}
              className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#123850] px-4 font-mono text-xs font-black shadow-[3px_3px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${
                reproduciendo
                  ? "bg-[#D69A3F] text-[#123850]"
                  : "bg-[#123850] text-[#FEFEFA]"
              }`}
            >
              {reproduciendo ? (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="3.5" y="3" width="3.2" height="10" rx="1" />
                    <rect x="9.3" y="3" width="3.2" height="10" rx="1" />
                  </svg>
                  <span>Pausa</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 translate-x-0.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4 2.5 L13.5 8 L4 13.5 Z" />
                  </svg>
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={detenerReproductor}
              onMouseEnter={playHoverTick}
              aria-label="Detener y saltar a la siguiente pista"
              title="Detener y cambiar pista"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="4" y="4" width="8" height="8" rx="1.5" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => cambiarPista(1)}
              onMouseEnter={playHoverTick}
              aria-label="Siguiente pista"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#123850] bg-[#FEFEFA] text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
            >
              ⏭
            </button>
          </div>

          <div className="min-w-[190px] flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-base">
                  {pistaActual.emoji}
                </span>
                <p className="font-mono text-sm font-black text-[#123850]">
                  {pistaActual.titulo}{" "}
                  <span className="text-xs font-bold text-[#123850]/70">
                    · {pistaActual.subtitulo}
                  </span>
                </p>
              </div>

              {/* Barras de ecualizador animadas */}
              <div
                aria-label={reproduciendo && !silenciado ? "Audio Lo-Fi reproduciéndose" : "Audio en pausa"}
                className="flex h-5 items-end gap-1 pr-1"
              >
                {[12, 18, 10, 16].map((altura, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full border border-[#123850] transition-all motion-reduce:animate-none ${
                      reproduciendo && !silenciado
                        ? "animate-pulse bg-[#D69A3F]"
                        : "bg-[#123850]/25"
                    }`}
                    style={{
                      height: reproduciendo && !silenciado ? `${altura}px` : "6px",
                      animationDelay: `${i * 130}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Onda garabateada estilo libreta */}
            <svg
              aria-hidden="true"
              className={`mt-1.5 h-4 w-full text-[#123850] motion-reduce:animate-none ${
                reproduciendo && !silenciado && animacionesExtra ? "animate-pulse" : ""
              }`}
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
      </div>

      <p className="mt-4 text-center font-mono text-[11px] font-bold text-[#123850]/75">
        💡 Sube cualquier tarjeta al 100% para escuchar el acorde especial o prueba las 3 pistas Lo-Fi.
      </p>
    </section>
  );
}
