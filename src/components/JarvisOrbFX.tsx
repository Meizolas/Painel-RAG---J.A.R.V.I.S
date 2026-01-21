"use client";

import React from "react";

type JarvisOrbFXProps = {
  /** tamanho do orb em px */
  size?: number;
  /** quando true, intensifica o pulso (ex: quando está “digitando”) */
  speaking?: boolean;

  /** usa microfone (permite pulso real pela voz/ambiente) */
  micReactive?: boolean;

  /** se micReactive=false, usa um pulso “simulado” (bom pra quando a IA responde) */
  syntheticReactive?: boolean;

  /** quantidade de partículas orbitando */
  particles?: number;

  /** callback pra você saber o nível (0..1) se quiser usar em outros efeitos */
  onLevel?: (level01: number) => void;

  className?: string;
};

/**
 * JarvisOrbFX: canvas de particulas + (opcional) audio-react (mic ou simulado)
 * - Renderiza UM <canvas> do mesmo tamanho do orb
 * - Atualiza via requestAnimationFrame
 */
export default function JarvisOrbFX({
  size = 280,
  speaking = false,
  micReactive = false,
  syntheticReactive = true,
  particles = 26,
  onLevel,
  className = "",
}: JarvisOrbFXProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // nível 0..1 (energia do áudio)
  const levelRef = React.useRef(0);

  // WebAudio refs
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);

  // partículas (pré-geradas)
  const particlesRef = React.useRef(
    Array.from({ length: particles }).map(() => ({
      // raio de órbita (0..1), ângulo, velocidade, tamanho
      r: 0.25 + Math.random() * 0.28,
      a: Math.random() * Math.PI * 2,
      v: 0.003 + Math.random() * 0.008,
      s: 0.7 + Math.random() * 1.9,
      o: 0.25 + Math.random() * 0.65, // opacidade
      wob: Math.random() * Math.PI * 2, // “tremor”
    }))
  );

  // se o usuário mudar o número de partículas dinamicamente
  React.useEffect(() => {
    particlesRef.current = Array.from({ length: particles }).map(() => ({
      r: 0.25 + Math.random() * 0.28,
      a: Math.random() * Math.PI * 2,
      v: 0.003 + Math.random() * 0.008,
      s: 0.7 + Math.random() * 1.9,
      o: 0.25 + Math.random() * 0.65,
      wob: Math.random() * Math.PI * 2,
    }));
  }, [particles]);

  // Inicializa microfone (opcional)
  React.useEffect(() => {
    if (!micReactive) return;

    let cancelled = false;

    async function initMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;

        micStreamRef.current = stream;

        const Ctx = (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;
        analyserRef.current = analyser;

        const src = ctx.createMediaStreamSource(stream);
        sourceRef.current = src;
        src.connect(analyser);
      } catch (e) {
        console.warn("MicReactive: sem permissão ou indisponível.", e);
      }
    }

    initMic();

    return () => {
      cancelled = true;
      // cleanup
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
      } catch {}
      try {
        micStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
      sourceRef.current = null;
      analyserRef.current = null;
      micStreamRef.current = null;
      audioCtxRef.current = null;
    };
  }, [micReactive]);

  // Loop principal: desenha e atualiza nível
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let t = 0;

    const cx = size / 2;
    const cy = size / 2;

    // buffer para ler o analyser
    const analyser = analyserRef.current;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    function readAudioLevel() {
      // Mic
      if (micReactive && analyserRef.current && data) {
        analyserRef.current.getByteFrequencyData(data);
        // média simples (0..255)
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        // normaliza 0..1 (ajuste conforme preferir)
        const l = Math.min(1, Math.max(0, (avg - 10) / 140));
        return l;
      }

      // Simulado (sem mic): pulso quando speaking=true
      if (syntheticReactive) {
        if (!speaking) return 0;
        // seno + ruído leve
        const base = 0.35 + 0.25 * Math.sin(t * 2.2);
        const jitter = (Math.random() - 0.5) * 0.12;
        return Math.max(0, Math.min(1, base + jitter));
      }

      return 0;
    }

    function draw() {
      t += 0.016;

      // atualiza nível com suavização
      const target = readAudioLevel();
      levelRef.current = levelRef.current * 0.86 + target * 0.14;

      onLevel?.(levelRef.current);

      // limpa
      ctx.clearRect(0, 0, size, size);

      // desenha partículas orbitando
      const p = particlesRef.current;
      const level = levelRef.current;

      // brilho global conforme nível
      const glow = 0.10 + level * 0.35;

      // “anel” sutil
      ctx.strokeStyle = `rgba(34,211,238,${0.12 + level * 0.18})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      // partículas
      for (let i = 0; i < p.length; i++) {
        const it = p[i];
        it.a += it.v * (1 + level * 1.6);
        it.wob += 0.02;

        const rr = size * it.r * (1 + level * 0.15 * Math.sin(it.wob));
        const x = cx + Math.cos(it.a) * rr;
        const y = cy + Math.sin(it.a) * rr;

        // tamanho e alpha reativos
        const r = it.s + level * 1.8;
        const a = (it.o * 0.55 + glow) * 0.9;

        // bolinha
        ctx.fillStyle = `rgba(34,211,238,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // rastro curto
        ctx.strokeStyle = `rgba(168,85,247,${a * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          cx + Math.cos(it.a - 0.12) * (rr - 2),
          cy + Math.sin(it.a - 0.12) * (rr - 2)
        );
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, speaking, micReactive, syntheticReactive, onLevel]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
