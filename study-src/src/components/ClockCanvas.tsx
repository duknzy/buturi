import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TaskItem } from '../types';
import { SUBJECT_METAS } from '../constants/subjects';

interface ClockCanvasProps {
  tasks: TaskItem[];
  currentTime?: Date;
  onTaskClick?: (task: TaskItem) => void;
}

interface SegmentHoverInfo {
  task: TaskItem;
  x: number;
  y: number;
  startAngle: number;
  endAngle: number;
}

export const ClockCanvas: React.FC<ClockCanvasProps> = ({ tasks, currentTime = new Date(), onTaskClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<SegmentHoverInfo | null>(null);

  // Helper to convert "HH:MM" to angle (0:00 = -Math.PI / 2, top)
  const timeToAngle = useCallback((timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + (m || 0);
    const fraction = totalMinutes / 1440; // 0 to 1
    return fraction * 2 * Math.PI - Math.PI / 2;
  }, []);

  const durationToAngle = useCallback((minutes: number): number => {
    return (minutes / 1440) * 2 * Math.PI;
  }, []);

  // Compute active task under current time
  const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
  
  const activeTask = tasks.find((t) => {
    const [h, m] = t.time.split(':').map(Number);
    const startMin = h * 60 + (m || 0);
    const endMin = startMin + t.duration;
    if (endMin <= 1440) {
      return currentTotalMinutes >= startMin && currentTotalMinutes < endMin;
    } else {
      // wraps over midnight
      return currentTotalMinutes >= startMin || currentTotalMinutes < (endMin - 1440);
    }
  });

  const drawClock = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const size = Math.min(width, height);
    const center = { x: width / 2, y: height / 2 };
    const radius = size * 0.44;

    ctx.clearRect(0, 0, width, height);

    // Outer dial boundary ring
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Inner dial background
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#070d1d';
    ctx.fill();

    // Draw Schedule Arcs (Segments)
    const arcInnerRadius = radius * 0.58;
    const arcOuterRadius = radius * 0.88;

    tasks.forEach((task) => {
      const meta = SUBJECT_METAS[task.subject] || SUBJECT_METAS.life;
      const startAngle = timeToAngle(task.time);
      const angleSpan = durationToAngle(task.duration);
      const endAngle = startAngle + angleSpan;

      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x, center.y, arcOuterRadius, startAngle, endAngle, false);
      ctx.arc(center.x, center.y, arcInnerRadius, endAngle, startAngle, true);
      ctx.closePath();

      if (task.done) {
        // Dimmed done state with clean outline
        ctx.fillStyle = meta.color + '44';
        ctx.fill();
        ctx.strokeStyle = meta.color + '88';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Bright active or planned state
        ctx.fillStyle = meta.color + 'dd';
        ctx.fill();
        ctx.strokeStyle = '#ffffff25';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Outer Hour Ticks and Markers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(9, Math.floor(size * 0.032))}px 'JetBrains Mono', monospace`;

    for (let h = 0; h < 24; h++) {
      const fraction = h / 24;
      const angle = fraction * 2 * Math.PI - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Major tick mark
      const tickOuter = radius + 2;
      const tickInner = h % 6 === 0 ? radius - 8 : h % 3 === 0 ? radius - 5 : radius - 3;

      ctx.beginPath();
      ctx.moveTo(center.x + tickOuter * cos, center.y + tickOuter * sin);
      ctx.lineTo(center.x + tickInner * cos, center.y + tickInner * sin);
      ctx.lineWidth = h % 6 === 0 ? 2 : h % 3 === 0 ? 1.2 : 0.8;
      ctx.strokeStyle = h % 6 === 0 ? '#3b82f6' : h % 3 === 0 ? '#64748b' : '#334155';
      ctx.stroke();

      // Cardinal Hour Labels (00H, 06H, 12H, 18H) & Hour numbers
      if (h % 3 === 0) {
        const numRadius = radius * 0.95;
        const numX = center.x + numRadius * cos;
        const numY = center.y + numRadius * sin;

        ctx.fillStyle = h % 6 === 0 ? '#60a5fa' : '#94a3b8';
        const label = h % 6 === 0 ? `${h.toString().padStart(2, '0')}H` : `${h.toString().padStart(2, '0')}`;
        ctx.fillText(label, numX, numY);
      }
    }

    // Center Core Hub (Digital Telemetry readout)
    const hubRadius = radius * 0.52;
    const hubGrad = ctx.createRadialGradient(center.x, center.y, 8, center.x, center.y, hubRadius);
    hubGrad.addColorStop(0, '#0f172a');
    hubGrad.addColorStop(1, '#020617');

    ctx.beginPath();
    ctx.arc(center.x, center.y, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Center Display Elements
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeDisplay = `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}:${pad(currentTime.getSeconds())}`;

    ctx.fillStyle = '#60a5fa';
    ctx.font = `800 ${Math.max(15, Math.floor(size * 0.065))}px 'JetBrains Mono', monospace`;
    ctx.fillText(timeDisplay, center.x, center.y - size * 0.04);

    // Active Task status label in hub
    if (activeTask) {
      const meta = SUBJECT_METAS[activeTask.subject];
      ctx.fillStyle = meta?.color || '#94a3b8';
      ctx.font = `700 ${Math.max(9, Math.floor(size * 0.028))}px 'Plus Jakarta Sans', sans-serif`;
      
      const maxLen = 13;
      const taskLabel = activeTask.task.length > maxLen ? activeTask.task.substring(0, maxLen) + '…' : activeTask.task;
      ctx.fillText(`▶ ${taskLabel}`, center.x, center.y + size * 0.015);

      ctx.fillStyle = '#64748b';
      ctx.font = `600 ${Math.max(8, Math.floor(size * 0.024))}px 'JetBrains Mono', monospace`;
      ctx.fillText(`[${activeTask.time} ~ ${activeTask.duration}m]`, center.x, center.y + size * 0.055);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = `600 ${Math.max(9, Math.floor(size * 0.026))}px 'JetBrains Mono', monospace`;
      ctx.fillText('STANDBY // 待機中', center.x, center.y + size * 0.025);
    }

    // Current Time Needle (High-precision continuous hand)
    const currentAngle = (currentTotalMinutes / 1440) * 2 * Math.PI - Math.PI / 2;
    const needleCos = Math.cos(currentAngle);
    const needleSin = Math.sin(currentAngle);

    // Needle line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center.x + hubRadius * 0.9 * needleCos, center.y + hubRadius * 0.9 * needleSin);
    ctx.lineTo(center.x + (radius + 6) * needleCos, center.y + (radius + 6) * needleSin);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.shadowColor = 'rgba(59, 130, 246, 0.7)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Needle pointer tip circle
    ctx.beginPath();
    ctx.arc(center.x + (radius + 5) * needleCos, center.y + (radius + 5) * needleSin, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

  }, [tasks, currentTime, timeToAngle, durationToAngle, currentTotalMinutes, activeTask]);

  // Handle Resize and high-DPI scaling
  useEffect(() => {
    let animFrameId: number | null = null;

    const handleResize = () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      animFrameId = requestAnimationFrame(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const rect = container.getBoundingClientRect();
        if (rect.width === 0) return;
        const dpr = window.devicePixelRatio || 1;
        const displaySize = Math.floor(Math.min(rect.width, 460));

        const targetPhysicalSize = displaySize * dpr;
        if (canvas.width !== targetPhysicalSize || canvas.height !== targetPhysicalSize) {
          canvas.width = targetPhysicalSize;
          canvas.height = targetPhysicalSize;
          canvas.style.width = `${displaySize}px`;
          canvas.style.height = `${displaySize}px`;
        }

        drawClock();
      });
    };

    handleResize();
    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      observer.disconnect();
    };
  }, [drawClock]);

  // Re-draw when tasks or time change
  useEffect(() => {
    drawClock();
  }, [drawClock]);

  // Mouse move and click detection on clock segments
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const center = { x: rect.width / 2, y: rect.height / 2 };
    const dx = x - center.x;
    const dy = y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const radius = rect.width * 0.44;
    const innerR = radius * 0.58;
    const outerR = radius * 0.88;

    if (dist >= innerR && dist <= outerR) {
      let angle = Math.atan2(dy, dx);
      let normAngle = angle + Math.PI / 2;
      if (normAngle < 0) normAngle += 2 * Math.PI;

      const clickedMinutes = (normAngle / (2 * Math.PI)) * 1440;

      const hit = tasks.find((t) => {
        const [h, m] = t.time.split(':').map(Number);
        const startMin = h * 60 + (m || 0);
        const endMin = startMin + t.duration;
        if (endMin <= 1440) {
          return clickedMinutes >= startMin && clickedMinutes < endMin;
        } else {
          return clickedMinutes >= startMin || clickedMinutes < (endMin - 1440);
        }
      });

      if (hit) {
        setHoveredSegment({
          task: hit,
          x: e.clientX,
          y: e.clientY,
          startAngle: 0,
          endAngle: 0,
        });
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredSegment(null);
    canvas.style.cursor = 'default';
  };

  const handleCanvasClick = () => {
    if (hoveredSegment && onTaskClick) {
      onTaskClick(hoveredSegment.task);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-md xl:max-w-lg mx-auto select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredSegment(null)}
        onClick={handleCanvasClick}
        className="rounded-full shadow-lg transition-transform active:scale-[0.99]"
      />

      {/* Interactive Tooltip on Hover */}
      {hoveredSegment && (
        <div
          style={{ left: `${hoveredSegment.x + 12}px`, top: `${hoveredSegment.y - 40}px` }}
          className="fixed pointer-events-none z-50 px-2.5 py-1.5 bg-[#0f172a]/95 border border-blue-500/40 text-slate-100 rounded shadow-xl backdrop-blur-md text-[11px] whitespace-nowrap animate-fade-in font-mono"
        >
          <div className="flex items-center gap-2 font-bold">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: SUBJECT_METAS[hoveredSegment.task.subject]?.color || '#3b82f6' }}
            />
            <span className="font-sans font-semibold">{hoveredSegment.task.task}</span>
          </div>
          <div className="text-slate-400 mt-0.5 flex gap-2.5 text-[10px]">
            <span>TIME: {hoveredSegment.task.time}</span>
            <span>DUR: {hoveredSegment.task.duration}m</span>
            <span className={hoveredSegment.task.done ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {hoveredSegment.task.done ? 'DONE' : 'PENDING'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
