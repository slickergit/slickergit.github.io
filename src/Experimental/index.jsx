import React, { useRef, useEffect, useState, useCallback } from "react";

const GraffitiSlicker = ({ onUnlock, onEnter }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [userDrawingEnabled, setUserDrawingEnabled] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [isHoveringCorner, setIsHoveringCorner] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [autoDrawComplete, setAutoDrawComplete] = useState(false);
  const animationFrameRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const sprayStartTime = useRef(0);

  const config = {
    minRadius: 3,
    maxRadius: 35,
    expandTime: 800,
    baseDensity: 30,
    maxDensity: 80,
    particleSize: 1.2,
  };

  // Graffiti style letter paths - chunky, bold, with style
  const getLetterPaths = (startX, startY, scale) => {
    const letters = {
      S: [
        { x: 70, y: 5 },
        { x: 50, y: 0 },
        { x: 25, y: 0 },
        { x: 8, y: 12 },
        { x: 0, y: 30 },
        { x: 5, y: 45 },
        { x: 20, y: 52 },
        { x: 45, y: 58 },
        { x: 65, y: 68 },
        { x: 72, y: 82 },
        { x: 65, y: 98 },
        { x: 45, y: 108 },
        { x: 20, y: 108 },
        { x: 0, y: 95 },
      ],
      L: [
        { x: 15, y: 0 },
        { x: 12, y: 35 },
        { x: 10, y: 70 },
        { x: 8, y: 108 },
        { x: 25, y: 108 },
        { x: 45, y: 110 },
        { x: 65, y: 108 },
      ],
      I: [
        { x: 25, y: 0 },
        { x: 28, y: 30 },
        { x: 25, y: 60 },
        { x: 28, y: 90 },
        { x: 25, y: 108 },
      ],
      C: [
        { x: 65, y: 18 },
        { x: 50, y: 5 },
        { x: 30, y: 0 },
        { x: 12, y: 10 },
        { x: 0, y: 35 },
        { x: 0, y: 55 },
        { x: 0, y: 75 },
        { x: 10, y: 98 },
        { x: 30, y: 108 },
        { x: 50, y: 105 },
        { x: 65, y: 92 },
      ],
      K: [
        { x: 12, y: 0 },
        { x: 10, y: 55 },
        { x: 12, y: 108 },
        null,
        { x: 15, y: 58 },
        { x: 35, y: 35 },
        { x: 55, y: 12 },
        { x: 70, y: 0 },
        null,
        { x: 15, y: 58 },
        { x: 40, y: 78 },
        { x: 60, y: 95 },
        { x: 75, y: 108 },
      ],
      E: [
        { x: 65, y: 5 },
        { x: 35, y: 0 },
        { x: 12, y: 0 },
        { x: 10, y: 35 },
        { x: 10, y: 70 },
        { x: 12, y: 108 },
        { x: 40, y: 108 },
        { x: 65, y: 105 },
        null,
        { x: 15, y: 52 },
        { x: 35, y: 55 },
        { x: 52, y: 52 },
      ],
      R: [
        { x: 12, y: 108 },
        { x: 10, y: 70 },
        { x: 12, y: 35 },
        { x: 12, y: 0 },
        { x: 35, y: 0 },
        { x: 55, y: 5 },
        { x: 65, y: 20 },
        { x: 65, y: 38 },
        { x: 55, y: 52 },
        { x: 35, y: 55 },
        { x: 15, y: 55 },
        null,
        { x: 35, y: 55 },
        { x: 50, y: 75 },
        { x: 65, y: 95 },
        { x: 75, y: 108 },
      ],
    };

    return Object.entries(letters).map(([letter, path], index) => ({
      letter,
      path: path.map((p) =>
        p
          ? {
              x: startX + index * 90 * scale + p.x * scale,
              y: startY + p.y * scale,
            }
          : null
      ),
    }));
  };

  // Letter-based spray - sprays letters from "SLICKER" instead of dots
  const sprayLettersAt = useCallback(
    (context, x, y, radius, density, opacity = 1) => {
      const letters = "SLICKER";

      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        // More concentrated center with occasional far spray
        const randomDist =
          Math.random() < 0.85 ? Math.random() * Math.random() : Math.random();
        const distance = randomDist * radius;

        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;

        const distanceRatio = distance / radius;
        const letterOpacity = (0.92 - distanceRatio * 0.45) * opacity;

        // Pick a random letter from SLICKER
        const letter = letters[Math.floor(Math.random() * letters.length)];

        // Font size varies based on distance from center - closer = bigger
        const fontSize = (4 + Math.random() * 8) * (1 - distanceRatio * 0.5);
        const rotation = (Math.random() - 0.5) * 1.2;

        context.save();
        context.translate(px, py);
        context.rotate(rotation);
        context.font = `bold ${fontSize}px Arial, sans-serif`;
        context.fillStyle = `rgba(255, 255, 255, ${letterOpacity})`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(letter, 0, 0);
        context.restore();
      }
    },
    []
  );

  // Draw drip effect with letters - called during drawing
  const drawDripAnimated = useCallback((context, x, y) => {
    const letters = "SLICKER";
    const dripLength = 20 + Math.random() * 45;
    const steps = Math.floor(dripLength / 2.5);
    let currentY = y;
    const wobbleAmount = (Math.random() - 0.5) * 3;
    let currentX = x;

    const animateDrip = (step) => {
      if (step >= steps) return;

      const progress = step / steps;
      const density = Math.floor(3 * (1 - progress * 0.5));
      const opacity = 0.9 - progress * 0.35;

      // Wobble and drift
      currentX +=
        Math.sin(step * 0.4) * wobbleAmount * 0.3 + (Math.random() - 0.5) * 1.5;
      const dropSpeed = 2.5 + progress * 2;
      currentY += dropSpeed;

      // Draw letters for drip
      for (let i = 0; i < density; i++) {
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const fontSize = 3 + Math.random() * 4 * (1 - progress * 0.5);
        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 4;
        const rotation = (Math.random() - 0.5) * 0.8;

        context.save();
        context.translate(currentX + offsetX, currentY + offsetY);
        context.rotate(rotation);
        context.font = `bold ${fontSize}px Arial, sans-serif`;
        context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(letter, 0, 0);
        context.restore();
      }

      // Variable timing - accelerates as it falls
      const delay = Math.max(8, 18 - progress * 12) + Math.random() * 5;
      setTimeout(() => animateDrip(step + 1), delay);
    };

    animateDrip(0);
  }, []);

  // Auto-draw the graffiti text with letter spray animation
  const autoDrawGraffiti = useCallback(
    async (context, canvas) => {
      const scale = Math.min(canvas.width / 750, canvas.height / 280) * 0.75;
      const startX = (canvas.width - 620 * scale) / 2;
      const startY = (canvas.height - 108 * scale) / 2;

      const letterPaths = getLetterPaths(startX, startY, scale);

      // Track spray accumulation for drips
      let accumulatedSpray = 0;
      let lastDripTime = 0;

      // Draw each letter with letter spray effect
      for (let l = 0; l < letterPaths.length; l++) {
        const { path } = letterPaths[l];

        let segments = [[]];
        path.forEach((p) => {
          if (p === null) {
            segments.push([]);
          } else {
            segments[segments.length - 1].push(p);
          }
        });

        // Each letter has slightly different characteristics
        const letterPressure = 0.7 + Math.random() * 0.5;
        const letterSpeed = 0.8 + Math.random() * 0.6;
        const letterWobble = 1 + Math.random() * 2;

        // Draw each segment
        for (const segment of segments) {
          if (segment.length < 2) continue;

          // Pause before starting new segment (hand repositioning)
          if (Math.random() > 0.5) {
            await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));
          }

          for (let i = 0; i < segment.length - 1; i++) {
            const start = segment[i];
            const end = segment[i + 1];
            const dist = Math.sqrt(
              (end.x - start.x) ** 2 + (end.y - start.y) ** 2
            );
            const steps = Math.max(Math.floor(dist / 5), 1);

            // Direction affects spray behavior
            const isGoingDown = end.y > start.y;
            const isGoingUp = end.y < start.y;

            for (let s = 0; s <= steps; s++) {
              const t = s / steps;

              // Organic wobble - varies throughout stroke
              const strokeProgress = (i + t) / segment.length;
              const wobbleIntensity =
                letterWobble * (0.7 + Math.sin(strokeProgress * 5) * 0.3);
              const wobbleX = (Math.random() - 0.5) * wobbleIntensity;
              const wobbleY = (Math.random() - 0.5) * wobbleIntensity;

              const x = start.x + (end.x - start.x) * t + wobbleX;
              const y = start.y + (end.y - start.y) * t + wobbleY;

              // Pressure varies - heavier at start of strokes, lighter at ends
              const strokePressure =
                letterPressure * (0.85 + Math.sin(t * Math.PI) * 0.25);
              const radius =
                18 * scale * strokePressure * (0.9 + Math.random() * 0.2);
              // Higher density for letters to create solid coverage
              const density = Math.floor(
                25 * strokePressure * (0.85 + Math.random() * 0.3)
              );

              // Use letter-based spray instead of dots
              sprayLettersAt(context, x, y, radius, density);

              // Track spray for drips
              accumulatedSpray += density * 0.15;

              // Natural drip conditions
              const now = Date.now();
              const timeSinceDrip = now - lastDripTime;
              const dripChance = isGoingDown
                ? 0.015
                : isGoingUp
                ? 0.003
                : 0.008;
              const accumulationBonus = Math.min(
                accumulatedSpray * 0.002,
                0.02
              );

              if (
                timeSinceDrip > 200 &&
                Math.random() < dripChance + accumulationBonus &&
                accumulatedSpray > 15
              ) {
                drawDripAnimated(context, x + (Math.random() - 0.5) * 6, y);
                accumulatedSpray *= 0.3;
                lastDripTime = now;
              }

              // Variable delay - more organic timing
              const baseDelay = 1.5 / letterSpeed;
              const randomPause = Math.random() > 0.92 ? Math.random() * 15 : 0;
              const speedVariation = Math.random() * 2;
              await new Promise((r) =>
                setTimeout(r, baseDelay + randomPause + speedVariation)
              );
            }
          }
        }

        // Chance for drip at end of letter if lots of paint accumulated
        if (accumulatedSpray > 25 && Math.random() > 0.5) {
          const validPoints = path.filter((p) => p !== null);
          const bottomPoints = validPoints.filter(
            (p) => p.y > startY + 70 * scale
          );
          const dripPoint =
            bottomPoints.length > 0
              ? bottomPoints[Math.floor(Math.random() * bottomPoints.length)]
              : validPoints[Math.floor(Math.random() * validPoints.length)];
          if (dripPoint) {
            drawDripAnimated(
              context,
              dripPoint.x + (Math.random() - 0.5) * 8,
              dripPoint.y
            );
            accumulatedSpray = 0;
          }
        }

        // Pause between letters - like moving to next letter
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 80));
      }

      setAutoDrawComplete(true);
    },
    [sprayLettersAt, drawDripAnimated]
  );

  // Wipe animation
  const wipeCanvas = useCallback((context, canvas) => {
    return new Promise((resolve) => {
      setIsWiping(true);
      const wipeWidth = 100;
      let currentX = -wipeWidth;

      const animate = () => {
        // Draw wipe effect
        const gradient = context.createLinearGradient(
          currentX,
          0,
          currentX + wipeWidth,
          0
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(0.4, "rgba(60, 60, 60, 0.9)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

        context.fillStyle = gradient;
        context.fillRect(currentX, 0, wipeWidth, canvas.height);

        // Clear behind the wipe
        context.fillStyle = "black";
        context.fillRect(0, 0, currentX + wipeWidth * 0.2, canvas.height);

        currentX += 20;

        if (currentX < canvas.width + wipeWidth) {
          requestAnimationFrame(animate);
        } else {
          context.fillStyle = "black";
          context.fillRect(0, 0, canvas.width, canvas.height);
          setIsWiping(false);
          resolve();
        }
      };

      animate();
    });
  }, []);

  // Handle corner click to enable drawing
  const handleCornerClick = useCallback(
    async (e) => {
      e.stopPropagation();
      if (isWiping || !ctx || !canvasRef.current) return;

      await wipeCanvas(ctx, canvasRef.current);
      setShowCursor(true);
      setUserDrawingEnabled(true);

      if (onUnlock) {
        onUnlock();
      }
    },
    [ctx, isWiping, wipeCanvas, onUnlock]
  );

  // Handle arrow click to enter the site
  const handleEnterClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onEnter) {
        onEnter();
      }
    },
    [onEnter]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const context = canvas.getContext("2d");
      setCtx(context);

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Start auto-drawing after a short delay
      setTimeout(() => {
        autoDrawGraffiti(context, canvas);
      }, 500);
    }
  }, [autoDrawGraffiti]);

  // Hide system cursor when custom cursor is shown
  useEffect(() => {
    if (showCursor) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "auto";
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [showCursor]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    return () =>
      document.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  const sprayPaint = useCallback(() => {
    if (!ctx || !isDrawing || !userDrawingEnabled) return;

    const letters = "SLICKER";
    const elapsedTime = Date.now() - sprayStartTime.current;
    const expansionProgress = Math.min(elapsedTime / config.expandTime, 1);
    const easedProgress = 1 - Math.pow(1 - expansionProgress, 3);

    const currentRadius =
      config.minRadius + (config.maxRadius - config.minRadius) * easedProgress;
    const currentDensity = Math.floor(2 + 6 * easedProgress);

    for (let i = 0; i < currentDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const randomDist = Math.random() * Math.random();
      const distance = randomDist * currentRadius;

      const x = mousePos.current.x + Math.cos(angle) * distance;
      const y = mousePos.current.y + Math.sin(angle) * distance;

      const distanceRatio = distance / currentRadius;
      const opacity = 0.85 - distanceRatio * 0.35;

      const letter = letters[Math.floor(Math.random() * letters.length)];
      const fontSize = 5 + Math.random() * 7;
      const rotation = (Math.random() - 0.5) * 0.8;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, 0, 0);
      ctx.restore();
    }

    animationFrameRef.current = requestAnimationFrame(sprayPaint);
  }, [ctx, isDrawing, userDrawingEnabled, config]);

  const handleMouseDown = (e) => {
    if (!userDrawingEnabled) return;
    setIsDrawing(true);
    sprayStartTime.current = Date.now();
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    if (isDrawing && userDrawingEnabled) {
      sprayPaint();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDrawing, userDrawingEnabled, sprayPaint]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "black",
        cursor: showCursor ? "none" : "auto",
        position: "relative",
      }}
    >
      {/* Custom spray can cursor */}
      {showCursor && (
        <div
          style={{
            position: "fixed",
            left: cursorPos.x,
            top: cursorPos.y,
            width: "50px",
            height: "50px",
            pointerEvents: "none",
            zIndex: 9999,
            transform: "translate(-25px, 0)",
            filter: "invert(1)",
          }}
        >
          <img
            src="/assets/spray-can.png"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </div>
      )}

      {/* Corner trigger - spray can to enable drawing */}
      {autoDrawComplete && !userDrawingEnabled && (
        <div
          onMouseEnter={() => setIsHoveringCorner(true)}
          onMouseLeave={() => setIsHoveringCorner(false)}
          onClick={handleCornerClick}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: isHoveringCorner ? "50px" : "30px",
            height: isHoveringCorner ? "50px" : "30px",
            backgroundColor: "white",
            clipPath: isHoveringCorner
              ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
              : "polygon(100% 0, 100% 100%, 0 0)",
            cursor: "pointer",
            transition: "all 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <img
            src="/assets/spray-can.png"
            alt="Start drawing"
            style={{
              width: "28px",
              height: "28px",
              opacity: isHoveringCorner ? 1 : 0,
              transform: isHoveringCorner ? "scale(1)" : "scale(0.3)",
              transition: "all 0.25s ease",
            }}
          />
        </div>
      )}

      {/* Arrow button to enter site */}
      {userDrawingEnabled && (
        <div
          onMouseEnter={() => setIsHoveringCorner(true)}
          onMouseLeave={() => setIsHoveringCorner(false)}
          onClick={handleEnterClick}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: isHoveringCorner ? "50px" : "30px",
            height: isHoveringCorner ? "50px" : "30px",
            backgroundColor: "white",
            clipPath: isHoveringCorner
              ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
              : "polygon(100% 0, 100% 100%, 0 0)",
            cursor: "pointer",
            transition: "all 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: "22px",
              height: "22px",
              opacity: isHoveringCorner ? 1 : 0,
              transform: isHoveringCorner ? "scale(1)" : "scale(0.3)",
              transition: "all 0.25s ease",
            }}
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
};

export default GraffitiSlicker;
