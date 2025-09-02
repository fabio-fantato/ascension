import React, { useEffect, useMemo, useRef, useState } from "react";
import { UndoIcon, NewRoundIcon, ClearIcon } from "./icons";

/**
 * Ascension Tracker – Mobile/PWA-first
 * - Cabeçalho simples com ações essenciais
 * - Cada recurso tem 2 totalizadores (TOTAL e FALTA) como badges com ícone de fundo
 * - Duas fileiras de botões grandes: GANHEI (adiciona ao total) e GASTEI (adiciona ao usado)
 * - Botões com altura grande e espaçamento “tap-friendly”
 * - Barra fixa inferior com ações globais (Desfazer / Nova rodada / Limpar)
 * - Persistência localStorage
 * - Histórico compacto com rolagem natural
 */

const LS_KEY = "ascension:tracker:v7";
const ASSET = (p: string) => import.meta.env.BASE_URL + p;

type HistoryItem = { res: 1 | 2; kind: "gain" | "spend"; delta: number; note?: string; ts: number };
type TrackerState = {
  res1Name: string;
  res2Name: string;
  res1Total: number;
  res2Total: number;
  res1Used: number;
  res2Used: number;
  presetsGain: number[];
  presetsSpend: number[];
  history: HistoryItem[];
};

const DEFAULT_STATE: TrackerState = {
  res1Name: "Runas",
  res2Name: "Poder",
  res1Total: 0,
  res2Total: 0,
  res1Used: 0,
  res2Used: 0,
  presetsGain: [1, 2, 3, 4, 5],
  presetsSpend: [1, 2, 3],
  history: [],
};

/** Badge com imagem de fundo e valor em destaque (tamanhos pensados pro celular) */
function TotalBadge({
  bgSrc,
  value,
  alt,
  size = 84, // ideal p/ smartphone; pode subir pra 100 no tablet
}: {
  bgSrc: string;
  value: number;
  alt: string;
  size?: number;
}) {
  return (
    <div
      aria-label={alt}
      className="relative select-none"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${bgSrc})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "contain",
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,.45))",
      }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold text-white"
        style={{
          fontSize: Math.max(22, Math.round(size * 0.38)),
          textShadow: "0 2px 6px rgba(0,0,0,.75)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Barra de progresso sucinta (boa leitura no celular) */
function Progress({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, rgba(99,102,241,1), rgba(251,191,36,1))",
        }}
      />
    </div>
  );
}

/** Botão grande amigável ao polegar */
function TapBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex items-center justify-center gap-2 flex-1 min-w-[68px] h-12 rounded-2xl text-base font-semibold shadow-sm
                 border border-white/10 bg-white/10 backdrop-blur
                 active:scale-[.98] transition"
    >
      {children}
    </button>
  );
}

export default function App() {
  const [st, setSt] = useState<TrackerState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) } as TrackerState;
    } catch {}
    return DEFAULT_STATE;
  });

  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(st)), [st]);

  const left1 = useMemo(() => Math.max(0, st.res1Total - st.res1Used), [st.res1Total, st.res1Used]);
  const left2 = useMemo(() => Math.max(0, st.res2Total - st.res2Used), [st.res2Total, st.res2Used]);

  function gain(res: 1 | 2, delta: number, note?: string) {
    setSt((prev) => {
      const totalKey = res === 1 ? "res1Total" : "res2Total";
      return {
        ...prev,
        [totalKey]: Math.max(0, (prev as any)[totalKey] + delta),
        history: [...prev.history, { res, kind: "gain", delta, note, ts: Date.now() }],
      };
    });
  }

  function spend(res: 1 | 2, delta: number, note?: string) {
    setSt((prev) => {
      const usedKey = res === 1 ? "res1Used" : "res2Used";
      const totalKey = res === 1 ? "res1Total" : "res2Total";
      const capped = Math.max(0, Math.min((prev as any)[totalKey], (prev as any)[usedKey] + delta));
      return {
        ...prev,
        [usedKey]: capped,
        history: [...prev.history, { res, kind: "spend", delta, note, ts: Date.now() }],
      };
    });
  }

  function rename(res: 1 | 2, name: string) {
    setSt((prev) => ({ ...prev, [res === 1 ? "res1Name" : "res2Name"]: name }));
  }

  function undo() {
    setSt((prev) => {
      const history = [...prev.history];
      const last = history.pop();
      if (!last) return prev;
      if (last.kind === "gain") {
        const totalKey = last.res === 1 ? "res1Total" : "res2Total";
        return { ...prev, [totalKey]: Math.max(0, (prev as any)[totalKey] - last.delta), history };
      } else {
        const usedKey = last.res === 1 ? "res1Used" : "res2Used";
        return { ...prev, [usedKey]: Math.max(0, (prev as any)[usedKey] - last.delta), history };
      }
    });
  }

  function resetRound() {
    setSt((prev) => ({ ...prev, res1Used: 0, res2Used: 0, history: [] }));
  }

  function clearAll() {
    setSt(DEFAULT_STATE);
  }

  function setPresets(which: "gain" | "spend", text: string) {
    const numbers = text
      .split(/[,\s]+/)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n))
      .slice(0, 10);
    if (!numbers.length) return;
    if (which === "gain") setSt((p) => ({ ...p, presetsGain: numbers }));
    else setSt((p) => ({ ...p, presetsSpend: numbers }));
  }

  /** Card do recurso — simplificado e “tap-friendly” */
  function ResourceCard({ idx, icon }: { idx: 1 | 2; icon: string }) {
    const is1 = idx === 1;
    const name = is1 ? st.res1Name : st.res2Name;
    const total = is1 ? st.res1Total : st.res2Total;
    const used = is1 ? st.res1Used : st.res2Used;
    const left = Math.max(0, total - used);

    const amtRef = useRef<HTMLInputElement | null>(null);
    const noteRef = useRef<HTMLInputElement | null>(null);

    return (
      <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-3 sm:p-4 flex flex-col gap-3 shadow-xl">
        {/* Cabeçalho: TOTAL (esq) e FALTA (dir) */}
        <div className="flex items-center gap-3">
          <TotalBadge bgSrc={icon} value={total} alt={`${name} total`} size={84} />
          <input
            value={name}
            onChange={(e) => rename(idx, e.target.value)}
            className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-white/30 rounded px-1"
          />
          <TotalBadge bgSrc={icon} value={left} alt={`${name} restante`} size={72} />
        </div>

        <Progress used={used} total={total} />

        {/* GANHEI – botões altos e largos, 3 por linha em telas pequenas */}
        <div>
          <div className="text-xs text-white/70 mb-1">Ganhei</div>
          <div className="grid grid-cols-3 gap-2">
            {st.presetsGain.map((n, i) => (
              <TapBtn key={i} onClick={() => gain(idx, n)} title={`Ganhei ${n}`}>
                +{n}
              </TapBtn>
            ))}
            <TapBtn
              title="Zerar total"
              onClick={() => {
                const totalKey = idx === 1 ? "res1Total" : "res2Total";
                setSt((p) => ({ ...p, [totalKey]: 0 } as TrackerState));
              }}
            >
              Zerar
            </TapBtn>
          </div>
        </div>

        {/* GASTEI – igual ao GANHEI */}
        <div>
          <div className="text-xs text-white/70 mb-1">Gastei</div>
          <div className="grid grid-cols-3 gap-2">
            {st.presetsSpend.map((n, i) => (
              <TapBtn key={i} onClick={() => spend(idx, n)} title={`Gastei ${n}`}>
                +{n}
              </TapBtn>
            ))}
            <TapBtn onClick={() => spend(idx, Math.max(0, left))}>Tudo</TapBtn>
          </div>
        </div>

        {/* Entrada livre + nota para “Gastei” (inputs grandes) */}
        <div className="flex items-center gap-2">
          <input
            ref={amtRef}
            type="number"
            inputMode="numeric"
            placeholder="Qtd"
            className="w-24 h-12 px-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/30"
          />
          <input
            ref={noteRef}
            type="text"
            placeholder="Nota (ex.: Derrotei X)"
            className="flex-1 h-12 px-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/30"
          />
          <TapBtn
            onClick={() => {
              const amt = Math.floor(Number(amtRef.current?.value || 0));
              if (!amt) return;
              const note = noteRef.current?.value || undefined;
              spend(idx, amt, note);
              if (amtRef.current) amtRef.current.value = "";
              if (noteRef.current) noteRef.current.value = "";
            }}
          >
            Add
          </TapBtn>
        </div>

        {/* Ajuste de presets (compacto) */}
        <div className="grid grid-cols-2 gap-2 text-[12px] text-white/70">
          <label className="flex items-center gap-2">
            Presets +Ganhei
            <input
              defaultValue={st.presetsGain.join(",")}
              onBlur={(e) => setPresets("gain", e.target.value)}
              className="flex-1 px-2 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/30 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            Presets +Gastei
            <input
              defaultValue={st.presetsSpend.join(",")}
              onBlur={(e) => setPresets("spend", e.target.value)}
              className="flex-1 px-2 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/30 text-white"
            />
          </label>
        </div>
      </section>
    );
  }

  return (
    <div
      className="min-h-screen text-white safe-area"
      style={{
        background:
          "radial-gradient(1200px 800px at 10% -10%, rgba(99,102,241,.35), transparent), radial-gradient(1000px 700px at 110% 10%, rgba(251,191,36,.25), transparent), linear-gradient(180deg, #0b1020 0%, #131a2e 100%)",
      }}
    >
      {/* topo compacto */}
      <header className="px-3 pt-3 pb-2 flex items-center gap-2">
        <h1 className="text-xl font-extrabold tracking-tight">Ascension</h1>
        <span className="text-xs text-white/70">Tracker</span>
      </header>

      <main className="px-3 pb-24 grid gap-3 max-w-[720px] mx-auto">
        {/* Cards dos recursos (uma coluna no mobile; duas a partir de md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ResourceCard idx={1} icon={ASSET("icons/runa_clean.png")} />
        <ResourceCard idx={2} icon={ASSET("icons/poder_clean.png")} />
        </div>

        {/* Histórico resumido */}
        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-3">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold text-sm">Histórico</h2>
            <span className="text-xs text-white/60">(mais recente primeiro)</span>
          </div>
          {st.history.length === 0 ? (
            <div className="text-sm text-white/70">Sem ações ainda.</div>
          ) : (
            <ul className="space-y-1">
              {[...st.history].reverse().slice(0, 12).map((h, i) => (
                <li
                  key={i}
                  className="text-sm flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                >
                  <span>
                    <b>{h.kind === "gain" ? "Ganhei" : "Gastei"}</b>{" "}
                    {Math.abs(h.delta)} {h.res === 1 ? st.res1Name : st.res2Name}
                    {h.note ? <span className="text-white/70"> — {h.note}</span> : null}
                  </span>
                  <span className="text-[11px] text-white/60">
                    {new Date(h.ts).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* barra fixa inferior: ações globais prontas pro polegar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-black/30 backdrop-blur
                   border-t border-white/10 px-3 py-2"
      >
        <div className="max-w-[720px] mx-auto grid grid-cols-3 gap-2">
          <TapBtn onClick={undo} title="Desfazer última ação">
            <UndoIcon className="w-5 h-5" />
            <span>Desfazer</span>
          </TapBtn>
          <TapBtn onClick={resetRound} title="Zerar gastos da rodada">
            <NewRoundIcon className="w-5 h-5" />
            <span>Nova</span>
          </TapBtn>
          <TapBtn onClick={clearAll} title="Voltar ao padrão">
            <ClearIcon className="w-5 h-5" />
            <span>Limpar</span>
          </TapBtn>
        </div>
      </nav>
    </div>
  );
}
