import React, { useEffect, useRef } from 'react';

interface DogAnimatorProps {
  status: 'idle' | 'running' | 'carrying' | 'happy';
  currentQuery?: string;
  className?: string;
}

export const DogAnimator: React.FC<DogAnimatorProps> = ({
  status,
  currentQuery,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const pixelSize = 4;

      // Background grass / floor track
      ctx.fillStyle = '#1e2436';
      ctx.fillRect(0, height - 12, width, 12);

      // Moving grass dots for speed effect if running or carrying
      if (status === 'running' || status === 'carrying') {
        ctx.fillStyle = '#343e5c';
        for (let i = 0; i < 15; i++) {
          const x = (i * 40 - (frame * 6) % 40 + width) % width;
          ctx.fillRect(x, height - 8, 8, 2);
        }
      }

      const dogX = status === 'running' ? (width * 0.45) : (width * 0.25);
      const dogY = height - 38;

      // Draw Pixel Dog (Shiba Inu Style)
      drawPixelDog(ctx, dogX, dogY, pixelSize, status, frame);

      // Draw Frisbee
      drawFrisbee(ctx, width, height, pixelSize, status, frame, dogX, dogY);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-[#151824]/90 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-md ${className}`}>
      {/* Dynamic Status Banner */}
      <div className="absolute top-2 left-4 right-4 flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-2 text-amber-400 font-mono">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === 'running' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          {status === 'running' && 'FETCHING INFO... (爆走探索中)'}
          {status === 'carrying' && 'RETURNING WITH RESULT! (咥えて帰還中)'}
          {status === 'happy' && 'GREAT FETCH! (ユーザー確認待ち)'}
          {status === 'idle' && 'READY TO FETCH (待機中)'}
        </span>
        {currentQuery && (
          <span className="text-slate-400 truncate max-w-[200px] font-sans bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            🎯 {currentQuery}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={100}
        className="w-full max-w-[500px] h-[100px] image-rendering-pixelated mt-5"
      />
    </div>
  );
};

// Helper: Draw Pixel Art Dog
function drawPixelDog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  status: 'idle' | 'running' | 'carrying' | 'happy',
  frame: number
) {
  // Color Palette
  const FUR_ORANGE = '#e67e22';
  const FUR_DARK = '#d35400';
  const FUR_WHITE = '#fdfefe';
  const NOSE_BLACK = '#17202a';
  const COLLAR_RED = '#e74c3c';
  const FRISBEE_GOLD = '#f1c40f';

  // Animation cycle
  const legCycle = Math.sin(frame * 0.3);
  const bounceY = (status === 'running' || status === 'carrying') ? Math.abs(Math.sin(frame * 0.25)) * 4 : 0;
  const tailWag = Math.sin(frame * 0.4) * 4;

  const currentY = y - bounceY;

  ctx.save();
  ctx.translate(x, currentY);

  // Body Matrix (Pixel grid offsets)
  // Tail
  ctx.fillStyle = FUR_ORANGE;
  ctx.fillRect(-12 + tailWag, -16, 6, 8);
  ctx.fillStyle = FUR_WHITE;
  ctx.fillRect(-14 + tailWag, -18, 4, 4);

  // Main Body
  ctx.fillStyle = FUR_ORANGE;
  ctx.fillRect(-8, -12, 24, 14);

  // White Belly
  ctx.fillStyle = FUR_WHITE;
  ctx.fillRect(-2, -4, 14, 6);

  // Red Collar
  ctx.fillStyle = COLLAR_RED;
  ctx.fillRect(14, -14, 4, 10);

  // Head
  ctx.fillStyle = FUR_ORANGE;
  ctx.fillRect(14, -22, 12, 14);

  // Ears
  ctx.fillStyle = FUR_DARK;
  ctx.fillRect(16, -26, 4, 5);
  ctx.fillRect(22, -26, 4, 5);

  // White Snout & Chest
  ctx.fillStyle = FUR_WHITE;
  ctx.fillRect(22, -18, 8, 8);
  ctx.fillRect(16, -10, 8, 6);

  // Eye & Nose
  ctx.fillStyle = NOSE_BLACK;
  ctx.fillRect(22, -19, 3, 3); // Eye
  ctx.fillRect(29, -17, 3, 3); // Nose

  // If carrying frisbee in mouth
  if (status === 'carrying') {
    ctx.fillStyle = FRISBEE_GOLD;
    ctx.fillRect(28, -14, 12, 4);
    ctx.fillStyle = '#b7950b';
    ctx.fillRect(30, -13, 8, 2);
  }

  // Legs Animation
  ctx.fillStyle = FUR_DARK;
  if (status === 'running' || status === 'carrying') {
    // Front legs
    ctx.fillRect(18 + legCycle * 5, 2, 4, 10);
    ctx.fillRect(12 - legCycle * 5, 2, 4, 10);
    // Back legs
    ctx.fillRect(-4 + legCycle * 5, 2, 4, 10);
    ctx.fillRect(-8 - legCycle * 5, 2, 4, 10);
  } else if (status === 'happy') {
    // Jump pose
    ctx.fillRect(18, 4, 4, 8);
    ctx.fillRect(10, 4, 4, 8);
    ctx.fillRect(-4, 4, 4, 8);
    ctx.fillRect(-8, 4, 4, 8);
  } else {
    // Idle sit
    ctx.fillRect(18, 2, 4, 10);
    ctx.fillRect(12, 2, 4, 10);
    ctx.fillRect(-6, 2, 8, 10);
  }

  // Speed lines when running
  if (status === 'running') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 3; i++) {
      const lineX = -25 - ((frame * 8 + i * 15) % 40);
      const lineY = -15 + i * 8;
      ctx.fillRect(lineX, lineY, 12, 2);
    }
  }

  ctx.restore();
}

// Helper: Draw Flying / Catching Frisbee
function drawFrisbee(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number,
  status: 'idle' | 'running' | 'carrying' | 'happy',
  frame: number,
  dogX: number,
  dogY: number
) {
  const FRISBEE_GOLD = '#f1c40f';
  const FRISBEE_SHINE = '#fef9e7';

  if (status === 'running') {
    // Flying Frisbee ahead of the dog
    const frisbeeX = (frame * 7) % (width + 60) - 30;
    const frisbeeY = height * 0.35 + Math.sin(frame * 0.15) * 8;

    ctx.save();
    ctx.fillStyle = FRISBEE_GOLD;
    ctx.beginPath();
    ctx.ellipse(frisbeeX, frisbeeY, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = FRISBEE_SHINE;
    ctx.beginPath();
    ctx.ellipse(frisbeeX - 2, frisbeeY - 1, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Motion glow line behind frisbee
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(frisbeeX - 25, frisbeeY);
    ctx.lineTo(frisbeeX - 5, frisbeeY);
    ctx.stroke();

    ctx.restore();
  } else if (status === 'happy') {
    // Frisbee placed on the ground in front of dog
    const frisbeeX = dogX + 40;
    const frisbeeY = height - 15;

    ctx.fillStyle = FRISBEE_GOLD;
    ctx.fillRect(frisbeeX, frisbeeY, 16, 4);
    ctx.fillStyle = FRISBEE_SHINE;
    ctx.fillRect(frisbeeX + 3, frisbeeY + 1, 8, 2);
  }
}
