import React, { useEffect, useRef } from 'react';

interface Simplex2D {
  noise2D: (xin: number, yin: number) => number;
}

/**
 * Lightweight Seeded 2D Simplex Noise (Mulberry32 PRNG)
 * Matches the Driftwave Algorithmic Flow Field HTML reference.
 */
function createSimplexNoise(seed = 1407): Simplex2D {
  const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = Math.floor(rand() * 256);

  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  const grad3 = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
  ]);

  return {
    noise2D(xin: number, yin: number): number {
      let n0 = 0;
      let n1 = 0;
      let n2 = 0;

      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const X0 = i - t;
      const Y0 = j - t;
      const x0 = xin - X0;
      const y0 = yin - Y0;

      const i1 = x0 > y0 ? 1 : 0;
      const j1 = x0 > y0 ? 0 : 1;

      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1.0 + 2.0 * G2;
      const y2 = y0 - 1.0 + 2.0 * G2;

      const ii = i & 255;
      const jj = j & 255;

      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        t0 *= t0;
        const gi0 = permMod12[ii + perm[jj]] * 3;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
      }

      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        t1 *= t1;
        const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }

      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        t2 *= t2;
        const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }

      return 70.0 * (n0 + n1 + n2);
    },
  };
}

interface FlowParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  life: number;
  maxLife: number;
  speedMultiplier: number;
}

/**
 * Exact Driftwave 'Vortex' Preset Background Canvas
 * - Runs behind Hero & opening light-studio marquee zone only
 * - Stays crisp through Hero + initial Category row, then hides cleanly once the dark wheel section begins
 */
export default function HeroVortexField() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const simplex = createSimplexNoise(1407);

    // Exact Driftwave 'vortex' preset parameters from reference HTML
    const config = {
      density: 2200,
      speed: prefersReducedMotion ? 0.2 : 2.0,
      noiseScale: 0.0040,
      mouseRadius: 140,
      opacity: 0.35,
      strokeWidth: 1.1,
    };

    let logicalWidth = 0;
    let logicalHeight = 0;
    let timeOffset = 0;
    let rafId = 0;
    let isHeroVisible = true;
    let isScrollingOut = false;
    let dismissProgress = 0; // 0 = full vivid vortex, 1 = smoothly evaporated & hidden

    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
    };

    let particles: FlowParticle[] = [];

    const resetParticle = (p: FlowParticle, initial: boolean) => {
      p.x = Math.random() * logicalWidth;
      p.y = Math.random() * logicalHeight;
      p.prevX = p.x;
      p.prevY = p.y;
      p.life = initial ? Math.random() * 300 : 0;
      p.maxLife = 180 + Math.random() * 250;
      p.speedMultiplier = 0.7 + Math.random() * 0.6;
    };

    const initSizeAndParticles = () => {
      const rect = wrapper.getBoundingClientRect();
      logicalWidth = Math.max(320, Math.floor(rect.width));
      logicalHeight = Math.max(320, Math.floor(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Studio light background matching Hero + opening Category stage (#fafaf8)
      ctx.fillStyle = '#fafaf8';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      let targetCount = config.density;
      if (logicalWidth < 768) {
        targetCount = Math.floor(config.density * 0.45);
      }

      particles = Array.from({ length: targetCount }, () => {
        const p: FlowParticle = {
          x: 0,
          y: 0,
          prevX: 0,
          prevY: 0,
          life: 0,
          maxLife: 200,
          speedMultiplier: 1,
        };
        resetParticle(p, true);
        return p;
      });
    };

    const updateScrollFade = () => {
      const wheelEl = document.getElementById('category-wheel-wrapper');
      let rawDismiss = 0;

      if (wheelEl && window.innerWidth >= 1024) {
        const rect = wheelEl.getBoundingClientRect();
        // Stay 100% sharp & vivid while viewing Hero + white Category Marquee (rect.top >= 260).
        // Slowly & gracefully dissolve across a wide 520px scroll runway (rect.top: 260 -> -260).
        rawDismiss = Math.max(0, Math.min(1, (260 - rect.top) / 520));
      } else {
        // Mobile fallback: stay visible through Hero + mobile Category marquee, then dissolve slowly
        const scrollY = Math.max(0, window.scrollY);
        rawDismiss = Math.max(0, Math.min(1, (scrollY - 500) / 420));
      }

      // Smoothstep quintic-feel easing for slow organic entry & feather-soft finish
      const easedDismiss = rawDismiss * rawDismiss * (3 - 2 * rawDismiss);
      dismissProgress = easedDismiss;

      const visibleAlpha = Math.max(0, 1 - easedDismiss);
      const depthBlur = easedDismiss * 5.0; // Smooth optical depth-of-field blur
      const driftScale = 1 + easedDismiss * 0.035; // Subtle ambient atmospheric expansion

      wrapper.style.opacity = visibleAlpha.toFixed(3);
      wrapper.style.filter = depthBlur > 0.05 ? `blur(${depthBlur.toFixed(2)}px)` : 'none';
      wrapper.style.transform = `scale(${driftScale.toFixed(4)})`;

      isScrollingOut = visibleAlpha <= 0.01;
    };

    const drawFrame = () => {
      if (!isHeroVisible || isScrollingOut) return;

      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Particles decelerate smoothly & trails evaporate naturally during slow scroll dismissal
      const activeSpeed = config.speed * (1 - 0.65 * dismissProgress);
      const trailFadeAlpha = 0.08 + 0.18 * dismissProgress;
      const strokeOpacity = config.opacity * (1 - dismissProgress * 0.85);

      timeOffset += 0.0003 * activeSpeed;

      // Exact 'trace' fading trails mode from Driftwave Vortex preset on #fafaf8 ground
      ctx.fillStyle = `rgba(250, 250, 248, ${trailFadeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      const batchPath = new Path2D();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.prevX = p.x;
        p.prevY = p.y;

        const noiseVal = simplex.noise2D(
          p.x * config.noiseScale,
          p.y * config.noiseScale + timeOffset
        );
        let angle = noiseVal * Math.PI * 2.5;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radiusSq = config.mouseRadius * config.mouseRadius;

          if (distSq < radiusSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = 1 - dist / config.mouseRadius;
            const pushAngle = Math.atan2(dy, dx);
            angle = angle * (1 - force * 0.75) + pushAngle * (force * 0.75);
            p.x += Math.cos(pushAngle) * force * 2.5;
            p.y += Math.sin(pushAngle) * force * 2.5;
          }
        }

        const vx = Math.cos(angle) * activeSpeed * p.speedMultiplier;
        const vy = Math.sin(angle) * activeSpeed * p.speedMultiplier;
        p.x += vx;
        p.y += vy;
        p.life++;

        if (
          p.x < -20 ||
          p.x > logicalWidth + 20 ||
          p.y < -20 ||
          p.y > logicalHeight + 20 ||
          p.life > p.maxLife
        ) {
          resetParticle(p, false);
          continue;
        }

        batchPath.moveTo(p.prevX, p.prevY);
        batchPath.lineTo(p.x, p.y);
      }

      ctx.strokeStyle = `rgba(28, 27, 24, ${strokeOpacity.toFixed(3)})`;
      ctx.lineWidth = config.strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke(batchPath);
    };

    const tick = () => {
      drawFrame();
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = wrapper.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.active = false;
    };

    initSizeAndParticles();
    updateScrollFade();

    // Warm up rich Driftwave trails immediately on mount
    const warmupSteps = prefersReducedMotion ? 32 : 30;
    for (let step = 0; step < warmupSteps; step++) {
      drawFrame();
    }

    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(tick);
    }

    const resizeObserver = new ResizeObserver(() => {
      initSizeAndParticles();
    });
    resizeObserver.observe(wrapper);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isHeroVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(wrapper);

    window.addEventListener('scroll', updateScrollFade, { passive: true });
    window.addEventListener('resize', updateScrollFade, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('scroll', updateScrollFade);
      window.removeEventListener('resize', updateScrollFade);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[1480px] z-0 pointer-events-none select-none overflow-hidden origin-top will-change-[opacity,filter,transform]"
      style={{
        maskImage:
          'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
