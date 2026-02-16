"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
  BLACK: "#000000",
  RED: "#E10600",
  WHITE: "#FFFFFF",
} as const;

const GAME_DURATION = 15; // seconds
const IDLE_TIMEOUT = 10000; // ms
const WIN_SCORE = 12;
const LANE_COUNT = 3;
const SPAWN_INTERVAL = 600; // ms between obstacle/collectible spawns
const VAN_WIDTH_RATIO = 0.08; // relative to canvas width
const VAN_HEIGHT_RATIO = 0.06; // relative to canvas height
const OBJECT_SPEED_BASE = 3; // base pixels per frame (scaled)
const SWIPE_THRESHOLD = 30; // px

// Object types for spawning
type GameObjectType = "parcel" | "address_tag" | "roadblock" | "cone";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: GameObjectType;
  lane: number;
}

interface GameState {
  vanLane: number;
  vanX: number;
  vanY: number;
  vanWidth: number;
  vanHeight: number;
  score: number;
  timeLeft: number;
  objects: GameObject[];
  roadOffset: number;
  isRunning: boolean;
  lastSpawnTime: number;
  startTime: number;
  flashTimer: number;
  flashType: string;
}

// =============================================================================
// SCREEN STATES
// =============================================================================

type ScreenState = "landing" | "playing" | "success" | "failure";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const NotFound = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [screen, setScreen] = useState<ScreenState>("landing");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [showIdle, setShowIdle] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // ---------------------------------------------------------------------------
  // IDLE BEHAVIOR
  // ---------------------------------------------------------------------------

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setShowIdle(false);
    idleTimerRef.current = setTimeout(() => {
      setShowIdle(true);
    }, IDLE_TIMEOUT);
  }, []);

  // ---------------------------------------------------------------------------
  // CANVAS SIZING
  // ---------------------------------------------------------------------------

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    setCanvasSize({ w, h });
  }, []);

  // ---------------------------------------------------------------------------
  // GAME INITIALIZATION
  // ---------------------------------------------------------------------------

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const vanW = Math.max(40, w * VAN_WIDTH_RATIO);
    const vanH = Math.max(60, h * VAN_HEIGHT_RATIO);
    const laneWidth = w / LANE_COUNT;
    const startLane = 1; // middle lane

    const state: GameState = {
      vanLane: startLane,
      vanX: laneWidth * startLane + laneWidth / 2 - vanW / 2,
      vanY: h - vanH - 30,
      vanWidth: vanW,
      vanHeight: vanH,
      score: 0,
      timeLeft: GAME_DURATION,
      objects: [],
      roadOffset: 0,
      isRunning: true,
      lastSpawnTime: 0,
      startTime: performance.now(),
      flashTimer: 0,
      flashType: "",
    };

    gameStateRef.current = state;
    setScore(0);
    setTimeLeft(GAME_DURATION);
  }, []);

  // ---------------------------------------------------------------------------
  // LANE MOVEMENT
  // ---------------------------------------------------------------------------

  const moveVan = useCallback((direction: "left" | "right") => {
    const gs = gameStateRef.current;
    if (!gs || !gs.isRunning || !canvasRef.current) return;

    if (direction === "left" && gs.vanLane > 0) {
      gs.vanLane -= 1;
    } else if (direction === "right" && gs.vanLane < LANE_COUNT - 1) {
      gs.vanLane += 1;
    }

    const w = canvasRef.current.width;
    const laneWidth = w / LANE_COUNT;
    gs.vanX = laneWidth * gs.vanLane + laneWidth / 2 - gs.vanWidth / 2;
  }, []);

  // ---------------------------------------------------------------------------
  // SPAWNING
  // ---------------------------------------------------------------------------

  const spawnObject = useCallback((w: number, h: number) => {
    const gs = gameStateRef.current;
    if (!gs) return;

    const laneWidth = w / LANE_COUNT;
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const rand = Math.random();

    let type: GameObjectType;
    if (rand < 0.35) type = "parcel";
    else if (rand < 0.50) type = "address_tag";
    else if (rand < 0.80) type = "roadblock";
    else type = "cone";

    const objW = Math.max(24, laneWidth * 0.35);
    const objH = type === "cone" ? objW : Math.max(24, laneWidth * 0.3);

    gs.objects.push({
      x: laneWidth * lane + laneWidth / 2 - objW / 2,
      y: -objH,
      width: objW,
      height: objH,
      type,
      lane,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // DRAWING FUNCTIONS
  // ---------------------------------------------------------------------------

  const drawRoad = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, offset: number) => {
    // Black background
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, w, h);

    // Lane dividers — white dashed lines
    const laneWidth = w / LANE_COUNT;
    ctx.strokeStyle = COLORS.WHITE;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -offset;

    for (let i = 1; i < LANE_COUNT; i++) {
      const x = laneWidth * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Road edges
    ctx.strokeStyle = COLORS.RED;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 1, 0);
    ctx.lineTo(w - 1, h);
    ctx.stroke();
  }, []);

  const drawVan = useCallback((ctx: CanvasRenderingContext2D, gs: GameState) => {
    const { vanX, vanY, vanWidth, vanHeight } = gs;

    // Van body — white
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillRect(vanX, vanY, vanWidth, vanHeight);

    // Red stripe across middle
    const stripeH = vanHeight * 0.15;
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(vanX, vanY + vanHeight * 0.4, vanWidth, stripeH);

    // Windshield
    ctx.fillStyle = COLORS.BLACK;
    const windshieldMargin = vanWidth * 0.15;
    ctx.fillRect(vanX + windshieldMargin, vanY + 4, vanWidth - windshieldMargin * 2, vanHeight * 0.2);

    // Wheels
    ctx.fillStyle = COLORS.BLACK;
    const wheelW = vanWidth * 0.15;
    const wheelH = vanHeight * 0.12;
    ctx.fillRect(vanX - 2, vanY + vanHeight * 0.15, wheelW, wheelH);
    ctx.fillRect(vanX + vanWidth - wheelW + 2, vanY + vanHeight * 0.15, wheelW, wheelH);
    ctx.fillRect(vanX - 2, vanY + vanHeight * 0.75, wheelW, wheelH);
    ctx.fillRect(vanX + vanWidth - wheelW + 2, vanY + vanHeight * 0.75, wheelW, wheelH);
  }, []);

  const drawObject = useCallback((ctx: CanvasRenderingContext2D, obj: GameObject) => {
    const { x, y, width, height, type } = obj;

    switch (type) {
      case "parcel": {
        // White parcel box
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(x, y, width, height);
        // Cross tape
        ctx.strokeStyle = COLORS.RED;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2, y + height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width, y + height / 2);
        ctx.stroke();
        // "+1" label
        ctx.fillStyle = COLORS.RED;
        ctx.font = `bold ${Math.max(10, width * 0.35)}px 'Inter', monospace`;
        ctx.textAlign = "center";
        ctx.fillText("+1", x + width / 2, y - 4);
        break;
      }
      case "address_tag": {
        // White envelope shape
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(x, y, width, height * 0.7);
        // Flap triangle
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width / 2, y + height * 0.35);
        ctx.lineTo(x + width, y);
        ctx.closePath();
        ctx.strokeStyle = COLORS.RED;
        ctx.lineWidth = 2;
        ctx.stroke();
        // "+2" label
        ctx.fillStyle = COLORS.RED;
        ctx.font = `bold ${Math.max(10, width * 0.35)}px 'Inter', monospace`;
        ctx.textAlign = "center";
        ctx.fillText("+2", x + width / 2, y - 4);
        break;
      }
      case "roadblock": {
        // Red barrier block
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(x, y, width, height);
        // White stripes
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 2;
        const stripeCount = 3;
        for (let i = 0; i < stripeCount; i++) {
          const sx = x + (width / stripeCount) * i;
          ctx.beginPath();
          ctx.moveTo(sx, y);
          ctx.lineTo(sx + width / stripeCount, y + height);
          ctx.stroke();
        }
        break;
      }
      case "cone": {
        // Red triangle cone
        ctx.fillStyle = COLORS.RED;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        // White stripe on cone
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.6);
        ctx.lineTo(x + width * 0.7, y + height * 0.6);
        ctx.stroke();
        break;
      }
    }
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, w: number, gs: GameState) => {
    const padding = 16;

    // Score
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = `bold ${Math.max(14, w * 0.025)}px 'Inter', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("SCORE: ", padding, 30);
    const scoreTextWidth = ctx.measureText("SCORE: ").width;
    ctx.fillStyle = COLORS.RED;
    ctx.fillText(`${gs.score}`, padding + scoreTextWidth, 30);

    // Timer
    ctx.fillStyle = COLORS.WHITE;
    ctx.textAlign = "right";
    ctx.fillText("TIME: ", w - padding - ctx.measureText(`${gs.timeLeft}s`).width, 30);
    const timeLabel = ctx.measureText("TIME: ").width;
    ctx.fillStyle = COLORS.RED;
    ctx.textAlign = "right";
    ctx.fillText(`${gs.timeLeft}s`, w - padding, 30);

    // Flash effect for score changes
    if (gs.flashTimer > 0) {
      ctx.fillStyle = gs.flashType === "positive" ? COLORS.WHITE : COLORS.RED;
      ctx.globalAlpha = gs.flashTimer / 30;
      ctx.font = `bold ${Math.max(20, w * 0.05)}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      const flashText = gs.flashType === "positive" ? "+1" : (gs.flashType === "bonus" ? "+2" : "-1");
      ctx.fillText(flashText, w / 2, gs.vanY - 20);
      ctx.globalAlpha = 1;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // COLLISION DETECTION
  // ---------------------------------------------------------------------------

  const checkCollision = useCallback((gs: GameState) => {
    const vanLeft = gs.vanX;
    const vanRight = gs.vanX + gs.vanWidth;
    const vanTop = gs.vanY;
    const vanBottom = gs.vanY + gs.vanHeight;

    for (let i = gs.objects.length - 1; i >= 0; i--) {
      const obj = gs.objects[i];
      const objLeft = obj.x;
      const objRight = obj.x + obj.width;
      const objTop = obj.y;
      const objBottom = obj.y + obj.height;

      // AABB collision
      if (vanLeft < objRight && vanRight > objLeft && vanTop < objBottom && vanBottom > objTop) {
        // Remove object
        gs.objects.splice(i, 1);

        switch (obj.type) {
          case "parcel":
            gs.score += 1;
            gs.flashTimer = 25;
            gs.flashType = "positive";
            break;
          case "address_tag":
            gs.score += 2;
            gs.flashTimer = 25;
            gs.flashType = "bonus";
            break;
          case "roadblock":
          case "cone":
            gs.score -= 1;
            gs.flashTimer = 25;
            gs.flashType = "negative";
            break;
        }

        setScore(gs.score);
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // GAME LOOP
  // ---------------------------------------------------------------------------

  const gameLoop = useCallback((timestamp: number) => {
    const gs = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!gs || !canvas || !gs.isRunning) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Delta time for consistent speed
    const dt = lastFrameTimeRef.current ? (timestamp - lastFrameTimeRef.current) / 16.67 : 1;
    lastFrameTimeRef.current = timestamp;

    // Clamp dt to avoid huge jumps
    const clampedDt = Math.min(dt, 3);

    // ------- UPDATE -------

    // Road scroll
    const speed = OBJECT_SPEED_BASE * (h / 600) * clampedDt;
    gs.roadOffset = (gs.roadOffset + speed * 2) % 35;

    // Timer
    const elapsed = (timestamp - gs.startTime) / 1000;
    const remaining = Math.max(0, GAME_DURATION - Math.floor(elapsed));
    if (remaining !== gs.timeLeft) {
      gs.timeLeft = remaining;
      setTimeLeft(remaining);
    }

    // End game
    if (remaining <= 0) {
      gs.isRunning = false;
      setScore(gs.score);
      if (gs.score >= WIN_SCORE) {
        setScreen("success");
      } else {
        setScreen("failure");
      }
      return;
    }

    // Spawn objects
    if (timestamp - gs.lastSpawnTime > SPAWN_INTERVAL) {
      gs.lastSpawnTime = timestamp;
      spawnObject(w, h);
    }

    // Move objects downward
    for (let i = gs.objects.length - 1; i >= 0; i--) {
      gs.objects[i].y += speed;
      // Remove off-screen
      if (gs.objects[i].y > h + 50) {
        gs.objects.splice(i, 1);
      }
    }

    // Flash timer countdown
    if (gs.flashTimer > 0) gs.flashTimer -= clampedDt;

    // Collision
    checkCollision(gs);

    // ------- DRAW -------
    drawRoad(ctx, w, h, gs.roadOffset);

    // Draw objects
    for (const obj of gs.objects) {
      drawObject(ctx, obj);
    }

    // Draw van
    drawVan(ctx, gs);

    // Draw HUD
    drawHUD(ctx, w, gs);

    // Continue loop
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [spawnObject, checkCollision, drawRoad, drawObject, drawVan, drawHUD]);

  // ---------------------------------------------------------------------------
  // START GAME
  // ---------------------------------------------------------------------------

  const startGame = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setShowIdle(false);
    updateCanvasSize();
    initGame();
    setScreen("playing");
    lastFrameTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateCanvasSize, initGame, gameLoop]);

  // ---------------------------------------------------------------------------
  // RESTART GAME
  // ---------------------------------------------------------------------------

  const restartGame = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    startGame();
  }, [startGame]);

  // ---------------------------------------------------------------------------
  // KEYBOARD INPUT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen === "landing") resetIdleTimer();
      if (screen !== "playing") return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        moveVan("left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        moveVan("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, moveVan, resetIdleTimer]);

  // ---------------------------------------------------------------------------
  // TOUCH INPUT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (screen !== "playing") return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (screen !== "playing" || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;

      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) moveVan("left");
        else moveVan("right");
      }
      touchStartRef.current = null;
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [screen, moveVan]);

  // ---------------------------------------------------------------------------
  // RESIZE HANDLER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
      const gs = gameStateRef.current;
      if (gs && canvasRef.current) {
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        gs.vanWidth = Math.max(40, w * VAN_WIDTH_RATIO);
        gs.vanHeight = Math.max(60, h * VAN_HEIGHT_RATIO);
        const laneWidth = w / LANE_COUNT;
        gs.vanX = laneWidth * gs.vanLane + laneWidth / 2 - gs.vanWidth / 2;
        gs.vanY = h - gs.vanHeight - 30;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  // ---------------------------------------------------------------------------
  // IDLE TIMER ON LANDING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (screen === "landing") {
      resetIdleTimer();

      const handleActivity = () => resetIdleTimer();
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("touchstart", handleActivity);

      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("touchstart", handleActivity);
      };
    }
  }, [screen, resetIdleTimer]);

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------------------------

  const styles = {
    container: {
      position: "fixed" as const,
      inset: 0,
      backgroundColor: COLORS.BLACK,
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
    },
    overlay: {
      position: "absolute" as const,
      inset: 0,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      padding: "24px",
    },
    heading404: {
      fontSize: "clamp(80px, 15vw, 200px)",
      fontWeight: 900,
      color: COLORS.WHITE,
      lineHeight: 1,
      margin: 0,
      letterSpacing: "-0.02em",
    },
    subtitle: {
      fontSize: "clamp(16px, 3vw, 28px)",
      fontWeight: 700,
      color: COLORS.RED,
      letterSpacing: "0.3em",
      textTransform: "uppercase" as const,
      margin: "8px 0 0",
    },
    message: {
      fontSize: "clamp(13px, 2vw, 18px)",
      color: COLORS.WHITE,
      opacity: 0.85,
      margin: "24px 0 0",
      maxWidth: 500,
      textAlign: "center" as const,
      lineHeight: 1.5,
    },
    btnPrimary: {
      backgroundColor: COLORS.RED,
      color: COLORS.WHITE,
      border: "none",
      padding: "14px 40px",
      fontSize: "clamp(14px, 2vw, 18px)",
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
      marginTop: 32,
      transition: "background-color 0.2s, transform 0.15s",
      fontFamily: "inherit",
    },
    btnOutline: {
      backgroundColor: "transparent",
      color: COLORS.WHITE,
      border: `2px solid ${COLORS.WHITE}`,
      padding: "14px 40px",
      fontSize: "clamp(14px, 2vw, 18px)",
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
      marginTop: 12,
      transition: "background-color 0.2s, transform 0.15s",
      fontFamily: "inherit",
      textDecoration: "none",
      display: "inline-block",
      textAlign: "center" as const,
    },
    canvas: {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      display: screen === "playing" ? "block" : "none",
    },
    gameHUDOverlay: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "space-between",
      padding: "16px 20px",
      zIndex: 20,
      pointerEvents: "auto" as const,
    },
    mobileBtn: {
      width: "clamp(50px, 12vw, 70px)",
      height: "clamp(50px, 12vw, 70px)",
      backgroundColor: "rgba(225, 6, 0, 0.25)",
      border: `2px solid ${COLORS.RED}`,
      color: COLORS.WHITE,
      fontSize: "clamp(20px, 5vw, 28px)",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      userSelect: "none" as const,
      fontFamily: "inherit",
    },
    endHeading: {
      fontSize: "clamp(28px, 6vw, 56px)",
      fontWeight: 900,
      lineHeight: 1.1,
      margin: 0,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
    },
    endSubtext: {
      fontSize: "clamp(14px, 2.5vw, 20px)",
      color: COLORS.WHITE,
      opacity: 0.8,
      margin: "16px 0 0",
      lineHeight: 1.5,
    },
    endScore: {
      fontSize: "clamp(16px, 3vw, 24px)",
      color: COLORS.WHITE,
      marginTop: 12,
    },
    idleMenu: {
      position: "absolute" as const,
      bottom: "clamp(20px, 5vh, 60px)",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: 10,
      zIndex: 20,
      animation: "fadeIn 0.4s ease",
    },
    idleLink: {
      color: COLORS.WHITE,
      fontSize: "clamp(13px, 2vw, 16px)",
      textDecoration: "none",
      padding: "10px 28px",
      border: `1px solid rgba(255,255,255,0.3)`,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      transition: "border-color 0.2s, background-color 0.2s",
      fontFamily: "inherit",
      textAlign: "center" as const,
      minWidth: 220,
      display: "block",
    },
    decorLine: {
      width: 60,
      height: 3,
      backgroundColor: COLORS.RED,
      margin: "20px 0",
    },
  };

  // ---------------------------------------------------------------------------
  // RENDER — LANDING SCREEN
  // ---------------------------------------------------------------------------

  if (screen === "landing") {
    return (
      <div ref={containerRef} className="cx-404-container" style={styles.container}>
        {/* CSS keyframe for idle fade-in */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          .cx-btn-primary:hover { background-color: #c10500 !important; transform: scale(1.03); }
          .cx-btn-outline:hover { background-color: rgba(255,255,255,0.08) !important; border-color: #fff !important; }
          .cx-idle-link:hover { border-color: #E10600 !important; background-color: rgba(225,6,0,0.1) !important; }
        `}</style>

        <div style={styles.overlay}>
          <h1 style={styles.heading404}>404</h1>
          <div style={styles.decorLine} />
          <p style={styles.subtitle}>ROUTE NOT FOUND</p>
          <p style={styles.message}>
            A parcel was misrouted. Help our courier recover it.
          </p>
          <button
            className="cx-btn-primary"
            style={styles.btnPrimary}
            onClick={startGame}
          >
            START MISSION
          </button>
        </div>

        {/* Idle menu */}
        {showIdle && (
          <div style={styles.idleMenu}>
            <Link href="/" className="cx-idle-link" style={styles.idleLink}>
              Go Home
            </Link>
            <Link href="/shipments" className="cx-idle-link" style={styles.idleLink}>
              Track Shipment
            </Link>
            <Link href="/support" className="cx-idle-link" style={styles.idleLink}>
              Contact Support
            </Link>
          </div>
        )}

        {/* Hidden canvas for sizing */}
        <canvas ref={canvasRef} style={{ ...styles.canvas, display: "none" }} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — PLAYING SCREEN
  // ---------------------------------------------------------------------------

  if (screen === "playing") {
    return (
      <div ref={containerRef} className="cx-404-container" style={styles.container}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          .cx-mobile-btn:active { background-color: rgba(225,6,0,0.5) !important; }
        `}</style>

        <canvas ref={canvasRef} style={{ ...styles.canvas, display: "block" }} />

        {/* Mobile control buttons */}
        <div style={styles.gameHUDOverlay}>
          <button
            className="cx-mobile-btn"
            style={styles.mobileBtn}
            onClick={() => moveVan("left")}
            aria-label="Move left"
          >
            ◀
          </button>
          <button
            className="cx-mobile-btn"
            style={styles.mobileBtn}
            onClick={() => moveVan("right")}
            aria-label="Move right"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — SUCCESS SCREEN
  // ---------------------------------------------------------------------------

  if (screen === "success") {
    return (
      <div ref={containerRef} className="cx-404-container" style={styles.container}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          .cx-btn-primary:hover { background-color: #c10500 !important; transform: scale(1.03); }
          .cx-btn-outline:hover { background-color: rgba(255,255,255,0.08) !important; border-color: #fff !important; }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ ...styles.overlay, animation: "slideUp 0.5s ease" }}>
          <h2 style={{ ...styles.endHeading, color: COLORS.RED }}>
            DELIVERY COMPLETED
          </h2>
          <div style={styles.decorLine} />
          <p style={styles.endSubtext}>Route restored successfully.</p>
          <p style={styles.endScore}>
            Final Score: <span style={{ color: COLORS.RED, fontWeight: 700 }}>{score}</span>
          </p>
          <Link href="/" className="cx-btn-primary" style={{ ...styles.btnPrimary, textDecoration: "none" }}>
            GO HOME
          </Link>
          <Link href="/shipments" className="cx-btn-outline" style={styles.btnOutline}>
            TRACK SHIPMENT
          </Link>
          <button
            className="cx-btn-outline"
            style={{ ...styles.btnOutline, border: `1px solid rgba(255,255,255,0.3)` }}
            onClick={restartGame}
          >
            PLAY AGAIN
          </button>
        </div>
        <canvas ref={canvasRef} style={{ ...styles.canvas, display: "none" }} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — FAILURE SCREEN
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="cx-404-container" style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .cx-btn-primary:hover { background-color: #c10500 !important; transform: scale(1.03); }
        .cx-btn-outline:hover { background-color: rgba(255,255,255,0.08) !important; border-color: #fff !important; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ ...styles.overlay, animation: "slideUp 0.5s ease" }}>
        <h2 style={{ ...styles.endHeading, color: COLORS.RED }}>
          ROUTE BLOCKED
        </h2>
        <div style={styles.decorLine} />
        <p style={styles.endSubtext}>Try again.</p>
        <p style={styles.endScore}>
          Score: <span style={{ color: COLORS.RED, fontWeight: 700 }}>{score}</span> / {WIN_SCORE}
        </p>
        <button
          className="cx-btn-primary"
          style={styles.btnPrimary}
          onClick={restartGame}
        >
          RETRY MISSION
        </button>
        <Link href="/" className="cx-btn-outline" style={styles.btnOutline}>
          GO HOME
        </Link>
      </div>
      <canvas ref={canvasRef} style={{ ...styles.canvas, display: "none" }} />
    </div>
  );
};

export default NotFound;
