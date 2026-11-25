"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playLevelUp, playPop, playToggle } from "../sonidos";
import { AccesoRol } from "./AccesoRol";
import { CalendarioTemario } from "./CalendarioTemario";
import { CarpetasProyectos } from "./CarpetasProyectos";
import {
  crearCursoInicial,
  crearProgresoInicial,
  FECHA_SEMILLA_SSR,
  formatearFechaLocalHoy,
} from "./datosIniciales";
import { MapaNodos } from "./MapaNodos";
import {
  aulaStorageLocal,
  descargarCursoComoJSON,
  validarCursoImportado,
} from "./storage";
import type {
  CarpetaFuentes,
  ConfiguracionCurso,
  NodoTemario,
  ProgresoAlumno,
  ProyectoAula,
  RecursoFuente,
  RolUsuario,
} from "./types";

type PestanaAula = "mapa" | "calendario" | "carpetas";

export function AulaInteractiva() {
  // Inicialización determinista segura para SSR (sin acceder a window ni new Date() en render inicial)
  const [hoyISO, setHoyISO] = useState<string>(FECHA_SEMILLA_SSR);
  const [curso, setCurso] = useState<ConfiguracionCurso>(() =>
    crearCursoInicial(FECHA_SEMILLA_SSR)
  );
  const [progreso, setProgreso] = useState<ProgresoAlumno>(() =>
    crearProgresoInicial(FECHA_SEMILLA_SSR)
  );

  const [rolActual, setRolActual] = useState<RolUsuario>("alumnado");
  const [docenteAutenticado, setDocenteAutenticado] = useState<boolean>(false);
  const [vistaPreviaAlumno, setVistaPreviaAlumno] = useState<boolean>(false);
  const [panelAccesoAbierto, setPanelAccesoAbierto] = useState<boolean>(false);

  const [pestanaActiva, setPestanaActiva] = useState<PestanaAula>("mapa");
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState<string | null>("nodo-3-nextjs");
  const [carpetaActivaId, setCarpetaActivaId] = useState<string | null>(null);
  const [proyectoDestacadoId, setProyectoDestacadoId] = useState<string | null>(null);
  const [avisoSistema, setAvisoSistema] = useState<string | null>(null);

  const inputImportarRef = useRef<HTMLInputElement | null>(null);

  // Hidratación cliente: sincronizar fecha real y localStorage una sola vez al montar
  useEffect(() => {
    const hoyReal = formatearFechaLocalHoy(new Date());
    setHoyISO(hoyReal);

    const cursoGuardado = aulaStorageLocal.cargarCurso(hoyReal);
    const progresoGuardado = aulaStorageLocal.cargarProgreso(hoyReal);

    // Actualizar racha si cambió el día
    if (progresoGuardado.ultimaFechaISO !== hoyReal) {
      const actualizado: ProgresoAlumno = {
        ...progresoGuardado,
        rachaDias: progresoGuardado.rachaDias + 1,
        ultimaFechaISO: hoyReal,
      };
      aulaStorageLocal.guardarProgreso(actualizado);
      setProgreso(actualizado);
    } else {
      setProgreso(progresoGuardado);
    }

    setCurso(cursoGuardado);
  }, []);

  const mostrarAviso = (texto: string) => {
    setAvisoSistema(texto);
    window.setTimeout(() => {
      setAvisoSistema((actual) => (actual === texto ? null : actual));
    }, 3200);
  };

  const actualizarCurso = (nuevoCurso: ConfiguracionCurso) => {
    setCurso(nuevoCurso);
    aulaStorageLocal.guardarCurso(nuevoCurso);
  };

  const actualizarProgreso = (nuevoProgreso: ProgresoAlumno) => {
    setProgreso(nuevoProgreso);
    aulaStorageLocal.guardarProgreso(nuevoProgreso);
  };

  const modoEdicionDocente =
    rolActual === "docente" && docenteAutenticado && !vistaPreviaAlumno;

  // Cálculo sincronizado de puntos XP y avance global
  const estadisticasXP = useMemo(() => {
    const nodosVisibles = curso.nodos.filter((n) => n.visible);
    const xpTotalNodos = nodosVisibles.reduce((acc, n) => acc + n.xp, 0);
    const xpTotalProyectos = curso.proyectos.reduce((acc, p) => acc + p.xpExtra, 0);
    const xpTotalCurso = Math.max(1, xpTotalNodos + xpTotalProyectos);

    const xpGanadoNodos = nodosVisibles
      .filter((n) => progreso.nodosCompletados.includes(n.id))
      .reduce((acc, n) => acc + n.xp, 0);

    const xpGanadoProyectos = curso.proyectos
      .filter((p) => {
        const marcados = progreso.entregablesMarcados[p.id] ?? [];
        return p.entregables.length > 0 && marcados.length >= p.entregables.length;
      })
      .reduce((acc, p) => acc + p.xpExtra, 0);

    const xpGanado = xpGanadoNodos + xpGanadoProyectos;
    const porcentaje = Math.min(100, Math.round((xpGanado / xpTotalCurso) * 100));
    const nodosHechos = nodosVisibles.filter((n) =>
      progreso.nodosCompletados.includes(n.id)
    ).length;

    return {
      xpGanado,
      xpTotalCurso,
      porcentaje,
      nodosHechos,
      totalNodosVisibles: nodosVisibles.length,
    };
  }, [curso, progreso]);

  // Acciones de Alumnado
  const alternarPasoChecklist = (nodoId: string, pasoId: string) => {
    const actuales = progreso.checklistMarcados[nodoId] ?? [];
    const existe = actuales.includes(pasoId);
    const siguientes = existe ? actuales.filter((id) => id !== pasoId) : [...actuales, pasoId];

    actualizarProgreso({
      ...progreso,
      checklistMarcados: {
        ...progreso.checklistMarcados,
        [nodoId]: siguientes,
      },
    });
  };

  const registrarQuizCorrecto = (nodoId: string) => {
    if (progreso.respuestasCorrectas.includes(nodoId)) return;
    actualizarProgreso({
      ...progreso,
      respuestasCorrectas: [...progreso.respuestasCorrectas, nodoId],
    });
  };

  const alternarCompletadoNodo = (nodoId: string, completar: boolean) => {
    const yaEstaba = progreso.nodosCompletados.includes(nodoId);
    if (completar && !yaEstaba) {
      const nodo = curso.nodos.find((n) => n.id === nodoId);
      const todosPasos = nodo ? nodo.checklist.map((c) => c.id) : [];
      actualizarProgreso({
        ...progreso,
        nodosCompletados: [...progreso.nodosCompletados, nodoId],
        checklistMarcados: {
          ...progreso.checklistMarcados,
          [nodoId]: todosPasos,
        },
      });
      if (nodo) mostrarAviso(`🎉 ¡Completaste "${nodo.titulo}" (+${nodo.xp} XP)!`);
    } else if (!completar && yaEstaba) {
      actualizarProgreso({
        ...progreso,
        nodosCompletados: progreso.nodosCompletados.filter((id) => id !== nodoId),
      });
    }
  };

  const alternarRecursoRevisado = (recursoId: string) => {
    const existe = progreso.recursosRevisados.includes(recursoId);
    const siguientes = existe
      ? progreso.recursosRevisados.filter((id) => id !== recursoId)
      : [...progreso.recursosRevisados, recursoId];
    actualizarProgreso({ ...progreso, recursosRevisados: siguientes });
  };

  const alternarEntregableProyecto = (
    proyectoId: string,
    entregableId: string,
    totalEntregables: number
  ) => {
    const actuales = progreso.entregablesMarcados[proyectoId] ?? [];
    const existe = actuales.includes(entregableId);
    const siguientes = existe
      ? actuales.filter((id) => id !== entregableId)
      : [...actuales, entregableId];

    actualizarProgreso({
      ...progreso,
      entregablesMarcados: {
        ...progreso.entregablesMarcados,
        [proyectoId]: siguientes,
      },
    });

    if (!existe && siguientes.length >= totalEntregables) {
      const proy = curso.proyectos.find((p) => p.id === proyectoId);
      if (proy) mostrarAviso(`🚀 ¡Proyecto "${proy.titulo}" acreditado (+${proy.xpExtra} XP)!`);
    }
  };

  // Acciones de Profesorado (Docente)
  const guardarNodoDocente = (nodoEditado: NodoTemario, esNuevo: boolean) => {
    const nuevosNodos = esNuevo
      ? [...curso.nodos, nodoEditado]
      : curso.nodos.map((n) => (n.id === nodoEditado.id ? nodoEditado : n));

    // Sincronizar también carpetasIds bidireccionalmente
    const carpetasSincronizadas = curso.carpetas.map((c) => {
      const debeEstar = nodoEditado.carpetasIds.includes(c.id);
      const yaEsta = c.nodoIds.includes(nodoEditado.id);
      if (debeEstar && !yaEsta) return { ...c, nodoIds: [...c.nodoIds, nodoEditado.id] };
      if (!debeEstar && yaEsta) {
        return { ...c, nodoIds: c.nodoIds.filter((id) => id !== nodoEditado.id) };
      }
      return c;
    });

    actualizarCurso({
      ...curso,
      nodos: nuevosNodos,
      carpetas: carpetasSincronizadas,
    });
    mostrarAviso(esNuevo ? "✨ Nuevo nodo añadido a la ruta." : "✓ Nodo actualizado.");
  };

  const eliminarNodoDocente = (nodoId: string) => {
    const restantes = curso.nodos
      .filter((n) => n.id !== nodoId)
      .map((n, i) => ({
        ...n,
        orden: i + 1,
        prerequisitoId: n.prerequisitoId === nodoId ? null : n.prerequisitoId,
      }));
    actualizarCurso({ ...curso, nodos: restantes });
    mostrarAviso("🗑️ Nodo eliminado del temario.");
  };

  const moverNodoDocente = (nodoId: string, direccion: -1 | 1) => {
    const ordenados = [...curso.nodos].sort((a, b) => a.orden - b.orden);
    const idx = ordenados.findIndex((n) => n.id === nodoId);
    const destino = idx + direccion;
    if (idx < 0 || destino < 0 || destino >= ordenados.length) return;

    const copia = [...ordenados];
    const [extraido] = copia.splice(idx, 1);
    copia.splice(destino, 0, extraido);

    const reenumerados = copia.map((n, i) => ({ ...n, orden: i + 1 }));
    actualizarCurso({ ...curso, nodos: reenumerados });
  };

  const actualizarFechasNodoDocente = (
    nodoId: string,
    fechaInicio: string,
    fechaLimite: string
  ) => {
    actualizarCurso({
      ...curso,
      nodos: curso.nodos.map((n) =>
        n.id === nodoId ? { ...n, fechaInicio, fechaLimite } : n
      ),
    });
  };

  const actualizarFechasProyectoDocente = (
    proyectoId: string,
    fechaInicio: string,
    fechaLimite: string
  ) => {
    actualizarCurso({
      ...curso,
      proyectos: curso.proyectos.map((p) =>
        p.id === proyectoId ? { ...p, fechaInicio, fechaLimite } : p
      ),
    });
  };

  const crearCarpetaDocente = (nueva: CarpetaFuentes) => {
    actualizarCurso({ ...curso, carpetas: [...curso.carpetas, nueva] });
    mostrarAviso(`📂 Carpeta "${nueva.nombre}" creada.`);
  };

  const eliminarCarpetaDocente = (carpetaId: string) => {
    actualizarCurso({
      ...curso,
      carpetas: curso.carpetas.filter((c) => c.id !== carpetaId),
      nodos: curso.nodos.map((n) => ({
        ...n,
        carpetasIds: n.carpetasIds.filter((id) => id !== carpetaId),
      })),
    });
    if (carpetaActivaId === carpetaId) setCarpetaActivaId(null);
  };

  const alternarVinculoCarpetaNodoDocente = (carpetaId: string, nodoId: string) => {
    const carpetasActualizadas = curso.carpetas.map((c) => {
      if (c.id !== carpetaId) return c;
      const existe = c.nodoIds.includes(nodoId);
      return {
        ...c,
        nodoIds: existe ? c.nodoIds.filter((id) => id !== nodoId) : [...c.nodoIds, nodoId],
      };
    });

    const nodosActualizados = curso.nodos.map((n) => {
      if (n.id !== nodoId) return n;
      const existe = n.carpetasIds.includes(carpetaId);
      return {
        ...n,
        carpetasIds: existe
          ? n.carpetasIds.filter((id) => id !== carpetaId)
          : [...n.carpetasIds, carpetaId],
      };
    });

    actualizarCurso({ ...curso, carpetas: carpetasActualizadas, nodos: nodosActualizados });
  };

  const agregarRecursoDocente = (carpetaId: string, recurso: RecursoFuente) => {
    actualizarCurso({
      ...curso,
      carpetas: curso.carpetas.map((c) =>
        c.id === carpetaId ? { ...c, recursos: [...c.recursos, recurso] } : c
      ),
    });
  };

  const eliminarRecursoDocente = (carpetaId: string, recursoId: string) => {
    actualizarCurso({
      ...curso,
      carpetas: curso.carpetas.map((c) =>
        c.id === carpetaId
          ? { ...c, recursos: c.recursos.filter((r) => r.id !== recursoId) }
          : c
      ),
    });
  };

  const guardarProyectoDocente = (proy: ProyectoAula, esNuevo: boolean) => {
    actualizarCurso({
      ...curso,
      proyectos: esNuevo
        ? [...curso.proyectos, proy]
        : curso.proyectos.map((p) => (p.id === proy.id ? proy : p)),
    });
    mostrarAviso(esNuevo ? "🚀 Nuevo proyecto creado." : "✓ Proyecto actualizado.");
  };

  const eliminarProyectoDocente = (proyectoId: string) => {
    actualizarCurso({
      ...curso,
      proyectos: curso.proyectos.filter((p) => p.id !== proyectoId),
      nodos: curso.nodos.map((n) =>
        n.proyectoId === proyectoId ? { ...n, proyectoId: null } : n
      ),
    });
  };

  // Importar / Exportar / Restablecer JSON
  const manejarImportacionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      const contenido = String(lector.result ?? "");
      const validacion = validarCursoImportado(contenido, curso.pinDocente);
      if (validacion.ok) {
        playLevelUp(100);
        actualizarCurso(validacion.curso);
        mostrarAviso(`✅ Temario "${validacion.curso.nombreCurso}" importado con éxito.`);
      } else {
        playToggle(false);
        mostrarAviso(`⚠ Error al importar: ${validacion.error}`);
      }
      e.target.value = "";
    };
    lector.readAsText(archivo);
  };

  const restablecerDatos = () => {
    playToggle(false);
    const { curso: c, progreso: p } = aulaStorageLocal.restablecerFabrica(hoyISO);
    setCurso(c);
    setProgreso(p);
    mostrarAviso("↺ Datos de fábrica del aula restaurados.");
  };

  return (
    <section
      aria-label="Plataforma interactiva de Aula"
      className="mt-10 rounded-3xl border-[3px] border-[#123850] bg-[#FEFEFA] p-5 text-[#123850] shadow-[8px_8px_0px_#123850] sm:p-7"
      style={{
        backgroundImage: "radial-gradient(rgba(18,56,80,0.14) 1.3px, transparent 1.3px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* Cinta superior e insignia del módulo */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-[#123850]/30 pb-5">
        <div>
          <span className="inline-block -rotate-1 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-[#123850] shadow-[2px_2px_0px_#123850]">
            🎓 Plataforma de Aula · Sketchbook LMS
          </span>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#123850] sm:text-3xl">
            {curso.nombreCurso}
          </h2>
          <p className="mt-0.5 text-xs font-bold text-[#123850]/75 sm:text-sm">
            {curso.subtitulo}
          </p>
        </div>

        {/* Botones de Rol, Vista Previa y JSON */}
        <div className="flex flex-wrap items-center gap-2">
          {docenteAutenticado && (
            <button
              type="button"
              onClick={() => {
                playToggle(!vistaPreviaAlumno);
                setVistaPreviaAlumno((prev) => !prev);
              }}
              aria-pressed={vistaPreviaAlumno}
              className={`cursor-pointer rounded-full border-2 border-[#123850] px-3 py-1.5 font-mono text-xs font-black shadow-[2px_2px_0px_#123850] ${
                vistaPreviaAlumno ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
              }`}
            >
              {vistaPreviaAlumno ? "✏️ Volver a Editar" : "👁️ Vista Alumnado"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playPop();
              setPanelAccesoAbierto((prev) => !prev);
            }}
            aria-expanded={panelAccesoAbierto}
            className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#123850] px-3.5 py-1.5 font-mono text-xs font-black text-[#FEFEFA] shadow-[3px_3px_0px_#D69A3F] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {modoEdicionDocente
              ? "🎓 Rol: Docente (Editar)"
              : vistaPreviaAlumno
                ? "👁️ Docente (Vista Alumno)"
                : `🎒 ${progreso.avatar} ${progreso.alias} · Cambiar Rol`}
          </button>
        </div>
      </div>

      {/* Notificación de estado del aula */}
      {avisoSistema && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center justify-between gap-2 rounded-2xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-2 font-mono text-xs font-black text-[#123850] shadow-[3px_3px_0px_#123850]"
        >
          <span>{avisoSistema}</span>
          <button
            type="button"
            onClick={() => setAvisoSistema(null)}
            aria-label="Cerrar notificación"
            className="cursor-pointer rounded-full border border-[#123850] bg-[#FEFEFA] px-2 py-0.5 text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Panel desplegable de Acceso Alumnado / Profesorado */}
      <AccesoRol
        rolActual={rolActual}
        docenteAutenticado={docenteAutenticado}
        vistaPreviaAlumno={vistaPreviaAlumno}
        pinDocenteActual={curso.pinDocente}
        progreso={progreso}
        abierto={panelAccesoAbierto}
        onCerrar={() => setPanelAccesoAbierto(false)}
        onGuardarPerfilAlumno={(alias, avatar) => {
          setRolActual("alumnado");
          actualizarProgreso({ ...progreso, alias, avatar });
        }}
        onAutenticarDocente={() => {
          setDocenteAutenticado(true);
          setVistaPreviaAlumno(false);
          setRolActual("docente");
        }}
        onCerrarSesionDocente={() => {
          setDocenteAutenticado(false);
          setVistaPreviaAlumno(false);
          setRolActual("alumnado");
        }}
        onAlternarVistaPrevia={() => setVistaPreviaAlumno((prev) => !prev)}
        onCambiarPinDocente={(nuevoPin) => actualizarCurso({ ...curso, pinDocente: nuevoPin })}
      />

      {/* Barra sincronizada de Puntos XP, Avance Global, Nodos y Racha + JSON */}
      <div className="mb-6 rounded-2xl border-[2.5px] border-[#123850] bg-[#FEFEFA] p-4 shadow-[4px_4px_0px_#123850]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#123850] bg-[#D69A3F] px-3 py-1 font-mono text-xs font-black text-[#123850]">
              ⚡ {estadisticasXP.xpGanado} / {estadisticasXP.xpTotalCurso} XP
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-1 font-mono text-xs font-black text-[#123850]">
              ✅ {estadisticasXP.nodosHechos}/{estadisticasXP.totalNodosVisibles} nodos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-3 py-1 font-mono text-xs font-black text-[#123850]">
              🔥 Racha: {progreso.rachaDias}d
            </span>
          </div>

          {/* Exportar / Importar JSON del temario + Restablecer */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playPop();
                descargarCursoComoJSON(curso);
                mostrarAviso("⬇ Archivo aula-temario-sketchbook.json descargado.");
              }}
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-[11px] font-black text-[#123850] hover:bg-[#FAF6EC]"
            >
              ⬇ Exportar JSON
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                inputImportarRef.current?.click();
              }}
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-1 font-mono text-[11px] font-black text-[#123850] hover:bg-[#FAF6EC]"
            >
              ⬆ Importar JSON
            </button>
            <input
              ref={inputImportarRef}
              type="file"
              accept=".json,application/json"
              onChange={manejarImportacionArchivo}
              className="hidden"
            />

            <button
              type="button"
              onClick={restablecerDatos}
              title="Restablecer temario y progreso de fábrica"
              className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FAF6EC] px-2.5 py-1 font-mono text-[11px] font-black text-[#123850]"
            >
              ↺ Fábrica
            </button>
          </div>
        </div>

        {/* Barra maestra de progreso global del curso */}
        <div className="mt-3">
          <div className="mb-1 flex justify-between font-mono text-[11px] font-black text-[#123850]/80">
            <span>Avance global sincronizado (nodos + proyectos)</span>
            <span>{estadisticasXP.porcentaje}%</span>
          </div>
          <div
            className="h-4 w-full overflow-hidden rounded-full border-2 border-[#123850] bg-[#FEFEFA] p-0.5"
            role="progressbar"
            aria-valuenow={estadisticasXP.porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de avance global del curso"
          >
            <div
              className="h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
              style={{
                width: `${estadisticasXP.porcentaje}%`,
                background:
                  "repeating-linear-gradient(-55deg, #123850, #123850 5px, #2b5470 5px, #2b5470 8px)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Pestañas principales del Aula */}
      <nav
        aria-label="Secciones del Aula Interactiva"
        className="mb-6 flex flex-wrap gap-2.5"
      >
        {(
          [
            { id: "mapa", icono: "🗺️", texto: "Mapa de Nodos" },
            { id: "calendario", icono: "📅", texto: "Calendario y Tiempos" },
            { id: "carpetas", icono: "📂", texto: "Fuentes y Proyectos" },
          ] as { id: PestanaAula; icono: string; texto: string }[]
        ).map((tab) => {
          const activa = pestanaActiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playPop();
                setPestanaActiva(tab.id);
              }}
              aria-pressed={activa}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border-[2.5px] border-[#123850] px-4 py-2 font-mono text-xs font-black transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none sm:text-sm ${
                activa
                  ? "bg-[#D69A3F] text-[#123850] shadow-[3px_3px_0px_#123850]"
                  : "bg-[#FEFEFA] text-[#123850] shadow-[3px_3px_0px_#123850]"
              }`}
            >
              <span aria-hidden="true">{tab.icono}</span>
              <span>{tab.texto}</span>
            </button>
          );
        })}
      </nav>

      {/* Contenido de la pestaña seleccionada */}
      {pestanaActiva === "mapa" && (
        <MapaNodos
          nodos={curso.nodos}
          carpetas={curso.carpetas}
          proyectos={curso.proyectos}
          progreso={progreso}
          hoyISO={hoyISO}
          modoEdicionDocente={modoEdicionDocente}
          nodoSeleccionadoId={nodoSeleccionadoId}
          onSeleccionarNodo={setNodoSeleccionadoId}
          onAlternarPasoChecklist={alternarPasoChecklist}
          onResponderQuiz={registrarQuizCorrecto}
          onAlternarCompletadoNodo={alternarCompletadoNodo}
          onIrACarpeta={(cId) => {
            setCarpetaActivaId(cId);
            setProyectoDestacadoId(null);
            setPestanaActiva("carpetas");
          }}
          onIrAProyecto={(pId) => {
            setCarpetaActivaId(null);
            setProyectoDestacadoId(pId);
            setPestanaActiva("carpetas");
          }}
          onGuardarNodoDocente={guardarNodoDocente}
          onEliminarNodoDocente={eliminarNodoDocente}
          onMoverNodoDocente={moverNodoDocente}
        />
      )}

      {pestanaActiva === "calendario" && (
        <CalendarioTemario
          nodos={curso.nodos}
          proyectos={curso.proyectos}
          progreso={progreso}
          hoyISO={hoyISO}
          modoEdicionDocente={modoEdicionDocente}
          onIrANodo={(nId) => {
            setNodoSeleccionadoId(nId);
            setPestanaActiva("mapa");
          }}
          onIrAProyecto={(pId) => {
            setCarpetaActivaId(null);
            setProyectoDestacadoId(pId);
            setPestanaActiva("carpetas");
          }}
          onActualizarFechasNodoDocente={actualizarFechasNodoDocente}
          onActualizarFechasProyectoDocente={actualizarFechasProyectoDocente}
        />
      )}

      {pestanaActiva === "carpetas" && (
        <CarpetasProyectos
          carpetas={curso.carpetas}
          proyectos={curso.proyectos}
          nodos={curso.nodos}
          progreso={progreso}
          hoyISO={hoyISO}
          modoEdicionDocente={modoEdicionDocente}
          carpetaActivaId={carpetaActivaId}
          proyectoDestacadoId={proyectoDestacadoId}
          onSeleccionarCarpeta={setCarpetaActivaId}
          onAlternarRecursoRevisado={alternarRecursoRevisado}
          onAlternarEntregableProyecto={alternarEntregableProyecto}
          onIrANodo={(nId) => {
            setNodoSeleccionadoId(nId);
            setPestanaActiva("mapa");
          }}
          onCrearCarpetaDocente={crearCarpetaDocente}
          onEliminarCarpetaDocente={eliminarCarpetaDocente}
          onAlternarVinculoCarpetaNodoDocente={alternarVinculoCarpetaNodoDocente}
          onAgregarRecursoDocente={agregarRecursoDocente}
          onEliminarRecursoDocente={eliminarRecursoDocente}
          onGuardarProyectoDocente={guardarProyectoDocente}
          onEliminarProyectoDocente={eliminarProyectoDocente}
        />
      )}
    </section>
  );
}
