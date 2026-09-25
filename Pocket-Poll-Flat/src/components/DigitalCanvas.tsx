import React, { useEffect, useRef } from 'react';

interface DigitalCanvasProps {
  interactive?: boolean;
}

export const DigitalCanvas: React.FC<DigitalCanvasProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Active Cursor Tracking - Always listen globally for smooth interactive response
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let isMouseInside = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      isMouseInside = true;
    };

    const handleMouseLeave = () => {
      isMouseInside = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Harmonious Seamless Base Loop Configuration (20 seconds)
    const LOOP_DURATION = 20000;
    const startTime = performance.now();

    // Professional Palette: Vibrant Orange, Crisp Emerald Green, Crimson Red, and Pure Luminous White
    const palette = [
      { r: 249, g: 115, b: 22, name: 'orange' },   // Emerald / Amber orange
      { r: 16, g: 185, b: 129, name: 'green' },    // Verified green
      { r: 239, g: 68, b: 68, name: 'red' },       // Alert / dynamic red
      { r: 255, g: 255, b: 255, name: 'white' },   // Pure crisp white
    ];

    // Ambient floating particles with subtle voting telemetry
    const PARTICLE_COUNT = 130;
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const color = palette[i % palette.length];
      return {
        id: i,
        baseX: Math.random(),
        baseY: Math.random(),
        size: Math.random() * 2.0 + 0.8,
        driftFreqX: (i % 2 === 0 ? 1 : 2),
        driftFreqY: (i % 3 === 0 ? 1 : 2),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        isBinary: i % 4 === 0,
        digit: Math.random() > 0.5 ? '1' : '0',
        color,
        baseAlpha: Math.random() * 0.45 + 0.2,
      };
    });

    // Helper: Draw Flat-topped Hexagon
    const drawHexagon = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number
    ) => {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) % LOOP_DURATION;
      const theta = (elapsed / LOOP_DURATION) * Math.PI * 2;

      // Smooth cursor interpolation with responsive spring
      const lerpSpeed = 0.08;
      mouseX += (targetMouseX - mouseX) * lerpSpeed;
      mouseY += (targetMouseY - mouseY) * lerpSpeed;

      // Parallax offset following cursor dynamically
      const cursorParallaxX = (mouseX / width - 0.5) * 55;
      const cursorParallaxY = (mouseY / height - 0.5) * 45;

      // Deep rich dark canvas background (#07080b)
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, width, height);

      // Dynamic cursor radial spotlight with subtle Orange/Green/White aura
      const spotlightRadius = Math.max(220, Math.min(width, height) * 0.38);
      const cursorGrad = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        spotlightRadius
      );
      // Soft amber/orange and emerald glass radiance following the cursor
      cursorGrad.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
      cursorGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.06)');
      cursorGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      cursorGrad.addColorStop(1, 'rgba(7, 8, 11, 0)');

      ctx.fillStyle = cursorGrad;
      ctx.fillRect(0, 0, width, height);

      // Deep subtle background radial vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        100,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      bgGrad.addColorStop(0.5, 'rgba(18, 20, 26, 0.4)');
      bgGrad.addColorStop(1, '#07080b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // Full-Screen Hexagonal Lattice with Cursor-Interactive Physics
      // -------------------------------------------------------------
      const driftAmplitude = 24;
      const baseGridDriftX = Math.sin(theta) * driftAmplitude;
      const baseGridDriftY = Math.sin(theta * 2) * 4;

      const hexRadius = 42;
      const hexWidth = Math.sqrt(3) * hexRadius;
      const hexVertStep = 1.5 * hexRadius;

      const margin = 140;
      const startX = -margin + baseGridDriftX + cursorParallaxX * 0.5;
      const endX = width + margin;
      const startY = -margin + baseGridDriftY + cursorParallaxY * 0.5;
      const endY = height + margin;

      let rowIndex = 0;
      for (let y = startY; y < endY; y += hexVertStep) {
        const isRowOdd = Math.abs(rowIndex) % 2 !== 0;
        const xOffset = isRowOdd ? hexWidth / 2 : 0;
        let colIndex = 0;

        for (let x = startX - hexWidth + xOffset; x < endX + hexWidth; x += hexWidth) {
          // Distance from cursor to this hexagon center
          const dx = mouseX - x;
          const dy = mouseY - y;
          const distToCursor = Math.hypot(dx, dy);

          // Cursor dynamic interaction physics:
          // 1. Proximity factor [0..1]
          const influenceRadius = 260;
          const proximity = Math.max(0, 1 - distToCursor / influenceRadius);

          // 2. Cursor repulsion / attraction displacement:
          // Hexagons subtly push outward and follow the cursor gesture
          const pushForce = Math.sin(proximity * Math.PI) * 14;
          const angleToCursor = Math.atan2(dy, dx);
          const interactiveX = x - Math.cos(angleToCursor) * pushForce;
          const interactiveY = y - Math.sin(angleToCursor) * pushForce;

          // 3. Proximity scale boost for 3D glass depth
          const currentRadius = hexRadius * (0.94 + proximity * 0.12);

          // Professional Palette color cycling
          // Cycle through Orange (#f97316), Green (#10b981), Red (#ef4444), White
          const colorIndex = (Math.abs(rowIndex + colIndex * 2)) % 4;
          const baseColor = palette[colorIndex];

          // Dynamic brightness & stroke alpha based on cursor proximity and spatial wave
          const wavePhase = (x * 0.0035 + y * 0.0025) + theta;
          const wavePulse = Math.sin(wavePhase);

          let strokeAlpha = 0.07 + (wavePulse > 0.3 ? 0.05 : 0) + proximity * 0.55;
          let lineWidth = 0.95 + proximity * 1.2;

          // Under cursor highlight: active vibrant orange, emerald green, crisp white, or crimson red
          let strokeR = baseColor.r;
          let strokeG = baseColor.g;
          let strokeB = baseColor.b;

          if (proximity > 0.4) {
            // When close to cursor, glow brightly with crisp professional colors
            if (proximity > 0.75) {
              // Core proximity: Brilliant white/orange highlight
              strokeR = 255;
              strokeG = Math.round(200 + proximity * 55);
              strokeB = Math.round(180 + proximity * 75);
              strokeAlpha = Math.min(0.9, strokeAlpha * 1.5);
            }
          }

          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeAlpha})`;

          drawHexagon(ctx, interactiveX, interactiveY, currentRadius);
          ctx.stroke();

          // Subtle glowing node at key vertices or under cursor
          if (proximity > 0.25 || (rowIndex + colIndex) % 5 === 0) {
            const nodeAlpha = Math.min(0.85, 0.1 + proximity * 0.75);
            ctx.fillStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${nodeAlpha})`;
            ctx.beginPath();
            ctx.arc(
              interactiveX,
              interactiveY - currentRadius,
              1.2 + proximity * 1.8,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Specular halo for near-cursor hexagons
            if (proximity > 0.5) {
              ctx.fillStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${nodeAlpha * 0.25})`;
              ctx.beginPath();
              ctx.arc(
                interactiveX,
                interactiveY - currentRadius,
                4 + proximity * 4,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }

          colIndex++;
        }
        rowIndex++;
      }

      // -------------------------------------------------------------
      // Dynamic Floating Telemetry Particles (Orange, Green, Red, White)
      // -------------------------------------------------------------
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      particles.forEach((p) => {
        const floatX = Math.sin(theta * p.driftFreqX + p.phaseX) * 26;
        const floatY = Math.cos(theta * p.driftFreqY + p.phaseY) * 20;

        // Base particle pos
        let posX = p.baseX * width + floatX + baseGridDriftX * 0.7 + cursorParallaxX * 0.4;
        let posY = p.baseY * height + floatY + baseGridDriftY * 0.7 + cursorParallaxY * 0.4;

        // Cursor dynamic interaction with particles: subtle magnetic attraction
        const pdx = mouseX - posX;
        const pdy = mouseY - posY;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist < 200 && pdist > 0) {
          const attraction = (1 - pdist / 200) * 18;
          posX += (pdx / pdist) * attraction;
          posY += (pdy / pdist) * attraction;
        }

        const pulse = Math.sin(theta * 2 + p.phaseX) * 0.1;
        const currentAlpha = Math.max(0.12, Math.min(0.9, p.baseAlpha + pulse + (pdist < 200 ? 0.35 : 0)));

        const { r, g, b } = p.color;

        if (p.isBinary) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha * 0.8})`;
          ctx.fillText(p.digit, posX, posY);
        } else {
          // Core
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(posX, posY, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Soft frosted chromatic halo
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(posX, posY, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // -------------------------------------------------------------
      // Peripheral Vignette for Cinema Depth
      // -------------------------------------------------------------
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.45,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(7, 8, 11, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default DigitalCanvas;
