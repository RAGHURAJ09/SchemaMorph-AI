import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Tilt from "react-parallax-tilt";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { TEAM_MEMBERS } from "./Team";
/* ─── Data ─────────────────────────────────────────────────── */
import Background3D from "../components/Background3D";
import HolographicOverlay from "../components/HolographicOverlay";
const TEAM = [
  { name: "Raghuraj Pratap Rajpoot", role: "Lead & Architect", avatar: "RR", color: "#1D9E75", bg: "rgba(29,158,117,0.12)", desc: "Graph analysis engine, AI pipeline, backend architecture" },
  { name: "Samridhi Singh", role: "Frontend Engineer", avatar: "SS", color: "#534AB7", bg: "rgba(83,74,183,0.12)", desc: "React Flow visualization, UI design, Zustand state management" },
  { name: "Samridhi Jaiswal", role: "Backend Engineer", avatar: "SJ", color: "#993556", bg: "rgba(153,53,86,0.12)", desc: "SQL parsing, database schema, validation pipeline" },
];
const STEPS = [
  { num: "01", title: "DDL & Schema Parsing", body: "Upload or paste PostgreSQL DDL. sqlglot parses every table, column data type, primary key, and foreign key constraint.", icon: "↑", color: "#1D9E75" },
  { num: "02", title: "Workload & Query Analysis", body: "Ingests transaction queries and JOIN logs. Calculates table co-access frequencies and categorizes read/write access patterns.", icon: "⚡", color: "#38bdf8" },
  { num: "03", title: "Weighted Graph Construction", body: "NetworkX builds an undirected graph with tables as nodes. Structural FK edges are weighted 2×, query co-access weighted 1×.", icon: "⬡", color: "#818cf8" },
  { num: "04", title: "Louvain Community Detection", body: "Executes mathematical modularity optimization to partition tables into natural service clusters — 100% deterministically.", icon: "◎", color: "#f59e0b" },
  { num: "05", title: "Gemini AI Semantic Narration", body: "Google Gemini inspects clusters to assign domain-driven microservice names, architectural rationale, and API boundaries.", icon: "◇", color: "#ec4899" },
  { num: "06", title: "Rule-Based Integrity Validation", body: "Rigorous engine validates partition completeness, detects cross-boundary queries, cyclic references, and flags orphaned tables.", icon: "✓", color: "#10b981" },
  { num: "07", title: "DDL Export & React Flow Dashboard", body: "Generates clean, per-service isolated SQL schemas, downloadable Markdown audit reports, and interactive React Flow visualization.", icon: "↗", color: "#6366f1" },
];
const FEATURES = [
  { icon: "⬡", label: "Graph analysis", text: "FK + co-access weighted graph via NetworkX" },
  { icon: "◎", label: "Louvain clustering", text: "Community detection, not heuristics" },
  { icon: "◇", label: "AI narration only", text: "AI names, never decides — determinism first" },
  { icon: "✓", label: "Full validation", text: "Orphans, cycles, FK integrity, broken queries" },
  { icon: "↗", label: "Per-service DDL", text: "Ready-to-deploy split schemas with comments" },
  { icon: "→", label: "React Flow viz", text: "Interactive, color-coded dependency graph" },
];
const SERVICES = [
  { name: "User Service", x: .18, y: .32, color: "#1D9E75", tables: ["users", "sessions", "auth"] },
  { name: "Order Service", x: .40, y: .20, color: "#818cf8", tables: ["orders", "order_items"] },
  { name: "Product Service", x: .74, y: .28, color: "#38bdf8", tables: ["products", "inventory", "categories"] },
  { name: "Payment Service", x: .26, y: .62, color: "#f59e0b", tables: ["payments", "invoices"] },
  { name: "Analytics", x: .52, y: .66, color: "#ec4899", tables: ["events", "logs"] },
  { name: "Notification", x: .82, y: .58, color: "#10b981", tables: ["notifications"] },
];
const EDGES = [[0, 1], [0, 3], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [1, 5]];

/* ─── Graph Background Canvas removed for 3D version ───────────────────────────────── */

/* ─── Dashboard Canvas (drag-interactive) ───────────────────── */
function DashboardCanvas() {
  const canvasRef = useRef(null);
  const servicesRef = useRef(SERVICES.map(s => ({ ...s })));
  const stateRef = useRef({ mx: 0, my: 0, isDragging: false, dragS: null, dragOffX: 0, dragOffY: 0, hoveredS: null, t: 0 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const st = stateRef.current;
    const services = servicesRef.current;
    let W = 0, H = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.mx = W / 2;
      st.my = H / 2;
    }
    resize();

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      st.mx = e.clientX - r.left;
      st.my = e.clientY - r.top;
      if (st.isDragging && st.dragS) {
        st.dragS.x = (st.mx - st.dragOffX) / W;
        st.dragS.y = (st.my - st.dragOffY) / H;
        st.dragS.x = Math.max(.08, Math.min(.92, st.dragS.x));
        st.dragS.y = Math.max(.10, Math.min(.85, st.dragS.y));
      }
      st.hoveredS = null;
      services.forEach(s => {
        if (Math.hypot(st.mx - s.x * W, st.my - s.y * H) < 46) st.hoveredS = s;
      });
      canvas.style.cursor = st.hoveredS || st.isDragging ? "grab" : "default";
    };

    const onDown = e => {
      const r = canvas.getBoundingClientRect();
      const lx = e.clientX - r.left, ly = e.clientY - r.top;
      services.forEach(s => {
        if (Math.hypot(lx - s.x * W, ly - s.y * H) < 46) {
          st.isDragging = true;
          st.dragS = s;
          st.dragOffX = lx - s.x * W;
          st.dragOffY = ly - s.y * H;
          canvas.style.cursor = "grabbing";
        }
      });
    };

    const onUp = () => {
      st.isDragging = false;
      st.dragS = null;
      canvas.style.cursor = st.hoveredS ? "grab" : "default";
    };

    // Touch support for mobile/tablets
    const onTouchStart = e => {
      if (!e.touches || !e.touches[0]) return;
      const r = canvas.getBoundingClientRect();
      const lx = e.touches[0].clientX - r.left, ly = e.touches[0].clientY - r.top;
      st.mx = lx; st.my = ly;
      services.forEach(s => {
        if (Math.hypot(lx - s.x * W, ly - s.y * H) < 48) {
          st.isDragging = true;
          st.dragS = s;
          st.dragOffX = lx - s.x * W;
          st.dragOffY = ly - s.y * H;
          st.hoveredS = s;
        }
      });
    };
    const onTouchMove = e => {
      if (!e.touches || !e.touches[0] || !st.isDragging || !st.dragS) return;
      const r = canvas.getBoundingClientRect();
      st.mx = e.touches[0].clientX - r.left;
      st.my = e.touches[0].clientY - r.top;
      st.dragS.x = (st.mx - st.dragOffX) / W;
      st.dragS.y = (st.my - st.dragOffY) / H;
      st.dragS.x = Math.max(.08, Math.min(.92, st.dragS.x));
      st.dragS.y = Math.max(.10, Math.min(.85, st.dragS.y));
    };
    const onTouchEnd = () => {
      st.isDragging = false;
      st.dragS = null;
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      st.t += 0.018;
      const offX = (st.mx - W / 2) * 0.04;
      const offY = (st.my - H / 2) * 0.04;

      // Subtle ambient background grid & radial glow
      const rad = ctx.createRadialGradient(W / 2 + offX, H / 2 + offY, 0, W / 2 + offX, H / 2 + offY, W * 0.65);
      rad.addColorStop(0, "rgba(29, 158, 117, 0.08)");
      rad.addColorStop(0.5, "rgba(99, 102, 241, 0.04)");
      rad.addColorStop(1, "transparent");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, W, H);

      // Edges with glowing gradient & active data packets
      EDGES.forEach(([a, b]) => {
        const sa = services[a], sb = services[b];
        const x1 = sa.x * W + offX * (1 - sa.x), y1 = sa.y * H + offY * (1 - sa.y);
        const x2 = sb.x * W + offX * (1 - sb.x), y2 = sb.y * H + offY * (1 - sb.y);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, sa.color + "66");
        grad.addColorStop(1, sb.color + "66");
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Animated data packet on edge
        const prog = ((st.t * 0.45 + a * 0.28) % 1);
        const px = x1 + (x2 - x1) * prog;
        const py = y1 + (y2 - y1) * prog;

        ctx.save();
        ctx.shadowColor = sa.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = sa.color + "88";
        ctx.fill();
        ctx.restore();
      });

      // Nodes
      services.forEach((s, i) => {
        const pf = 1 - (i * 0.03);
        const sx = s.x * W + offX * pf;
        const sy = s.y * H + offY * pf;
        const isH = s === st.hoveredS || s === st.dragS;
        const r = isH ? 44 : 36;
        const pulse = Math.sin(st.t * 2.5 + i * 1.2) * 2;

        ctx.save();

        // Outer glow
        ctx.shadowColor = s.color;
        ctx.shadowBlur = isH ? 32 : 16;

        // Concentric animated ripple ring
        ctx.beginPath();
        ctx.arc(sx, sy, r + 7 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = s.color + (isH ? "88" : "33");
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node dark solid disc
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#0c101c";
        ctx.fill();

        // Node vibrant tint fill
        ctx.fillStyle = s.color + (isH ? "44" : "28");
        ctx.fill();

        // Node border
        ctx.strokeStyle = s.color;
        ctx.lineWidth = isH ? 3 : 2;
        ctx.stroke();

        // Glowing center core dot
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.restore();

        // Service Name (crystal clear, bright white with text contrast)
        ctx.save();
        ctx.font = "700 13px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = 6;
        ctx.fillText(s.name, sx, sy + r + 18);

        // Table count badge
        ctx.font = "600 11px 'Inter', sans-serif";
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 0;
        ctx.fillText(`${s.tables.length} tables · drag me`, sx, sy + r + 34);
        ctx.restore();

        // Hover / Drag Tooltip card showing exact tables
        if (isH) {
          ctx.save();
          const boxW = 175;
          const boxH = 30 + s.tables.length * 18;
          const bx = Math.max(12, Math.min(W - boxW - 12, sx - boxW / 2));
          const by = Math.max(12, sy - r - boxH - 14);

          // Card background
          ctx.fillStyle = "rgba(10, 16, 28, 0.95)";
          ctx.strokeStyle = s.color + "99";
          ctx.lineWidth = 1.5;
          ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = 14;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, by, boxW, boxH, 10);
          } else {
            ctx.rect(bx, by, boxW, boxH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.shadowBlur = 0;

          // Header
          ctx.font = "700 10px 'Space Grotesk', sans-serif";
          ctx.fillStyle = s.color;
          ctx.textAlign = "left";
          ctx.fillText("MICROSERVICE BOUNDARY", bx + 12, by + 18);

          // Table list
          ctx.font = "500 11px 'JetBrains Mono', monospace";
          ctx.fillStyle = "#e2e8f0";
          s.tables.forEach((t, ti) => {
            ctx.fillText("• " + t, bx + 12, by + 36 + ti * 18);
          });

          ctx.restore();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

/* ─── Tilt Card ─────────────────────────────────────────────── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });
  const [hovered, setHovered] = useState(false);
  const onMove = useCallback(e => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - .5) * -16, y: (px - .5) * 16, gx: Math.round(px * 100), gy: Math.round(py * 100) });
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setTilt({ x: 0, y: 0, gx: 50, gy: 50 }); setHovered(false); }}
      style={{
        ...style, transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? "scale(1.04)" : "scale(1)"}`,
        transition: hovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(.23,1,.32,1)",
        position: "relative", overflow: "hidden", cursor: "default"
      }}>
      {hovered && <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
        background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.11) 0%, transparent 60%)`
      }} />}
      {children}
    </div>
  );
}

/* ─── Typewriter ─────────────────────────────────────────────── */
function TypewriterText({ text, delay = 200, speed = 52 }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started || displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [displayed, started, text, speed]);
  return <span>{displayed}{displayed.length < text.length && started && <span style={{ opacity: .5, animation: "blink 1s step-end infinite" }}>|</span>}</span>;
}

/* ─── Counter ────────────────────────────────────────────────── */
function AnimCounter({ target, suffix = "", delay = 0 }) {
  const [count, setCount] = useState(0); const ref = useRef(null);
  useEffect(() => {
    let started = false;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return; started = true;
      setTimeout(() => {
        const steps = 60, dur = 1300; let i = 0;
        const id = setInterval(() => { i++; setCount(Math.round(target * Math.min(1, i / steps))); if (i >= steps) clearInterval(id); }, dur / steps);
      }, delay);
    }, { threshold: .3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, delay]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Cybernetic Scroll Progress Bar ─────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, pointerEvents: "none" }}>
      <motion.div
        style={{
          scaleX,
          transformOrigin: "0%",
          height: "100%",
          background: "linear-gradient(90deg, #1D9E75 0%, #22d3ee 50%, #534AB7 100%)",
          boxShadow: "0 0 12px rgba(34, 211, 238, 0.8), 0 0 24px rgba(29, 158, 117, 0.5)",
        }}
      />
    </div>
  );
}

/* ─── Scroll-to-Top Floating Button ──────────────────────────── */
function ScrollToTopButton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > 350);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.12, boxShadow: "0 0 25px rgba(29,158,117,0.6)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 90,
            background: "rgba(9, 12, 18, 0.88)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(29, 158, 117, 0.45)",
            color: "#5DCAA5",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
          title="Back to top"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─── Step Row (Connected Laser Pipeline) ─────────────────────── */
function StepRow({ step, i, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -35 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
      style={{ display: "flex", gap: "18px", alignItems: "stretch", position: "relative" }}
    >
      {/* Connected vertical laser spine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 48 }}>
        <motion.div
          whileHover={{ scale: 1.15, rotate: 6 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${step.color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: step.color,
            border: `1.5px solid ${step.color}45`,
            fontFamily: "Space Grotesk,sans-serif",
            boxShadow: `0 0 16px ${step.color}25`,
            position: "relative",
            zIndex: 2,
          }}
        >
          {step.icon}
        </motion.div>
        {!isLast && (
          <div style={{
            width: 2,
            flex: 1,
            minHeight: 28,
            background: `linear-gradient(to bottom, ${step.color}77, rgba(255,255,255,0.06))`,
            margin: "4px 0",
          }} />
        )}
      </div>

      {/* Step card content */}
      <motion.div
        whileHover={{ x: 6, borderColor: `${step.color}88` }}
        transition={{ duration: 0.2 }}
        style={{
          flex: 1,
          background: "rgba(10, 15, 26, 0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: "18px 22px",
          marginBottom: isLast ? 0 : 16,
          boxShadow: "0 10px 25px -10px rgba(0,0,0,0.5)",
          transition: "border-color 0.25s, box-shadow 0.25s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: 12, fontWeight: 700, color: step.color, letterSpacing: "0.12em", background: `${step.color}22`, border: `1px solid ${step.color}44`, padding: "3px 10px", borderRadius: 6 }}>
            {step.num}
          </span>
          <h3 style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            {step.title}
          </h3>
        </div>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>
          {step.body}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Fade-in wrapper ────────────────────────────────────────── */
function FadeIn({ children, i = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function NavBar({ page, setPage }) {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [scrolled, setScrolled] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('schemamorph-profile-image') || null;
  });

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U';
  const emailPrefix = user?.email?.split('@')[0] || 'User';

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem('schemamorph-profile-image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  const go = (n) => {
    if (n === "Team") { setPage("team"); window.scrollTo({ top: 0 }); }
    else if (n === "Home") { setPage("home"); window.scrollTo({ top: 0 }); }
    else { setPage("home"); setTimeout(() => document.getElementById(n === "How it works" ? "how" : "features")?.scrollIntoView({ behavior: "smooth" }), 60); }
  };
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(9,12,18,0.9)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none", borderBottom: scrolled ? "0.5px solid rgba(255,255,255,0.07)" : "none", padding: "0 28px", transition: "all 0.3s ease" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 62, gap: 8 }}>
        <div onClick={() => go("Home")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk,sans-serif" }}>S</div>
          <span style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>Schema<span style={{ color: "#1D9E75" }}>Morph</span> AI</span>
        </div>
        <div style={{ flex: 1 }} />
        {["Home", "How it works", "Features", "Team"].map(n => (
          <button key={n} onClick={() => go(n)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.58)", fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 6, fontFamily: "Space Grotesk,sans-serif" }}>{n}</button>
        ))}
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate("/upload")} style={{ background: "transparent", color: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(255,255,255,0.2)", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "Space Grotesk,sans-serif", cursor: "pointer" }}>Dashboard</button>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
            {/* Profile Dropdown Trigger */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: profileOpen ? 'rgba(29, 158, 117, 0.15)' : 'rgba(255,255,255,0.03)',
                border: profileOpen ? '1px solid rgba(29, 158, 117, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 2
              }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="profile-trigger"
              >
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: profileImage ? 'transparent' : 'linear-gradient(135deg, #1D9E75, #0d6e52)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  fontFamily: 'Space Grotesk, sans-serif',
                  overflow: 'hidden'
                }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initial}
                </div>
              </div>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 260,
                  background: 'rgba(9, 12, 18, 0.95)',
                  backdropFilter: 'blur(32px) saturate(150%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 6,
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                  animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  transformOrigin: 'top right'
                }}>
                  {/* User Info Header with Image Upload */}
                  <div style={{
                    padding: '12px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div
                      className="dropdown-avatar"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: profileImage ? 'transparent' : 'linear-gradient(135deg, #1D9E75, #0d6e52)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: '#fff',
                        fontFamily: 'Space Grotesk, sans-serif',
                        cursor: 'pointer',
                        flexShrink: 0,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                      title="Change Profile Photo"
                    >
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : initial}

                      {/* Hover overlay for upload indication */}
                      <div className="avatar-upload-overlay" style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>{emailPrefix}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
                  </div>

                  {/* Profile Item */}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile') }}
                    className="dropdown-item"
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none', background: 'transparent',
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s', textAlign: 'left',
                      marginBottom: 2
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </button>

                  {/* Settings Item */}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile') }}
                    className="dropdown-item"
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none', background: 'transparent',
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s', textAlign: 'left'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </button>

                  {/* Logout Item */}
                  <button
                    onClick={() => { logout(); navigate("/"); }}
                    className="dropdown-item logout"
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none', background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s', textAlign: 'left',
                      marginTop: 4
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => navigate("/login")} style={{ marginLeft: 10, background: "transparent", color: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(255,255,255,0.2)", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "Space Grotesk,sans-serif", cursor: "pointer" }}>Log in</button>
            <button onClick={() => navigate("/register")} style={{ marginLeft: 6, background: "#1D9E75", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "Space Grotesk,sans-serif", cursor: "pointer" }}>Sign up →</button>
          </>
        )}
      </div>
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function HeroSection() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "110px 24px 60px", textAlign: "center", position: "relative" }}>
      <HolographicOverlay />
      {/* Subtle radial gradient backdrop for hero text contrast */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(860px, 94vw)",
        height: "600px",
        background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(6, 8, 16, 0.45) 0%, transparent 80%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />
      <div style={{ position: "relative", zIndex: 3, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(29,158,117,0.16)", border: "1px solid rgba(29,158,117,0.45)", borderRadius: 100, padding: "6px 18px", marginBottom: 26, animation: "fadeUp 0.6s ease both", boxShadow: "0 0 20px rgba(29,158,117,0.25)" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", boxShadow: "0 0 10px #1D9E75", display: "inline-block" }} />
        <span style={{ fontSize: 13, color: "#5DCAA5", fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Graph-first microservice discovery</span>
      </div>
      <h1 style={{ position: "relative", zIndex: 3, fontFamily: "Space Grotesk,sans-serif", fontSize: "clamp(2.6rem,6vw,4rem)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 22, animation: "fadeUp 0.6s 0.1s ease both", textShadow: "0 4px 30px rgba(6,8,16,0.95), 0 2px 10px rgba(0,0,0,0.9)" }}>
        <TypewriterText text="Split your monolith." delay={300} speed={50} />
        <br />
        <span style={{ color: "#1D9E75" }}><TypewriterText text="Not your sanity." delay={1800} speed={52} /></span>
      </h1>
      <p style={{ position: "relative", zIndex: 3, fontSize: "clamp(1.05rem,2vw,1.2rem)", color: "#e2e8f0", lineHeight: 1.72, maxWidth: 560, margin: "0 auto 40px", fontFamily: "Inter,sans-serif", animation: "fadeUp 0.6s 0.25s ease both", textShadow: "0 2px 18px rgba(6,8,16,0.95), 0 0 30px rgba(0,0,0,0.9)" }}>
        Upload a PostgreSQL schema. SchemaMorph builds a dependency graph, runs Louvain clustering, and delivers named microservice boundaries with validation and per-service DDL.
      </p>
      <div style={{ position: "relative", zIndex: 3, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.6s 0.35s ease both" }}>
        {token ? (
          <button onClick={() => navigate("/upload")} style={{ background: "#1D9E75", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: "Space Grotesk,sans-serif", border: "none", cursor: "pointer", display: "inline-block", boxShadow: "0 0 20px rgba(29,158,117,0.4)" }}>Go to Dashboard →</button>
        ) : (
          <>
            <button onClick={() => navigate("/register")} style={{ background: "#1D9E75", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: "Space Grotesk,sans-serif", border: "none", cursor: "pointer", display: "inline-block", boxShadow: "0 0 20px rgba(29,158,117,0.4)" }}>Get started →</button>
            <button onClick={() => navigate("/login")} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.22)", padding: "13px 24px", borderRadius: 10, fontSize: 15, fontWeight: 500, fontFamily: "Space Grotesk,sans-serif", cursor: "pointer", display: "inline-block" }}>Log in</button>
          </>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 3, display: "flex", gap: 52, justifyContent: "center", marginTop: 60, flexWrap: "wrap", animation: "fadeUp 0.6s 0.5s ease both" }}>
        {[{ v: 7, s: " steps", l: "pipeline stages" }, { v: 8, s: " tables", l: "internal schema" }, { v: 100, s: "%", l: "deterministic" }].map((st, i) => (
          <div key={st.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.1rem", fontWeight: 700, color: "#1D9E75", fontFamily: "Space Grotesk,sans-serif", lineHeight: 1, textShadow: "0 0 24px rgba(29, 158, 117, 0.6), 0 2px 10px rgba(0,0,0,0.9)" }}><AnimCounter target={st.v} suffix={st.s} delay={800 + i * 200} /></div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 6, fontFamily: "Inter,sans-serif", fontWeight: 500, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          marginTop: 45,
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}
      >
        <span style={{ fontSize: 12, fontFamily: "Space Grotesk,sans-serif", color: "rgba(255,255,255,0.7)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          style={{ color: "#1D9E75", fontSize: 18, filter: "drop-shadow(0 0 8px #1D9E75)" }}
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Dashboard Preview Section ──────────────────────────────── */
function DashboardSection() {
  return (
    <section id="dashboard" style={{ background: "transparent", padding: "100px 24px 80px", position: "relative" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 44, position: "relative" }}>
          {/* Subtle localized dark aura behind text so 3D background never obscures typography */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(680px, 94vw)",
            height: "170px",
            background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6, 8, 16, 0.75) 0%, rgba(6, 8, 16, 0.3) 60%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(16px)",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          {/* Prominent Eyebrow Badge */}
          <div style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(56, 189, 248, 0.14)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 100, padding: "6px 18px", marginBottom: 14, boxShadow: "0 0 20px rgba(56, 189, 248, 0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 10px #38bdf8", display: "inline-block" }} />
            <span style={{ color: "#38bdf8", fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>INTERACTIVE DASHBOARD</span>
          </div>

          {/* Heading with crisp, strong text shadow */}
          <h2 style={{
            position: "relative",
            zIndex: 1,
            fontFamily: "Space Grotesk,sans-serif",
            fontSize: "clamp(1.9rem,4vw,2.8rem)",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.5px",
            margin: "0 0 12px",
            textShadow: "0 4px 28px rgba(6, 8, 16, 0.95), 0 2px 10px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.85)"
          }}>
            See your schema come alive
          </h2>

          {/* Subtitle: High contrast, large, sharp and readable */}
          <p style={{
            position: "relative",
            zIndex: 1,
            fontFamily: "Inter,sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#f1f5f9",
            maxWidth: 620,
            margin: "0 auto",
            lineHeight: 1.6,
            textShadow: "0 2px 16px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.95)"
          }}>
            Drag the service nodes — they're live. The graph responds to your cursor.
          </p>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0, y: 45, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRadius: 18,
            border: "1px solid rgba(29, 158, 117, 0.35)",
            overflow: "hidden",
            background: "rgba(9, 13, 24, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 30px 70px -15px rgba(0,0,0,0.8), 0 0 45px -10px rgba(29,158,117,0.25)",
          }}
        >
          {/* Top header bar */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {["Dependency Graph", "Target Schemas", "Queries"].map((t, i) => (
                <div key={t} style={{ padding: "14px 20px", fontSize: 13, fontFamily: "Space Grotesk,sans-serif", color: i === 0 ? "#1D9E75" : "rgba(255,255,255,0.55)", fontWeight: i === 0 ? 700 : 500, borderBottom: i === 0 ? "2px solid #1D9E75" : "2px solid transparent", cursor: "pointer" }}>{t}</div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(29, 158, 117, 0.12)", border: "1px solid rgba(29, 158, 117, 0.28)", borderRadius: 100, fontSize: 12, color: "#5DCAA5", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>
              <span>✋ Click & drag any service node</span>
            </div>
          </div>

          {/* Interactive canvas with generous 520px height so all nodes & labels fit cleanly */}
          <div style={{ position: "relative", height: 520, overflow: "hidden", background: "radial-gradient(ellipse at 50% 50%, rgba(13, 20, 36, 0.6) 0%, rgba(9, 13, 24, 0.95) 100%)" }}>
            <DashboardCanvas />
          </div>

          {/* Dedicated bottom stats bar - cleanly placed below the canvas so nothing is ever obstructed */}
          <div style={{ background: "rgba(9, 12, 18, 0.94)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", padding: "14px 24px" }}>
            {[{ l: "Total Tables", v: "24" }, { l: "Identified Services", v: "6" }, { l: "Inter-Service Edges", v: "47" }, { l: "Integrity Validation", v: "✓ 100% Pass" }].map((s, i) => (
              <div key={s.l} style={{ flex: 1, textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: i === 3 ? "#1D9E75" : "#fff", fontFamily: "Space Grotesk,sans-serif" }}>{s.v}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", marginTop: 2, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────── */
function HowSection() {
  return (
    <section id="how" style={{ background: "transparent", padding: "100px 24px 80px", position: "relative" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52, position: "relative" }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(520px, 92vw)",
            height: "150px",
            background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6, 8, 16, 0.72) 0%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(16px)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(29, 158, 117, 0.15)", border: "1px solid rgba(29, 158, 117, 0.4)", borderRadius: 100, padding: "6px 18px", marginBottom: 14, boxShadow: "0 0 20px rgba(29, 158, 117, 0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", boxShadow: "0 0 10px #1D9E75", display: "inline-block" }} />
            <span style={{ color: "#5DCAA5", fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>7-STEP PIPELINE</span>
          </div>
          <h2 style={{ position: "relative", zIndex: 1, fontFamily: "Space Grotesk,sans-serif", fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: 0, textShadow: "0 4px 28px rgba(6, 8, 16, 0.95), 0 2px 10px rgba(0, 0, 0, 0.9)" }}>
            How it works
          </h2>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {STEPS.map((step, i) => (
            <StepRow key={step.num} step={step} i={i} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" style={{ background: "transparent", padding: "100px 24px 80px", position: "relative" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48, position: "relative" }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(520px, 92vw)",
            height: "150px",
            background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6, 8, 16, 0.72) 0%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(16px)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(129, 140, 248, 0.4)", borderRadius: 100, padding: "6px 18px", marginBottom: 14, boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 10px #818cf8", display: "inline-block" }} />
            <span style={{ color: "#a5b4fc", fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>WHAT'S INSIDE</span>
          </div>
          <h2 style={{ position: "relative", zIndex: 1, fontFamily: "Space Grotesk,sans-serif", fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: 0, textShadow: "0 4px 28px rgba(6, 8, 16, 0.95), 0 2px 10px rgba(0, 0, 0, 0.9)" }}>
            Built for real decomposition work
          </h2>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 18 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            >
              <TiltCard style={{ background: "rgba(10, 16, 28, 0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "24px 24px", height: "100%", boxShadow: "0 15px 35px -10px rgba(0,0,0,0.6)" }}>
                <div style={{ fontSize: 22, marginBottom: 12, color: "#1D9E75", filter: "drop-shadow(0 0 10px rgba(29,158,117,0.4))" }}>{f.icon}</div>
                <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{f.label}</div>
                <div style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.65 }}>{f.text}</div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Team Page ──────────────────────────────────────────────── */

function SimpleMemberCard({ member }) {
  const ROLE_COLORS = {
    Admin: { text: '#1D9E75' },
    Analyst: { text: '#818cf8' },
    Viewer: { text: 'rgba(255,255,255,0.5)' },
  }
  const rc = ROLE_COLORS[member.role] || ROLE_COLORS.Viewer
  const [imgError, setImgError] = useState(false)
  const imgMap = {
    'Raghuraj': '/raghu.jpeg',
    'Raghuraj Pratap Rajpoot': '/raghu.jpeg',
    'Samridhi Jaiswal': '/samridhi.jpeg',
    'Samridhi Singh': '/samridhi_singh.jpeg'
  }
  const imgSrc = imgMap[member.name] || '/raghu.jpeg'

  return (
    <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.05} transitionSpeed={2500} className="tilt-wrapper" style={{ height: '100%' }}>
      <motion.div
        className="team-card"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ '--secondary': rc.text, width: '100%', minHeight: '100%', cursor: 'default', padding: '30px 20px' }}
      >
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {!imgError ? (
            <img
              src={imgSrc}
              className="team-img"
              alt={member.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="team-img"
              style={{
                background: `linear-gradient(135deg, ${member.color || '#1D9E75'}33, ${member.color || '#1D9E75'}88)`,
                border: `2px solid ${member.color || '#1D9E75'}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif'
              }}
            >
              {member.initials || member.name.charAt(0)}
            </div>
          )}
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 5, textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}>{member.name}</h3>
        <p className="role" style={{ color: rc.text, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase' }}>
          {member.role}
        </p>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: 10 }}>
          {member.email}
        </div>
      </motion.div>
    </Tilt>
  )
}

function TeamPage() {
  return (
    <section style={{ minHeight: "100vh", background: "transparent", padding: "110px 24px 80px", position: "relative" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64, position: "relative" }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(560px, 92vw)",
            height: "160px",
            background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6, 8, 16, 0.75) 0%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(18px)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(129, 140, 248, 0.4)", borderRadius: 100, padding: "6px 18px", marginBottom: 16, boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 10px #818cf8", display: "inline-block" }} />
            <span style={{ color: "#a5b4fc", fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>THE PEOPLE</span>
          </div>
          <h1 style={{ position: "relative", zIndex: 1, fontFamily: "Space Grotesk,sans-serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.8px", marginBottom: 14, textShadow: "0 4px 28px rgba(6, 8, 16, 0.95), 0 2px 10px rgba(0, 0, 0, 0.9)" }}>
            Built by three.
          </h1>
          <p style={{ position: "relative", zIndex: 1, fontFamily: "Inter,sans-serif", fontSize: 16, color: "#e2e8f0", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, textShadow: "0 2px 16px rgba(0,0,0,0.95)" }}>
            SchemaMorph AI is a capstone project — a real tool built by engineers who needed it to exist.
          </p>
        </div>
        <div className="team-container">
          {TEAM_MEMBERS.map(m => (
            <SimpleMemberCard key={m.id} member={m} />
          ))}
        </div>
        <FadeIn i={3} style={{ marginTop: 52 }}>
          <div style={{ textAlign: "center", background: "rgba(10, 16, 28, 0.8)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "26px 24px", boxShadow: "0 15px 35px -10px rgba(0,0,0,0.6)" }}>
            <p style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: 14, color: "#ffffff", margin: "0 0 14px", letterSpacing: "0.05em" }}>Built with</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {["FastAPI", "LangChain", "Gemini 1.5", "NetworkX", "sqlglot", "React 18", "React Flow", "Supabase", "Docker"].map(t => (
                <span key={t} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "5px 12px", fontSize: 13, color: "#e2e8f0", fontFamily: "Space Grotesk,sans-serif", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Main Landing Page ──────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const [page, setPage] = useState("home");
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{50%{opacity:0}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.22);opacity:0}}
      `}</style>
      <ScrollProgressBar />
      <Background3D />
      <ScrollToTopButton />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", background: "transparent", overflowX: "hidden" }}>
        <NavBar page={page} setPage={setPage} />
        {page === "home" ? (
          <>
            <HeroSection />
            <DashboardSection />
            <HowSection />
            <FeaturesSection />
            <section style={{ padding: "110px 24px", textAlign: "center", background: "transparent", position: "relative" }}>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(620px, 94vw)",
                height: "240px",
                background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6, 8, 16, 0.78) 0%, transparent 100%)",
                borderRadius: "50%",
                filter: "blur(20px)",
                pointerEvents: "none",
                zIndex: 0,
              }} />
              <div style={{ maxWidth: 540, margin: "0 auto", position: "relative", zIndex: 1 }}>
                <h2 style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: "clamp(1.9rem,4vw,2.6rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", marginBottom: 16, textShadow: "0 4px 28px rgba(6, 8, 16, 0.95), 0 2px 10px rgba(0, 0, 0, 0.9)" }}>
                  Ready to decompose your schema?
                </h2>
                <p style={{ color: "#e2e8f0", fontFamily: "Inter,sans-serif", fontSize: 15, lineHeight: 1.7, marginBottom: 32, textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
                  Upload your PostgreSQL DDL and get a full microservice decomposition report in seconds.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  {token ? (
                    <button onClick={() => navigate("/upload")} style={{ background: "#1D9E75", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: "Space Grotesk,sans-serif", border: "none", cursor: "pointer", display: "inline-block", boxShadow: "0 0 20px rgba(29,158,117,0.4)" }}>Go to Dashboard →</button>
                  ) : (
                    <>
                      <button onClick={() => navigate("/register")} style={{ background: "#1D9E75", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: "Space Grotesk,sans-serif", border: "none", cursor: "pointer", display: "inline-block", boxShadow: "0 0 20px rgba(29,158,117,0.4)" }}>Get started →</button>
                      <button onClick={() => navigate("/login")} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.22)", padding: "13px 24px", borderRadius: 10, fontSize: 15, fontWeight: 500, fontFamily: "Space Grotesk,sans-serif", cursor: "pointer", display: "inline-block" }}>Log in</button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : <TeamPage />}
        <footer style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(18px)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "26px 28px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>© 2025 SchemaMorph AI · Raghuraj · Samridhi Singh · Samridhi Jaiswal</p>
            <div style={{ display: "flex", gap: 20 }}>
              {token ? (
                <>
                  <button onClick={() => navigate("/upload")} style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</button>
                  <button onClick={() => { logout(); navigate("/"); }} style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Log out</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Log in</button>
                  <button onClick={() => navigate("/register")} style={{ fontFamily: "Space Grotesk,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Sign up</button>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
