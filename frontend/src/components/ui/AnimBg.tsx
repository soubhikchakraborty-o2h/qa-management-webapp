import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function AnimBg() {
  const { isDark } = useTheme();
  const ref = useRef<HTMLCanvasElement>(null);
  const isDarkRef = useRef(isDark);

  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, W: number, H: number;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const orbs = [
      { x: 0.15, y: 0.2,  r: 520, color: '124,106,247', a: 0.06, vx: 0.06,  vy: 0.04  },
      { x: 0.8,  y: 0.75, r: 480, color: '124,106,247', a: 0.05, vx: -0.05, vy: -0.05 },
      { x: 0.5,  y: 0.5,  r: 400, color: '124,106,247', a: 0.04, vx: 0.03,  vy: -0.04 },
      { x: 0.9,  y: 0.1,  r: 380, color: '96,165,250',  a: 0.04, vx: -0.04, vy: 0.05  },
      { x: 0.1,  y: 0.85, r: 350, color: '96,165,250',  a: 0.035,vx: 0.05,  vy: -0.03 },
      { x: 0.6,  y: 0.3,  r: 300, color: '96,165,250',  a: 0.03, vx: -0.03, vy: 0.04  },
      { x: 0.3,  y: 0.6,  r: 320, color: '244,114,182', a: 0.03, vx: 0.04,  vy: 0.05  },
      { x: 0.75, y: 0.45, r: 280, color: '244,114,182', a: 0.025,vx: -0.05, vy: -0.04 },
    ].map(o => ({ ...o, cx: o.x * window.innerWidth, cy: o.y * window.innerHeight }));

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random(),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      opacity: 0.1 + Math.random() * 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const dark = isDarkRef.current;
      const orbMult = dark ? 1 : 0.35;

      ctx.fillStyle = dark ? '#050508' : '#f2f2f8';
      ctx.fillRect(0, 0, W, H);

      // Dot grid
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
      for (let x = 0; x < W; x += 32) {
        for (let y = 0; y < H; y += 32) {
          ctx.beginPath();
          ctx.arc(x, y, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Orbs
      orbs.forEach(o => {
        o.cx += o.vx; o.cy += o.vy;
        if (o.cx < -o.r) o.cx = W + o.r;
        if (o.cx > W + o.r) o.cx = -o.r;
        if (o.cy < -o.r) o.cy = H + o.r;
        if (o.cy > H + o.r) o.cy = -o.r;
        const g = ctx.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, o.r);
        g.addColorStop(0, `rgba(${o.color},${o.a * orbMult})`);
        g.addColorStop(0.5, `rgba(${o.color},${o.a * orbMult * 0.4})`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Particles
      particles.forEach(p => {
        p.x += p.vx / W;
        p.y += p.vy / H;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        ctx.fillStyle = dark
          ? `rgba(255,255,255,${p.opacity})`
          : `rgba(100,100,160,${p.opacity * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />;
}
