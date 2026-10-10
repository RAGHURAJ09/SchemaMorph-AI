import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { TEAM_MEMBERS } from "./Team";
/* ─── Data ─────────────────────────────────────────────────── */
import Background3D from "../components/Background3D";
const TEAM = [
  { name:"Raghuraj Pratap Rajpoot", role:"Lead & Architect", avatar:"RR", color:"#1D9E75", bg:"rgba(29,158,117,0.12)", desc:"Graph analysis engine, AI pipeline, backend architecture" },
  { name:"Samridhi Singh", role:"Frontend Engineer", avatar:"SS", color:"#534AB7", bg:"rgba(83,74,183,0.12)", desc:"React Flow visualization, UI design, Zustand state management" },
  { name:"Samridhi Jaiswal", role:"Backend Engineer", avatar:"SJ", color:"#993556", bg:"rgba(153,53,86,0.12)", desc:"SQL parsing, database schema, validation pipeline" },
];
const STEPS = [
  { num:"01", title:"Upload your schema", body:"Paste DDL or upload a .sql file. SchemaMorph accepts PostgreSQL schemas of any size.", icon:"↑", color:"#1D9E75" },
  { num:"02", title:"Graph is built", body:"sqlglot parses every table and FK. NetworkX builds a weighted graph — FK edges 2×, co-access 1×.", icon:"⬡", color:"#534AB7" },
  { num:"03", title:"Louvain clustering", body:"Community detection groups tables into microservice candidates — deterministically, before AI sees anything.", icon:"◎", color:"#185FA5" },
  { num:"04", title:"AI narration", body:"Gemini names each service, writes rationale, and flags cross-boundary queries.", icon:"◇", color:"#BA7517" },
  { num:"05", title:"Validation & report", body:"Orphan tables, FK integrity, cycle detection, broken query rewrites — all reported.", icon:"✓", color:"#639922" },
];
const FEATURES = [
  { icon:"⬡", label:"Graph analysis", text:"FK + co-access weighted graph via NetworkX" },
  { icon:"◎", label:"Louvain clustering", text:"Community detection, not heuristics" },
  { icon:"◇", label:"AI narration only", text:"AI names, never decides — determinism first" },
  { icon:"✓", label:"Full validation", text:"Orphans, cycles, FK integrity, broken queries" },
  { icon:"↗", label:"Per-service DDL", text:"Ready-to-deploy split schemas with comments" },
  { icon:"→", label:"React Flow viz", text:"Interactive, color-coded dependency graph" },
];
const SERVICES = [
  { name:"User Service", x:.18, y:.35, color:"#1D9E75", tables:["users","sessions","auth"] },
  { name:"Order Service", x:.42, y:.22, color:"#534AB7", tables:["orders","order_items"] },
  { name:"Product Service", x:.68, y:.35, color:"#185FA5", tables:["products","inventory","categories"] },
  { name:"Payment Service", x:.32, y:.68, color:"#BA7517", tables:["payments","invoices"] },
  { name:"Analytics", x:.58, y:.70, color:"#993556", tables:["events","logs"] },
  { name:"Notification", x:.82, y:.55, color:"#639922", tables:["notifications"] },
];
const EDGES = [[0,1],[0,3],[1,2],[1,3],[2,4],[3,4],[4,5],[1,5]];

/* ─── Graph Background Canvas removed for 3D version ───────────────────────────────── */

/* ─── Dashboard Canvas (drag-interactive) ───────────────────── */
function DashboardCanvas() {
  const canvasRef = useRef(null);
  const servicesRef = useRef(SERVICES.map(s => ({...s})));
  const stateRef = useRef({ mx:0, my:0, isDragging:false, dragS:null, dragOffX:0, dragOffY:0, hoveredS:null, t:0 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    const services = servicesRef.current;
    let W, H;

    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; st.mx=W/2; st.my=H/2; }
    resize();

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      st.mx = e.clientX-r.left; st.my = e.clientY-r.top;
      if(st.isDragging&&st.dragS){
        st.dragS.x=(st.mx-st.dragOffX)/W; st.dragS.y=(st.my-st.dragOffY)/H;
        st.dragS.x=Math.max(.05,Math.min(.95,st.dragS.x));
        st.dragS.y=Math.max(.08,Math.min(.80,st.dragS.y));
      }
      st.hoveredS=null;
      services.forEach(s=>{ if(Math.hypot(st.mx-s.x*W,st.my-s.y*H)<36) st.hoveredS=s; });
      canvas.style.cursor=st.hoveredS||st.isDragging?"grab":"default";
    };
    const onDown = e => {
      const r = canvas.getBoundingClientRect();
      const lx=e.clientX-r.left, ly=e.clientY-r.top;
      services.forEach(s => {
        if(Math.hypot(lx-s.x*W,ly-s.y*H)<36){
          st.isDragging=true; st.dragS=s; st.dragOffX=lx-s.x*W; st.dragOffY=ly-s.y*H;
          canvas.style.cursor="grabbing";
        }
      });
    };
    const onUp = ()=>{ st.isDragging=false; st.dragS=null; canvas.style.cursor="default"; };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0,0,W,H);
      st.t += .018;
      const offX=(st.mx-W/2)*.05, offY=(st.my-H/2)*.05;

      // bg glow
      const rad=ctx.createRadialGradient(W/2+offX,H/2+offY,0,W/2+offX,H/2+offY,W*.6);
      rad.addColorStop(0,"rgba(29,158,117,0.07)"); rad.addColorStop(1,"transparent");
      ctx.fillStyle=rad; ctx.fillRect(0,0,W,H);

      // edges
      EDGES.forEach(([a,b]) => {
        const sa=services[a], sb=services[b];
        const x1=sa.x*W+offX*(1-sa.x), y1=sa.y*H+offY*(1-sa.y);
        const x2=sb.x*W+offX*(1-sb.x), y2=sb.y*H+offY*(1-sb.y);
        const grad=ctx.createLinearGradient(x1,y1,x2,y2);
        grad.addColorStop(0,sa.color+"44"); grad.addColorStop(1,sb.color+"44");
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
        ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.stroke();
        const prog=((st.t*.5+a*.3)%1);
        ctx.beginPath();ctx.arc(x1+(x2-x1)*prog, y1+(y2-y1)*prog, 2.5,0,Math.PI*2);
        ctx.fillStyle=sa.color+"cc"; ctx.fill();
      });

      // nodes
      services.forEach((s,i) => {
        const pf=1-(i*.04);
        const sx=s.x*W+offX*pf, sy=s.y*H+offY*pf;
        const isH=s===st.hoveredS||s===st.dragS;
        const r=isH?38:30;
        const glow=Math.sin(st.t+i*1.1)*.15+.85;
        if(isH){
          ctx.beginPath();ctx.arc(sx,sy,r+10,0,Math.PI*2);
          ctx.strokeStyle=s.color+"44"; ctx.lineWidth=7; ctx.stroke();
        }
        ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);
        ctx.fillStyle=s.color+Math.floor(glow*32).toString(16).padStart(2,"0");
        ctx.fill();
        ctx.strokeStyle=s.color+Math.floor(glow*200).toString(16).padStart(2,"0");
        ctx.lineWidth=1.5; ctx.stroke();
        ctx.beginPath();ctx.arc(sx,sy,6,0,Math.PI*2);
        ctx.fillStyle=s.color; ctx.fill();

        ctx.font="600 11px 'Space Grotesk',sans-serif";
        ctx.fillStyle="rgba(255,255,255,0.88)"; ctx.textAlign="center";
        ctx.fillText(s.name,sx,sy+r+13);

        if(isH){
          ctx.font="400 9px 'Inter',sans-serif"; ctx.fillStyle=s.color+"cc";
          s.tables.forEach((t,ti)=>ctx.fillText(t,sx,sy+r+25+ti*11));
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
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />;
}

/* ─── Tilt Card ─────────────────────────────────────────────── */
function TiltCard({ children, style={} }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x:0, y:0, gx:50, gy:50 });
  const [hovered, setHovered] = useState(false);
  const onMove = useCallback(e => {
    const r = ref.current.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
    setTilt({ x:(py-.5)*-16, y:(px-.5)*16, gx:Math.round(px*100), gy:Math.round(py*100) });
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setTilt({x:0,y:0,gx:50,gy:50});setHovered(false);}}
      style={{ ...style, transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered?"scale(1.04)":"scale(1)"}`,
        transition:hovered?"transform 0.08s ease-out":"transform 0.5s cubic-bezier(.23,1,.32,1)",
        position:"relative", overflow:"hidden", cursor:"default" }}>
      {hovered && <div style={{ position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none",zIndex:2,
        background:`radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.11) 0%, transparent 60%)` }} />}
      {children}
    </div>
  );
}

/* ─── Typewriter ─────────────────────────────────────────────── */
function TypewriterText({ text, delay=200, speed=52 }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setStarted(true),delay); return()=>clearTimeout(t); },[delay]);
  useEffect(()=>{
    if(!started||displayed.length>=text.length) return;
    const t=setTimeout(()=>setDisplayed(text.slice(0,displayed.length+1)),speed);
    return()=>clearTimeout(t);
  },[displayed,started,text,speed]);
  return <span>{displayed}{displayed.length<text.length&&started&&<span style={{opacity:.5,animation:"blink 1s step-end infinite"}}>|</span>}</span>;
}

/* ─── Counter ────────────────────────────────────────────────── */
function AnimCounter({ target, suffix="", delay=0 }) {
  const [count, setCount] = useState(0); const ref = useRef(null);
  useEffect(()=>{
    let started=false;
    const obs=new IntersectionObserver(([e])=>{
      if(!e.isIntersecting||started) return; started=true;
      setTimeout(()=>{ const steps=60,dur=1300; let i=0;
        const id=setInterval(()=>{ i++; setCount(Math.round(target*Math.min(1,i/steps))); if(i>=steps)clearInterval(id); },dur/steps);
      },delay);
    },{threshold:.3});
    if(ref.current) obs.observe(ref.current);
    return()=>obs.disconnect();
  },[target,delay]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Step Row ───────────────────────────────────────────────── */
function StepRow({ step, i }) {
  const ref = useRef(null); const [vis, setVis] = useState(false);
  useEffect(()=>{ const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.2}); if(ref.current)obs.observe(ref.current); return()=>obs.disconnect(); },[]);
  return (
    <div ref={ref} style={{ display:"flex",gap:"14px",alignItems:"flex-start",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(20px)",transition:`opacity 0.5s ${i*.09}s ease,transform 0.5s ${i*.09}s ease` }}>
      <div style={{ width:46,height:46,borderRadius:10,flexShrink:0,background:`${step.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:step.color,border:`1px solid ${step.color}30`,fontFamily:"Space Grotesk,sans-serif" }}>{step.icon}</div>
      <div style={{ flex:1,background:"rgba(255,255,255,0.025)",border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"15px 18px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:5 }}>
          <span style={{ fontFamily:"Space Grotesk,sans-serif",fontSize:10,fontWeight:700,color:step.color,letterSpacing:"0.1em" }}>{step.num}</span>
          <h3 style={{ fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:14,color:"#fff",margin:0 }}>{step.title}</h3>
        </div>
        <p style={{ fontFamily:"Inter,sans-serif",fontSize:13,color:"rgba(255,255,255,0.38)",lineHeight:1.65,margin:0 }}>{step.body}</p>
      </div>
    </div>
  );
}

/* ─── Fade-in wrapper ────────────────────────────────────────── */
function FadeIn({ children, i=0, style={} }) {
  const ref = useRef(null); const [vis, setVis] = useState(false);
  useEffect(()=>{ const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.15}); if(ref.current)obs.observe(ref.current); return()=>obs.disconnect(); },[]);
  return <div ref={ref} style={{ ...style, opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(20px)", transition:`opacity 0.5s ${i*.09}s ease,transform 0.5s ${i*.09}s ease` }}>{children}</div>;
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

  useEffect(()=>{ const fn=()=>setScrolled(window.scrollY>20); window.addEventListener("scroll",fn); return()=>window.removeEventListener("scroll",fn); },[]);

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
    if(n==="Team"){setPage("team");window.scrollTo({top:0});}
    else if(n==="Home"){setPage("home");window.scrollTo({top:0});}
    else{setPage("home");setTimeout(()=>document.getElementById(n==="How it works"?"how":"features")?.scrollIntoView({behavior:"smooth"}),60);}
  };
  return (
    <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:100, background:scrolled?"rgba(9,12,18,0.9)":"transparent", backdropFilter:scrolled?"blur(14px)":"none", borderBottom:scrolled?"0.5px solid rgba(255,255,255,0.07)":"none", padding:"0 28px", transition:"all 0.3s ease" }}>
      <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",height:62,gap:8 }}>
        <div onClick={()=>go("Home")} style={{ display:"flex",alignItems:"center",gap:9,cursor:"pointer" }}>
          <div style={{ width:30,height:30,borderRadius:8,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",fontFamily:"Space Grotesk,sans-serif" }}>S</div>
          <span style={{ fontFamily:"Space Grotesk,sans-serif",fontWeight:700,fontSize:17,color:"#fff" }}>Schema<span style={{color:"#1D9E75"}}>Morph</span> AI</span>
        </div>
        <div style={{flex:1}}/>
        {["Home","How it works","Features","Team"].map(n=>(
          <button key={n} onClick={()=>go(n)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.58)",fontSize:13,fontWeight:500,padding:"6px 12px",borderRadius:6,fontFamily:"Space Grotesk,sans-serif" }}>{n}</button>
        ))}
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={()=>navigate("/upload")} style={{ background:"transparent",color:"rgba(255,255,255,0.8)",border:"0.5px solid rgba(255,255,255,0.2)",padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:500,fontFamily:"Space Grotesk,sans-serif",cursor:"pointer" }}>Dashboard</button>
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
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
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
            <button onClick={()=>navigate("/login")} style={{ marginLeft:10,background:"transparent",color:"rgba(255,255,255,0.8)",border:"0.5px solid rgba(255,255,255,0.2)",padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:500,fontFamily:"Space Grotesk,sans-serif",cursor:"pointer" }}>Log in</button>
            <button onClick={()=>navigate("/register")} style={{ marginLeft:6,background:"#1D9E75",color:"#fff",padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:"Space Grotesk,sans-serif",cursor:"pointer" }}>Sign up →</button>
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
    <section style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"110px 24px 60px",textAlign:"center",position:"relative" }}>
      <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(29,158,117,0.1)",border:"0.5px solid rgba(29,158,117,0.3)",borderRadius:100,padding:"5px 14px",marginBottom:26,animation:"fadeUp 0.6s ease both" }}>
        <span style={{width:6,height:6,borderRadius:"50%",background:"#1D9E75",display:"inline-block"}}/>
        <span style={{fontSize:12,color:"#5DCAA5",fontFamily:"Space Grotesk,sans-serif",fontWeight:500}}>Graph-first microservice discovery</span>
      </div>
      <h1 style={{ fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(2.6rem,6vw,4rem)",fontWeight:700,color:"#fff",lineHeight:1.08,letterSpacing:"-2px",marginBottom:22,animation:"fadeUp 0.6s 0.1s ease both" }}>
        <TypewriterText text="Split your monolith." delay={300} speed={50}/>
        <br/>
        <span style={{color:"#1D9E75"}}><TypewriterText text="Not your sanity." delay={1800} speed={52}/></span>
      </h1>
      <p style={{ fontSize:"clamp(1rem,2vw,1.15rem)",color:"rgba(255,255,255,0.44)",lineHeight:1.72,maxWidth:530,margin:"0 auto 40px",fontFamily:"Inter,sans-serif",animation:"fadeUp 0.6s 0.25s ease both" }}>
        Upload a PostgreSQL schema. SchemaMorph builds a dependency graph, runs Louvain clustering, and delivers named microservice boundaries with validation and per-service DDL.
      </p>
      <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",animation:"fadeUp 0.6s 0.35s ease both" }}>
        {token ? (
          <button onClick={()=>navigate("/upload")} style={{ background:"#1D9E75",color:"#fff",padding:"13px 28px",borderRadius:10,fontSize:15,fontWeight:600,fontFamily:"Space Grotesk,sans-serif",border:"none",cursor:"pointer",display:"inline-block" }}>Go to Dashboard →</button>
        ) : (
          <>
            <button onClick={()=>navigate("/register")} style={{ background:"#1D9E75",color:"#fff",padding:"13px 28px",borderRadius:10,fontSize:15,fontWeight:600,fontFamily:"Space Grotesk,sans-serif",border:"none",cursor:"pointer",display:"inline-block" }}>Get started →</button>
            <button onClick={()=>navigate("/login")} style={{ background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.82)",border:"0.5px solid rgba(255,255,255,0.15)",padding:"13px 24px",borderRadius:10,fontSize:15,fontWeight:500,fontFamily:"Space Grotesk,sans-serif",cursor:"pointer",display:"inline-block" }}>Log in</button>
          </>
        )}
      </div>
      <div style={{ display:"flex",gap:52,justifyContent:"center",marginTop:60,flexWrap:"wrap",animation:"fadeUp 0.6s 0.5s ease both" }}>
        {[{v:7,s:" steps",l:"pipeline stages"},{v:8,s:" tables",l:"internal schema"},{v:100,s:"%",l:"deterministic"}].map((st,i)=>(
          <div key={st.l} style={{textAlign:"center"}}>
            <div style={{fontSize:"2.1rem",fontWeight:700,color:"#1D9E75",fontFamily:"Space Grotesk,sans-serif",lineHeight:1}}><AnimCounter target={st.v} suffix={st.s} delay={800+i*200}/></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:5,fontFamily:"Inter,sans-serif"}}>{st.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Dashboard Preview Section ──────────────────────────────── */
function DashboardSection() {
  return (
    <section style={{ background:"rgba(9,12,18,0.85)",padding:"90px 24px",position:"relative" }}>
      <div style={{ maxWidth:1000,margin:"0 auto" }}>
        <FadeIn style={{ textAlign:"center",marginBottom:48 }}>
          <p style={{color:"#185FA5",fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:12,letterSpacing:"0.1em",marginBottom:10}}>DASHBOARD</p>
          <h2 style={{fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(1.7rem,4vw,2.6rem)",fontWeight:700,color:"#fff",letterSpacing:"-0.5px",margin:"0 0 10px"}}>See your schema come alive</h2>
          <p style={{fontFamily:"Inter,sans-serif",fontSize:14,color:"rgba(255,255,255,0.36)",maxWidth:400,margin:"0 auto"}}>Drag the service nodes — they're live. The graph responds to your cursor.</p>
        </FadeIn>
        <FadeIn i={1}>
          <div style={{ borderRadius:16,border:"0.5px solid rgba(255,255,255,0.1)",overflow:"hidden",background:"rgba(255,255,255,0.02)" }}>
            {/* Tab bar */}
            <div style={{ background:"rgba(255,255,255,0.03)",borderBottom:"0.5px solid rgba(255,255,255,0.08)",display:"flex",padding:"0 20px" }}>
              {["Dependency Graph","Target Schemas","Queries"].map((t,i)=>(
                <div key={t} style={{ padding:"12px 18px",fontSize:13,fontFamily:"Space Grotesk,sans-serif",color:i===0?"#1D9E75":"rgba(255,255,255,0.35)",fontWeight:i===0?600:400,borderBottom:i===0?"2px solid #1D9E75":"2px solid transparent" }}>{t}</div>
              ))}
            </div>
            {/* Interactive canvas */}
            <div style={{ position:"relative",height:360,overflow:"hidden" }}>
              <DashboardCanvas/>
              {/* Stats bar overlay */}
              <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"rgba(9,12,18,0.84)",backdropFilter:"blur(8px)",borderTop:"0.5px solid rgba(255,255,255,0.07)",display:"flex",padding:"10px 20px" }}>
                {[{l:"Tables",v:"24"},{l:"Services",v:"6"},{l:"Edges",v:"47"},{l:"Validation",v:"✓ Pass"}].map((s,i)=>(
                  <div key={s.l} style={{ flex:1,textAlign:"center",borderRight:i<3?"0.5px solid rgba(255,255,255,0.07)":"none" }}>
                    <div style={{fontSize:16,fontWeight:700,color:i===3?"#1D9E75":"#fff",fontFamily:"Space Grotesk,sans-serif"}}>{s.v}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.32)",fontFamily:"Inter,sans-serif",marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────── */
function HowSection() {
  return (
    <section id="how" style={{ background:"rgba(12,16,24,0.9)",padding:"90px 24px" }}>
      <div style={{ maxWidth:860,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:52 }}>
          <p style={{color:"#1D9E75",fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:12,letterSpacing:"0.1em",marginBottom:10}}>7-STEP PIPELINE</p>
          <h2 style={{fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(1.7rem,4vw,2.6rem)",fontWeight:700,color:"#fff",letterSpacing:"-0.5px",margin:0}}>How it works</h2>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {STEPS.map((step,i)=><StepRow key={step.num} step={step} i={i}/>)}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" style={{ background:"rgba(9,12,18,0.9)",padding:"90px 24px" }}>
      <div style={{ maxWidth:940,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <p style={{color:"#534AB7",fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:12,letterSpacing:"0.1em",marginBottom:10}}>WHAT'S INSIDE</p>
          <h2 style={{fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(1.7rem,4vw,2.6rem)",fontWeight:700,color:"#fff",letterSpacing:"-0.5px",margin:0}}>Built for real decomposition work</h2>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14 }}>
          {FEATURES.map((f,i)=>(
            <FadeIn key={f.label} i={i}>
              <TiltCard style={{ background:"rgba(255,255,255,0.025)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"22px 22px" }}>
                <div style={{fontSize:19,marginBottom:9,color:"#1D9E75"}}>{f.icon}</div>
                <div style={{fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:14,color:"#fff",marginBottom:5}}>{f.label}</div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.6}}>{f.text}</div>
              </TiltCard>
            </FadeIn>
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
  const imgMap = {
    'Raghuraj': '/raghu.jpeg',
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
          <img src={imgSrc} className="team-img" alt={member.name} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 5, textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}>{member.name}</h3>
        <p className="role" style={{ color: rc.text, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase' }}>
          {member.role}
        </p>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: 10 }}>
          {member.email}
        </div>
      </motion.div>
    </Tilt>
  )
}

function TeamPage() {
  return (
    <section style={{ minHeight:"100vh",background:"radial-gradient(ellipse 65% 45% at 50% 0%,rgba(83,74,183,0.13) 0%,transparent 60%),rgba(9,12,18,0.97)",padding:"110px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:64 }}>
          <p style={{color:"#534AB7",fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:12,letterSpacing:"0.1em",marginBottom:12}}>THE PEOPLE</p>
          <h1 style={{fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(2rem,5vw,3rem)",fontWeight:700,color:"#fff",letterSpacing:"-0.8px",marginBottom:12}}>Built by three.</h1>
          <p style={{fontFamily:"Inter,sans-serif",fontSize:15,color:"rgba(255,255,255,0.38)",maxWidth:440,margin:"0 auto",lineHeight:1.7}}>SchemaMorph AI is a capstone project — a real tool built by engineers who needed it to exist.</p>
        </div>
        <div className="team-container">
          {TEAM_MEMBERS.map(m => (
            <SimpleMemberCard key={m.id} member={m} />
          ))}
        </div>
        <FadeIn i={3} style={{ marginTop:52 }}>
          <div style={{ textAlign:"center",background:"rgba(255,255,255,0.02)",border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:12,padding:24 }}>
            <p style={{fontFamily:"Space Grotesk,sans-serif",fontWeight:600,fontSize:13,color:"rgba(255,255,255,0.32)",margin:"0 0 12px"}}>Built with</p>
            <div style={{ display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap" }}>
              {["FastAPI","LangChain","Gemini 1.5","NetworkX","sqlglot","React 18","React Flow","Supabase","Docker"].map(t=>(
                <span key={t} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"4px 10px",fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:"Space Grotesk,sans-serif"}}>{t}</span>
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{50%{opacity:0}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.22);opacity:0}}
      `}</style>
      <Background3D/>
      <div style={{ position:"relative",zIndex:1,minHeight:"100vh",background:"transparent",overflowX:"hidden" }}>
        <NavBar page={page} setPage={setPage}/>
        {page==="home" ? (
          <>
            <HeroSection/>
            <DashboardSection/>
            <HowSection/>
            <FeaturesSection/>
            <section style={{ padding:"80px 24px",textAlign:"center" }}>
              <div style={{ maxWidth:500,margin:"0 auto" }}>
                <h2 style={{fontFamily:"Space Grotesk,sans-serif",fontSize:"clamp(1.7rem,4vw,2.4rem)",fontWeight:700,color:"#fff",letterSpacing:"-0.5px",marginBottom:14}}>Ready to decompose your schema?</h2>
                <p style={{color:"rgba(255,255,255,0.38)",fontFamily:"Inter,sans-serif",fontSize:14,lineHeight:1.7,marginBottom:30}}>Upload your PostgreSQL DDL and get a full microservice decomposition report in seconds.</p>
                <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                  {token ? (
                    <button onClick={()=>navigate("/upload")} style={{background:"#1D9E75",color:"#fff",padding:"12px 26px",borderRadius:10,fontSize:14,fontWeight:600,fontFamily:"Space Grotesk,sans-serif",border:"none",cursor:"pointer",display:"inline-block"}}>Go to Dashboard →</button>
                  ) : (
                    <>
                      <button onClick={()=>navigate("/register")} style={{background:"#1D9E75",color:"#fff",padding:"12px 26px",borderRadius:10,fontSize:14,fontWeight:600,fontFamily:"Space Grotesk,sans-serif",border:"none",cursor:"pointer",display:"inline-block"}}>Get started →</button>
                      <button onClick={()=>navigate("/login")} style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.75)",border:"0.5px solid rgba(255,255,255,0.12)",padding:"12px 22px",borderRadius:10,fontSize:14,fontWeight:500,fontFamily:"Space Grotesk,sans-serif",cursor:"pointer",display:"inline-block"}}>Log in</button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : <TeamPage/>}
        <footer style={{ background:"rgba(6,8,16,0.96)",borderTop:"0.5px solid rgba(255,255,255,0.06)",padding:"20px 28px" }}>
          <div style={{ maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
            <p style={{fontFamily:"Inter,sans-serif",fontSize:12,color:"rgba(255,255,255,0.22)"}}>© 2025 SchemaMorph AI · Raghuraj · Samridhi Singh · Samridhi Jaiswal</p>
            <div style={{display:"flex",gap:16}}>
              {token ? (
                <>
                  <button onClick={()=>navigate("/upload")} style={{fontFamily:"Space Grotesk,sans-serif",fontSize:12,color:"rgba(255,255,255,0.28)",textDecoration:"none",background:"none",border:"none",cursor:"pointer"}}>Dashboard</button>
                  <button onClick={()=>{logout(); navigate("/");}} style={{fontFamily:"Space Grotesk,sans-serif",fontSize:12,color:"rgba(255,255,255,0.28)",textDecoration:"none",background:"none",border:"none",cursor:"pointer"}}>Log out</button>
                </>
              ) : (
                <>
                  <button onClick={()=>navigate("/login")} style={{fontFamily:"Space Grotesk,sans-serif",fontSize:12,color:"rgba(255,255,255,0.28)",textDecoration:"none",background:"none",border:"none",cursor:"pointer"}}>Log in</button>
                  <button onClick={()=>navigate("/register")} style={{fontFamily:"Space Grotesk,sans-serif",fontSize:12,color:"rgba(255,255,255,0.28)",textDecoration:"none",background:"none",border:"none",cursor:"pointer"}}>Sign up</button>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
