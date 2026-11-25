"use client";

import { useState } from "react";
import { playLevelUp, playPop, playToggle } from "../sonidos";
import type {
  CarpetaFuentes,
  EstadoVisualNodo,
  NodoTemario,
  ProgresoAlumno,
  ProyectoAula,
} from "./types";

interface MapaNodosProps {
  nodos: NodoTemario[];
  carpetas: CarpetaFuentes[];
  proyectos: ProyectoAula[];
  progreso: ProgresoAlumno;
  hoyISO: string;
  modoEdicionDocente: boolean;
  nodoSeleccionadoId: string | null;
  onSeleccionarNodo: (id: string | null) => void;
  onAlternarPasoChecklist: (nodoId: string, pasoId: string) => void;
  onResponderQuiz: (nodoId: string) => void;
  onAlternarCompletadoNodo: (nodoId: string, completar: boolean) => void;
  onIrACarpeta: (carpetaId: string) => void;
  onIrAProyecto: (proyectoId: string) => void;
  onGuardarNodoDocente: (nodo: NodoTemario, esNuevo: boolean) => void;
  onEliminarNodoDocente: (nodoId: string) => void;
  onMoverNodoDocente: (nodoId: string, direccion: -1 | 1) => void;
}

const CLASES_ZIGZAG = [
  "translate-x-0",
  "sm:translate-x-12 translate-x-4",
  "translate-x-0",
  "sm:-translate-x-12 -translate-x-4",
];

export function calcularEstadoNodo(
  nodo: NodoTemario,
  todosNodos: NodoTemario[],
  progreso: ProgresoAlumno,
  hoyISO: string
): { estado: EstadoVisualNodo; motivoBloqueo?: string } {
  if (progreso.nodosCompletados.includes(nodo.id)) {
    return { estado: "completado" };
  }

  if (!nodo.desbloqueoManual) {
    if (nodo.prerequisitoId) {
      const prereq = todosNodos.find((n) => n.id === nodo.prerequisitoId);
      if (prereq && prereq.visible && !progreso.nodosCompletados.includes(prereq.id)) {
        return {
          estado: "bloqueado",
          motivoBloqueo: `Completa antes "${prereq.titulo}"`,
        };
      }
    }
    if (nodo.bloqueoPorFecha && hoyISO < nodo.fechaInicio) {
      return {
        estado: "bloqueado",
        motivoBloqueo: `Disponible a partir del ${nodo.fechaInicio}`,
      };
    }
  }

  const marcados = progreso.checklistMarcados[nodo.id] ?? [];
  if (marcados.length > 0) {
    return { estado: "en_progreso" };
  }

  return { estado: "disponible" };
}

export function MapaNodos({
  nodos,
  carpetas,
  proyectos,
  progreso,
  hoyISO,
  modoEdicionDocente,
  nodoSeleccionadoId,
  onSeleccionarNodo,
  onAlternarPasoChecklist,
  onResponderQuiz,
  onAlternarCompletadoNodo,
  onIrACarpeta,
  onIrAProyecto,
  onGuardarNodoDocente,
  onEliminarNodoDocente,
  onMoverNodoDocente,
}: MapaNodosProps) {
  const [editandoNodo, setEditandoNodo] = useState<NodoTemario | null>(null);
  const [esNuevoNodo, setEsNuevoNodo] = useState<boolean>(false);
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState<string>("");
  const [opcionElegidaQuiz, setOpcionElegidaQuiz] = useState<Record<string, number>>({});

  const nodosOrdenados = [...nodos]
    .sort((a, b) => a.orden - b.orden)
    .filter((n) => modoEdicionDocente || n.visible);

  const nodoActivo =
    nodosOrdenados.find((n) => n.id === nodoSeleccionadoId) ?? nodosOrdenados[0] ?? null;

  const abrirFormularioNuevo = () => {
    playPop();
    const ultimo = nodosOrdenados[nodosOrdenados.length - 1];
    const nuevo: NodoTemario = {
      id: `nodo-${Date.now()}`,
      orden: nodos.length + 1,
      unidad: ultimo?.unidad ?? "Unidad Nueva",
      titulo: "Nuevo tema del curso",
      descripcion: "Describe el objetivo práctico y entregable de este nodo.",
      emoji: "⭐",
      xp: 80,
      fechaInicio: hoyISO,
      fechaLimite: hoyISO,
      tiempoEstimado: "1 h",
      prerequisitoId: ultimo?.id ?? null,
      carpetasIds: [],
      proyectoId: null,
      bloqueoPorFecha: false,
      desbloqueoManual: false,
      visible: true,
      checklist: [
        { id: `chk-${Date.now()}-1`, texto: "Revisar material de la carpeta vinculada" },
        { id: `chk-${Date.now()}-2`, texto: "Completar ejercicio práctico del tema" },
      ],
    };
    setEsNuevoNodo(true);
    setEditandoNodo(nuevo);
  };

  const abrirFormularioEdicion = (nodo: NodoTemario) => {
    playPop();
    setEsNuevoNodo(false);
    setEditandoNodo({
      ...nodo,
      carpetasIds: [...nodo.carpetasIds],
      checklist: nodo.checklist.map((c) => ({ ...c })),
    });
  };

  const guardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoNodo || !editandoNodo.titulo.trim()) return;
    playLevelUp(75);
    onGuardarNodoDocente(editandoNodo, esNuevoNodo);
    onSeleccionarNodo(editandoNodo.id);
    setEditandoNodo(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de acción Docente en Mapa */}
      {modoEdicionDocente && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#123850] bg-[#FAF6EC] px-4 py-3">
          <p className="font-mono text-xs font-bold text-[#123850]">
            🛠️ <span className="font-black">Editor de Ruta activo:</span> reordena nodos, ajusta
            ventanas de fechas o crea nuevos escalones en la ruta.
          </p>
          <button
            type="button"
            onClick={abrirFormularioNuevo}
            className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-4 py-1.5 font-mono text-xs font-black text-[#123850] shadow-[3px_3px_0px_#123850] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            + Nuevo nodo en ruta
          </button>
        </div>
      )}

      {/* Modal / Tarjeta de creación o edición Docente */}
      {modoEdicionDocente && editandoNodo && (
        <form
          onSubmit={guardarEdicion}
          className="space-y-4 rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[6px_6px_0px_#123850]"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-[#123850]/25 pb-3">
            <h3 className="text-base font-black text-[#123850]">
              {esNuevoNodo ? "✨ Crear Nuevo Nodo" : `✏️ Editando: ${editandoNodo.titulo}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditandoNodo(null)}
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-0.5 font-mono text-xs font-black text-[#123850]"
            >
              Cancelar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Título del nodo
              </label>
              <input
                type="text"
                required
                value={editandoNodo.titulo}
                onChange={(e) => setEditandoNodo({ ...editandoNodo, titulo: e.target.value })}
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-sm font-bold text-[#123850]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-mono text-xs font-black text-[#123850]">Emoji</label>
                <input
                  type="text"
                  maxLength={8}
                  value={editandoNodo.emoji}
                  onChange={(e) => setEditandoNodo({ ...editandoNodo, emoji: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-center text-base"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs font-black text-[#123850]">XP</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  step={10}
                  value={editandoNodo.xp}
                  onChange={(e) =>
                    setEditandoNodo({ ...editandoNodo, xp: Math.max(10, Number(e.target.value) || 50) })
                  }
                  className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1.5 font-mono text-sm font-bold text-[#123850]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Unidad / Bloque
              </label>
              <input
                type="text"
                value={editandoNodo.unidad}
                onChange={(e) => setEditandoNodo({ ...editandoNodo, unidad: e.target.value })}
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Fecha inicio
              </label>
              <input
                type="date"
                value={editandoNodo.fechaInicio}
                onChange={(e) => setEditandoNodo({ ...editandoNodo, fechaInicio: e.target.value })}
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Fecha límite
              </label>
              <input
                type="date"
                value={editandoNodo.fechaLimite}
                onChange={(e) => setEditandoNodo({ ...editandoNodo, fechaLimite: e.target.value })}
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-2.5 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Tiempo estimado
              </label>
              <input
                type="text"
                value={editandoNodo.tiempoEstimado}
                onChange={(e) => setEditandoNodo({ ...editandoNodo, tiempoEstimado: e.target.value })}
                placeholder="Ej. 1.5 h"
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
              Objetivo / Descripción
            </label>
            <textarea
              rows={2}
              value={editandoNodo.descripcion}
              onChange={(e) => setEditandoNodo({ ...editandoNodo, descripcion: e.target.value })}
              className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-2 text-xs font-semibold text-[#123850]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Nodo prerequisito
              </label>
              <select
                value={editandoNodo.prerequisitoId ?? ""}
                onChange={(e) =>
                  setEditandoNodo({
                    ...editandoNodo,
                    prerequisitoId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
              >
                <option value="">Sin prerequisito (libre desde el inicio)</option>
                {nodos
                  .filter((n) => n.id !== editandoNodo.id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.emoji} {n.titulo}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Proyecto asociado
              </label>
              <select
                value={editandoNodo.proyectoId ?? ""}
                onChange={(e) =>
                  setEditandoNodo({
                    ...editandoNodo,
                    proyectoId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1.5 text-xs font-bold text-[#123850]"
              >
                <option value="">Sin proyecto directo</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Carpetas vinculadas + banderas de bloqueo */}
          <div className="space-y-2 rounded-xl border-2 border-[#123850]/30 bg-[#FAF6EC] p-3">
            <p className="font-mono text-xs font-black text-[#123850]">
              Carpetas de fuentes vinculadas:
            </p>
            <div className="flex flex-wrap gap-2">
              {carpetas.map((c) => {
                const vinculada = editandoNodo.carpetasIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      playToggle(!vinculada);
                      const nuevas = vinculada
                        ? editandoNodo.carpetasIds.filter((id) => id !== c.id)
                        : [...editandoNodo.carpetasIds, c.id];
                      setEditandoNodo({ ...editandoNodo, carpetasIds: nuevas });
                    }}
                    aria-pressed={vinculada}
                    className={`cursor-pointer rounded-full border-2 border-[#123850] px-3 py-1 font-mono text-xs font-bold ${
                      vinculada ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
                    }`}
                  >
                    {c.emoji} {c.nombre} {vinculada ? "✓" : "+"}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 pt-1 text-xs font-bold text-[#123850]">
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={editandoNodo.bloqueoPorFecha}
                  onChange={(e) =>
                    setEditandoNodo({ ...editandoNodo, bloqueoPorFecha: e.target.checked })
                  }
                  className="accent-[#123850]"
                />
                <span>Bloquear hasta su fecha de inicio</span>
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={editandoNodo.desbloqueoManual}
                  onChange={(e) =>
                    setEditandoNodo({ ...editandoNodo, desbloqueoManual: e.target.checked })
                  }
                  className="accent-[#123850]"
                />
                <span>Desbloqueo manual forzado</span>
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={editandoNodo.visible}
                  onChange={(e) => setEditandoNodo({ ...editandoNodo, visible: e.target.checked })}
                  className="accent-[#123850]"
                />
                <span>Visible para el alumnado</span>
              </label>
            </div>
          </div>

          {/* Checklist editable del nodo */}
          <div className="space-y-2">
            <p className="font-mono text-xs font-black text-[#123850]">
              Pasos de verificación del nodo:
            </p>
            <ul className="space-y-1.5">
              {editandoNodo.checklist.map((paso) => (
                <li
                  key={paso.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#123850]/40 bg-[#FAF6EC] px-3 py-1 text-xs font-bold text-[#123850]"
                >
                  <span>{paso.texto}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditandoNodo({
                        ...editandoNodo,
                        checklist: editandoNodo.checklist.filter((c) => c.id !== paso.id),
                      })
                    }
                    className="cursor-pointer font-mono text-xs font-black text-[#123850]"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoPasoTexto}
                onChange={(e) => setNuevoPasoTexto(e.target.value)}
                placeholder="Añadir nuevo paso de actividad…"
                className="flex-1 rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 text-xs font-bold text-[#123850]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!nuevoPasoTexto.trim()) return;
                  playPop();
                  setEditandoNodo({
                    ...editandoNodo,
                    checklist: [
                      ...editandoNodo.checklist,
                      { id: `chk-${Date.now()}`, texto: nuevoPasoTexto.trim() },
                    ],
                  });
                  setNuevoPasoTexto("");
                }}
                className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#FAF6EC] px-3 py-1 font-mono text-xs font-black text-[#123850]"
              >
                + Paso
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-5 py-2 font-mono text-xs font-black uppercase text-[#123850] shadow-[3px_3px_0px_#123850]"
            >
              💾 Guardar nodo
            </button>
          </div>
        </form>
      )}

      {/* Diseño de 2 columnas en escritorio: Ruta sinuosa tipo Duolingo + Panel de Detalle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna izquierda: Camino sinuoso de nodos */}
        <div className="rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850] lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="inline-block -rotate-1 rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-0.5 font-mono text-[11px] font-black text-[#123850]">
              🗺️ Ruta de Aprendizaje
            </span>
            <span className="font-mono text-[11px] font-bold text-[#123850]/75">
              Toca un nodo para abrirlo
            </span>
          </div>

          <div className="flex flex-col items-center py-2">
            {nodosOrdenados.map((nodo, idx) => {
              const { estado } = calcularEstadoNodo(nodo, nodos, progreso, hoyISO);
              const seleccionado = nodoActivo?.id === nodo.id;
              const claseZigZag = CLASES_ZIGZAG[idx % CLASES_ZIGZAG.length];
              const mostrarEncabezadoUnidad =
                idx === 0 || nodosOrdenados[idx - 1].unidad !== nodo.unidad;

              const iconoEstado =
                estado === "completado"
                  ? "✅"
                  : estado === "en_progreso"
                    ? "✏️"
                    : estado === "disponible"
                      ? "⭐"
                      : "🔒";

              return (
                <div key={nodo.id} className="flex w-full flex-col items-center">
                  {/* Cinta separadora de Unidad */}
                  {mostrarEncabezadoUnidad && (
                    <div className="my-2 flex w-full items-center gap-2">
                      <span className="h-[2px] flex-1 border-t-2 border-dashed border-[#123850]/25" />
                      <span className="rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#123850]">
                        {nodo.unidad}
                      </span>
                      <span className="h-[2px] flex-1 border-t-2 border-dashed border-[#123850]/25" />
                    </div>
                  )}

                  {/* Nodo circular táctil estilo Duolingo Sketch */}
                  <div className={`relative my-1 flex flex-col items-center transition-transform ${claseZigZag}`}>
                    {estado === "disponible" && (
                      <span className="mb-1 -rotate-2 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-[#123850] shadow-[2px_2px_0px_#123850] motion-reduce:animate-none animate-bounce">
                        ¡Empezar!
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        playPop();
                        onSeleccionarNodo(nodo.id);
                      }}
                      aria-pressed={seleccionado}
                      aria-label={`${nodo.titulo} (${estado}, ${nodo.xp} XP)`}
                      className={`group relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-full border-[3px] border-[#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${
                        estado === "completado"
                          ? "bg-[#D69A3F] text-[#123850] shadow-[0_6px_0_#123850]"
                          : estado === "disponible"
                            ? "bg-[#FEFEFA] text-[#123850] shadow-[0_6px_0_#123850] ring-4 ring-[#D69A3F]"
                            : estado === "en_progreso"
                              ? "bg-[#FAF6EC] text-[#123850] shadow-[0_6px_0_#123850] ring-2 ring-[#D69A3F]"
                              : "border-dashed bg-[#FAF6EC]/70 text-[#123850]/60 shadow-[0_4px_0_#123850]"
                      } ${seleccionado ? "scale-105" : ""}`}
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {estado === "bloqueado" ? "🔒" : nodo.emoji}
                      </span>
                      <span className="mt-0.5 font-mono text-[10px] font-black">
                        {nodo.xp} XP
                      </span>

                      {/* Mini insignia de estado */}
                      <span
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#123850] bg-[#FEFEFA] text-xs"
                      >
                        {iconoEstado}
                      </span>
                    </button>

                    <p
                      className={`mt-1.5 max-w-[190px] text-center text-xs font-black leading-tight ${
                        !nodo.visible ? "line-through opacity-60" : "text-[#123850]"
                      }`}
                    >
                      {nodo.titulo}
                    </p>

                    {/* Controles rápidos de orden y edición Docente */}
                    {modoEdicionDocente && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            playPop();
                            onMoverNodoDocente(nodo.id, -1);
                          }}
                          disabled={idx === 0}
                          aria-label={`Subir ${nodo.titulo}`}
                          className="cursor-pointer rounded-md border border-[#123850] bg-[#FEFEFA] px-1.5 py-0.5 font-mono text-[10px] font-black disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playPop();
                            onMoverNodoDocente(nodo.id, 1);
                          }}
                          disabled={idx === nodosOrdenados.length - 1}
                          aria-label={`Bajar ${nodo.titulo}`}
                          className="cursor-pointer rounded-md border border-[#123850] bg-[#FEFEFA] px-1.5 py-0.5 font-mono text-[10px] font-black disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirFormularioEdicion(nodo)}
                          aria-label={`Editar ${nodo.titulo}`}
                          className="cursor-pointer rounded-md border border-[#123850] bg-[#D69A3F] px-2 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                        >
                          Editar
                        </button>
                        {nodos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              playToggle(false);
                              onEliminarNodoDocente(nodo.id);
                            }}
                            aria-label={`Eliminar ${nodo.titulo}`}
                            className="cursor-pointer rounded-md border border-[#123850] bg-[#FEFEFA] px-1.5 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conector SVG punteado sinuoso hacia el siguiente nodo */}
                  {idx < nodosOrdenados.length - 1 && (
                    <svg
                      aria-hidden="true"
                      className="my-0.5 h-10 w-28 text-[#123850]"
                      viewBox="0 0 112 40"
                      fill="none"
                    >
                      <path
                        d={
                          idx % 2 === 0
                            ? "M 56 2 C 62 16, 82 22, 84 38"
                            : "M 84 2 C 80 18, 58 22, 56 38"
                        }
                        stroke={estado === "completado" ? "#D69A3F" : "#123850"}
                        strokeWidth="3"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna derecha: Panel de Detalle del Nodo Seleccionado */}
        <div className="lg:col-span-6">
          {nodoActivo ? (
            (() => {
              const { estado, motivoBloqueo } = calcularEstadoNodo(
                nodoActivo,
                nodos,
                progreso,
                hoyISO
              );
              const bloqueadoParaAlumno = estado === "bloqueado" && !modoEdicionDocente;
              const pasosMarcados = progreso.checklistMarcados[nodoActivo.id] ?? [];
              const carpetasVinculadas = carpetas.filter((c) =>
                nodoActivo.carpetasIds.includes(c.id)
              );
              const proyectoVinculado = proyectos.find((p) => p.id === nodoActivo.proyectoId);
              const quizRespondido = progreso.respuestasCorrectas.includes(nodoActivo.id);
              const eleccionQuiz = opcionElegidaQuiz[nodoActivo.id];

              return (
                <article
                  aria-live="polite"
                  className="sticky top-20 space-y-4 rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-dashed border-[#123850]/25 pb-3">
                    <div>
                      <span className="font-mono text-[11px] font-black uppercase text-[#123850]/70">
                        {nodoActivo.unidad} · ⏱ {nodoActivo.tiempoEstimado}
                      </span>
                      <h3 className="mt-0.5 text-xl font-black text-[#123850]">
                        {nodoActivo.emoji} {nodoActivo.titulo}
                      </h3>
                    </div>

                    <span className="rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-0.5 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]">
                      +{nodoActivo.xp} XP
                    </span>
                  </div>

                  <p className="text-sm font-semibold leading-relaxed text-[#123850]">
                    {nodoActivo.descripcion}
                  </p>

                  {/* Ventana de fechas sincronizada con el calendario */}
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#123850]/30 bg-[#FAF6EC] px-3 py-2 font-mono text-xs font-bold text-[#123850]">
                    <span>📅 Ventana:</span>
                    <span>{nodoActivo.fechaInicio}</span>
                    <span aria-hidden="true">→</span>
                    <span>{nodoActivo.fechaLimite}</span>
                  </div>

                  {/* Aviso si está bloqueado */}
                  {bloqueadoParaAlumno ? (
                    <div className="rounded-xl border-2 border-dashed border-[#123850] bg-[#FAF6EC] p-4 text-center">
                      <p className="text-2xl" aria-hidden="true">
                        🔒
                      </p>
                      <p className="mt-1 text-sm font-black text-[#123850]">Nodo bloqueado</p>
                      <p className="mt-0.5 text-xs font-bold text-[#123850]/75">
                        {motivoBloqueo ?? "Completa el nodo anterior para desbloquear este reto."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Checklist de actividades del nodo */}
                      <div className="space-y-2">
                        <p className="font-mono text-xs font-black uppercase text-[#123850]">
                          ✓ Actividades para dominar el nodo ({pasosMarcados.length}/
                          {nodoActivo.checklist.length})
                        </p>
                        <ul className="space-y-2">
                          {nodoActivo.checklist.map((paso) => {
                            const hecho = pasosMarcados.includes(paso.id);
                            return (
                              <li key={paso.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playPop();
                                    onAlternarPasoChecklist(nodoActivo.id, paso.id);
                                  }}
                                  aria-pressed={hecho}
                                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#123850] px-3 py-2 text-left text-xs font-bold transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
                                    hecho
                                      ? "bg-[#D69A3F]/25 text-[#123850]"
                                      : "bg-[#FEFEFA] text-[#123850]"
                                  }`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#123850] font-mono text-xs font-black ${
                                      hecho ? "bg-[#D69A3F]" : "bg-[#FEFEFA]"
                                    }`}
                                  >
                                    {hecho ? "✓" : ""}
                                  </span>
                                  <span className={hecho ? "line-through opacity-85" : ""}>
                                    {paso.texto}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Pregunta rápida opcional estilo Duolingo */}
                      {nodoActivo.preguntaRapida && (
                        <div className="space-y-2 rounded-xl border-2 border-[#123850] bg-[#FAF6EC] p-3.5">
                          <p className="font-mono text-xs font-black text-[#123850]">
                            🧠 Mini reto rápido: {nodoActivo.preguntaRapida.pregunta}
                          </p>
                          <div className="space-y-1.5">
                            {nodoActivo.preguntaRapida.opciones.map((op, i) => {
                              const esCorrecta = i === nodoActivo.preguntaRapida!.indiceCorrecto;
                              const fueElegida = eleccionQuiz === i;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setOpcionElegidaQuiz((prev) => ({
                                      ...prev,
                                      [nodoActivo.id]: i,
                                    }));
                                    if (esCorrecta) {
                                      playLevelUp(85);
                                      onResponderQuiz(nodoActivo.id);
                                    } else {
                                      playToggle(false);
                                    }
                                  }}
                                  className={`block w-full cursor-pointer rounded-lg border-2 border-[#123850] px-3 py-1.5 text-left text-xs font-bold ${
                                    quizRespondido && esCorrecta
                                      ? "bg-[#D69A3F] text-[#123850]"
                                      : fueElegida && !esCorrecta
                                        ? "bg-[#123850] text-[#FEFEFA]"
                                        : "bg-[#FEFEFA] text-[#123850]"
                                  }`}
                                >
                                  {op}
                                </button>
                              );
                            })}
                          </div>
                          {eleccionQuiz !== undefined && (
                            <p className="font-mono text-[11px] font-black text-[#123850]">
                              {eleccionQuiz === nodoActivo.preguntaRapida.indiceCorrecto
                                ? "✅ ¡Exacto! Concepto dominado."
                                : "💡 Casi; intenta con otra opción."}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Accesos directos a Carpetas de Fuentes y Proyecto vinculado */}
                      {(carpetasVinculadas.length > 0 || proyectoVinculado) && (
                        <div className="space-y-2 pt-1">
                          <p className="font-mono text-xs font-black text-[#123850]">
                            📂 Contextos y entregas vinculadas:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {carpetasVinculadas.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  playPop();
                                  onIrACarpeta(c.id);
                                }}
                                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-1 font-mono text-xs font-extrabold text-[#123850] shadow-[2px_2px_0px_#123850] hover:-translate-y-0.5"
                              >
                                {c.emoji} {c.nombre} →
                              </button>
                            ))}

                            {proyectoVinculado && (
                              <button
                                type="button"
                                onClick={() => {
                                  playPop();
                                  onIrAProyecto(proyectoVinculado.id);
                                }}
                                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F]/30 px-3 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850] hover:-translate-y-0.5"
                              >
                                {proyectoVinculado.emoji} Proyecto: {proyectoVinculado.titulo} →
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botón principal de completar / acreditar XP */}
                      <div className="pt-2">
                        {estado === "completado" ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-2.5">
                            <span className="font-mono text-xs font-black text-[#123850]">
                              ✅ Nodo completado (+{nodoActivo.xp} XP acreditados)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                playToggle(false);
                                onAlternarCompletadoNodo(nodoActivo.id, false);
                              }}
                              className="cursor-pointer rounded-full border border-[#123850] bg-[#FEFEFA] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                            >
                              Reabrir
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playLevelUp(100);
                              onAlternarCompletadoNodo(nodoActivo.id, true);
                            }}
                            className="w-full cursor-pointer rounded-2xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-3 font-mono text-xs font-black uppercase tracking-wide text-[#123850] shadow-[4px_4px_0px_#123850] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            🎉 Completar nodo y ganar +{nodoActivo.xp} XP
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })()
          ) : (
            <p className="text-sm font-bold text-[#123850]">No hay nodos visibles en el temario.</p>
          )}
        </div>
      </div>
    </div>
  );
}
