import React, { useRef, useEffect, useCallback } from 'react';
import { PhysicsEngine } from '../physics/engine';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvasProps {
  engine: PhysicsEngine;
  onTapEntity?: (type: string) => void;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Gesture tracking refs
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const holdTimerRef = useRef<number | null>(null);

  // High-DPI Canvas resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    engine.init(rect.width, rect.height, dpr);
  }, [engine]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main Animation & Physics Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.666, 2.5);
      lastTime = now;

      engine.update(dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, engine, canvas.width, canvas.height, engine.dpr);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // --- POINTER GESTURE HANDLERS ---

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    const { x, y } = getCanvasCoords(e);
    pointerStartRef.current = { x, y, time: performance.now() };
    lastPosRef.current = { x, y };

    engine.mo.lookTarget = { x, y };

    // Check if dragging Sun
    if (Math.hypot(x - engine.sun.x, y - engine.sun.y) < engine.sun.radius * 1.5) {
      engine.isDraggingSun = true;
      soundEngine.playSunTouch();
      return;
    }

    // Check if dragging Mo
    if (Math.hypot(x - engine.mo.x, y - engine.mo.y) < engine.mo.radius * 1.6) {
      engine.isDraggingMo = true;
      engine.mo.vx = 0;
      engine.mo.vy = 0;
      engine.mo.mood = 'bouncy';
      soundEngine.playMoBounce();
      return;
    }

    // Setup Hold Detection (Time slows down on hold)
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      if (isPointerDownRef.current) {
        engine.isSlowMoHold = true;
        soundEngine.playTimeRewind();
      }
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;

    engine.mo.lookTarget = { x, y };

    if (engine.isDraggingSun) {
      engine.sun.x = x;
      engine.sun.y = y;
      lastPosRef.current = { x, y };
      return;
    }

    if (engine.isDraggingMo) {
      engine.mo.x = x;
      engine.mo.y = y;
      engine.mo.vx = dx * 1.2;
      engine.mo.vy = dy * 1.2;
      lastPosRef.current = { x, y };
      return;
    }

    // If swiping ground, bend the landscape
    if (y > engine.height - 130) {
      engine.bendGroundAt(x, dy * 0.4);
    }

    // Birds follow dragging finger
    if (engine.birds.length > 0) {
      engine.directBirdsTo(x, y);
    }

    // Rapid horizontal swipe makes Mo run
    if (Math.abs(dx) > 12) {
      engine.mo.vx += Math.sign(dx) * 4;
      engine.mo.squishX = 1.25;
      engine.mo.squishY = 0.8;
      engine.mo.mood = 'happy';
    }

    lastPosRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    engine.isSlowMoHold = false;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const { x, y } = getCanvasCoords(e);
    const duration = performance.now() - pointerStartRef.current.time;
    const dist = Math.hypot(x - pointerStartRef.current.x, y - pointerStartRef.current.y);

    if (engine.isDraggingSun) {
      engine.isDraggingSun = false;
      return;
    }

    if (engine.isDraggingMo) {
      engine.isDraggingMo = false;
      return;
    }

    // Short tap
    if (duration < 350 && dist < 15) {
      engine.handleTap(x, y);
    } else if (dist >= 15) {
      // Swipe gesture: upward swipe throws objects
      const swipeDy = y - pointerStartRef.current.y;
      if (swipeDy < -35) {
        // Fling entities upward
        for (const f of engine.fruits) {
          if (Math.hypot(x - f.x, y - f.y) < 80) {
            f.vy = -16;
            f.vx = (x - pointerStartRef.current.x) * 0.4;
          }
        }
        for (const c of engine.chickens) {
          if (Math.hypot(x - c.x, y - c.y) < 80) {
            c.vy = -14;
            c.vx = (x - pointerStartRef.current.x) * 0.4;
          }
        }
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden select-none touch-none ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};

// --- DRAWING PIPELINE ---

function drawScene(
  ctx: CanvasRenderingContext2D,
  engine: PhysicsEngine,
  width: number,
  height: number,
  dpr: number
) {
  ctx.save();
  ctx.scale(dpr, dpr);

  const logicalW = width / dpr;
  const logicalH = height / dpr;

  // 1. Sky & Atmosphere Background
  drawSky(ctx, engine, logicalW, logicalH);

  // 2. Sun & Sunrays
  drawSun(ctx, engine);

  // 3. Rainbow
  if (engine.rainbow.active && engine.rainbow.alpha > 0.05) {
    drawRainbow(ctx, engine);
  }

  // 4. Background Clouds
  for (const cloud of engine.clouds) {
    if (!cloud.isBurst) {
      drawCloud(ctx, cloud, engine.isNight);
    }
  }

  // 5. Parallax Distant Hills
  drawDistantHills(ctx, engine, logicalW, logicalH);

  // 6. Interactive Ground & Pond
  drawGroundAndWater(ctx, engine, logicalW, logicalH);

  // 7. Volcanoes
  for (const vol of engine.volcanoes) {
    drawVolcano(ctx, vol);
  }

  // 8. Castle Blocks & Ruins
  for (const block of engine.castleBlocks) {
    drawCastleBlock(ctx, block);
  }

  // 9. Trees & Falling Fruits
  for (const tree of engine.trees) {
    drawTree(ctx, tree);
  }
  for (const fruit of engine.fruits) {
    drawFruit(ctx, fruit);
  }

  // 10. Rocks
  for (const rock of engine.rocks) {
    drawRock(ctx, rock);
  }

  // 11. Fish in Water Pond
  for (const f of engine.fish) {
    drawFish(ctx, f);
  }

  // 12. Chickens & Bomb Chickens
  for (const chicken of engine.chickens) {
    drawChicken(ctx, chicken);
  }

  // 13. Birds
  for (const bird of engine.birds) {
    drawBird(ctx, bird);
  }

  // 14. Spaceships
  for (const ship of engine.spaceships) {
    drawSpaceship(ctx, ship);
  }

  // 15. Dream World Specials (Giant Ant, Giant Hand)
  if (engine.giantAnt && engine.giantAnt.active) {
    drawGiantAnt(ctx, engine.giantAnt);
  }
  if (engine.giantHand.active) {
    drawGiantHand(ctx, engine.giantHand);
  }

  // 16. Mo (The Star Character!)
  drawMo(ctx, engine.mo, engine.isNight);

  // 17. Particles (Sparks, Feathers, Fire, Water Drops)
  drawParticles(ctx, engine.particles);

  // 18. Slow-Mo / Time Rewind Overlay Vignette
  if (engine.isSlowMoHold) {
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(0, 0, logicalW, logicalH);
  } else if (engine.isTimeRewinding) {
    ctx.fillStyle = 'rgba(236, 72, 153, 0.18)';
    ctx.fillRect(0, 0, logicalW, logicalH);
  }

  ctx.restore();
}

function drawSky(ctx: CanvasRenderingContext2D, engine: PhysicsEngine, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);

  if (engine.isNight) {
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.6, '#0B0F19');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 97) % w);
      const sy = ((i * 53) % (h * 0.65));
      const sSize = 1 + (i % 3);
      ctx.beginPath();
      ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (engine.vibe === 'INSANE') {
    grad.addColorStop(0, '#4C0519'); // Dramatic crimson
    grad.addColorStop(0.4, '#7C2D12');
    grad.addColorStop(0.8, '#F59E0B');
    grad.addColorStop(1, '#FEF08A');
  } else if (engine.vibe === 'CRAZY') {
    grad.addColorStop(0, '#0284C7'); // Playful electric azure
    grad.addColorStop(0.5, '#38BDF8');
    grad.addColorStop(0.85, '#BAE6FD');
    grad.addColorStop(1, '#FEF3C7');
  } else {
    // Relax / Curious: Peaceful sky
    grad.addColorStop(0, '#7DD3FC');
    grad.addColorStop(0.45, '#BAE6FD');
    grad.addColorStop(0.85, '#E0F2FE');
    grad.addColorStop(1, '#FEF9C3');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawSun(ctx: CanvasRenderingContext2D, engine: PhysicsEngine) {
  const { sun, isNight } = engine;
  if (isNight) {
    // Draw glowing crescent moon
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.fillStyle = '#FEF08A';
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, sun.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0B0F19';
    ctx.beginPath();
    ctx.arc(sun.radius * 0.4, -sun.radius * 0.2, sun.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(sun.x, sun.y);

  // Corona rays
  const pulse = Math.sin(sun.pulsePhase) * 4;
  const numRays = 12;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 4;
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2 + sun.pulsePhase * 0.2;
    const r1 = sun.radius + 6;
    const r2 = sun.radius + 18 + pulse;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Sun body
  const sunGrad = ctx.createRadialGradient(-sun.radius * 0.3, -sun.radius * 0.3, 4, 0, 0, sun.radius);
  sunGrad.addColorStop(0, '#FEF08A');
  sunGrad.addColorStop(0.7, '#FBBF24');
  sunGrad.addColorStop(1, '#F59E0B');

  ctx.fillStyle = sunGrad;
  ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(0, 0, sun.radius, 0, Math.PI * 2);
  ctx.fill();

  // Cute face on the sun!
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(-8, -4, 3, 0, Math.PI * 2);
  ctx.arc(8, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 4, 7, 0, Math.PI);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#78350F';
  ctx.stroke();

  ctx.restore();
}

function drawRainbow(ctx: CanvasRenderingContext2D, engine: PhysicsEngine) {
  const { rainbow } = engine;
  ctx.save();
  ctx.globalAlpha = rainbow.alpha;

  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#FACC15', // Yellow
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#A855F7', // Violet
  ];

  colors.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(rainbow.startX, rainbow.startY);
    ctx.quadraticCurveTo(
      (rainbow.startX + rainbow.endX) / 2,
      rainbow.controlY + i * 6,
      rainbow.endX,
      rainbow.endY
    );
    ctx.stroke();
  });

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: any, isNight: boolean) {
  ctx.save();
  ctx.translate(cloud.x, cloud.y);
  ctx.fillStyle = isNight ? 'rgba(71, 85, 105, 0.65)' : 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = isNight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  for (const p of cloud.puffs) {
    ctx.beginPath();
    ctx.arc(p.offsetX, p.offsetY, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDistantHills(ctx: CanvasRenderingContext2D, engine: PhysicsEngine, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = engine.isNight ? '#0F172A' : '#A7F3D0';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 160);
  ctx.bezierCurveTo(w * 0.35, h - 210, w * 0.7, h - 130, w, h - 170);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGroundAndWater(ctx: CanvasRenderingContext2D, engine: PhysicsEngine, w: number, h: number) {
  const pts = engine.groundPoints;
  if (pts.length < 2) return;

  ctx.save();

  // Foreground rolling green hills
  ctx.fillStyle = engine.isNight ? '#1E293B' : '#4ADE80';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 0; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.lineTo(w + 30, h + 30);
  ctx.lineTo(-30, h + 30);
  ctx.closePath();
  ctx.fill();

  // Grass rim highlights
  ctx.strokeStyle = engine.isNight ? '#334155' : '#86EFAC';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.stroke();

  // Sparkling Water Pond basin in middle
  const pondStartX = w * 0.35;
  const pondEndX = w * 0.7;
  const pondY = h - 50;

  ctx.fillStyle = engine.isNight ? 'rgba(30, 58, 138, 0.85)' : 'rgba(56, 189, 248, 0.85)';
  ctx.beginPath();
  ctx.ellipse((pondStartX + pondEndX) / 2, pondY, (pondEndX - pondStartX) / 2, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pond wave specular glint
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc((pondStartX + pondEndX) / 2, pondY - 8, 30, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, tree: any) {
  ctx.save();
  ctx.translate(tree.x, tree.groundY);
  ctx.rotate(tree.bendAngle);

  // Trunk
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.lineTo(6, -tree.height);
  ctx.lineTo(-6, -tree.height);
  ctx.closePath();
  ctx.fill();

  // Foliage
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.arc(0, -tree.height, tree.foliageRadius, 0, Math.PI * 2);
  ctx.fill();

  // Hanging fruit in foliage
  for (let i = 0; i < tree.fruitCount; i++) {
    const angle = (i / Math.max(1, tree.fruitCount)) * Math.PI * 2;
    const fx = Math.cos(angle) * (tree.foliageRadius * 0.55);
    const fy = -tree.height + Math.sin(angle) * (tree.foliageRadius * 0.55);

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(fx, fy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFruit(ctx: CanvasRenderingContext2D, fruit: any) {
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.fillStyle = fruit.color;

  ctx.beginPath();
  ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
  ctx.fill();

  // Leaf/stem
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.ellipse(fruit.radius * 0.4, -fruit.radius * 0.8, fruit.radius * 0.3, fruit.radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, rock: any) {
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  rock.points.forEach((pt: any, idx: number) => {
    const px = Math.cos(pt.angle) * pt.dist;
    const py = Math.sin(pt.angle) * pt.dist;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFish(ctx: CanvasRenderingContext2D, f: any) {
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.vx < 0) ctx.scale(-1, 1);

  ctx.fillStyle = f.color;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wiggling Tail
  const tailWiggle = Math.sin(f.swimPhase) * 6;
  ctx.beginPath();
  ctx.moveTo(-f.size * 0.8, 0);
  ctx.lineTo(-f.size * 1.5, -f.size * 0.4 + tailWiggle);
  ctx.lineTo(-f.size * 1.5, f.size * 0.4 + tailWiggle);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(f.size * 0.4, -f.size * 0.15, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(f.size * 0.45, -f.size * 0.15, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawChicken(ctx: CanvasRenderingContext2D, c: any) {
  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.vx < 0) ctx.scale(-1, 1);

  const s = c.size;

  // Legs waddling
  const legOffset = Math.sin(c.legPhase) * (s * 0.2);
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, s * 0.3);
  ctx.lineTo(-s * 0.2, s * 0.6 + legOffset);
  ctx.moveTo(s * 0.2, s * 0.3);
  ctx.lineTo(s * 0.2, s * 0.6 - legOffset);
  ctx.stroke();

  // Body
  ctx.fillStyle = c.isGiant ? '#FEF08A' : '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Red Comb on top
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(s * 0.1, -s * 0.45, s * 0.16, 0, Math.PI * 2);
  ctx.arc(s * 0.28, -s * 0.42, s * 0.14, 0, Math.PI * 2);
  ctx.arc(s * 0.42, -s * 0.35, s * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(s * 0.45, -s * 0.1);
  ctx.lineTo(s * 0.75, 0);
  ctx.lineTo(s * 0.45, s * 0.1);
  ctx.closePath();
  ctx.fill();

  // Googly Eye
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(s * 0.3, -s * 0.15, s * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // If it's a surprise bomb chicken!
  if (c.isBomb) {
    // Sizzling bomb fuse on back
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.5, -s * 0.6, -s * 0.8);
    ctx.stroke();

    // Spark on fuse
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-s * 0.6, -s * 0.8, 4 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, bird: any) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  if (bird.vx < 0) ctx.scale(-1, 1);

  ctx.fillStyle = bird.color;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing flapping
  const flap = Math.sin(bird.wingPhase) * 6;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(3, -8 + flap);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  // Beak
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.moveTo(8, -1);
  ctx.lineTo(13, 0);
  ctx.lineTo(8, 2);
  ctx.fill();

  ctx.restore();
}

function drawCastleBlock(ctx: CanvasRenderingContext2D, b: any) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rotation);

  ctx.fillStyle = b.color;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;

  ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
  ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

  // Brick highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(-b.width / 2 + 2, -b.height / 2 + 2, b.width - 4, 3);

  ctx.restore();
}

function drawVolcano(ctx: CanvasRenderingContext2D, vol: any) {
  ctx.save();
  ctx.translate(vol.x, vol.y);

  // Mountain caldera
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-vol.width / 2, 0);
  ctx.lineTo(-vol.width * 0.22, -vol.height);
  ctx.lineTo(vol.width * 0.22, -vol.height);
  ctx.lineTo(vol.width / 2, 0);
  ctx.closePath();
  ctx.fill();

  // Molten lava top
  ctx.fillStyle = '#EF4444';
  ctx.shadowColor = '#F97316';
  ctx.shadowBlur = vol.isErupting ? 20 : 8;
  ctx.beginPath();
  ctx.ellipse(0, -vol.height, vol.width * 0.22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSpaceship(ctx: CanvasRenderingContext2D, ship: any) {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  // Rocket body
  ctx.fillStyle = '#E2E8F0';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.bezierCurveTo(12, -10, 14, 15, 12, 22);
  ctx.lineTo(-12, 22);
  ctx.bezierCurveTo(-14, 15, -12, -10, 0, -32);
  ctx.fill();
  ctx.stroke();

  // Fins
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.lineTo(-24, 25);
  ctx.lineTo(-12, 22);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(12, 10);
  ctx.lineTo(24, 25);
  ctx.lineTo(12, 22);
  ctx.fill();

  // Porthole
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(0, -5, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGiantAnt(ctx: CanvasRenderingContext2D, ant: any) {
  ctx.save();
  ctx.translate(ant.x, ant.y);
  if (ant.vx < 0) ctx.scale(-1, 1);

  ctx.fillStyle = '#18181B';
  const s = ant.size;

  // 3 segments
  ctx.beginPath();
  ctx.arc(-s * 0.35, 0, s * 0.28, 0, Math.PI * 2);
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.arc(s * 0.35, -s * 0.05, s * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Scuttling legs
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, 0);
  ctx.lineTo(-s * 0.3, s * 0.4);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.4);
  ctx.moveTo(s * 0.1, 0);
  ctx.lineTo(s * 0.3, s * 0.4);
  ctx.stroke();

  // Antennae
  ctx.beginPath();
  ctx.moveTo(s * 0.45, -s * 0.1);
  ctx.lineTo(s * 0.7, -s * 0.35);
  ctx.stroke();

  ctx.restore();
}

function drawGiantHand(ctx: CanvasRenderingContext2D, hand: any) {
  ctx.save();
  ctx.translate(hand.x, hand.y);

  // Friendly giant cartoon hand reaching down
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(-30, -180, 60, 180, [15, 15, 20, 20]);
  ctx.fill();
  ctx.stroke();

  // Finger tips
  [-20, -7, 7, 20].forEach(fx => {
    ctx.beginPath();
    ctx.arc(fx, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function drawMo(ctx: CanvasRenderingContext2D, mo: any, isNight: boolean) {
  ctx.save();
  ctx.translate(mo.x, mo.y);
  ctx.rotate(mo.rotation);
  ctx.scale(mo.squishX, mo.squishY);

  // Motion Comet Trail
  for (const t of mo.tailTrail) {
    ctx.save();
    ctx.translate(t.x - mo.x, t.y - mo.y);
    ctx.fillStyle = `rgba(253, 224, 71, ${t.alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, mo.radius * 0.7 * t.alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Aura glow
  ctx.shadowColor = isNight ? '#38BDF8' : '#F59E0B';
  ctx.shadowBlur = isNight ? 28 : 18;

  // Mo Body - Rich warm glowing yellow orb
  const bodyGrad = ctx.createRadialGradient(-mo.radius * 0.35, -mo.radius * 0.35, 3, 0, 0, mo.radius);
  if (isNight) {
    bodyGrad.addColorStop(0, '#67E8F9');
    bodyGrad.addColorStop(0.8, '#06B6D4');
    bodyGrad.addColorStop(1, '#0891B2');
  } else {
    bodyGrad.addColorStop(0, '#FEF08A');
    bodyGrad.addColorStop(0.75, '#FACC15');
    bodyGrad.addColorStop(1, '#EAB308');
  }

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, mo.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye look direction offset
  let lookDx = 0;
  let lookDy = 0;
  if (mo.lookTarget) {
    const angle = Math.atan2(mo.lookTarget.y - mo.y, mo.lookTarget.x - mo.x);
    lookDx = Math.cos(angle) * 3;
    lookDy = Math.sin(angle) * 3;
  }

  // Big Curious Eyes
  const eyeRadius = mo.radius * 0.24;
  const eyeSpacing = mo.radius * 0.36;
  const eyeY = -mo.radius * 0.12;

  const isBlinking = mo.blinkTimer < 8;

  if (isBlinking) {
    // Blinking happy arcs
    ctx.strokeStyle = '#713F12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeRadius, 0.2, Math.PI - 0.2);
    ctx.arc(eyeSpacing, eyeY, eyeRadius, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    // Eye whites
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dark pupils looking at player's touch!
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + lookDx, eyeY + lookDy, eyeRadius * 0.58, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + lookDx, eyeY + lookDy, eyeRadius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + lookDx - 1.5, eyeY + lookDy - 1.5, eyeRadius * 0.24, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + lookDx - 1.5, eyeY + lookDy - 1.5, eyeRadius * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.beginPath();
  ctx.arc(-eyeSpacing - 4, eyeY + eyeRadius + 3, eyeRadius * 0.7, 0, Math.PI * 2);
  ctx.arc(eyeSpacing + 4, eyeY + eyeRadius + 3, eyeRadius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Mouth
  ctx.strokeStyle = '#713F12';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  if (mo.mood === 'flying' || mo.mood === 'scared') {
    // Surprised 'O'
    ctx.fillStyle = '#713F12';
    ctx.arc(0, mo.radius * 0.32, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Joyful curved smile
    ctx.arc(0, mo.radius * 0.22, mo.radius * 0.26, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: any[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    if (p.type === 'star') {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    } else {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}
