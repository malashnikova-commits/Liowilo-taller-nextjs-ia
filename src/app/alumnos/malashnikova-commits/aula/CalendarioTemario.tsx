"use client";

import { useEffect, useMemo, useState } from "react";
import { playPop, playToggle } from "../sonidos";
import type {
  EventoCalendario,
  NodoTemario,
  ProgresoAlumno,
  ProyectoAula,
  SemaforoPlazo,
} from "./types";

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ETIQUETA_SEMAFORO: Record<SemaforoPlazo, { texto: string; icono: string; destacado: boolean }> = {
  completado: { texto: "Completado", icono: "✅", destacado: false },
  en_curso: { texto: "En curso", icono: "🟢", destacado: true },
  vence_pronto: { texto: "Vence pronto", icono: "⏳", destacado: true },
  proximo: { texto: "Próximo", icono: "🗓️", destacado: false },
  atrasado: { texto: "Atrasado", icono: "⚠️", destacado: true },
};

function calcularDiferenciaDias(fechaA: string, fechaB: string): number {
  const [ya, ma, da] = fechaA.split("-").map(Number);
  const [yb, mb, db] = fechaB.split("-").map(Number);
  const utcA = Date.UTC(ya, (ma || 1) - 1, da || 1);
  const utcB = Date.UTC(yb, (mb || 1) - 1, db || 1);
  return Math.round((utcA - utcB) / 86400000);
}

function obtenerSemaforo(
  fechaInicio: string,
  fechaLimite: string,
  completado: boolean,
  hoyISO: string
): SemaforoPlazo {
  if (completado) return "completado";
  if (fechaLimite < hoyISO) return "atrasado";
  const diasParaVencer = calcularDiferenciaDias(fechaLimite, hoyISO);
  if (diasParaVencer >= 0 && diasParaVencer <= 2) return "vence_pronto";
  if (fechaInicio <= hoyISO && hoyISO <= fechaLimite) return "en_curso";
  return "proximo";
}

interface CalendarioTemarioProps {
  nodos: NodoTemario[];
  proyectos: ProyectoAula[];
  progreso: ProgresoAlumno;
  hoyISO: string;
  modoEdicionDocente: boolean;
  onIrANodo: (nodoId: string) => void;
  onIrAProyecto: (proyectoId: string) => void;
  onActualizarFechasNodoDocente: (nodoId: string, fechaInicio: string, fechaLimite: string) => void;
  onActualizarFechasProyectoDocente: (
    proyectoId: string,
    fechaInicio: string,
    fechaLimite: string
  ) => void;
}

export function CalendarioTemario({
  nodos,
  proyectos,
  progreso,
  hoyISO,
  modoEdicionDocente,
  onIrANodo,
  onIrAProyecto,
  onActualizarFechasNodoDocente,
  onActualizarFechasProyectoDocente,
}: CalendarioTemarioProps) {
  const [anioInicial, mesInicial] = hoyISO.split("-").map(Number);
  const [anioVista, setAnioVista] = useState<number>(anioInicial || 2026);
  const [mesVista, setMesVista] = useState<number>((mesInicial || 11) - 1); // 0–11
  const [diaSeleccionadoISO, setDiaSeleccionadoISO] = useState<string>(hoyISO);
  const [filtroSemaforo, setFiltroSemaforo] = useState<"todos" | SemaforoPlazo>("todos");

  // Mantener sincronizado cuando hoyISO se hidrata en el cliente
  useEffect(() => {
    const [y, m] = hoyISO.split("-").map(Number);
    if (y && m) {
      setAnioVista(y);
      setMesVista(m - 1);
      setDiaSeleccionadoISO(hoyISO);
    }
  }, [hoyISO]);

  // Construir eventos sincronizados desde nodos y proyectos
  const eventos = useMemo<EventoCalendario[]>(() => {
    const lista: EventoCalendario[] = [];

    nodos
      .filter((n) => modoEdicionDocente || n.visible)
      .forEach((n) => {
        const hecho = progreso.nodosCompletados.includes(n.id);
        const sem = obtenerSemaforo(n.fechaInicio, n.fechaLimite, hecho, hoyISO);

        lista.push({
          id: `ini-${n.id}`,
          fecha: n.fechaInicio,
          tipo: "inicio_nodo",
          titulo: `Inicio: ${n.titulo}`,
          subtitulo: `${n.unidad} · ${n.tiempoEstimado}`,
          emoji: n.emoji,
          xp: n.xp,
          referenciaId: n.id,
          completado: hecho,
          semaforo: sem,
        });

        lista.push({
          id: `lim-${n.id}`,
          fecha: n.fechaLimite,
          tipo: "limite_nodo",
          titulo: `Meta: ${n.titulo}`,
          subtitulo: `Cierre de tema · +${n.xp} XP`,
          emoji: "🏁",
          xp: n.xp,
          referenciaId: n.id,
          completado: hecho,
          semaforo: sem,
        });
      });

    proyectos.forEach((p) => {
      const marcados = progreso.entregablesMarcados[p.id] ?? [];
      const hecho = p.entregables.length > 0 && marcados.length >= p.entregables.length;
      const sem = obtenerSemaforo(p.fechaInicio, p.fechaLimite, hecho, hoyISO);

      lista.push({
        id: `proy-${p.id}`,
        fecha: p.fechaLimite,
        tipo: "entrega_proyecto",
        titulo: `Entrega Proyecto: ${p.titulo}`,
        subtitulo: `${p.entregables.length} entregables · +${p.xpExtra} XP extra`,
        emoji: p.emoji,
        xp: p.xpExtra,
        referenciaId: p.id,
        completado: hecho,
        semaforo: sem,
      });
    });

    return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [nodos, proyectos, progreso, hoyISO, modoEdicionDocente]);

  const eventosPorFecha = useMemo(() => {
    const mapa: Record<string, EventoCalendario[]> = {};
    eventos.forEach((ev) => {
      if (!mapa[ev.fecha]) mapa[ev.fecha] = [];
      mapa[ev.fecha].push(ev);
    });
    return mapa;
  }, [eventos]);

  // Celdas del mes actual (Lunes = 0 ... Domingo = 6)
  const celdasMes = useMemo(() => {
    const primerDiaSemanaUTC = new Date(Date.UTC(anioVista, mesVista, 1)).getUTCDay();
    const offsetLunes = (primerDiaSemanaUTC + 6) % 7;
    const diasEnMes = new Date(Date.UTC(anioVista, mesVista + 1, 0)).getUTCDate();

    const celdas: { vacia: true; key: string }[] | { vacia: false; iso: string; dia: number }[] = [];
    const resultado: ({ vacia: true; key: string } | { vacia: false; iso: string; dia: number })[] =
      [];

    for (let i = 0; i < offsetLunes; i++) {
      resultado.push({ vacia: true, key: `vacia-${i}` });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      const mm = String(mesVista + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      resultado.push({ vacia: false, iso: `${anioVista}-${mm}-${dd}`, dia: d });
    }
    void celdas;
    return resultado;
  }, [anioVista, mesVista]);

  const cambiarMes = (delta: -1 | 1) => {
    playPop();
    const nuevo = new Date(Date.UTC(anioVista, mesVista + delta, 1));
    setAnioVista(nuevo.getUTCFullYear());
    setMesVista(nuevo.getUTCMonth());
  };

  const volverAHoy = () => {
    playToggle(true);
    const [y, m] = hoyISO.split("-").map(Number);
    if (y && m) {
      setAnioVista(y);
      setMesVista(m - 1);
    }
    setDiaSeleccionadoISO(hoyISO);
  };

  const eventosDelDia = eventosPorFecha[diaSeleccionadoISO] ?? [];

  const agendaFiltrada = useMemo(() => {
    // Mostrar 1 fila consolidada por nodo y por proyecto ordenada por fecha límite
    const filas = [
      ...nodos
        .filter((n) => modoEdicionDocente || n.visible)
        .map((n) => {
          const hecho = progreso.nodosCompletados.includes(n.id);
          return {
            id: n.id,
            esProyecto: false,
            emoji: n.emoji,
            titulo: n.titulo,
            unidad: n.unidad,
            fechaInicio: n.fechaInicio,
            fechaLimite: n.fechaLimite,
            xp: n.xp,
            semaforo: obtenerSemaforo(n.fechaInicio, n.fechaLimite, hecho, hoyISO),
          };
        }),
      ...proyectos.map((p) => {
        const marcados = progreso.entregablesMarcados[p.id] ?? [];
        const hecho = p.entregables.length > 0 && marcados.length >= p.entregables.length;
        return {
          id: p.id,
          esProyecto: true,
          emoji: p.emoji,
          titulo: `Proyecto: ${p.titulo}`,
          unidad: `${p.entregables.length} entregables`,
          fechaInicio: p.fechaInicio,
          fechaLimite: p.fechaLimite,
          xp: p.xpExtra,
          semaforo: obtenerSemaforo(p.fechaInicio, p.fechaLimite, hecho, hoyISO),
        };
      }),
    ].sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));

    if (filtroSemaforo === "todos") return filas;
    return filas.filter((f) => f.semaforo === filtroSemaforo);
  }, [nodos, proyectos, progreso, hoyISO, modoEdicionDocente, filtroSemaforo]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Calendario Mensual Interactivo */}
        <div className="rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850] lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black uppercase tracking-wide text-[#123850]">
              📅 {NOMBRES_MESES[mesVista]} {anioVista}
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={volverAHoy}
                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
              >
                →
              </button>
            </div>
          </div>

          {/* Encabezado Lunes–Domingo */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-black text-[#123850]/75">
            {DIAS_SEMANA.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 gap-1.5">
            {celdasMes.map((celda) => {
              if (celda.vacia) {
                return <div key={celda.key} className="h-14 rounded-xl bg-[#FAF6EC]/40" />;
              }

              const evs = eventosPorFecha[celda.iso] ?? [];
              const esHoy = celda.iso === hoyISO;
              const esSeleccionado = celda.iso === diaSeleccionadoISO;
              const tieneEntregaProyecto = evs.some((e) => e.tipo === "entrega_proyecto");

              return (
                <button
                  key={celda.iso}
                  type="button"
                  onClick={() => {
                    playPop();
                    setDiaSeleccionadoISO(celda.iso);
                  }}
                  aria-pressed={esSeleccionado}
                  aria-label={`${celda.iso}${esHoy ? " (Hoy)" : ""}, ${evs.length} eventos`}
                  className={`flex h-14 cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-1.5 transition-transform hover:-translate-y-0.5 ${
                    esSeleccionado
                      ? "border-[#123850] bg-[#D69A3F] text-[#123850] shadow-[2px_2px_0px_#123850]"
                      : esHoy
                        ? "border-[#123850] bg-[#FAF6EC] text-[#123850] ring-2 ring-[#D69A3F]"
                        : evs.length > 0
                          ? "border-[#123850] bg-[#FEFEFA] text-[#123850]"
                          : "border-[#123850]/25 bg-[#FEFEFA] text-[#123850]/75"
                  }`}
                >
                  <span className="font-mono text-xs font-black">
                    {celda.dia}
                    {esHoy ? "★" : ""}
                  </span>

                  {evs.length > 0 && (
                    <div className="flex items-center gap-1" aria-hidden="true">
                      <span
                        className={`h-2 w-2 rounded-full border border-[#123850] ${
                          tieneEntregaProyecto ? "bg-[#D69A3F]" : "bg-[#123850]"
                        }`}
                      />
                      {evs.length > 1 && (
                        <span className="font-mono text-[9px] font-black">+{evs.length}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del Día Seleccionado */}
        <div className="rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850] lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-dashed border-[#123850]/25 pb-3">
            <div>
              <p className="font-mono text-[11px] font-black uppercase text-[#123850]/70">
                Hitos programados
              </p>
              <h4 className="text-base font-black text-[#123850]">
                📌 {diaSeleccionadoISO} {diaSeleccionadoISO === hoyISO ? "(Hoy)" : ""}
              </h4>
            </div>
            <span className="rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-2.5 py-0.5 font-mono text-xs font-black text-[#123850]">
              {eventosDelDia.length} {eventosDelDia.length === 1 ? "hito" : "hitos"}
            </span>
          </div>

          {eventosDelDia.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#123850]/35 bg-[#FAF6EC] p-6 text-center">
              <p className="text-2xl" aria-hidden="true">
                ☕
              </p>
              <p className="mt-1 text-xs font-bold text-[#123850]/80">
                Sin cierres ni aperturas en esta fecha. Toca cualquier día marcado en el calendario.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {eventosDelDia.map((ev) => {
                const infoSem = ETIQUETA_SEMAFORO[ev.semaforo];
                return (
                  <li
                    key={ev.id}
                    className="rounded-xl border-2 border-[#123850] bg-[#FAF6EC] p-3 shadow-[2px_2px_0px_#123850]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-[#123850]">
                          {ev.emoji} {ev.titulo}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-bold text-[#123850]/75">
                          {ev.subtitulo}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#123850] bg-[#D69A3F] px-2 py-0.5 font-mono text-[10px] font-black text-[#123850]">
                        +{ev.xp} XP
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-black text-[#123850]">
                        {infoSem.icono} {infoSem.texto}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playPop();
                          if (ev.tipo === "entrega_proyecto") {
                            onIrAProyecto(ev.referenciaId);
                          } else {
                            onIrANodo(ev.referenciaId);
                          }
                        }}
                        className="cursor-pointer rounded-full border border-[#123850] bg-[#FEFEFA] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#123850]"
                      >
                        Abrir →
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Cronograma / Agenda por Tiempos con Semáforo Automático y Edición Rápida Docente */}
      <section className="rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-5 shadow-[5px_5px_0px_#123850]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#123850]">
              ⏱️ Cronograma de Temarios y Entregas por Tiempos
            </h3>
            <p className="text-xs font-bold text-[#123850]/75">
              {modoEdicionDocente
                ? "Ajusta cualquier fecha aquí y el calendario mensual se actualizará al instante."
                : "Semáforo automático calculado frente a la fecha actual."}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "todos", label: "Todos" },
                { id: "en_curso", label: "🟢 En curso" },
                { id: "vence_pronto", label: "⏳ Vence pronto" },
                { id: "proximo", label: "🗓️ Próximos" },
                { id: "completado", label: "✅ Completados" },
              ] as { id: "todos" | SemaforoPlazo; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  playPop();
                  setFiltroSemaforo(f.id);
                }}
                aria-pressed={filtroSemaforo === f.id}
                className={`cursor-pointer rounded-full border-2 border-[#123850] px-2.5 py-0.5 font-mono text-[11px] font-extrabold ${
                  filtroSemaforo === f.id
                    ? "bg-[#123850] text-[#FEFEFA]"
                    : "bg-[#FAF6EC] text-[#123850]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {agendaFiltrada.map((item) => {
            const sem = ETIQUETA_SEMAFORO[item.semaforo];
            return (
              <div
                key={`${item.esProyecto ? "p" : "n"}-${item.id}`}
                className="flex flex-col justify-between gap-3 rounded-xl border-2 border-[#123850] bg-[#FAF6EC] p-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border border-[#123850] px-2 py-0.5 font-mono text-[10px] font-black ${
                        sem.destacado ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
                      }`}
                    >
                      {sem.icono} {sem.texto}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#123850]/70">
                      {item.unidad}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-[#123850]">
                    {item.emoji} {item.titulo}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {modoEdicionDocente ? (
                    <>
                      <input
                        type="date"
                        aria-label={`Inicio de ${item.titulo}`}
                        value={item.fechaInicio}
                        onChange={(e) => {
                          if (item.esProyecto) {
                            onActualizarFechasProyectoDocente(item.id, e.target.value, item.fechaLimite);
                          } else {
                            onActualizarFechasNodoDocente(item.id, e.target.value, item.fechaLimite);
                          }
                        }}
                        className="rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2 py-1 font-mono text-xs font-bold text-[#123850]"
                      />
                      <span className="font-mono text-xs font-black">→</span>
                      <input
                        type="date"
                        aria-label={`Fecha límite de ${item.titulo}`}
                        value={item.fechaLimite}
                        onChange={(e) => {
                          if (item.esProyecto) {
                            onActualizarFechasProyectoDocente(item.id, item.fechaInicio, e.target.value);
                          } else {
                            onActualizarFechasNodoDocente(item.id, item.fechaInicio, e.target.value);
                          }
                        }}
                        className="rounded-lg border-2 border-[#123850] bg-[#FEFEFA] px-2 py-1 font-mono text-xs font-bold text-[#123850]"
                      />
                    </>
                  ) : (
                    <span className="rounded-lg border border-[#123850]/40 bg-[#FEFEFA] px-2.5 py-1 font-mono text-xs font-bold text-[#123850]">
                      {item.fechaInicio} → {item.fechaLimite}
                    </span>
                  )}

                  <span className="rounded-full border-2 border-[#123850] bg-[#D69A3F] px-2.5 py-0.5 font-mono text-xs font-black text-[#123850]">
                    +{item.xp} XP
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      if (item.esProyecto) onIrAProyecto(item.id);
                      else onIrANodo(item.id);
                    }}
                    className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#123850] px-3 py-1 font-mono text-xs font-extrabold text-[#FEFEFA]"
                  >
                    Ir →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
