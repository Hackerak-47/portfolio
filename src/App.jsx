import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Google Fonts injected once ─── */
const FontLink = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

/* ─── Particle canvas simulation ─── */
function ParticleCanvas({ color1 = "#ff3cac", color2 = "#2b86c5" }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], mouse: { x: -999, y: -999 }, raf: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 90;
    s.particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5,
      hue: Math.random(),
    }));

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      s.mouse.x = e.clientX - rect.left;
      s.mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener("mousemove", onMove);

    const lerp = (a, b, t) => a + (b - a) * t;
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { particles, mouse } = s;

      particles.forEach((p) => {
        // repel from mouse
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.6;
          p.vy += (dy / dist) * force * 0.6;
        }
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const cr = Math.round(lerp(r1, r2, p.hue));
        const cg = Math.round(lerp(g1, g2, p.hue));
        const cb = Math.round(lerp(b1, b2, p.hue));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`;
        ctx.fill();
      });

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            const alpha = (1 - d / 100) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,60,172,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      s.raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}

/* ─── Floating blobs ─── */
function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { w: 500, h: 500, right: -100, top: -100, bg: "radial-gradient(#ff3cac88,#784ba044)", delay: "0s" },
        { w: 350, h: 350, right: 180, bottom: 40, bg: "radial-gradient(#2b86c588,#784ba044)", delay: "3s" },
        { w: 220, h: 220, left: 80, top: 120, bg: "radial-gradient(#ff6b6b66,#ff3cac33)", delay: "1.5s" },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.w,
            height: b.h,
            right: b.right,
            left: b.left,
            top: b.top,
            bottom: b.bottom,
            background: b.bg,
            borderRadius: "50%",
            filter: "blur(80px)",
            opacity: 0.4,
            animation: `blobFloat 8s ease-in-out ${b.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Typewriter ─── */
function Typewriter({ words, speed = 90, pause = 1800 }) {
  const [display, setDisplay] = useState("");
  const [wi, setWi] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wi % words.length];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setDisplay(word.slice(0, display.length + 1));
        if (display.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setDisplay(display.slice(0, -1));
        if (display.length === 0) { setDeleting(false); setWi((w) => w + 1); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [display, deleting, wi]);

  return (
    <span>
      {display}
      <span style={{ borderRight: "3px solid #ff3cac", marginLeft: 2, animation: "blink 0.8s step-end infinite" }} />
    </span>
  );
}

/* ─── Magnetic button ─── */
function MagBtn({ children, onClick, primary }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
  };
  const onLeave = () => { ref.current.style.transform = ""; };

  const base = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: "2px",
    textTransform: "uppercase",
    padding: "14px 34px",
    borderRadius: 3,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "box-shadow 0.3s, transform 0.15s",
    border: "none",
  };
  const style = primary
    ? { ...base, background: "linear-gradient(135deg,#ff3cac,#784ba0)", color: "#fff" }
    : { ...base, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.22)" };

  return (
    <span
      ref={ref}
      style={{ display: "inline-block", transition: "transform 0.18s ease" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <button style={style} onClick={onClick}>{children}</button>
    </span>
  );
}

/* ─── Custom cursor ─── */
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.left = pos.current.x + "px";
        dotRef.current.style.top = pos.current.y + "px";
      }
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf.current); };
  }, []);

  const dot = { position:"fixed", width:10, height:10, background:"#ff3cac", borderRadius:"50%", pointerEvents:"none", zIndex:9999, transform:"translate(-50%,-50%)", mixBlendMode:"difference" };
  const ringS = { position:"fixed", width:36, height:36, border:"1.5px solid rgba(255,60,172,0.5)", borderRadius:"50%", pointerEvents:"none", zIndex:9998, transform:"translate(-50%,-50%)" };
  return <><div ref={dotRef} style={dot}/><div ref={ringRef} style={ringS}/></>;
}

/* ─── Scroll indicator ─── */
function ScrollDots({ total, current }) {
  return (
    <div style={{ position:"fixed", right:28, top:"50%", transform:"translateY(-50%)", zIndex:200, display:"flex", flexDirection:"column", gap:12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ 
          width: 6, 
          height: i === current ? 28 : 6, 
          borderRadius: 8, 
          background: i === current ? "#ff3cac" : "rgba(255,255,255,0.15)", 
          transition:"all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
          boxShadow: i === current ? "0 0 16px rgba(255,60,172,0.6)" : "none",
          cursor:"pointer"
        }} onClick={() => document.getElementById("s"+i).scrollIntoView({ behavior:"smooth" })} />
      ))}
    </div>
  );
}

/* ─── Counter animation ─── */
function CountUp({ end, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = () => {
          start += Math.ceil(end / 40);
          if (start >= end) { setVal(end); return; }
          setVal(start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Scroll Reveal Animation ─── */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "inherit",
        textAlign: "inherit"
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTIONS
═══════════════════════════════════════════ */

function HomeSection() {
  return (
    <section style={sectionStyle("#0a0a0f")}>
      <Blobs />
      <ParticleCanvas />
      <div style={{ position:"relative", zIndex:2, maxWidth:900, padding:"0 48px", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#ff3cac", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <span style={{ display:"inline-block", width:40, height:1, background:"#ff3cac" }} />
          IT Student & Developer
          <span style={{ display:"inline-block", width:40, height:1, background:"#ff3cac" }} />
        </div>

        <Reveal delay={0.1}>
          <h1 style={{ 
            fontFamily:"'Bebas Neue',sans-serif", 
            fontSize:"clamp(72px,11vw,132px)", 
            lineHeight:0.95, 
            letterSpacing:2, 
            marginBottom:16,
            display: "inline-block",
            textShadow: "0 0 40px rgba(255, 60, 172, 0.15)"
          }}>
            <span style={{ display:"block", color:"#fff" }}>Aastha</span>
            <span style={{ display:"block", background:"linear-gradient(135deg,#ff3cac 0%,#784ba0 50%,#2b86c5 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Khandelwal
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.3}>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:18, fontWeight:300, lineHeight:1.8, color:"rgba(255,255,255,0.6)", maxWidth:600, marginTop:20, marginBottom:44 }}>
            Building <Typewriter words={["full-stack apps","collaborative editors","AI applications","real things with code"]} />
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
            <MagBtn primary onClick={() => document.getElementById("s2").scrollIntoView({ behavior:"smooth" })}>
              See My Work
            </MagBtn>
            <MagBtn onClick={() => document.getElementById("s3").scrollIntoView({ behavior:"smooth" })}>
              Get In Touch
            </MagBtn>
          </div>
        </Reveal>

        {/* stats */}
        <Reveal delay={0.7}>
          <div style={{ 
          display: "flex", 
          gap: 48, 
          marginTop: 64, 
          justifyContent: "center",
          width: "100%",
          maxWidth: 600
        }}>
          {[
            { num: 3, suf: "+", label: "Projects Built" },
            { num: 160, suf: "+", label: "NSS Hours" },
            { num: 15, suf: "+", label: "Tech Stack" },
          ].map((s, i) => (
            <div key={i} style={{ 
              flex: 1, 
              textAlign: "center", 
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none", 
              paddingLeft: i > 0 ? 24 : 0 
            }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, lineHeight:1, background:"linear-gradient(135deg,#ff3cac,#784ba0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                <CountUp end={s.num} suffix={s.suf} />
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginTop:4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        </Reveal>
      </div>

      <ScrollHint />
    </section>
  );
}

function SkillsSection() {
  const [activeTab, setActiveTab] = useState("all");

  const skills = [
    { name:"JavaScript", cat:"lang" }, { name:"TypeScript", cat:"lang" }, { name:"React", cat:"fw" },
    { name:"Next.js", cat:"fw" }, { name:"Node.js", cat:"fw" }, { name:"Express.js", cat:"fw" },
    { name:"Tailwind CSS", cat:"lib" }, { name:"Firebase", cat:"fw" }, { name:"Supabase", cat:"fw" },
    { name:"Gemini API", cat:"lib" }, { name:"MongoDB", cat:"fw" }, { name:"SQL", cat:"lang" },
    { name:"Framer Motion", cat:"lib" }, { name:"Recharts", cat:"lib" }, { name:"Mongoose", cat:"lib" },
    { name:"Python", cat:"lang" }, { name:"Java", cat:"lang" }, { name:"C", cat:"lang" },
    { name:"Flask", cat:"fw" }, { name:"Git", cat:"tool" }, { name:"Docker", cat:"tool" },
  ];

  const catColor = { lang:"#ff3cac", fw:"#784ba0", tool:"#2b86c5", lib:"#20c997" };
  const categories = [
    { id: "all", label: "All" },
    { id: "lang", label: "Languages" },
    { id: "fw", label: "Frameworks" },
    { id: "lib", label: "Libraries" },
    { id: "tool", label: "Tools" },
  ];

  const filteredSkills = activeTab === "all" 
    ? skills 
    : skills.filter(s => s.cat === activeTab);

  return (
    <section style={sectionStyle("radial-gradient(ellipse 60% 70% at 20% 50%,#0d1a2e,#0a0a0f)")}>
      <ParticleCanvas color1="#2b86c5" color2="#784ba0" />
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:960, padding:"0 48px" }}>
        <Reveal delay={0.1}>
          <div style={eyebrow}>What I work with</div>
          <h2 style={pageTitle("#2b86c5","#784ba0")}>Tech Stack</h2>
        </Reveal>
        
        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24, marginBottom: 28 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "8px 16px",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.3s",
                border: activeTab === cat.id ? "1px solid #ff3cac" : "1px solid rgba(255,255,255,0.08)",
                background: activeTab === cat.id ? "rgba(255,60,172,0.12)" : "rgba(255,255,255,0.02)",
                color: activeTab === cat.id ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
            {filteredSkills.map((s, i) => (
              <SkillPill key={s.name} name={s.name} color={catColor[s.cat]} delay={i * 0.03} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SkillPill({ name, color, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:"16px 20px",
        border: hov ? `1px solid ${color}88` : "1px solid rgba(255,255,255,0.08)",
        borderRadius:12,
        fontFamily:"'Outfit',sans-serif",
        fontSize:15,
        fontWeight:400,
        color: hov ? "#fff" : "rgba(255,255,255,0.75)",
        background: hov ? `linear-gradient(135deg, rgba(255,255,255,0.05), ${color}22)` : "rgba(255,255,255,0.02)",
        transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        cursor:"default",
        display:"flex",
        alignItems:"center",
        gap:12,
        transform: hov ? "translateY(-4px) scale(1.02)" : "none",
        boxShadow: hov ? `0 10px 24px ${color}33` : "none",
        animationDelay: delay + "s",
        backdropFilter: "blur(4px)"
      }}
    >
      <span style={{ 
        width:10, 
        height:10, 
        borderRadius:"50%", 
        background:color, 
        flexShrink:0, 
        boxShadow: hov ? `0 0 12px ${color}` : "none", 
        transition:"box-shadow 0.3s, transform 0.3s",
        transform: hov ? "scale(1.2)" : "none"
      }} />
      {name}
    </div>
  );
}

function ProjectsSection() {
  const projects = [
    {
      name:"Dev Lens",
      desc:"Built an AI-powered GitHub repository analysis dashboard that visualizes repository metrics, commit history, contributors, language distribution, and dependency graphs using the GitHub REST API.",
      tags:["Next.js","React","TypeScript","Tailwind CSS","React Flow","Recharts"],
      github:"https://github.com/Hackerak-47/DevLens",
      live:"https://dev-lens-ppie.vercel.app/",
    },
    {
      name:"CollabNotes",
      desc:"Real-time collaborative document workspace with Google Docs-style live synchronization. Features integrated Google Gemini AI for instant note summarization, rewriting, and explanations.",
      tags:["React","Vite","Firebase","Gemini API","React Router","Markdown"],
      github:"https://github.com/Hackerak-47/Collab_docs",
      live:"https://collab-docs-gold.vercel.app/",
    },
    {
      name:"JobCanvas",
      desc:"AI-powered job application tracker and Kanban board. Parses resumes client-side from PDF, compares them with job descriptions using Google Gemini AI to score matches and detect skill gaps.",
      tags:["Next.js","TypeScript","Supabase","Tailwind CSS","Dnd-kit","Gemini API"],
      github:"https://github.com/Hackerak-47/JobCanvas",
      live:"https://job-canvas-seven.vercel.app/",
    },
    {
      name:"Focus Forge",
      desc:"Full-stack personal study tracker and productivity hub featuring a visual Kanban board, Pomodoro timer, study planner, and diary-style blog. Secure auth with Node.js + MongoDB.",
      tags:["React","Node.js","Express","MongoDB","Framer Motion","Recharts"],
      github:"https://github.com/Hackerak-47/focusforge",
      live:"",
    },
  ];

  return (
    <section id="s2" style={sectionStyle("radial-gradient(ellipse 60% 60% at 80% 30%,#0f1f0f,#0a0a0f)")}>
      <ParticleCanvas color1="#20c997" color2="#784ba0" />
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:1000, padding:"0 48px" }}>
        <Reveal delay={0.1}>
          <div style={eyebrow}>Selected work</div>
          <h2 style={pageTitle("#20c997","#2b86c5")}>Projects</h2>
        </Reveal>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={0.2 + i * 0.15}>
              <ProjectCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ p }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="project-card"
    >
      {/* glow top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#ff3cac,#784ba0,#2b86c5)", transform: hov ? "scaleX(1)" : "scaleX(0)", transformOrigin:"left", transition:"transform 0.4s" }} />

      <div className="project-card-left">
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, letterSpacing:2, lineHeight:1, background:"linear-gradient(135deg,#fff 60%,rgba(255,60,172,0.8))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
          {p.name}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
          {p.tags.map((t) => (
            <span key={t} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, padding:"4px 10px", borderRadius:2, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.06)" }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="project-card-right">
        <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, lineHeight:1.75, color:"rgba(255,255,255,0.45)", fontWeight:300 }}>
          {p.desc}
        </p>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:8 }}>
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#ff3cac", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, transition:"color 0.3s" }}>
              GitHub →
            </a>
          )}
          {p.live && (
            <a href={p.live} target="_blank" rel="noreferrer" style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#20c997", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, transition:"color 0.3s" }}>
              Live Demo →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  const links = [
    { icon:"✉", label:"Email", value:"khandelwalaastha44@gmail.com", href:"mailto:khandelwalaastha44@gmail.com" },
    { icon:"in", label:"LinkedIn", value:"aastha-khandelwal-238290313", href:"https://www.linkedin.com/in/aastha-khandelwal-238290313/" },
    { icon:"⌥", label:"GitHub", value:"Hackerak-47", href:"https://github.com/Hackerak-47" },
    { icon:"</>", label:"LeetCode", value:"aasthakhandelwal", href:"https://leetcode.com/u/aasthakhandelwal/" },
  ];

  return (
    <section id="s3" style={sectionStyle("radial-gradient(ellipse 70% 70% at 50% 80%,#1f0a2e,#0a0a0f)")}>
      <ParticleCanvas color1="#ff3cac" color2="#784ba0" />
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:860, padding:"0 48px" }}>
        <Reveal delay={0.1}>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(56px,9vw,110px)", lineHeight:0.95, letterSpacing:2, marginBottom:48 }}>
            <span style={{ color:"#fff" }}>Let's{"\n"}</span>
            <span style={{ background:"linear-gradient(135deg,#ff3cac,#784ba0,#2b86c5)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Connect.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            {links.map((l, i) => <ContactRow key={i} {...l} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactRow({ icon, label, value, href }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex",
        alignItems:"center",
        gap:22,
        padding: hov ? "18px 0 18px 18px" : "18px 0",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        textDecoration:"none",
        transition:"all 0.3s",
      }}
    >
      <div style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, background: hov ? "rgba(255,60,172,0.12)" : "rgba(255,255,255,0.04)", border: hov ? "1px solid rgba(255,60,172,0.35)" : "1px solid rgba(255,255,255,0.06)", flexShrink:0, transition:"all 0.3s", color:"#fff" }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color: hov ? "#ff3cac" : "rgba(255,255,255,0.3)", marginBottom:4, transition:"color 0.3s" }}>{label}</div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, color:"rgba(255,255,255,0.8)", fontWeight:300 }}>{value}</div>
      </div>
      <span style={{ color: hov ? "#ff3cac" : "rgba(255,255,255,0.15)", fontSize:20, transform: hov ? "translateX(6px)" : "none", transition:"all 0.3s" }}>→</span>
    </a>
  );
}

/* ─── helpers ─── */
const sectionStyle = (bg) => ({
  position:"relative",
  minHeight:"100vh",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  overflow:"hidden",
  background: bg,
});

const eyebrow = {
  fontFamily:"'Space Mono',monospace",
  fontSize:10,
  letterSpacing:"3px",
  textTransform:"uppercase",
  color:"rgba(255,255,255,0.3)",
  marginBottom:14,
};

const pageTitle = (c1, c2) => ({
  fontFamily:"'Bebas Neue',sans-serif",
  fontSize:64,
  letterSpacing:3,
  lineHeight:1,
  background:`linear-gradient(135deg,${c1},${c2})`,
  WebkitBackgroundClip:"text",
  WebkitTextFillColor:"transparent",
  backgroundClip:"text",
});

function ScrollHint() {
  return (
    <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:2 }}>
      Scroll
      <div style={{ width:1, height:32, background:"linear-gradient(to bottom,rgba(255,60,172,0.5),transparent)", animation:"scrollPulse 1.5s ease infinite" }} />
    </div>
  );
}

/* ─── NAV ─── */
function Nav({ active }) {
  const sections = ["Home","Skills","Projects","Contact"];
  const ids = ["s0","s1","s2","s3"];
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:300, padding:"22px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(10,10,15,0.7)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:3, background:"linear-gradient(135deg,#ff3cac,#784ba0,#2b86c5)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AK</div>
      <div style={{ display:"flex", gap:36 }}>
        {sections.map((s, i) => (
          <button key={s} onClick={() => document.getElementById(ids[i]).scrollIntoView({ behavior:"smooth" })}
            style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color: active === i ? "#fff" : "rgba(255,255,255,0.35)", background:"none", border:"none", cursor:"pointer", position:"relative", padding:"6px 0", transition:"color 0.4s" }}>
            {s}
            <span style={{ position:"absolute", bottom:-2, left: "50%", width: active === i ? "100%" : 0, height:2, background:"#ff3cac", transition:"all 0.5s cubic-bezier(0.25, 1, 0.5, 1)", transform: "translateX(-50%)", borderRadius: 2 }} />
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ─── ROOT ─── */
export default function Portfolio() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = ["s0","s1","s2","s3"];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActive(ids.indexOf(e.target.id)); }),
      { threshold: 0.5 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <FontLink />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;cursor:none!important;}
        html{scroll-snap-type:y proximity;overflow-y:scroll;scroll-behavior:smooth;}
        body{background:#0a0a0f;color:#fff;}
        section>div[id]{scroll-snap-align:start;}
        @keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(20px,-30px) scale(1.05);}66%{transform:translate(-15px,20px) scale(0.95);}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes scrollPulse{0%,100%{opacity:0.3;}50%{opacity:1;}}
        ::-webkit-scrollbar{width:8px;}
        ::-webkit-scrollbar-track{background:rgba(10,10,15,0.8);}
        ::-webkit-scrollbar-thumb{background:rgba(255,60,172,0.4);border-radius:10px;border:2px solid rgba(10,10,15,0.8);}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,60,172,0.8);}
        .projects-grid{display:grid;grid-template-columns:1fr;gap:32px;margin-top:40px;width:100%;}
        .project-card{background:linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 48px;position:relative;overflow:hidden;transition:all 0.4s;display:flex;flex-direction:row;gap:48px;align-items:center;text-align:left;backdrop-filter:blur(10px);}
        .project-card:hover{border:1px solid rgba(255,60,172,0.4);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,0.5);}
        .project-card-left{flex:1.2;display:flex;flex-direction:column;gap:12px;}
        .project-card-right{flex:1.8;display:flex;flex-direction:column;gap:16px;}
        @media (max-width:768px){
          .project-card{flex-direction:column;align-items:flex-start;gap:20px;padding:24px;}
        }
      `}</style>
      <Cursor />
      <Nav active={active} />
      <ScrollDots total={4} current={active} />

      <div id="s0" style={{ scrollSnapAlign:"start" }}><HomeSection /></div>
      <div id="s1" style={{ scrollSnapAlign:"start" }}><SkillsSection /></div>
      <div id="s2" style={{ scrollSnapAlign:"start" }}><ProjectsSection /></div>
      <div id="s3" style={{ scrollSnapAlign:"start" }}><ContactSection /></div>
    </>
  );
}


