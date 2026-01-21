"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import JarvisOrb from "@/components/JarvisOrb";

type Source = { title: string; section?: string; snippet?: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  ts: number;
};

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeArraySources(x: any): Source[] {
  return Array.isArray(x) ? x : [];
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[] | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const hasChat = messages.length > 0;

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (lastAssistant?.sources?.length) setActiveSources(lastAssistant.sources);
  }, [lastAssistant]);

  function formatTime(ts: number) {
    if (!mounted) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  async function streamAssistantText(fullText: string, sources?: Source[]) {
    const id = uid();
    const startTs = Date.now();

    setMessages((m) => [
      ...m,
      { id, role: "assistant", content: "", ts: startTs, sources },
    ]);

    for (let i = 1; i <= fullText.length; i++) {
      const chunk = fullText.slice(0, i);

      setMessages((m) =>
        m.map((msg) => (msg.id === id ? { ...msg, content: chunk } : msg))
      );

      const delay = fullText.length > 900 ? 2 : fullText.length > 400 ? 5 : 9;
      await new Promise((r) => setTimeout(r, delay));
    }

    if (sources?.length) setActiveSources(sources);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      ts: Date.now(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise((r) => setTimeout(r, 160));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: uid(),
          user: { id: "demo", role: "internal" },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        await streamAssistantText(
          (data as any)?.error ??
            "Tive um problema ao consultar o servidor. Verifique o workflow no n8n.",
          []
        );
        setActiveSources([]);
        setTyping(false);
        return;
      }

      const answer = (data as any)?.answer ?? "Sem resposta.";
      const sources = safeArraySources((data as any)?.sources);

      await streamAssistantText(answer, sources);
      setActiveSources(sources);
      setTyping(false);
    } catch {
      await streamAssistantText(
        "Falha de rede ao chamar o servidor. Verifique a rota /api/chat e o webhook do n8n.",
        []
      );
      setActiveSources([]);
      setTyping(false);
    }
  }

  return (
    <main className="jarvis-root">
      {/* Background (grid + glow + scanline) */}
      <div className="jarvis-bg" aria-hidden="true">
        <div className="jarvis-bg__glowTop" />
        <div className="jarvis-bg__glowBottom" />
        <div className="jarvis-bg__grid" />
        <div className="jarvis-bg__scan" />
      </div>

      {/* Shell central (não fica gigante) */}
      <div className="jarvis-shell">
        {/* Top bar */}
        <header className="jarvis-topbar">
          <div className="jarvis-brand">
            <div className="jarvis-badge">
              <span className="jarvis-badgeDot" />
            </div>
            <div className="jarvis-brandText">
              <div className="jarvis-title">
                <span className="jarvis-titleGrad">J.A.R.V.I.S</span>
                <span className="jarvis-sub">N8N + Cursor • RAG</span>
              </div>
            </div>
          </div>

          <div className="jarvis-actions">
            <span className="jarvis-pill jarvis-pill--online">ONLINE</span>
            <button
              className="jarvis-pill jarvis-pill--btn"
              onClick={() => {
                setMessages([]);
                setActiveSources(null);
                setInput("");
              }}
            >
              Reset
            </button>
          </div>
        </header>

        {/* Card principal */}
        <section className="jarvis-card">
          {/* Estado vazio */}
          {!hasChat ? (
            <div className="jarvis-empty">
              {/* Orb central (sem “moldura” aqui — quem manda é o JarvisOrb CSS/props) */}
              <div className="jarvis-emptyOrb">
                <JarvisOrb
                  size={320}
                  label="J.A.R.V.I.S"
                  speaking={typing}
                />
              </div>

              <div className="jarvis-emptyMeta">
                <div className="jarvis-kicker">ARTIFICIAL INTELLIGENCE</div>
                <p className="jarvis-p">
                  Envie uma pergunta para eu consultar sua base de conhecimento
                  (RAG) e responder com fontes.
                </p>

                <div className="jarvis-suggestions">
                  {[
                    "Quais serviços a empresa oferece?",
                    "Como faço onboarding de cliente?",
                    "Qual o procedimento para emitir nota?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="jarvis-chip"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header do chat */}
              <div className="jarvis-chatHeader">
                <div className="jarvis-chatHeaderLeft">
                  <JarvisOrb size={44} className="jarvis-chatOrb" />
                  <div>
                    <div className="jarvis-chatTitle">JARVIS Console</div>
                    <div className="jarvis-chatHint">
                      Resposta RAG • Sempre com fontes quando possível
                    </div>
                  </div>
                </div>

                <div className="jarvis-chatHeaderRight">
                  <span className="jarvis-pill jarvis-pill--soft">
                    Fontes:{" "}
                    <b className="jarvis-accent">{activeSources?.length ?? 0}</b>
                  </span>
                </div>
              </div>

              {/* Mensagens */}
              <div className="jarvis-chatBody">
                {messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    msg={m}
                    time={formatTime(m.ts)}
                    onShowSources={() =>
                      setActiveSources(m.sources?.length ? m.sources : [])
                    }
                  />
                ))}

                {typing && (
                  <div className="jarvis-row">
                    <JarvisOrb size={40} className="jarvis-rowAvatar" />
                    <div className="jarvis-bubble jarvis-bubble--ai">
                      <div className="jarvis-processing">
                        <span>Processando</span>
                        <span className="jarvis-dots" aria-hidden="true" />
                      </div>
                      <div className="jarvis-processingSub">
                        Consultando o RAG...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Fontes */}
              <div className="jarvis-sources">
                <div className="jarvis-sourcesHead">
                  <span>Fontes</span>
                  <span className="jarvis-muted">
                    {activeSources?.length ?? 0}
                  </span>
                </div>

                {!activeSources?.length ? (
                  <div className="jarvis-muted">Nenhuma fonte nesta resposta.</div>
                ) : (
                  <div className="jarvis-sourcesGrid">
                    {activeSources.map((s, idx) => (
                      <div key={idx} className="jarvis-sourceCard">
                        <div className="jarvis-sourceTitle">{s.title}</div>
                        {s.section ? (
                          <div className="jarvis-sourceSection">{s.section}</div>
                        ) : null}
                        {s.snippet ? (
                          <div className="jarvis-sourceSnippet">{s.snippet}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Input fixo */}
          <div className="jarvis-inputBar">
            <div className="jarvis-inputRow">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Digite sua pergunta… (Enter envia • Shift+Enter quebra linha)"
                className="jarvis-textarea"
                rows={2}
              />

              <button
                onClick={sendMessage}
                disabled={typing || !input.trim()}
                className="jarvis-send"
              >
                Enviar
              </button>
            </div>

            <div className="jarvis-footnote">
              Dica: pergunte “como faço X?” ou “qual o procedimento Y?”.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MessageRow({
  msg,
  time,
  onShowSources,
}: {
  msg: Message;
  time: string;
  onShowSources: () => void;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={`jarvis-row ${isUser ? "jarvis-row--user" : ""}`}>
      {!isUser && (
        <div className="jarvis-avatarStack">
          <JarvisOrb size={40} className="jarvis-rowAvatar" />
          <div className="jarvis-avatarLabel">J.A.R.V.I.S</div>
        </div>
      )}

      <div className={`jarvis-col ${isUser ? "jarvis-col--user" : ""}`}>
        <div
          className={`jarvis-bubble ${
            isUser ? "jarvis-bubble--user" : "jarvis-bubble--ai"
          }`}
        >
          <p className="jarvis-text">{msg.content}</p>

          {!isUser && msg.sources?.length ? (
            <button className="jarvis-sourcesBtn" onClick={onShowSources}>
              <span className="jarvis-sourcesDot" />
              Ver fontes ({msg.sources.length})
            </button>
          ) : null}
        </div>

        {time ? <div className="jarvis-time">{time}</div> : null}
      </div>

      {isUser && (
        <div className="jarvis-userAvatar" aria-hidden="true">
          Eu
        </div>
      )}
    </div>
  );
}

