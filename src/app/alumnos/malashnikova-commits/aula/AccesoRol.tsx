"use client";

import { useState } from "react";
import { playLevelUp, playPop, playToggle } from "../sonidos";
import { PIN_DOCENTE_INICIAL } from "./datosIniciales";
import type { ProgresoAlumno, RolUsuario } from "./types";

const AVATARES_SUGERIDOS = ["👽", "🦊", "🚀", "🎨", "🦉", "⚡", "🐱", "🌟"];

interface AccesoRolProps {
  rolActual: RolUsuario;
  docenteAutenticado: boolean;
  vistaPreviaAlumno: boolean;
  pinDocenteActual: string;
  progreso: ProgresoAlumno;
  abierto: boolean;
  onCerrar: () => void;
  onGuardarPerfilAlumno: (alias: string, avatar: string) => void;
  onAutenticarDocente: () => void;
  onCerrarSesionDocente: () => void;
  onAlternarVistaPrevia: () => void;
  onCambiarPinDocente: (nuevoPin: string) => void;
}

export function AccesoRol({
  rolActual,
  docenteAutenticado,
  vistaPreviaAlumno,
  pinDocenteActual,
  progreso,
  abierto,
  onCerrar,
  onGuardarPerfilAlumno,
  onAutenticarDocente,
  onCerrarSesionDocente,
  onAlternarVistaPrevia,
  onCambiarPinDocente,
}: AccesoRolProps) {
  const [pestana, setPestana] = useState<RolUsuario>(rolActual);
  const [aliasInput, setAliasInput] = useState(progreso.alias);
  const [avatarInput, setAvatarInput] = useState(progreso.avatar);
  const [pinInput, setPinInput] = useState("");
  const [nuevoPinInput, setNuevoPinInput] = useState("");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  if (!abierto) return null;

  const guardarAlumno = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = aliasInput.trim();
    if (limpio.length < 2) {
      setMensajeError("Escribe un nombre o alias de al menos 2 caracteres.");
      return;
    }
    playPop();
    onGuardarPerfilAlumno(limpio, avatarInput);
    setMensajeError(null);
    setMensajeExito("✓ Perfil de alumnado actualizado en tu libreta local.");
  };

  const ingresarDocente = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === pinDocenteActual) {
      playLevelUp(90);
      setPinInput("");
      setMensajeError(null);
      setMensajeExito("✓ Modo Edición Docente desbloqueado.");
      onAutenticarDocente();
    } else {
      playToggle(false);
      setMensajeExito(null);
      setMensajeError("PIN incorrecto. Verifica la clave docente de demostración.");
    }
  };

  const actualizarPin = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nuevoPinInput.trim();
    if (limpio.length < 4) {
      setMensajeError("El nuevo PIN debe tener al menos 4 caracteres.");
      return;
    }
    playPop();
    onCambiarPinDocente(limpio);
    setNuevoPinInput("");
    setMensajeError(null);
    setMensajeExito(`✓ Nuevo PIN docente guardado en esta libreta (${limpio}).`);
  };

  return (
    <div
      role="region"
      aria-label="Panel de acceso Alumnado y Profesorado"
      className="mb-6 rounded-2xl border-[2.5px] border-[#123850] bg-[#FAF6EC] p-5 shadow-[5px_5px_0px_#123850]"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-[#123850]/30 pb-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Seleccionar modo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "alumnado"}
            onClick={() => {
              playToggle(true);
              setPestana("alumnado");
              setMensajeError(null);
              setMensajeExito(null);
            }}
            className={`cursor-pointer rounded-full border-2 border-[#123850] px-3.5 py-1 font-mono text-xs font-black transition-transform active:translate-x-[2px] active:translate-y-[2px] motion-reduce:transition-none ${
              pestana === "alumnado"
                ? "bg-[#D69A3F] text-[#123850] shadow-[2px_2px_0px_#123850]"
                : "bg-[#FEFEFA] text-[#123850]"
            }`}
          >
            🎒 Alumnado (Comunidad)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={pestana === "docente"}
            onClick={() => {
              playToggle(true);
              setPestana("docente");
              setMensajeError(null);
              setMensajeExito(null);
            }}
            className={`cursor-pointer rounded-full border-2 border-[#123850] px-3.5 py-1 font-mono text-xs font-black transition-transform active:translate-x-[2px] active:translate-y-[2px] motion-reduce:transition-none ${
              pestana === "docente"
                ? "bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F]"
                : "bg-[#FEFEFA] text-[#123850]"
            }`}
          >
            🔑 Profesorado (Docentes)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            playPop();
            onCerrar();
          }}
          aria-label="Cerrar panel de acceso"
          className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#FEFEFA] px-3 py-0.5 font-mono text-xs font-black text-[#123850]"
        >
          Cerrar ✕
        </button>
      </div>

      {mensajeError && (
        <p
          role="alert"
          className="mb-3 rounded-xl border-2 border-[#123850] bg-[#D69A3F]/35 px-3.5 py-2 font-mono text-xs font-bold text-[#123850]"
        >
          ⚠ {mensajeError}
        </p>
      )}

      {mensajeExito && (
        <p
          role="status"
          className="mb-3 rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3.5 py-2 font-mono text-xs font-bold text-[#123850]"
        >
          {mensajeExito}
        </p>
      )}

      {pestana === "alumnado" ? (
        <form onSubmit={guardarAlumno} className="space-y-4">
          <p className="text-xs font-bold text-[#123850]/80">
            Personaliza tu alias y avatar para guardar tu progreso, racha y puntos XP en este
            navegador (modo lectura sobre la estructura del temario).
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="input-alias-alumno" className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Nombre o alias de comunidad
              </label>
              <input
                id="input-alias-alumno"
                type="text"
                maxLength={40}
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="Ej. Alan Camacho"
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3.5 py-2 text-sm font-bold text-[#123850]"
              />
            </div>

            <div>
              <span className="mb-1 block font-mono text-xs font-black text-[#123850]">Avatar</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Elegir emoji de avatar">
                {AVATARES_SUGERIDOS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      playPop();
                      setAvatarInput(em);
                    }}
                    aria-pressed={avatarInput === em}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#123850] text-lg ${
                      avatarInput === em ? "bg-[#D69A3F] shadow-[2px_2px_0px_#123850]" : "bg-[#FEFEFA]"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-2 font-mono text-xs font-black uppercase text-[#123850] shadow-[3px_3px_0px_#123850] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Guardar perfil ✦
            </button>
          </div>
        </form>
      ) : !docenteAutenticado ? (
        <form onSubmit={ingresarDocente} className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-[#123850]/50 bg-[#FEFEFA] p-3 text-xs font-bold text-[#123850]">
            📌 <span className="font-black">Acceso de demostración local:</span> el PIN inicial del
            profesorado es{" "}
            <code className="rounded border border-[#123850] bg-[#D69A3F]/30 px-1.5 py-0.5 font-mono font-black">
              {PIN_DOCENTE_INICIAL}
            </code>{" "}
            (si aún no lo has cambiado). Habilita crear/editar nodos, fechas, carpetas, proyectos y
            exportar el JSON del curso.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="input-pin-docente" className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Clave / PIN Docente
              </label>
              <input
                id="input-pin-docente"
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={PIN_DOCENTE_INICIAL}
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3.5 py-2 font-mono text-sm font-bold text-[#123850]"
              />
            </div>

            <button
              type="submit"
              className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#123850] px-5 py-2 font-mono text-xs font-black uppercase text-[#FEFEFA] shadow-[3px_3px_0px_#D69A3F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Desbloquear Panel Docente
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#123850] bg-[#FEFEFA] p-3.5">
            <div>
              <p className="text-sm font-black text-[#123850]">
                🎓 Sesión de Profesorado Activa
              </p>
              <p className="text-xs font-bold text-[#123850]/75">
                {vistaPreviaAlumno
                  ? "Estás previsualizando el aula exactamente como la ve el alumnado."
                  : "Modo Edición activo en Mapa de Nodos, Calendario, Carpetas y Proyectos."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playToggle(!vistaPreviaAlumno);
                  onAlternarVistaPrevia();
                }}
                aria-pressed={vistaPreviaAlumno}
                className={`cursor-pointer rounded-full border-2 border-[#123850] px-3.5 py-1.5 font-mono text-xs font-black shadow-[2px_2px_0px_#123850] ${
                  vistaPreviaAlumno ? "bg-[#D69A3F] text-[#123850]" : "bg-[#FEFEFA] text-[#123850]"
                }`}
              >
                {vistaPreviaAlumno ? "✏️ Volver a Editar" : "👁️ Previsualizar como Alumnado"}
              </button>

              <button
                type="button"
                onClick={() => {
                  playToggle(false);
                  onCerrarSesionDocente();
                }}
                className="cursor-pointer rounded-full border-2 border-[#123850] bg-[#123850] px-3.5 py-1.5 font-mono text-xs font-black text-[#FEFEFA]"
              >
                Cerrar sesión docente
              </button>
            </div>
          </div>

          <form onSubmit={actualizarPin} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="nuevo-pin-docente" className="mb-1 block font-mono text-xs font-black text-[#123850]">
                Cambiar PIN Docente (mín. 4 caracteres)
              </label>
              <input
                id="nuevo-pin-docente"
                type="text"
                maxLength={24}
                value={nuevoPinInput}
                onChange={(e) => setNuevoPinInput(e.target.value)}
                placeholder="Escribe nuevo PIN personalizado…"
                className="w-full rounded-xl border-2 border-[#123850] bg-[#FEFEFA] px-3.5 py-1.5 font-mono text-xs font-bold text-[#123850]"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-xl border-2 border-[#123850] bg-[#D69A3F] px-4 py-1.5 font-mono text-xs font-black text-[#123850] shadow-[2px_2px_0px_#123850]"
            >
              Actualizar PIN
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
