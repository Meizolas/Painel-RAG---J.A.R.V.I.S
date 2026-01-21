"use client";

import React, { useEffect, useMemo, useRef } from "react";

type JarvisOrbProps = {
  size?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  speaking?: boolean; // quando estiver "digitando"
  particles?: number;
  intensity?: number; // 0..1
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function JarvisOrb({
  size = 280,
  className = "",
  label = "",
  sublabel,
  speaking = false,
  particles = 42,
  intensity = 0.55,
}: JarvisOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const config = useMemo(() => {
    return {
      particles: clamp(particles, 12, 140),
      intensity: clamp(intensity, 0, 1),
    };
  }, [particles, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const w = size;
    const h = size;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.36;

    // Partículas orbitando
    const pts = Array.from({ length: config.particles }).map((_, i) => {
      const ring = i % 3; // 3 “cintas”
      const baseR = R * (0.85 + ring * 0.15);
      const a = Math.random() * Math.PI * 2;
      const sp = 0.003 + Math.random() * 0.006 + ring * 0.0015;
      const phase = Math.random();
      return { baseR, a, sp, phase, ring };
    });

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += speaking ? 0.028 : 0.018;

      ctx.clearRect(0, 0, w, h);

      // glow radial (SEM quadrado, só circular)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.55);
      g.addColorStop(0, `rgba(34,211,238,${0.12 + config.intensity * 0.18})`);
      g.addColorStop(0.55, `rgba(168,85,247,${0.05 + config.intensity * 0.10})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // anéis finos
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(34,211,238,0.12)";
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // crosshair
      ctx.strokeStyle = "rgba(34,211,238,0.10)";
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();

      // sweep beam
      const ang = t % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);

      const sweep = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.25);
      sweep.addColorStop(0, "rgba(34,211,238,0)");
      sweep.addColorStop(0.65, `rgba(34,211,238,${0.10 + config.intensity * 0.18})`);
      sweep.addColorStop(1, "rgba(34,211,238,0)");

      ctx.fillStyle = sweep;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R * 1.25, -0.22, 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // partículas
      for (const p of pts) {
        p.a += p.sp * (speaking ? 1.6 : 1.0);

        const wobble = Math.sin(t * 2 + p.phase * 10) * (1.5 + p.ring);
        const rr = p.baseR + wobble;

        const x = cx + Math.cos(p.a) * rr;
        const y = cy + Math.sin(p.a) * rr;

        // brilho quando o feixe passa perto
        const diff = Math.abs(((p.a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const beamHit = Math.max(0, 1 - diff / 0.38);

        const alpha = 0.10 + beamHit * (0.55 + config.intensity * 0.35);
        const rad = 1.2 + beamHit * 2.0 + (speaking ? 0.7 : 0.0);

        ctx.fillStyle = `rgba(34,211,238,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // núcleo (pulsante)
      const pulse = 0.9 + Math.sin(t * (speaking ? 3.2 : 2.4)) * 0.08;
      const coreR = R * 0.13 * pulse;

      const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.2);
      coreG.addColorStop(0, "rgba(255,255,255,0.80)");
      coreG.addColorStop(0.25, "rgba(34,211,238,0.55)");
      coreG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(34,211,238,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // borda externa suave
      ctx.strokeStyle = "rgba(34,211,238,0.18)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, speaking, config]);

  return (
    <div className={`jarvis-orb ${className}`}>
      <canvas ref={canvasRef} className="jarvis-orb-canvas" />
      <div className="jarvis-orb-labels">
        <div className="jarvis-orb-label">{label}</div>
        {sublabel ? <div className="jarvis-orb-sublabel">{sublabel}</div> : null}
      </div>
    </div>
  );
}
