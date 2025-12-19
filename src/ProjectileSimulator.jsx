import React, { useState, useEffect, useRef, useCallback } from "react";

const GRAVITY = 9.8;
const AIR_DENSITY = 1.225;

const projectiles = {
  cannonball: {
    name: "Cannonball",
    mass: 4.5,
    diameter: 0.12,
    dragCoeff: 0.47,
    color: "#2d2d2d",
    emoji: "💣",
  },
  basketball: {
    name: "Basketball",
    mass: 0.62,
    diameter: 0.24,
    dragCoeff: 0.5,
    color: "#ff6b35",
    emoji: "🏀",
  },
  golfball: {
    name: "Golf Ball",
    mass: 0.046,
    diameter: 0.043,
    dragCoeff: 0.25,
    color: "#f8f8f8",
    emoji: "⚪",
  },
};

const projectileKeys = ["cannonball", "basketball", "golfball"];

// Custom SVG Slider Component
const SVGSlider = ({
  x,
  y,
  width,
  value,
  min,
  max,
  onChange,
  label,
  unit = "",
}) => {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef(null);

  const percent = (value - min) / (max - min);
  const thumbX = x + percent * width;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      const svg = trackRef.current?.ownerSVGElement;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const newPercent = Math.max(0, Math.min(1, (svgP.x - x) / width));
      const newValue = min + newPercent * (max - min);
      onChange(Math.round(newValue * 10) / 10);
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, x, width, min, max, onChange]);

  return (
    <g>
      <text
        x={x}
        y={y - 8}
        fill="#5a3d2b"
        fontSize="10"
        fontWeight="700"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
      >
        {label}: {value}
        {unit}
      </text>
      <rect
        ref={trackRef}
        x={x}
        y={y}
        width={width}
        height="8"
        rx="4"
        fill="#8B7355"
        stroke="#5a3d2b"
        strokeWidth="2"
      />
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, percent * width - 4)}
        height="4"
        rx="2"
        fill="#FFD93D"
      />
      <circle
        cx={thumbX}
        cy={y + 4}
        r="10"
        fill="#FF6B6B"
        stroke="#c0392b"
        strokeWidth="2"
        style={{
          cursor: "pointer",
          filter: dragging ? "drop-shadow(0 0 5px #FF6B6B)" : "none",
        }}
        onMouseDown={handleMouseDown}
      />
      <text
        x={x}
        y={y + 22}
        fill="#5a3d2b"
        fontSize="8"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
      >
        {min}
      </text>
      <text
        x={x + width}
        y={y + 22}
        fill="#5a3d2b"
        fontSize="8"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
        textAnchor="end"
      >
        {max}
      </text>
    </g>
  );
};

// Custom SVG Checkbox Component
const SVGCheckbox = ({ x, y, checked, onChange, label }) => (
  <g style={{ cursor: "pointer" }} onClick={() => onChange(!checked)}>
    <rect
      x={x}
      y={y}
      width="18"
      height="18"
      rx="3"
      fill={checked ? "#4ECDC4" : "#fff5e6"}
      stroke="#5a3d2b"
      strokeWidth="2"
    />
    {checked && (
      <text
        x={x + 9}
        y={y + 14}
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="bold"
      >
        ✓
      </text>
    )}
    <text
      x={x + 24}
      y={y + 14}
      fill="#5a3d2b"
      fontSize="11"
      fontWeight="600"
      fontFamily="'Comic Sans MS', cursive, sans-serif"
    >
      {label}
    </text>
  </g>
);

// Custom SVG Button Component
const SVGButton = ({
  x,
  y,
  width,
  height,
  onClick,
  label,
  variant = "primary",
  disabled = false,
}) => {
  const [hover, setHover] = useState(false);
  const colors =
    variant === "primary"
      ? { fill: "#FF6B6B", stroke: "#c0392b", text: "white" }
      : { fill: "#95a5a6", stroke: "#7f8c8d", text: "white" };

  return (
    <g
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <rect
        x={x}
        y={y + 3}
        width={width}
        height={height}
        rx="8"
        fill="#00000033"
      />
      <rect
        x={x}
        y={y + (hover && !disabled ? -1 : 0)}
        width={width}
        height={height}
        rx="8"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="2"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4 + (hover && !disabled ? -1 : 0)}
        textAnchor="middle"
        fill={colors.text}
        fontSize="12"
        fontWeight="700"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
      >
        {label}
      </text>
    </g>
  );
};

// Dropdown Component - only renders the button, menu is rendered separately
const SVGDropdown = ({
  x,
  y,
  width,
  value,
  options,
  onChange,
  label,
  isOpen,
  setIsOpen,
}) => {
  return (
    <g>
      <text
        x={x}
        y={y - 6}
        fill="#5a3d2b"
        fontSize="10"
        fontWeight="700"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
      >
        {label}
      </text>
      <g style={{ cursor: "pointer" }} onClick={() => setIsOpen(!isOpen)}>
        <rect
          x={x}
          y={y}
          width={width}
          height="32"
          rx="6"
          fill="#fff5e6"
          stroke={isOpen ? "#FF6B6B" : "#5a3d2b"}
          strokeWidth="2"
        />
        <text
          x={x + 10}
          y={y + 21}
          fill="#5a3d2b"
          fontSize="12"
          fontWeight="600"
          fontFamily="'Comic Sans MS', cursive, sans-serif"
        >
          {options.find((o) => o.value === value)?.emoji}{" "}
          {options.find((o) => o.value === value)?.label}
        </text>
        <text
          x={x + width - 14}
          y={y + 21}
          fill="#FF6B6B"
          fontSize="12"
          fontWeight="bold"
        >
          {isOpen ? "▲" : "▼"}
        </text>
      </g>
    </g>
  );
};

// Dropdown Menu - rendered separately at the end of SVG for proper z-index
const SVGDropdownMenu = ({
  x,
  y,
  width,
  value,
  options,
  onChange,
  onClose,
}) => {
  return (
    <g>
      {/* Invisible backdrop to close dropdown when clicking outside */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="transparent"
        onClick={onClose}
      />
      <g>
        <rect
          x={x}
          y={y + 3}
          width={width}
          height={options.length * 36 + 10}
          rx="8"
          fill="#00000033"
        />
        <rect
          x={x}
          y={y}
          width={width}
          height={options.length * 36 + 10}
          rx="8"
          fill="#fff5e6"
          stroke="#5a3d2b"
          strokeWidth="2"
        />
        {options.map((opt, i) => (
          <g
            key={opt.value}
            style={{ cursor: "pointer" }}
            onClick={() => {
              onChange(opt.value);
              onClose();
            }}
          >
            <rect
              x={x + 5}
              y={y + 5 + i * 36}
              width={width - 10}
              height="32"
              rx="5"
              fill={value === opt.value ? "#4ECDC4" : "transparent"}
            />
            <circle
              cx={x + 22}
              cy={y + 21 + i * 36}
              r="10"
              fill={projectiles[opt.value].color}
              stroke="#5a3d2b"
              strokeWidth="2"
            />
            <text
              x={x + 40}
              y={y + 25 + i * 36}
              fill={value === opt.value ? "#fff" : "#5a3d2b"}
              fontSize="12"
              fontWeight="600"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              {opt.label}
            </text>
            {value === opt.value && (
              <text
                x={x + width - 18}
                y={y + 25 + i * 36}
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
              >
                ✓
              </text>
            )}
          </g>
        ))}
      </g>
    </g>
  );
};

export default function ProjectileSimulator() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [projectileType, setProjectileType] = useState("cannonball");
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(20);
  const [platformHeight, setPlatformHeight] = useState(2);
  const [airResistance, setAirResistance] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [slowMotion, setSlowMotion] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [draggingCannon, setDraggingCannon] = useState(false);
  const [draggingPlatform, setDraggingPlatform] = useState(false);
  const svgRef = useRef(null);

  const [isFlying, setIsFlying] = useState(false);
  const [projectilePos, setProjectilePos] = useState({ x: 0, y: 0 });
  const [currentVelocity, setCurrentVelocity] = useState({ vx: 0, vy: 0 });
  const [trajectory, setTrajectory] = useState([]);
  const [actualPath, setActualPath] = useState([]);
  const [results, setResults] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [landingMarker, setLandingMarker] = useState(null);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  const SCALE = Math.min(dimensions.width, dimensions.height) / 100;
  const groundY = dimensions.height - 80;
  const currentProjectile = projectiles[projectileType];
  const cannonX = 140;
  const cannonBaseY = groundY - platformHeight * SCALE;
  const panelX = dimensions.width - 255;
  const panelY = 20;
  const panelWidth = 230;

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle cannon angle dragging
  useEffect(() => {
    if (!draggingCannon) return;

    const handleMouseMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

      // Calculate angle from cannon base to mouse position
      const dx = svgP.x - cannonX;
      const dy = cannonBaseY - 12 - svgP.y;
      let newAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      newAngle = Math.max(0, Math.min(90, Math.round(newAngle)));
      setAngle(newAngle);
    };

    const handleMouseUp = () => setDraggingCannon(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingCannon, cannonBaseY]);

  // Handle platform height dragging
  useEffect(() => {
    if (!draggingPlatform) return;

    const handleMouseMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

      // Calculate height from ground to mouse position
      const newHeight = (groundY - svgP.y) / SCALE;
      setPlatformHeight(
        Math.max(0, Math.min(30, Math.round(newHeight * 10) / 10))
      );
    };

    const handleMouseUp = () => setDraggingPlatform(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingPlatform, groundY, SCALE]);

  const calculatePredictedTrajectory = useCallback(() => {
    const points = [];
    const v0x = velocity * Math.cos((angle * Math.PI) / 180);
    const v0y = velocity * Math.sin((angle * Math.PI) / 180);
    const h = platformHeight;
    const tFlight = (v0y + Math.sqrt(v0y * v0y + 2 * GRAVITY * h)) / GRAVITY;

    for (let t = 0; t <= tFlight; t += 0.02) {
      const x = v0x * t;
      const y = h + v0y * t - 0.5 * GRAVITY * t * t;
      if (y >= 0) {
        points.push({ x: cannonX + x * SCALE, y: groundY - y * SCALE });
      }
    }
    return points;
  }, [velocity, angle, platformHeight, SCALE, groundY]);

  useEffect(() => {
    if (!isFlying) {
      setTrajectory(calculatePredictedTrajectory());
    }
  }, [velocity, angle, platformHeight, isFlying, calculatePredictedTrajectory]);

  const fireProjectile = () => {
    if (isFlying) return;

    setIsFlying(true);
    setActualPath([]);
    setLandingMarker(null);
    setResults(null);
    setElapsedTime(0);

    const v0x = velocity * Math.cos((angle * Math.PI) / 180);
    const v0y = velocity * Math.sin((angle * Math.PI) / 180);

    let x = 0,
      y = platformHeight,
      vx = v0x,
      vy = v0y,
      t = 0,
      maxHeight = platformHeight;
    const dt = 0.016;
    const timeScale = slowMotion ? 0.25 : 1;
    const path = [];
    const area = Math.PI * Math.pow(currentProjectile.diameter / 2, 2);
    const mass = currentProjectile.mass;
    const Cd = currentProjectile.dragCoeff;

    startTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const realDt = ((now - startTimeRef.current) / 1000) * timeScale;
      startTimeRef.current = now;

      const physicsSteps = Math.ceil(realDt / dt);
      const stepDt = realDt / physicsSteps;

      for (let i = 0; i < physicsSteps && y >= 0; i++) {
        if (airResistance) {
          const v = Math.sqrt(vx * vx + vy * vy);
          const Fd = 0.5 * AIR_DENSITY * v * v * Cd * area;
          const ax = (-Fd * (vx / v)) / mass;
          const ay = -GRAVITY - (Fd * (vy / v)) / mass;
          vx += ax * stepDt;
          vy += ay * stepDt;
        } else {
          vy -= GRAVITY * stepDt;
        }

        x += vx * stepDt;
        y += vy * stepDt;
        t += stepDt;
        if (y > maxHeight) maxHeight = y;
        path.push({ x: cannonX + x * SCALE, y: groundY - y * SCALE });
      }

      setProjectilePos({ x: cannonX + x * SCALE, y: groundY - y * SCALE });
      setCurrentVelocity({ vx, vy });
      setActualPath([...path]);
      setElapsedTime(t);

      if (y > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsFlying(false);
        setLandingMarker(x);
        setResults({
          maxHeight: maxHeight.toFixed(2),
          range: x.toFixed(2),
          timeOfFlight: t.toFixed(2),
        });
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const resetSimulation = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsFlying(false);
    setActualPath([]);
    setLandingMarker(null);
    setResults(null);
    setElapsedTime(0);
    setProjectilePos({ x: 0, y: 0 });
  };

  const getVectorScale = () =>
    Math.min(
      50,
      Math.sqrt(currentVelocity.vx ** 2 + currentVelocity.vy ** 2) * 2.5
    );

  const dropdownOptions = projectileKeys.map((key) => ({
    value: key,
    label: projectiles[key].name,
    emoji: projectiles[key].emoji,
  }));

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="50%" stopColor="#B0E0E6" />
            <stop offset="100%" stopColor="#E0F7FA" />
          </linearGradient>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7CB342" />
            <stop offset="40%" stopColor="#689F38" />
            <stop offset="100%" stopColor="#558B2F" />
          </linearGradient>
          <linearGradient id="dirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8D6E63" />
            <stop offset="100%" stopColor="#6D4C41" />
          </linearGradient>
          <filter id="cartoonShadow">
            <feDropShadow
              dx="4"
              dy="4"
              stdDeviation="0"
              floodColor="#00000044"
            />
          </filter>
          <marker
            id="arrowGreen"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#2ecc71" />
          </marker>
          <marker
            id="arrowYellow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f39c12" />
          </marker>
        </defs>

        {/* Sky */}
        <rect
          x="0"
          y="0"
          width={dimensions.width}
          height={groundY}
          fill="url(#skyGradient)"
        />

        {/* Cartoon Sun */}
        <g transform={`translate(${dimensions.width - 180}, 90)`}>
          <circle
            cx="0"
            cy="0"
            r="55"
            fill="#FFE66D"
            stroke="#FFA726"
            strokeWidth="4"
          />
          <circle cx="-15" cy="-10" r="8" fill="#5a3d2b" />
          <circle cx="15" cy="-10" r="8" fill="#5a3d2b" />
          <path
            d="M -20 15 Q 0 30 20 15"
            fill="none"
            stroke="#5a3d2b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((rot, i) => (
            <line
              key={i}
              x1="65"
              y1="0"
              x2="80"
              y2="0"
              stroke="#FFE66D"
              strokeWidth="6"
              strokeLinecap="round"
              transform={`rotate(${rot})`}
            />
          ))}
        </g>

        {/* Cartoon Clouds */}
        {[
          { x: 150, y: 100, scale: 1 },
          { x: 400, y: 70, scale: 1.2 },
          { x: 650, y: 120, scale: 0.9 },
        ].map((cloud, i) => (
          <g
            key={i}
            transform={`translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="50"
              ry="30"
              fill="white"
              stroke="#E0E0E0"
              strokeWidth="2"
            />
            <ellipse
              cx="-35"
              cy="10"
              rx="35"
              ry="22"
              fill="white"
              stroke="#E0E0E0"
              strokeWidth="2"
            />
            <ellipse
              cx="35"
              cy="10"
              rx="35"
              ry="22"
              fill="white"
              stroke="#E0E0E0"
              strokeWidth="2"
            />
            <ellipse cx="0" cy="0" rx="50" ry="30" fill="white" />
          </g>
        ))}

        {/* Hills in background */}
        <ellipse
          cx={dimensions.width * 0.2}
          cy={groundY}
          rx="200"
          ry="60"
          fill="#81C784"
        />
        <ellipse
          cx={dimensions.width * 0.6}
          cy={groundY}
          rx="250"
          ry="80"
          fill="#66BB6A"
        />
        <ellipse
          cx={dimensions.width * 0.9}
          cy={groundY}
          rx="180"
          ry="50"
          fill="#81C784"
        />

        {/* Ground */}
        <rect
          x="0"
          y={groundY}
          width={dimensions.width}
          height={dimensions.height - groundY}
          fill="url(#groundGradient)"
        />
        <rect
          x="0"
          y={groundY}
          width={dimensions.width}
          height="8"
          fill="#8BC34A"
        />

        {/* Dirt layer */}
        <rect
          x="0"
          y={dimensions.height - 30}
          width={dimensions.width}
          height="30"
          fill="url(#dirtGradient)"
        />

        {/* Cartoon grass tufts */}
        {Array.from({ length: Math.floor(dimensions.width / 40) }).map(
          (_, i) => (
            <g key={i} transform={`translate(${i * 40 + 20}, ${groundY})`}>
              <path
                d="M-8 0 Q-6 -15 0 -20 Q6 -15 8 0"
                fill="#4CAF50"
                stroke="#388E3C"
                strokeWidth="1"
              />
            </g>
          )
        )}

        {/* Distance markers - cartoon style */}
        {Array.from({
          length: Math.floor((dimensions.width - cannonX - 280) / (SCALE * 10)),
        }).map((_, i) => {
          const dist = (i + 1) * 10;
          return (
            <g key={dist}>
              <rect
                x={cannonX + dist * SCALE - 2}
                y={groundY - 5}
                width="4"
                height="20"
                fill="#5D4037"
                rx="2"
              />
              <rect
                x={cannonX + dist * SCALE - 18}
                y={groundY + 18}
                width="36"
                height="20"
                rx="4"
                fill="#FFE082"
                stroke="#5a3d2b"
                strokeWidth="2"
              />
              <text
                x={cannonX + dist * SCALE}
                y={groundY + 33}
                textAnchor="middle"
                fill="#5a3d2b"
                fontSize="11"
                fontWeight="700"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                {dist}m
              </text>
            </g>
          );
        })}

        {/* Platform - cartoon wooden crate style - INTERACTIVE */}
        <g
          filter="url(#cartoonShadow)"
          style={{ cursor: draggingPlatform ? "grabbing" : "ns-resize" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDraggingPlatform(true);
          }}
        >
          <rect
            x="60"
            y={cannonBaseY}
            width="120"
            height={Math.max(platformHeight * SCALE, 5)}
            fill="#A1887F"
            stroke={draggingPlatform ? "#FF6B6B" : "#5D4037"}
            strokeWidth={draggingPlatform ? 4 : 3}
            rx="4"
          />
          {/* Wood planks */}
          {Array.from({ length: Math.ceil((platformHeight * SCALE) / 20) }).map(
            (_, i) => (
              <line
                key={i}
                x1="60"
                y1={cannonBaseY + i * 20 + 10}
                x2="180"
                y2={cannonBaseY + i * 20 + 10}
                stroke="#8D6E63"
                strokeWidth="2"
              />
            )
          )}
          <line
            x1="90"
            y1={cannonBaseY}
            x2="90"
            y2={cannonBaseY + platformHeight * SCALE}
            stroke="#8D6E63"
            strokeWidth="2"
          />
          <line
            x1="150"
            y1={cannonBaseY}
            x2="150"
            y2={cannonBaseY + platformHeight * SCALE}
            stroke="#8D6E63"
            strokeWidth="2"
          />
          {/* Drag handle indicator */}
          <g opacity={draggingPlatform ? 1 : 0.6}>
            <rect
              x="105"
              y={cannonBaseY + 2}
              width="30"
              height="8"
              rx="2"
              fill="#5D4037"
            />
            <line
              x1="110"
              y1={cannonBaseY + 6}
              x2="130"
              y2={cannonBaseY + 6}
              stroke="#A1887F"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Cartoon Cannon - INTERACTIVE */}
        <g filter="url(#cartoonShadow)">
          {/* Wheels */}
          <circle
            cx={cannonX - 25}
            cy={cannonBaseY + 5}
            r="18"
            fill="#5D4037"
            stroke="#3E2723"
            strokeWidth="3"
          />
          <circle cx={cannonX - 25} cy={cannonBaseY + 5} r="8" fill="#8D6E63" />
          <circle
            cx={cannonX + 25}
            cy={cannonBaseY + 5}
            r="18"
            fill="#5D4037"
            stroke="#3E2723"
            strokeWidth="3"
          />
          <circle cx={cannonX + 25} cy={cannonBaseY + 5} r="8" fill="#8D6E63" />

          {/* Cannon base */}
          <ellipse
            cx={cannonX}
            cy={cannonBaseY - 8}
            rx="35"
            ry="18"
            fill="#546E7A"
            stroke="#37474F"
            strokeWidth="3"
          />

          {/* Cannon barrel - DRAGGABLE */}
          <g
            transform={`translate(${cannonX}, ${
              cannonBaseY - 12
            }) rotate(${-angle})`}
            style={{ cursor: draggingCannon ? "grabbing" : "grab" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingCannon(true);
            }}
          >
            <rect
              x="-8"
              y="-16"
              width="75"
              height="32"
              fill={draggingCannon ? "#7B8D9C" : "#607D8B"}
              stroke={draggingCannon ? "#FF6B6B" : "#37474F"}
              strokeWidth={draggingCannon ? 4 : 3}
              rx="4"
            />
            <rect
              x="55"
              y="-20"
              width="22"
              height="40"
              fill="#546E7A"
              stroke={draggingCannon ? "#FF6B6B" : "#37474F"}
              strokeWidth={draggingCannon ? 4 : 3}
              rx="6"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="20"
              ry="20"
              fill="#78909C"
              stroke="#37474F"
              strokeWidth="3"
            />
            <ellipse cx="0" cy="0" rx="10" ry="10" fill="#546E7A" />
            {/* Barrel rings */}
            <rect x="20" y="-18" width="6" height="36" fill="#37474F" rx="2" />
            <rect x="40" y="-18" width="6" height="36" fill="#37474F" rx="2" />
            {/* Grip indicator */}
            <circle
              cx="65"
              cy="0"
              r="8"
              fill={draggingCannon ? "#FF6B6B" : "#455A64"}
              stroke="#37474F"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* Angle indicator arc */}
        <path
          d={`M ${cannonX + 50} ${cannonBaseY - 12} A 50 50 0 0 0 ${
            cannonX + 50 * Math.cos((angle * Math.PI) / 180)
          } ${cannonBaseY - 12 - 50 * Math.sin((angle * Math.PI) / 180)}`}
          fill="none"
          stroke={draggingCannon ? "#FF6B6B" : "#FF6B6B"}
          strokeWidth={draggingCannon ? 4 : 3}
          strokeDasharray="6,4"
        />
        <rect
          x={cannonX + 55}
          y={cannonBaseY - 45}
          width="40"
          height="24"
          rx="6"
          fill={draggingCannon ? "#FF6B6B" : "#FF6B6B"}
          stroke="#c0392b"
          strokeWidth="2"
        />
        <text
          x={cannonX + 75}
          y={cannonBaseY - 28}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="700"
          fontFamily="'Comic Sans MS', cursive, sans-serif"
        >
          {angle}°
        </text>

        {/* Interactive hints */}
        {!isFlying && !draggingCannon && !draggingPlatform && (
          <g opacity="0.8">
            {/* Cannon hint */}
            <g transform={`translate(${cannonX + 90}, ${cannonBaseY - 60})`}>
              <rect x="-45" y="-12" width="90" height="20" rx="4" fill="#333" />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                🎯 Drag to aim
              </text>
            </g>
            {/* Platform hint */}
            <g
              transform={`translate(120, ${
                cannonBaseY + (platformHeight * SCALE) / 2
              })`}
            >
              <rect
                x="-50"
                y="-10"
                width="100"
                height="18"
                rx="4"
                fill="#333"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                ↕ Drag to adjust
              </text>
            </g>
          </g>
        )}

        {/* Predicted trajectory */}
        {!isFlying && trajectory.length > 1 && (
          <path
            d={`M ${trajectory.map((p) => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#3498db"
            strokeWidth="4"
            strokeDasharray="15,8"
            strokeLinecap="round"
          />
        )}

        {/* Actual path */}
        {actualPath.length > 1 && (
          <path
            d={`M ${actualPath.map((p) => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke={airResistance ? "#e74c3c" : "#2ecc71"}
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Projectile */}
        {isFlying && (
          <g>
            <circle
              cx={projectilePos.x}
              cy={projectilePos.y}
              r={Math.max(14, currentProjectile.diameter * SCALE * 5)}
              fill={currentProjectile.color}
              stroke="#222"
              strokeWidth="3"
            />
            {/* Cartoon shine */}
            <ellipse
              cx={projectilePos.x - 4}
              cy={projectilePos.y - 4}
              rx="4"
              ry="3"
              fill="white"
              opacity="0.6"
            />

            {showVectors && (
              <g>
                <line
                  x1={projectilePos.x}
                  y1={projectilePos.y}
                  x2={
                    projectilePos.x +
                    (currentVelocity.vx * getVectorScale()) / velocity
                  }
                  y2={
                    projectilePos.y -
                    (currentVelocity.vy * getVectorScale()) / velocity
                  }
                  stroke="#2ecc71"
                  strokeWidth="5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowGreen)"
                />
                <line
                  x1={projectilePos.x}
                  y1={projectilePos.y}
                  x2={projectilePos.x}
                  y2={projectilePos.y + 40}
                  stroke="#f39c12"
                  strokeWidth="5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowYellow)"
                />
              </g>
            )}
          </g>
        )}

        {/* Landing marker - cartoon flag */}
        {landingMarker !== null && (
          <g>
            <rect
              x={cannonX + landingMarker * SCALE - 3}
              y={groundY - 70}
              width="6"
              height="75"
              fill="#5D4037"
              rx="2"
            />
            <path
              d={`M ${cannonX + landingMarker * SCALE + 3} ${groundY - 70} L ${
                cannonX + landingMarker * SCALE + 50
              } ${groundY - 55} L ${cannonX + landingMarker * SCALE + 3} ${
                groundY - 40
              } Z`}
              fill="#FF6B6B"
              stroke="#c0392b"
              strokeWidth="2"
            />
            <rect
              x={cannonX + landingMarker * SCALE - 40}
              y={groundY - 105}
              width="80"
              height="30"
              rx="8"
              fill="#4ECDC4"
              stroke="#26A69A"
              strokeWidth="3"
            />
            <text
              x={cannonX + landingMarker * SCALE}
              y={groundY - 84}
              textAnchor="middle"
              fill="white"
              fontSize="16"
              fontWeight="700"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              {landingMarker.toFixed(1)}m
            </text>
          </g>
        )}

        {/* ====== TOP LEFT INFO PANELS ====== */}

        {/* Physics Equations Box */}
        <g filter="url(#cartoonShadow)">
          <rect
            x="20"
            y="90"
            width="220"
            height={airResistance ? 110 : 90}
            rx="12"
            fill="#FFF8E1"
            stroke="#5a3d2b"
            strokeWidth="3"
          />
          <rect x="20" y="90" width="220" height="30" rx="12" fill="#FFE082" />
          <rect x="20" y="108" width="220" height="12" fill="#FFF8E1" />
          <text
            x="130"
            y="112"
            textAnchor="middle"
            fill="#5a3d2b"
            fontSize="13"
            fontWeight="700"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
          >
            📐 PHYSICS EQUATIONS
          </text>
          <text
            x="35"
            y="138"
            fill="#E65100"
            fontSize="13"
            fontWeight="600"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            fontStyle="italic"
          >
            x = v₀cos(θ)t
          </text>
          <text
            x="35"
            y="160"
            fill="#E65100"
            fontSize="13"
            fontWeight="600"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            fontStyle="italic"
          >
            y = h + v₀sin(θ)t - ½gt²
          </text>
          {airResistance && (
            <text
              x="35"
              y="182"
              fill="#c0392b"
              fontSize="12"
              fontWeight="600"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
              fontStyle="italic"
            >
              F_drag = ½ρv²CdA
            </text>
          )}
        </g>

        {/* Legend Box */}
        <g filter="url(#cartoonShadow)">
          <rect
            x="20"
            y={airResistance ? 215 : 195}
            width="220"
            height={showVectors ? 105 : 80}
            rx="12"
            fill="#E8F5E9"
            stroke="#5a3d2b"
            strokeWidth="3"
          />
          <rect
            x="20"
            y={airResistance ? 215 : 195}
            width="220"
            height="30"
            rx="12"
            fill="#A5D6A7"
          />
          <rect
            x="20"
            y={airResistance ? 233 : 213}
            width="220"
            height="12"
            fill="#E8F5E9"
          />
          <text
            x="130"
            y={airResistance ? 237 : 217}
            textAnchor="middle"
            fill="#2E7D32"
            fontSize="13"
            fontWeight="700"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
          >
            🎯 LEGEND
          </text>

          <line
            x1="35"
            y1={airResistance ? 260 : 240}
            x2="75"
            y2={airResistance ? 260 : 240}
            stroke="#3498db"
            strokeWidth="4"
            strokeDasharray="8,4"
            strokeLinecap="round"
          />
          <text
            x="85"
            y={airResistance ? 265 : 245}
            fill="#5a3d2b"
            fontSize="12"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
          >
            Predicted Path
          </text>

          <line
            x1="35"
            y1={airResistance ? 282 : 262}
            x2="75"
            y2={airResistance ? 282 : 262}
            stroke="#2ecc71"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text
            x="85"
            y={airResistance ? 287 : 267}
            fill="#5a3d2b"
            fontSize="12"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
          >
            Actual Path
          </text>

          {showVectors && (
            <>
              <line
                x1="35"
                y1={airResistance ? 304 : 284}
                x2="60"
                y2={airResistance ? 304 : 284}
                stroke="#2ecc71"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text
                x="68"
                y={airResistance ? 309 : 289}
                fill="#2ecc71"
                fontSize="11"
                fontWeight="600"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                v (velocity)
              </text>
              <line
                x1="145"
                y1={airResistance ? 304 : 284}
                x2="170"
                y2={airResistance ? 304 : 284}
                stroke="#f39c12"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text
                x="178"
                y={airResistance ? 309 : 289}
                fill="#f39c12"
                fontSize="11"
                fontWeight="600"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                a (accel)
              </text>
            </>
          )}
        </g>

        {/* Real-time stats overlay */}
        {isFlying && (
          <g filter="url(#cartoonShadow)">
            <rect
              x="20"
              y={
                airResistance
                  ? showVectors
                    ? 335
                    : 310
                  : showVectors
                  ? 315
                  : 290
              }
              width="220"
              height="95"
              rx="12"
              fill="#E3F2FD"
              stroke="#5a3d2b"
              strokeWidth="3"
            />
            <rect
              x="20"
              y={
                airResistance
                  ? showVectors
                    ? 335
                    : 310
                  : showVectors
                  ? 315
                  : 290
              }
              width="220"
              height="30"
              rx="12"
              fill="#90CAF9"
            />
            <rect
              x="20"
              y={
                airResistance
                  ? showVectors
                    ? 353
                    : 328
                  : showVectors
                  ? 333
                  : 308
              }
              width="220"
              height="12"
              fill="#E3F2FD"
            />
            <text
              x="130"
              y={
                airResistance
                  ? showVectors
                    ? 357
                    : 332
                  : showVectors
                  ? 337
                  : 312
              }
              textAnchor="middle"
              fill="#1565C0"
              fontSize="13"
              fontWeight="700"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              ⚡ LIVE STATS
            </text>
            <text
              x="35"
              y={
                airResistance
                  ? showVectors
                    ? 385
                    : 360
                  : showVectors
                  ? 365
                  : 340
              }
              fill="#5a3d2b"
              fontSize="13"
              fontWeight="600"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              ⏱ Time: {elapsedTime.toFixed(2)}s
            </text>
            <text
              x="35"
              y={
                airResistance
                  ? showVectors
                    ? 407
                    : 382
                  : showVectors
                  ? 387
                  : 362
              }
              fill="#5a3d2b"
              fontSize="13"
              fontWeight="600"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              ↕ Height:{" "}
              {Math.max(0, (groundY - projectilePos.y) / SCALE).toFixed(1)}m
            </text>
            <text
              x="35"
              y={
                airResistance
                  ? showVectors
                    ? 429
                    : 404
                  : showVectors
                  ? 409
                  : 384
              }
              fill="#5a3d2b"
              fontSize="13"
              fontWeight="600"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              ↔ Distance: {((projectilePos.x - cannonX) / SCALE).toFixed(1)}m
            </text>
          </g>
        )}

        {/* ====== CONTROL PANEL (Right Side) ====== */}
        <g filter="url(#cartoonShadow)">
          <rect
            x={panelX}
            y={panelY}
            width={panelWidth}
            height={results ? 520 : 440}
            rx="12"
            fill="#FFF8E1"
            stroke="#5a3d2b"
            strokeWidth="3"
          />

          {/* Panel Header */}
          <rect
            x={panelX}
            y={panelY}
            width={panelWidth}
            height="36"
            rx="12"
            fill="#FF6B6B"
          />
          <rect
            x={panelX}
            y={panelY + 24}
            width={panelWidth}
            height="12"
            fill="#FFF8E1"
          />
          <text
            x={panelX + panelWidth / 2}
            y={panelY + 25}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="700"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
          >
            🎮 CONTROLS
          </text>

          {/* Projectile Type Dropdown */}
          <SVGDropdown
            x={panelX + 12}
            y={panelY + 52}
            width={panelWidth - 24}
            value={projectileType}
            options={dropdownOptions}
            onChange={setProjectileType}
            label="Projectile"
            isOpen={dropdownOpen}
            setIsOpen={setDropdownOpen}
          />

          {/* Mass & Diameter Display - inline */}
          <g>
            <rect
              x={panelX + 12}
              y={panelY + 105}
              width={(panelWidth - 30) / 2}
              height="38"
              rx="6"
              fill="#E8F5E9"
              stroke="#4CAF50"
              strokeWidth="2"
            />
            <text
              x={panelX + 12 + (panelWidth - 30) / 4}
              y={panelY + 122}
              textAnchor="middle"
              fill="#2E7D32"
              fontSize="13"
              fontWeight="700"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              {currentProjectile.mass}kg
            </text>
            <text
              x={panelX + 12 + (panelWidth - 30) / 4}
              y={panelY + 136}
              textAnchor="middle"
              fill="#5a3d2b"
              fontSize="8"
              fontWeight="600"
            >
              MASS
            </text>

            <rect
              x={panelX + 18 + (panelWidth - 30) / 2}
              y={panelY + 105}
              width={(panelWidth - 30) / 2}
              height="38"
              rx="6"
              fill="#E3F2FD"
              stroke="#2196F3"
              strokeWidth="2"
            />
            <text
              x={panelX + 18 + (3 * (panelWidth - 30)) / 4}
              y={panelY + 122}
              textAnchor="middle"
              fill="#1565C0"
              fontSize="13"
              fontWeight="700"
              fontFamily="'Comic Sans MS', cursive, sans-serif"
            >
              {(currentProjectile.diameter * 100).toFixed(1)}cm
            </text>
            <text
              x={panelX + 18 + (3 * (panelWidth - 30)) / 4}
              y={panelY + 136}
              textAnchor="middle"
              fill="#5a3d2b"
              fontSize="8"
              fontWeight="600"
            >
              DIAMETER
            </text>
          </g>

          {/* Sliders - more compact */}
          <SVGSlider
            x={panelX + 12}
            y={panelY + 165}
            width={panelWidth - 24}
            value={angle}
            min={0}
            max={90}
            onChange={setAngle}
            label="Angle"
            unit="°"
          />
          <SVGSlider
            x={panelX + 12}
            y={panelY + 215}
            width={panelWidth - 24}
            value={velocity}
            min={1}
            max={30}
            onChange={setVelocity}
            label="Velocity"
            unit=" m/s"
          />
          <SVGSlider
            x={panelX + 12}
            y={panelY + 265}
            width={panelWidth - 24}
            value={platformHeight}
            min={0}
            max={30}
            onChange={setPlatformHeight}
            label="Height"
            unit="m"
          />

          {/* Checkboxes - compact row */}
          <SVGCheckbox
            x={panelX + 12}
            y={panelY + 305}
            checked={airResistance}
            onChange={setAirResistance}
            label="Air Drag"
          />
          <SVGCheckbox
            x={panelX + 120}
            y={panelY + 305}
            checked={showVectors}
            onChange={setShowVectors}
            label="Vectors"
          />
          <SVGCheckbox
            x={panelX + 12}
            y={panelY + 332}
            checked={slowMotion}
            onChange={setSlowMotion}
            label="Slow-Mo"
          />

          {airResistance && (
            <g>
              <rect
                x={panelX + 100}
                y={panelY + 332}
                width={panelWidth - 112}
                height="20"
                rx="4"
                fill="#FFCDD2"
                stroke="#E57373"
                strokeWidth="1"
              />
              <text
                x={panelX + 106}
                y={panelY + 346}
                fill="#C62828"
                fontSize="9"
                fontWeight="600"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                Cd: {currentProjectile.dragCoeff}
              </text>
            </g>
          )}

          {/* Buttons - side by side */}
          <SVGButton
            x={panelX + 12}
            y={panelY + 362}
            width={(panelWidth - 30) * 0.7}
            height="38"
            onClick={fireProjectile}
            label="🚀 FIRE!"
            variant="primary"
            disabled={isFlying}
          />
          <SVGButton
            x={panelX + 18 + (panelWidth - 30) * 0.7}
            y={panelY + 362}
            width={(panelWidth - 30) * 0.3}
            height="38"
            onClick={resetSimulation}
            label="↺"
            variant="secondary"
          />

          {/* Results - compact */}
          {results && (
            <g>
              <rect
                x={panelX + 12}
                y={panelY + 410}
                width={panelWidth - 24}
                height="100"
                rx="8"
                fill="#E8F5E9"
                stroke="#4CAF50"
                strokeWidth="2"
              />
              <text
                x={panelX + 22}
                y={panelY + 428}
                fill="#2E7D32"
                fontSize="11"
                fontWeight="700"
                fontFamily="'Comic Sans MS', cursive, sans-serif"
              >
                🏆 RESULTS
              </text>

              {[
                {
                  label: "Height",
                  value: results.maxHeight + "m",
                  color: "#2E7D32",
                },
                {
                  label: "Range",
                  value: results.range + "m",
                  color: "#1565C0",
                },
                {
                  label: "Time",
                  value: results.timeOfFlight + "s",
                  color: "#E65100",
                },
              ].map((stat, i) => (
                <g key={stat.label}>
                  <rect
                    x={panelX + 18 + i * ((panelWidth - 36) / 3)}
                    y={panelY + 438}
                    width={(panelWidth - 48) / 3}
                    height="65"
                    rx="5"
                    fill="white"
                    stroke="#C8E6C9"
                    strokeWidth="1"
                  />
                  <text
                    x={
                      panelX +
                      18 +
                      i * ((panelWidth - 36) / 3) +
                      (panelWidth - 48) / 6
                    }
                    y={panelY + 465}
                    textAnchor="middle"
                    fill={stat.color}
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="'Comic Sans MS', cursive, sans-serif"
                  >
                    {stat.value}
                  </text>
                  <text
                    x={
                      panelX +
                      18 +
                      i * ((panelWidth - 36) / 3) +
                      (panelWidth - 48) / 6
                    }
                    y={panelY + 492}
                    textAnchor="middle"
                    fill="#5a3d2b"
                    fontSize="7"
                    fontWeight="600"
                  >
                    {stat.label.toUpperCase()}
                  </text>
                </g>
              ))}
            </g>
          )}
        </g>

        {/* Title Banner */}
        <g filter="url(#cartoonShadow)">
          <rect
            x="20"
            y="15"
            width="440"
            height="55"
            rx="12"
            fill="#4ECDC4"
            stroke="#26A69A"
            strokeWidth="4"
          />
          <text
            x="240"
            y="52"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="700"
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            stroke="#26A69A"
            strokeWidth="1"
          >
            🎯 Projectile Motion! 🚀
          </text>
        </g>

        {/* Dropdown Menu - rendered last for proper z-index */}
        {dropdownOpen && (
          <SVGDropdownMenu
            x={panelX + 12}
            y={panelY + 92}
            width={panelWidth - 24}
            value={projectileType}
            options={dropdownOptions}
            onChange={setProjectileType}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </svg>
    </div>
  );
}
