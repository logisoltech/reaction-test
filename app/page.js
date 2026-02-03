"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// Ruler component with realistic cm markings
function Ruler({ height = 300 }) {
  const cmCount = 30; // 30 cm ruler
  const pxPerCm = height / cmCount;

  return (
    <div
      className="relative bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 rounded-sm shadow-md"
      style={{ width: 48, height }}
    >
      {/* Wood grain effect */}
      <div
        className="absolute inset-0 opacity-20 rounded-sm"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.3) 2px,
            rgba(139, 69, 19, 0.3) 4px
          )`,
        }}
      />

      {/* Measurement markings */}
      <div className="absolute right-0 top-0 h-full">
        {Array.from({ length: cmCount + 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute right-0 flex items-center"
            style={{ top: i * pxPerCm }}
          >
            {/* Main cm line */}
            <div
              className="bg-gray-800"
              style={{
                width: i % 5 === 0 ? 16 : i % 1 === 0 ? 10 : 6,
                height: 1.5,
              }}
            />
            {/* Number label every 5 cm */}
            {i % 5 === 0 && i > 0 && (
              <span
                className="absolute text-gray-800 font-bold"
                style={{
                  fontSize: 8,
                  right: 20,
                  top: -5,
                }}
              >
                {i}
              </span>
            )}
          </div>
        ))}

        {/* Half cm marks */}
        {Array.from({ length: cmCount }).map((_, i) => (
          <div
            key={`half-${i}`}
            className="absolute right-0"
            style={{ top: i * pxPerCm + pxPerCm / 2 }}
          >
            <div className="bg-gray-600" style={{ width: 6, height: 1 }} />
          </div>
        ))}
      </div>

      {/* Left side markings (mm) */}
      <div className="absolute left-0 top-0 h-full">
        {Array.from({ length: cmCount * 10 + 1 }).map((_, i) => (
          <div
            key={`mm-${i}`}
            className="absolute left-0"
            style={{ top: i * (pxPerCm / 10) }}
          >
            <div
              className="bg-gray-700"
              style={{
                width: i % 10 === 0 ? 8 : i % 5 === 0 ? 5 : 3,
                height: 1,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReactionTest() {
  const rulerRef = useRef(null);
  const startTime = useRef(0);
  const crossedLineTime = useRef(null);
  const animationRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [distanceCm, setDistanceCm] = useState(0);
  const [realtimeCm, setRealtimeCm] = useState(0);
  const [realtimeMs, setRealtimeMs] = useState(0);
  const [reaction, setReaction] = useState(null);
  const [hasCrossedLine, setHasCrossedLine] = useState(false);
  const [tooSoon, setTooSoon] = useState(false);

  const gravity = 980; // cm/s²
  const pxPerCm = 10; // pixels per cm for animation
  const rulerHeight = 400; // ruler height in pixels
  const lineBottomOffset = 80; // px from bottom where the black line is
  const rulerStartOffset = rulerHeight - 80; // ruler starts with 80px visible

  const startDrop = () => {
    setReaction(null);
    setDistanceCm(0);
    setRealtimeCm(0);
    setRealtimeMs(0);
    setRunning(true);
    setHasCrossedLine(false);
    setTooSoon(false);
    crossedLineTime.current = null;

    if (rulerRef.current) {
      rulerRef.current.style.transform = `translateY(0px)`;
    }

    startTime.current = performance.now();
    animationRef.current = requestAnimationFrame(dropLoop);
  };

  const stopDrop = () => {
    if (!running) return;

    cancelAnimationFrame(animationRef.current);

    // Only count time/distance after crossing the line
    if (crossedLineTime.current) {
      const elapsed = (performance.now() - crossedLineTime.current) / 1000;
      const d = 0.5 * gravity * elapsed * elapsed;
      setDistanceCm(d);
      setReaction(elapsed);
    } else {
      // Caught before crossing the line
      setTooSoon(true);
    }
    
    setRunning(false);
  };

  const dropLoop = () => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    const totalDropPx = 0.5 * gravity * elapsed * elapsed * pxPerCm;

    if (rulerRef.current) {
      rulerRef.current.style.transform = `translateY(${totalDropPx}px)`;
    }

    // Check if ruler bottom has crossed the line
    // Line is at (window.innerHeight - lineBottomOffset) from top
    // Ruler bottom position = 80px (initial visible) + drop distance
    const linePositionFromTop = window.innerHeight - lineBottomOffset;
    const rulerBottomPos = 80 + totalDropPx;

    if (rulerBottomPos >= linePositionFromTop && !crossedLineTime.current) {
      crossedLineTime.current = performance.now();
      setHasCrossedLine(true);
    }

    // Update real-time display only after crossing line
    if (crossedLineTime.current) {
      const timeSinceCross = (performance.now() - crossedLineTime.current) / 1000;
      const cmSinceCross = 0.5 * gravity * timeSinceCross * timeSinceCross;
      setRealtimeCm(cmSinceCross);
      setRealtimeMs(timeSinceCross * 1000);
    }

    animationRef.current = requestAnimationFrame(dropLoop);
  };

  // Handle spacebar press
  const handleAction = useCallback(() => {
    if (running) {
      stopDrop();
    } else {
      startDrop();
    }
  }, [running]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  return (
    <div
      onClick={handleAction}
      className="fixed inset-0 bg-white overflow-hidden cursor-pointer select-none"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Left side - Text content */}
      <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2">
        <div className="text-left">
          {!running && reaction === null && !tooSoon && (
            <>
              <p className="text-2xl font-bold text-stone-800">Your turn:</p>
              <p className="text-sm text-stone-500">(tap or space to start)</p>
            </>
          )}

          {running && (
            <>
              <p className="text-2xl font-bold text-stone-800">Your turn:</p>
              <p className="text-sm text-stone-500">(tap or space to catch)</p>
              
              {/* Real-time tracking */}
              <div className="mt-6">
                <p className="text-4xl font-bold text-stone-800 tabular-nums">
                  {realtimeCm.toFixed(1)} <span className="text-xl">cm</span>
                </p>
                <p className="text-2xl text-amber-600 font-semibold tabular-nums">
                  {realtimeMs.toFixed(0)} <span className="text-base">ms</span>
                </p>
              </div>
            </>
          )}

          {tooSoon && !running && (
            <>
              <p className="text-3xl font-bold text-red-500 mb-2">Too soon!</p>
              <p className="text-sm text-stone-500">Wait for the ruler to cross the line</p>
              <p className="mt-4 text-sm text-stone-500">tap or space to retry</p>
            </>
          )}

          {reaction !== null && !tooSoon && (
            <>
              <p className="text-lg text-stone-500 mb-2">Result:</p>
              <p className="text-4xl font-bold text-stone-800 mb-1">
                {distanceCm.toFixed(1)} <span className="text-xl">cm</span>
              </p>
              <p className="text-2xl text-amber-600 font-semibold">
                {(reaction * 1000).toFixed(0)} <span className="text-base">ms</span>
              </p>
              <p className="mt-4 text-sm text-stone-500">tap or space to retry</p>
            </>
          )}
        </div>
      </div>

      {/* Right side - Ruler */}
      <div
        ref={rulerRef}
        className="absolute right-16 md:right-24"
        style={{ top: -rulerStartOffset }}
      >
        <Ruler height={rulerHeight} />
      </div>

      {/* Black line - the measurement start line */}
      <div 
        className="absolute left-0 right-0 border-t-2 border-stone-800"
        style={{ bottom: lineBottomOffset }}
      />
    </div>
  );
}
