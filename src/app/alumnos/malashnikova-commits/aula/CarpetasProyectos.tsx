"use client";

import { useState } from "react";
import { playLevelUp, playPop, playToggle } from "../sonidos";
import type {
  CarpetaFuentes,
  NodoTemario,
  ProgresoAlumno,
  ProyectoAula,
  RecursoFuente,
  TipoRecurso,
} from "./types";

interface CarpetasProyectosProps {
  carpetas: CarpetaFuentes[];
  proyectos: ProyectoAula[];
  nodos: NodoTemario[];
  progreso: ProgresoAlumno;
  hoyISO: string;
  modoEdicionDocente: boolean;
  carpetaActivaId: string | null;
  proyectoDestacadoId: string | null;
  onSeleccionarCarpeta: (id: string | null) => void;
  onAlternarRecursoRevisado: (recursoId: string) => void;
  onAlternarEntregableProyecto: (proyectoId: string, entregableId: string, totalEntregables: number) => void;
  onIrANodo: (nodoId: string) => void;
  onCrearCarpetaDocente: (carpeta: CarpetaFuentes) => void;
  onEliminarCarpetaDocente: (carpetaId: string) => void;
  onAlternarVinculoCarpetaNodoDocente: (carpetaId: string, nodoId: string) => void;
  onAgregarRecursoDocente: (carpetaId: string, recurso: RecursoFuente) => void;
  onEliminarRecursoDocente: (carpetaId: string, recursoId: string) => void;
  onGuardarProyectoDocente: (proyecto: ProyectoAula, esNuevo: boolean) => void;
  onEliminarProyectoDocente: (proyectoId: string) => void;
}

const TIPOS_RECURSO: TipoRecurso[] = ["Apunte", "Enlace", "Guía", "Ejercicio"];

export function CarpetasProyectos({
  carpetas,
  proyectos,
  nodos,
  progreso,
  hoyISO,
  modoEdicionDocente,
  carpetaActivaId,
  proyectoDestacadoId,
  onSeleccionarCarpeta,
  onAlternarRecursoRevisado,
  onAlternarEntregableProyecto,
  onIrANodo,
  onCrearCarpetaDocente,
  onEliminarCarpetaDocente,
  onAlternarVinculoCarpetaNodoDocente,
  onAgregarRecursoDocente,
  onEliminarRecursoDocente,
  onGuardarProyectoDocente,
  onEliminarProyectoDocente,
}: CarpetasProyectosProps) {
  const [filtroNodoId, setFiltroNodoId] = useState<string>("");

  // Estados de formularios Docente: nueva carpeta
  const [mostrarFormCarpeta, setMostrarFormCarpeta] = useState(false);
  const [nombreCarpeta, setNombreCarpeta] = useState("");
  const [emojiCarpeta, setEmojiCarpeta] = useState("📂");
  const [descCarpeta, setDescCarpeta] = useState("");

  // Estados de formulario Docente: nuevo recurso
  const [carpetaParaRecursoId, setCarpetaParaRecursoId] = useState<string | null>(null);
  const [tituloRec, setTituloRec] = useState("");
  const [tipoRec, setTipoRec] = useState<TipoRecurso>("Apunte");
  const [resumenRec, setResumenRec] = useState("");
  const [urlRec, setUrlRec] = useState("");
  const [errorUrlRec, setErrorUrlRec] = useState<string | null>(null);

  // Estados de formulario Docente: crear/editar proyecto
  const [editandoProy, setEditandoProy] = useState<ProyectoAula | null>(null);
  const [esNuevoProy, setEsNuevoProy] = useState(false);
  const [nuevoEntregableTexto, setNuevoEntregableTexto] = useState("");

  const carpetasFiltradas = carpetas.filter((c) => {
    if (carpetaActivaId && c.id !== carpetaActivaId) return false;
    if (filtroNodoId && !c.nodoIds.includes(filtroNodoId)) return false;
    return true;
  });

  const crearCarpeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCarpeta.trim()) return;
    playLevelUp(70);
    onCrearCarpetaDocente({
      id: `carpeta-${Date.now()}`,
      nombre: nombreCarpeta.trim(),
      emoji: emojiCarpeta || "📂",
      descripcion: descCarpeta.trim() || "Colección de fuentes del curso.",
      nodoIds: [],
      recursos: [],
    });
    setNombreCarpeta("");
    setDescCarpeta("");
    setMostrarFormCarpeta(false);
  };

  const guardarRecurso = (e: React.FormEvent, carpetaId: string) => {
    e.preventDefault();
    if (!tituloRec.trim()) return;
    const urlLimpia = urlRec.trim();
    if (urlLimpia && !urlLimpia.startsWith("https://")) {
      setErrorUrlRec("El enlace opcional debe comenzar estrictamente con https://");
      playToggle(false);
      return;
    }

    playPop();
    onAgregarRecursoDocente(carpetaId, {
      id: `rec-${Date.now()}`,
      titulo: tituloRec.trim(),
      tipo: tipoRec,
      resumen: resumenRec.trim() || "Material de consulta del nodo.",
      url: urlLimpia || undefined,
    });
    setTituloRec("");
    setResumenRec("");
    setUrlRec("");
    setErrorUrlRec(null);
    setCarpetaParaRecursoId(null);
  };

  const iniciarNuevoProyecto = () => {
    playPop();
    setEsNuevoProy(true);
    setEditandoProy({
      id: `proy-${Date.now()}`,
      titulo: "Nuevo Proyecto Integrador",
      emoji: "🛠️",
      descripcion: "Describe el reto práctico y criterios de entrega.",
      fechaInicio: hoyISO,
      fechaLimite: hoyISO,
      xpExtra: 100,
      nodoIds: [],
      entregables: [{ id: `ent-${Date.now()}-1`, texto: "Primer entregable verificable" }],
    });
  };

  return (
    <div className="space-y-8">
      {/* ═══════════════ SECCIÓN 1: CARPETAS DE FUENTES (CONTEXTOS) ═══════════════ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#123850]">
              📂 Carpetas de Fuentes y Contextos
            </h3>
            <p className="text-xs font-bold text-[#123850]/75">
              Filtra lecturas, guías y ejercicios por carpeta o nodo, y marca los que ya revisaste.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar carpetas por nodo del temario"
              value={filtroNodoId}
              onChange={(e) => {
                playPop();
                setFiltroNodoId(e.target.value);
              }}
              className="rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-xs font-bold text-[#123850]"
            >
              <option value="">Todos los nodos</option>
              {nodos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.emoji} {n.titulo}
                </option>
              ))}
            </select>

            {modoEdicionDocente && (
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setMostrarFormCarpeta((prev) => !prev);
                }}
                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3.5 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
              >
                + Nueva carpeta
              </button>
            )}
          </div>
        </div>

        {/* Chips de selección rápida de carpeta */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              playPop();
              onSeleccionarCarpeta(null);
            }}
            aria-pressed={carpetaActivaId === null}
            className={`cursor-pointer rounded-full border-2 border-[#123850] px-3.5 py-1 font-mono text-xs font-extrabold ${
              carpetaActivaId === null
                ? "bg-[#123850] text-[#FEFEFA]"
                : "bg-[#FEFEFA] text-[#123850]"
            }`}
          >
            Todas ({carpetas.length})
          </button>

          {carpetas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                playPop();
                onSeleccionarCarpeta(carpetaActivaId === c.id ? null : c.id);
              }}
              aria-pressed={carpetaActivaId === c.id}
              className={`cursor-pointer rounded-full border-2 border-[#123850] px-3.5 py-1 font-mono text-xs font-extrabold ${
                carpetaActivaId === c.id
                  ? "bg-[#D69A3F] text-[#123850] shadow-[2px_2px_0px_#123850]"
                  : "bg-[#FEFEFA] text-[#123850]"
              }`}
            >
              {c.emoji} {c.nombre} ({c.recursos.length})
            </button>
          ))}
        </div>

        {/* Formulario Docente: Nueva Carpeta */}
        {modoEdicionDocente && mostrarFormCarpeta && (
          <form
            onSubmit={crearCarpeta}
            className="grid grid-cols-1 gap-3 rounded-2xl border-2 border-[#123850] bg-[#FAF6EC] p-4 sm:grid-cols-4"
          >
            <input
              type="text"
              required
              placeholder="Nombre de carpeta…"
              value={nombreCarpeta}
              onChange={(e) => setNombreCarpeta(e.target.value)}
              className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
            />
            <input
              type="text"
              maxLength={6}
              placeholder="Emoji"
              value={emojiCarpeta}
              onChange={(e) => setEmojiCarpeta(e.target.value)}
              className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
            />
            <input
              type="text"
              placeholder="Descripción breve…"
              value={descCarpeta}
              onChange={(e) => setDescCarpeta(e.target.value)}
              className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-1.5 font-mono text-xs font-black text-[#123850]"
            >
              Crear carpeta
            </button>
          </form>
        )}

        {/* Tarjetas de Carpetas */}
        <div className="space-y-5">
          {carpetasFiltradas.map((carpeta) => {
            const revisadosCount = carpeta.recursos.filter((r) =>
              progreso.recursosRevisados.includes(r.id)
            ).length;

            return (
              <article
                key={carpeta.id}
                className="rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-[#123850]/25 pb-3">
                  <div>
                    <h4 className="text-base font-black text-[#123850]">
                      {carpeta.emoji} {carpeta.nombre}
                    </h4>
                    <p className="mt-0.5 text-xs font-semibold text-[#123850]/75">
                      {carpeta.descripcion}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-2.5 py-0.5 font-mono text-xs font-black text-[#123850]">
                      Revisados: {revisadosCount}/{carpeta.recursos.length}
                    </span>

                    {modoEdicionDocente && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playPop();
                            setErrorUrlRec(null);
                            setCarpetaParaRecursoId(
                              carpetaParaRecursoId === carpeta.id ? null : carpeta.id
                            );
                          }}
                          className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-0.5 font-mono text-xs font-black text-[#123850]"
                        >
                          + Recurso
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playToggle(false);
                            onEliminarCarpetaDocente(carpeta.id);
                          }}
                          aria-label={`Eliminar carpeta ${carpeta.nombre}`}
                          className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-0.5 font-mono text-xs font-black text-[#123850]"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Nodos vinculados a esta carpeta */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] font-black text-[#123850]/70">
                    Nodos:
                  </span>
                  {modoEdicionDocente
                    ? nodos.map((n) => {
                        const activo = carpeta.nodoIds.includes(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              playToggle(!activo);
                              onAlternarVinculoCarpetaNodoDocente(carpeta.id, n.id);
                            }}
                            aria-pressed={activo}
                            className={`cursor-pointer rounded-full border border-[#123850] px-2 py-0.5 font-mono text-[10px] font-bold ${
                              activo ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FAF6EC] opacity-65"
                            }`}
                          >
                            {n.emoji} {n.titulo} {activo ? "✓" : "+"}
                          </button>
                        );
                      })
                    : nodos
                        .filter((n) => carpeta.nodoIds.includes(n.id))
                        .map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              playPop();
                              onIrANodo(n.id);
                            }}
                            className="cursor-pointer rounded-full border border-[#123850] bg-[#FAF6EC] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#123850]"
                          >
                            {n.emoji} {n.titulo} →
                          </button>
                        ))}
                </div>

                {/* Formulario Docente: Agregar recurso con validación https:// */}
                {modoEdicionDocente && carpetaParaRecursoId === carpeta.id && (
                  <form
                    onSubmit={(e) => guardarRecurso(e, carpeta.id)}
                    className="mt-4 space-y-2.5 rounded-xl border-2 border-[#123850] bg-[#FAF6EC] p-3.5"
                  >
                    {errorUrlRec && (
                      <p className="font-mono text-xs font-black text-[#123850]">⚠ {errorUrlRec}</p>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        required
                        placeholder="Título del recurso…"
                        value={tituloRec}
                        onChange={(e) => setTituloRec(e.target.value)}
                        className="rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1 text-xs font-bold text-[#123850] sm:col-span-2"
                      />
                      <select
                        value={tipoRec}
                        onChange={(e) => setTipoRec(e.target.value as TipoRecurso)}
                        className="rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1 font-mono text-xs font-bold text-[#123850]"
                      >
                        {TIPOS_RECURSO.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Resumen de contexto…"
                      value={resumenRec}
                      onChange={(e) => setResumenRec(e.target.value)}
                      className="w-full rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1 text-xs font-semibold text-[#123850]"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="url"
                        placeholder="https://enlace-opcional..."
                        value={urlRec}
                        onChange={(e) => {
                          setUrlRec(e.target.value);
                          setErrorUrlRec(null);
                        }}
                        className="flex-1 rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1 font-mono text-xs font-bold text-[#123850]"
                      />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-lg border-2 border-[#123850] bg-[#D69A3F] px-4 py-1 font-mono text-xs font-black text-[#123850]"
                      >
                        Guardar recurso
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de recursos de la carpeta */}
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {carpeta.recursos.map((rec) => {
                    const revisado = progreso.recursosRevisados.includes(rec.id);
                    return (
                      <li
                        key={rec.id}
                        className={`flex flex-col justify-between gap-2.5 rounded-xl border-2 border-[#123850] p-3.5 ${
                          revisado ? "bg-[#D69A3F]/15" : "bg-[#FAF6EC]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md border border-[#123850] bg-[#FEFEFA] px-2 py-0.5 font-mono text-[10px] font-black text-[#123850]">
                              {rec.tipo}
                            </span>

                            {modoEdicionDocente && (
                              <button
                                type="button"
                                onClick={() => {
                                  playToggle(false);
                                  onEliminarRecursoDocente(carpeta.id, rec.id);
                                }}
                                aria-label={`Eliminar recurso ${rec.titulo}`}
                                className="cursor-pointer font-mono text-xs font-black text-[#123850]"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm font-black text-[#123850]">{rec.titulo}</p>
                          <p className="mt-1 text-xs font-medium leading-relaxed text-[#123850]/85">
                            {rec.resumen}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              playPop();
                              onAlternarRecursoRevisado(rec.id);
                            }}
                            aria-pressed={revisado}
                            className={`cursor-pointer rounded-full border-2 border-[#123850] px-3 py-0.5 font-mono text-[11px] font-black ${
                              revisado
                                ? "bg-[#D69A3F] text-[#123850]"
                                : "bg-[#FEFEFA] text-[#123850]"
                            }`}
                          >
                            {revisado ? "✓ Revisado" : "○ Marcar leído"}
                          </button>

                          {rec.url && rec.url.startsWith("https://") && (
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs font-black text-[#123850] underline decoration-[#D69A3F] decoration-2"
                            >
                              Abrir fuente ↗
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ SECCIÓN 2: PROYECTOS DEL CURSO ═══════════════ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#123850]">
              🚀 Proyectos Integradores y Entregables
            </h3>
            <p className="text-xs font-bold text-[#123850]/75">
              Completa todos los entregables de un proyecto para desbloquear su bono de XP extra.
            </p>
          </div>

          {modoEdicionDocente && (
            <button
              type="button"
              onClick={iniciarNuevoProyecto}
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-4 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
            >
              + Nuevo proyecto
            </button>
          )}
        </div>

        {/* Editor Docente de Proyecto */}
        {modoEdicionDocente && editandoProy && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editandoProy.titulo.trim()) return;
              playLevelUp(80);
              onGuardarProyectoDocente(editandoProy, esNuevoProy);
              setEditandoProy(null);
            }}
            className="space-y-3 rounded-2xl border-[2.5px] border-[#123850] bg-[#FAF6EC] p-5 shadow-[5px_5px_0px_#123850]"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#123850]">
                {esNuevoProy ? "✨ Crear Proyecto" : `✏️ Editando: ${editandoProy.titulo}`}
              </h4>
              <button
                type="button"
                onClick={() => setEditandoProy(null)}
                className="cursor-pointer font-mono text-xs font-black text-[#123850]"
              >
                Cancelar ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <input
                type="text"
                required
                value={editandoProy.titulo}
                onChange={(e) => setEditandoProy({ ...editandoProy, titulo: e.target.value })}
                placeholder="Título del proyecto"
                className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850] sm:col-span-2"
              />
              <input
                type="date"
                value={editandoProy.fechaLimite}
                onChange={(e) => setEditandoProy({ ...editandoProy, fechaLimite: e.target.value })}
                className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
              <input
                type="number"
                min={20}
                max={500}
                step={10}
                value={editandoProy.xpExtra}
                onChange={(e) =>
                  setEditandoProy({ ...editandoProy, xpExtra: Number(e.target.value) || 100 })
                }
                className="rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
            </div>

            <textarea
              rows={2}
              value={editandoProy.descripcion}
              onChange={(e) => setEditandoProy({ ...editandoProy, descripcion: e.target.value })}
              className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-semibold text-[#123850]"
            />

            <div className="space-y-1.5">
              <p className="font-mono text-xs font-black text-[#123850]">Entregables:</p>
              {editandoProy.entregables.map((ent) => (
                <div
                  key={ent.id}
                  className="flex items-center justify-between rounded-lg border border-[#123850]/40 bg-[#FEFEFA] px-3 py-1 text-xs font-bold"
                >
                  <span>{ent.texto}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditandoProy({
                        ...editandoProy,
                        entregables: editandoProy.entregables.filter((x) => x.id !== ent.id),
                      })
                    }
                    className="cursor-pointer font-mono text-xs font-black"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoEntregableTexto}
                  onChange={(e) => setNuevoEntregableTexto(e.target.value)}
                  placeholder="Nuevo entregable…"
                  className="flex-1 rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!nuevoEntregableTexto.trim()) return;
                    playPop();
                    setEditandoProy({
                      ...editandoProy,
                      entregables: [
                        ...editandoProy.entregables,
                        { id: `ent-${Date.now()}`, texto: nuevoEntregableTexto.trim() },
                      ],
                    });
                    setNuevoEntregableTexto("");
                  }}
                  className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-xs font-black"
                >
                  + Añadir
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-5 py-1.5 font-mono text-xs font-black text-[#123850]"
            >
              Guardar proyecto
            </button>
          </form>
        )}

        {/* Tarjetas de Proyectos */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {proyectos.map((proy) => {
            const marcados = progreso.entregablesMarcados[proy.id] ?? [];
            const totalEnt = proy.entregables.length;
            const pct = totalEnt > 0 ? Math.round((marcados.length / totalEnt) * 100) : 0;
            const terminado = totalEnt > 0 && marcados.length >= totalEnt;
            const esDestacado = proyectoDestacadoId === proy.id;

            return (
              <article
                key={proy.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850] ${
                  esDestacado ? "ring-4 ring-[#D69A3F]" : ""
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-black text-[#123850]/70">
                        📅 Entrega límite: {proy.fechaLimite}
                      </span>
                      <h4 className="text-base font-black text-[#123850]">
                        {proy.emoji} {proy.titulo}
                      </h4>
                    </div>

                    <span className="shrink-0 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-2.5 py-0.5 font-mono text-xs font-black text-[#123850]">
                      +{proy.xpExtra} XP
                    </span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed text-[#123850]/85">
                    {proy.descripcion}
                  </p>

                  {/* Checklist de entregables */}
                  <ul className="space-y-1.5 pt-1">
                    {proy.entregables.map((ent) => {
                      const hecho = marcados.includes(ent.id);
                      return (
                        <li key={ent.id}>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoConteo = hecho ? marcados.length - 1 : marcados.length + 1;
                              if (!hecho && nuevoConteo >= totalEnt) {
                                playLevelUp(100);
                              } else {
                                playPop();
                              }
                              onAlternarEntregableProyecto(proy.id, ent.id, totalEnt);
                            }}
                            aria-pressed={hecho}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border-2 border-[#123850] px-3 py-1.5 text-left text-xs font-bold ${
                              hecho ? "bg-[#D69A3F]/25" : "bg-[#FAF6EC]"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#123850] font-mono text-[10px] font-black ${
                                hecho ? "bg-[#D69A3F]" : "bg-[#FEFEFA]"
                              }`}
                            >
                              {hecho ? "✓" : ""}
                            </span>
                            <span className={hecho ? "line-through opacity-85" : ""}>
                              {ent.texto}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Barra de progreso + controles Docente */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between font-mono text-xs font-black text-[#123850]">
                    <span>{terminado ? "✅ Proyecto acreditado" : "Avance entregables"}</span>
                    <span>{pct}%</span>
                  </div>
                  <div
                    className="h-3.5 w-full overflow-hidden rounded-full border-2 border-[#123850] bg-[#FEFEFA] p-0.5"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance de ${proy.titulo}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background:
                          "repeating-linear-gradient(-55deg, #D69A3F, #D69A3F 6px, #e3b264 6px, #e3b264 8px)",
                      }}
                    />
                  </div>

                  {modoEdicionDocente && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          playPop();
                          setEsNuevoProy(false);
                          setEditandoProy({
                            ...proy,
                            entregables: proy.entregables.map((x) => ({ ...x })),
                          });
                        }}
                        className="cursor-pointer rounded-full border border-[#123850] bg-[#D69A3F] px-3 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                      >
                        Editar proyecto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playToggle(false);
                          onEliminarProyectoDocente(proy.id);
                        }}
                        className="cursor-pointer rounded-full border border-[#123850] bg-[#FEFEFA] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
