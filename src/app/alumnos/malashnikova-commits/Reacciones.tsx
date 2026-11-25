"use client";

import { useState } from "react";

interface Reaccion {
  id: string;
  emoji: string;
  etiqueta: string;
  votos: number;
}

const REACCIONES_INICIALES: Reaccion[] = [
  { id: "alien", emoji: "👽", etiqueta: "Out of this world", votos: 3 },
  { id: "fuego", emoji: "🔥", etiqueta: "Puro flow", votos: 5 },
  { id: "flor", emoji: "🌼", etiqueta: "Buena vibra", votos: 4 },
];

export function Reacciones() {
  const [reacciones, setReacciones] = useState<Reaccion[]>(REACCIONES_INICIALES);
  const [modoOscuro, setModoOscuro] = useState<boolean>(false);
  const [ultima, setUltima] = useState<string | null>(null);

  const sumar = (id: string) => {
    setReacciones((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, votos: item.votos + 1 } : item
      )
    );
    setUltima(id);
  };

  const total = reacciones.reduce((acc, r) => acc + r.votos, 0);

  return (
    <section
      className={`mt-10 rounded-2xl border-[3px] p-6 transition-colors ${
        modoOscuro
          ? "border-[#D69A3F] bg-[#123850] text-[#FEFEFA] shadow-[6px_6px_0px_#D69A3F]"
          : "border-[#123850] bg-[#FEFEFA] text-[#123850] shadow-[6px_6px_0px_#123850]"
      }`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            className={`inline-block -rotate-1 rounded-full border-2 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
              modoOscuro
                ? "border-[#FEFEFA] bg-[#D69A3F] text-[#123850]"
                : "border-[#123850] bg-[#D69A3F] text-[#FEFEFA]"
            }`}
          >
            ✦ Misión 4 · Reacciones
          </span>
          <h2 className="mt-1.5 text-xl font-black tracking-tight">
            Deja tu reacción en la libreta
          </h2>
        </div>

        {/* Toggle claro (Baby Powder) / oscuro (Gibraltar Sea) */}
        <button
          type="button"
          onClick={() => setModoOscuro((prev) => !prev)}
          className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0 ${
            modoOscuro
              ? "border-[#D69A3F] bg-[#FEFEFA] text-[#123850] shadow-[2px_2px_0px_#D69A3F]"
              : "border-[#123850] bg-[#123850] text-[#FEFEFA] shadow-[2px_2px_0px_#D69A3F]"
          }`}
        >
          {modoOscuro ? "☀️ Baby Powder" : "🌙 Gibraltar Sea"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {reacciones.map((item) => {
          const activa = ultima === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => sumar(item.id)}
              className={`group flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] ${
                modoOscuro
                  ? activa
                    ? "border-[#D69A3F] bg-[#D69A3F]/20 text-[#FEFEFA] shadow-[3px_3px_0px_#D69A3F]"
                    : "border-[#FEFEFA]/60 bg-[#123850] text-[#FEFEFA] shadow-[3px_3px_0px_#D69A3F]"
                  : activa
                    ? "border-[#123850] bg-[#D69A3F]/20 text-[#123850] shadow-[3px_3px_0px_#123850]"
                    : "border-[#123850] bg-[#FEFEFA] text-[#123850] shadow-[3px_3px_0px_#123850]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl transition-transform group-hover:scale-125">
                  {item.emoji}
                </span>
                <span className="text-xs font-extrabold">{item.etiqueta}</span>
              </div>
              <span
                className={`rounded-full border-2 px-2.5 py-0.5 font-mono text-xs font-black ${
                  modoOscuro
                    ? "border-[#FEFEFA] bg-[#D69A3F] text-[#123850]"
                    : "border-[#123850] bg-[#D69A3F] text-[#FEFEFA]"
                }`}
              >
                {item.votos}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className={`mt-4 text-right font-mono text-xs font-semibold ${
          modoOscuro ? "text-[#FEFEFA]/75" : "text-[#123850]/70"
        }`}
      >
        Total de clics: <span className="font-black text-[#D69A3F]">{total}</span>
      </p>
    </section>
  );
}
