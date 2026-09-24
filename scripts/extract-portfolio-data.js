const fs = require('fs');
const path = require('path');

function extractIndexData() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  
  // Helper to extract text content
  const getText = (selector, html) => {
    const regex = new RegExp(selector.replace(/([.\[\]()])/g, '\\$1') + '[^>]*>([^<]+)');
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  const getInnerHTML = (selector, html) => {
    const regex = new RegExp(selector.replace(/([.\[\]()])/g, '\\$1') + '[^>]*>([\\s\\S]*?)</');
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  // Extract data from HTML using regex patterns
  const data = {};

  // Site
  data.site = {
    brand: "M.R. — Full-Stack 3D+AI",
    nav: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Experience", href: "#experience" },
      { label: "Projects", href: "#projects" },
      { label: "3D & Videojuegos", href: "3d-portfolio.html" },
      { label: "3D Gallery", href: "gallery.html" },
      { label: "Contact", href: "#contact" }
    ],
    email: "miguelxlerion@gmail.com",
    linkedin: "https://linkedin.com/in/mikerodriguez84",
    github: "https://github.com/miguelxlerion",
    portfolio: "https://miguelxlerion.github.io/Mike_portfolio",
    telefono: "+57 313 226 3265",
    footer: "© 2026 Miguel E. Rodríguez Martínez"
  };

  // Hero
  data.hero = {
    badge: "Available for remote — GMT-5 · EU/US overlap",
    h1a: "Senior Full-Stack Engineer",
    h1b: "Real-Time 3D & AI Data Platforms",
    subtitle: "React · Next.js · Django · Three.js · LangChain · pgvector · FastAPI. I ship <strong>Digital Twins</strong>, <strong>RAG platforms</strong> and <strong>IoT telemetry</strong> that turn massive tabular/sensor data into interactive 3D experiences — with resilient ingestion, hybrid search and stable FPS.",
    stats: [
      { number: "7+", label: "Years experience" },
      { number: "99%", label: "Uptime (buffered ingestion)" },
      { number: "60%", label: "Faster decision time" },
      { number: "4", label: "Prod. platforms featured" }
    ],
    actions: [
      { label: "View Projects", href: "#projects", variant: "primary" },
      { label: "GitHub", href: "https://github.com/miguelxlerion", variant: "secondary" },
      { label: "Contact", href: "#contact", variant: "secondary" }
    ],
    visible: true
  };

  // About
  data.about = {
    label: "ABOUT ME",
    title: "Bridging visual design<br>and robust engineering",
    subtitle: "I close the gap between high-impact 3D and scalable software — from asset pipeline to resilient APIs.",
    paragraphs: [
      "Started in <strong>3D & digital art</strong>, I pivoted to build the tools creatives use. That path led me to master <strong>Full-Stack Engineering</strong> for data-intensive products.",
      "Today I'm <strong>bilingual in two worlds</strong>: design language (UX, visual hierarchy, 3D asset optimization) and engineering language (scalable architectures, secure APIs, RAG/LLM pipelines).",
      "I specialize in turning complex business requirements into <strong>high-performance web platforms</strong> — real-time 3D dashboards, RAG assistants and IoT telemetry — with a focus on <strong>code quality, mentorship and tech debt reduction</strong>.",
      "<strong>Superpower:</strong> End-to-end ownership from 3D asset pipeline (Blender/Substance) to data architecture (Postgres/pgvector, WebSockets/MQTT) — optimizing performance and UX across the stack."
    ],
    skills: [
      {
        title: "Frontend & Visualización 3D",
        tags: ["React.js", "Next.js", "TypeScript", "Three.js", "WebGL", "Tailwind CSS", "Unity WebGL"]
      },
      {
        title: "Backend & IA/RAG",
        tags: ["Python", "Django", "DRF", "Node.js", "LangChain", "pgvector", "OpenAI API"]
      },
      {
        title: "IoT & Tiempo Real",
        tags: ["WebSockets", "MQTT", "Asyncio", "TimescaleDB", "Docker", "Linux"]
      },
      {
        title: "3D & Creative Tech",
        tags: ["Unity 3D", "Unreal Engine 5", "ZBrush", "Blender", "Substance Painter"]
      }
    ]
  };

  // Services
  data.services = [
    {
      visible: true,
      title: "Digital Twins & IoT",
      desc: "Real-time 3D platforms that connect IoT sensors to interactive WebGL dashboards for industrial monitoring.",
      image: "images/Oficina0013.jpg",
      icon: "chart",
      color: "#4f8cff",
      features: [
        "3D dashboards with live telemetry",
        "WebSockets / MQTT ingestion",
        "Factory floor visualization",
        "Alerts & predictive signals"
      ],
      tech: ["Three.js", "WebSockets", "MQTT", "FastAPI", "React"]
    },
    {
      visible: true,
      title: "AI / RAG Systems",
      desc: "LLM assistants that ground corporate knowledge bases with Retrieval-Augmented Generation.",
      image: "images/documentacion-parallax.jpg",
      icon: "cpu",
      color: "#a855f7",
      features: [
        "Complex PDF processing & semantic chunking",
        "Hybrid vector + lexical search",
        "LLM re-ranking anti-hallucination",
        "Secure APIs with concurrency control"
      ],
      tech: ["Python", "Django", "LangChain", "pgvector", "Celery"]
    },
    {
      visible: true,
      title: "Web 3D Visualization",
      desc: "Interactive browser experiences that turn complex data into navigable, gamified 3D environments.",
      image: "images/proyectos-parallax.jpg",
      icon: "cube",
      color: "#10b981",
      features: [
        "Three.js / WebGL",
        "Asset optimization for web",
        "Stable 60 FPS",
        "Responsive & accessible UI"
      ],
      tech: ["Three.js", "WebGL", "React", "TypeScript", "GLTF"]
    },
    {
      visible: true,
      title: "Full-Stack Architecture",
      desc: "Complete platforms from scratch with scalable, fault-tolerant architectures.",
      image: "images/servicios-productos-parallax.jpg",
      icon: "dashboard",
      color: "#f59e0b",
      features: [
        "React / Next.js / Django / FastAPI",
        "PostgreSQL / pgvector / Redis",
        "Docker / Linux / Nginx",
        "99% uptime by design (buffering)"
      ],
      tech: ["Django", "FastAPI", "PostgreSQL", "Docker", "Redis"]
    },
    {
      visible: true,
      title: "KPI Dashboards",
      desc: "Real-time control panels that turn complex data into actionable insights.",
      image: "images/cronograma-progreso-parallax.jpg",
      icon: "shield",
      color: "#f43f5e",
      features: [
        "Complex data visualization",
        "Real-time updates",
        "UX focused on usability",
        "60% reduction in analysis time"
      ],
      tech: ["React", "Three.js", "WebSockets", "TimescaleDB", "Docker"]
    },
    {
      visible: true,
      title: "Tech Leadership",
      desc: "Team mentorship, pipeline standardization and tech debt reduction on high-impact projects.",
      image: "images/fundador-parallax.jpg",
      icon: "users",
      color: "#06b6d4",
      features: [
        "Junior mentorship",
        "Pipeline standardization",
        "Code review & best practices",
        "Performance optimization"
      ],
      tech: ["Leadership", "Mentoring", "Architecture", "Code Review"]
    }
  ];

  // Experience
  data.experience = [
    {
      visible: true,
      title: "Desarrollador Full-Stack Senior",
      company: "Alcaldía de Caucasia (FOVIS)",
      date: "2024 – 2025",
      image: "images/Oficina0013.jpg",
      achievements: [
        "Arquitecté y desarrollé desde cero la plataforma gubernamental de gestión habitacional, administrando más de <strong>1,200+ unidades</strong>.",
        "Diseñé e implementé dashboards de KPIs en tiempo real, <strong>reduciendo el tiempo de toma de decisiones en un 60%</strong>.",
        "Lideré la creación de una biblioteca de componentes UI reutilizables, <strong>reduciendo los tiempos de carga en un 35%</strong>."
      ],
      stack: ["React", "Tailwind CSS", "Django REST", "PostgreSQL", "WebSockets"]
    },
    {
      visible: true,
      title: "Technical Lead 3D & Creative Developer",
      company: "Xlerion Studio",
      date: "2023 – 2024",
      image: "images/servicios-productos-parallax.jpg",
      achievements: [
        "Lideré el desarrollo de arquitecturas frontend que conectan <strong>flujos de datos en tiempo real (WebSockets)</strong> con interfaces visuales 3D dinámicas.",
        "Optimicé recursos gráficos y pipelines de assets para entornos web interactivos, garantizando <strong>FPS estables en navegadores</strong>.",
        "Dirigí la integración de herramientas de IA en flujos de producción creativa, <strong>mejorando la eficiencia del equipo en 40%</strong>."
      ],
      stack: ["Three.js", "Unity WebGL", "React", "Python", "Docker"]
    },
    {
      visible: true,
      title: "Director de Diseño 3D & Data Visualization",
      company: "AONC Neuroscientific Strategies",
      date: "2018 – 2019",
      image: "images/filosofia-parallax.jpg",
      achievements: [
        "Transformé conjuntos de datos masivos y complejos en <strong>entornos 3D gamificados</strong> y navegables para análisis visual.",
        "<strong>Reduje el tiempo de análisis de datos en un 40%</strong> para usuarios no técnicos, aplicando principios de UX/UI centrados en la usabilidad."
      ],
      stack: ["Unity 3D", "Python", "Django", "PostgreSQL"]
    },
    {
      visible: true,
      title: "Desarrollador Frontend & UI Designer",
      company: "USAID - ACDI/VOCA",
      date: "2015 – 2017",
      image: "images/convocatorias-alianzas-parallax.jpg",
      achievements: [
        "Arquitecté el software \"ICOE\", traduciendo bases de datos complejas en representaciones digitales claras y paneles interactivos accesibles para tomadores de decisiones a nivel nacional."
      ],
      stack: ["JavaScript", "HTML5/CSS3", "UI/UX", "Data Viz"]
    }
  ];

  // Projects (section #projects)
  data.projects = [
    {
      number: "01 / REAL-TIME 3D · DIGITAL TWIN",
      title: "SmartFactory 3D — Industrial Digital Twin",
      desc: "<strong>Problem:</strong> Factory floor opacity. <strong>Solution:</strong> React 18 + Three.js r150 + FastAPI + WebSockets live telemetry with buffered ingestion and LOD for stable 60 FPS.",
      metric: "Dockerized full-stack (JS 83k + Python 34k) · Real factory visualization with interactive orbit, instancing & telemetry overlays. <strong>Updated 2026-08-31</strong>.",
      image: "images/Oficina0010.jpg",
      tech: ["React 18", "Three.js r150", "FastAPI", "WebSockets/MQTT", "Python 3.11", "Docker Compose", "PostgreSQL"],
      links: [
        { label: "View Code", href: "https://github.com/miguelxlerion/smartfactory-3d", icon: "github" },
        { label: "Docs →", href: "https://github.com/miguelxlerion/smartfactory-3d#readme" }
      ],
      metric_text: "Dockerized full-stack (JS 83k + Python 34k) · Real factory visualization with interactive orbit, instancing & telemetry overlays."
    },
    {
      number: "02 / AI & RAG · DATA PLATFORM",
      title: "Rag_X — Enterprise RAG Assistant",
      desc: "<strong>Problem:</strong> Corporate knowledge trapped in messy PDFs. <strong>Solution:</strong> Django/DRF + LangChain + pgvector + Celery/Redis with semantic chunking, hybrid search & LLM re-ranking.",
      metric: "Async PDF pipeline, anti-hallucination re-ranking, secure concurrent API. <strong>Python 190k + TS 57k · Docker</strong>.",
      image: "images/documentacion-recursos-parallax.jpg",
      tech: ["Python 3.10+", "Django/DRF", "LangChain", "pgvector", "Celery + Redis", "Docker", "OpenAI/Claude"],
      links: [
        { label: "View Code", href: "https://github.com/miguelxlerion/Rag_X", icon: "github" },
        { label: "Architecture →", href: "https://github.com/miguelxlerion/Rag_X#readme" }
      ],
      metric_text: "Async PDF pipeline, anti-hallucination re-ranking, secure concurrent API."
    },
    {
      number: "03 / DATA PLATFORM · ETL + IA",
      title: "Ingest Pipeline — Enterprise ETL + AI Enrichment",
      desc: "<strong>Problem:</strong> Multiformat raw docs (PDF/CSV/JSON/TXT) unfit for AI. <strong>Solution:</strong> Resilient pipeline (buffering, retries) that cleans, traces & semantically enriches data for RAG.",
      metric: "Production-grade data engineering pattern · <strong>99% uptime with local buffering</strong> under concurrent load (Locust-tested).",
      image: "images/soluciones-parallax.jpg",
      tech: ["Python Asyncio", "MQTT / WebSockets", "PostgreSQL", "Docker", "Locust", "Linux"],
      links: [
        { label: "View Code", href: "https://github.com/miguelxlerion/Ingest_Pipeline", icon: "github" },
        { label: "Diagram →", href: "https://github.com/miguelxlerion/Ingest_Pipeline/blob/main/docs/architecture-diagram.svg" }
      ],
      metric_text: "Production-grade data engineering pattern · 99% uptime with local buffering under concurrent load."
    },
    {
      number: "04 / AI · CIVIC TECH",
      title: "GobIA Auditor — Public Contracts Risk Agent",
      desc: "<strong>Problem:</strong> Opaque public procurement (SECOP II). <strong>Solution:</strong> Python agent that normalizes contracts, scores risk locally + optional GPT, and generates HTML + email reports.",
      metric: "MinTIC Hackathon 2026 · Automated audit signals for Colombian SECOP II. <strong>HTML 148k + Python 84k</strong>.",
      image: "images/inversionistas-alianzas-parallax.jpg",
      tech: ["Python 3.10+", "OpenAI / GPT", "SECOP II API", "Risk Scorer", "HTML Reports", "Docker"],
      links: [
        { label: "View Code", href: "https://github.com/miguelxlerion/GobIA", icon: "github" },
        { label: "Case Study →", href: "https://github.com/miguelxlerion/GobIA#readme" }
      ],
      metric_text: "MinTIC Hackathon 2026 · Automated audit signals for Colombian SECOP II."
    }
  ];

  // Portfolio (section #portfolio)
  data.portfolio = {
    label: "PORTFOLIO",
    title: "Selected works",
    subtitle: "A curated selection of shipped platforms, 3D experiences and AI products — from concept to production.",
    categories: ["All", "3D", "AI", "IoT", "Web"],
    items: [
      {
        visible: true,
        id: "pf-001",
        title: "SmartFactory — Digital Twin Ops",
        category: "3D",
        client: "Industrial Client",
        year: "2024",
        cover: "images/Oficina0013.jpg",
        gallery: [],
        desc: "Digital twin for factory floor with real-time WebSocket telemetry and 60 FPS Three.js rendering.",
        tools: ["React", "Three.js", "FastAPI"],
        link: "https://github.com/miguelxlerion/smartfactory-3d",
        linkLabel: "View Code",
        featured: true,
        color: "#4f8cff"
      },
      {
        visible: true,
        id: "pf-002",
        title: "RAG Knowledge Platform",
        category: "AI",
        client: "Enterprise",
        year: "2024",
        cover: "images/documentacion-parallax.jpg",
        gallery: ["images/documentacion-parallax.jpg", "images/documentacion-recursos-parallax.jpg"],
        desc: "Corporate RAG with semantic chunking and hybrid search to eliminate hallucinations.",
        tools: ["Django", "LangChain", "pgvector"],
        link: "https://github.com/miguelxlerion/Rag_X",
        linkLabel: "View Code",
        featured: true,
        color: "#a855f7"
      },
      {
        visible: true,
        id: "pf-003",
        title: "IoT Telemetry Fleet",
        category: "IoT",
        client: "Logistics",
        year: "2023",
        cover: "images/proyectos-parallax.jpg",
        gallery: ["images/proyectos-parallax.jpg"],
        desc: "Buffered ingestion pipeline with MQTT and TimescaleDB — 99% uptime.",
        tools: ["Python", "MQTT", "PostgreSQL"],
        link: "https://github.com/miguelxlerion/Ingest_Pipeline",
        linkLabel: "View Code",
        featured: false,
        color: "#10b981"
      }
    ]
  };

  // Contact
  data.contact = {
    label: "CONTACT",
    title: "Let's build<br>your next vision.",
    subtitle: "Available for remote Senior Full-Stack / Tech Lead roles — Real-Time 3D & AI Data Platforms. GMT-5 with EU/US overlap. Let's talk architecture, not just features.",
    links: [
      { icon: "mail", label: "Email", value: "miguelxlerion@gmail.com", href: "mailto:miguelxlerion@gmail.com", color: "#4f8cff" },
      { icon: "linkedin", label: "LinkedIn", value: "mikerodriguez84", href: "https://linkedin.com/in/mikerodriguez84", color: "#0077b5" },
      { icon: "github", label: "GitHub", value: "miguelxlerion", href: "https://github.com/miguelxlerion", color: "#24292e" },
      { icon: "globe", label: "Portfolio", value: "miguelxlerion.github.io", href: "https://miguelxlerion.github.io/Mike_portfolio/", color: "#4f8cff" },
      { icon: "phone", label: "Teléfono", value: "+57 313 226 3265", href: "tel:+573132263265", color: "#f59e0b" }
    ],
    email: "miguelxlerion@gmail.com",
    footer: "© 2026 Miguel E. Rodríguez Martínez",
    coords: ["4.7110° N, 74.0721° W, BOGOTÁ, CO"]
  };

  // Design
  data.design = {
    bg: "#0a0a0f",
    bg2: "#12121a",
    bg3: "#1a1a25",
    bg_card: "#16161f",
    texto: "#f0f0f5",
    text2: "#a0a0b5",
    muted: "#6a6a80",
    border: "#2a2a3a",
    border_hover: "#3a3a4f",
    accent: "#4f8cff",
    accent2: "#a855f7",
    accent_emerald: "#10b981",
    accent_amber: "#f59e0b",
    accent_rose: "#f43f5e",
    accent_cyan: "#06b6d4",
    grad_from: "#4f8cff",
    grad_mid: "#a855f7",
    grad_to: "#a855f7",
    grad2_from: "#10b981",
    grad2_mid: "#06b6d4",
    grad2_to: "#06b6d4",
    grad3_from: "#f59e0b",
    grad3_mid: "#f43f5e",
    grad3_to: "#f43f5e",
    font_heading: "Inter",
    font_heading_custom: "",
    font_body: "Inter",
    font_body_custom: "",
    font_mono: "JetBrains Mono",
    font_mono_custom: "",
    font_size_base: "16",
    favicon_url: "",
    logo_url: "",
    parallax_enabled: false,
    parallax_img: "",
    parallax_speed: "0.4",
    parallax_pos: "center",
    parallax_opacity: "40",
    fondo_enabled: false,
    fondo_img: "",
    fondo_pos: "center",
    fondo_opacity: "40",
    fondo_blur: "0",
    loader_enabled: true,
    loader_bg: "#05070d",
    loader_text: "#cfe0ff",
    loader_accent: "#00d4ff",
    loader_font_big: "Anton",
    loader_font_small: "JetBrains Mono",
    loader_template: "counter",
    loader_pos: "center",
    loader_duration: "1200",
    cursor_color: "#00d4ff",
    cursor_size: "14",
    cursor_big: "80",
    cursor_font: "JetBrains Mono",
    ticker_bg: "#05070d",
    ticker_color: "#cfe0ff",
    ticker_font: "Anton",
    ticker_speed: "40",
    sidebar_bg: "#12121a",
    sidebar_color: "#f0f0f5",
    sidebar_border: "#2a2a3a",
    sidebar_active: "#00d4ff",
    parallax_static: false
  };

  // SEO
  data.seo = {
    title: "Miguel E. Rodriguez — Senior Full-Stack Engineer · Real-Time 3D & AI Data Platforms",
    description: "Senior Full-Stack Engineer (7+ y) — Real-Time 3D & AI Data Platforms. React / Next.js · Django / DRF · Three.js / WebGL · LangChain / pgvector · FastAPI · WebSockets / MQTT. Digital Twins, RAG & IoT telemetry at scale.",
    keywords: "Senior Full-Stack Engineer, React, Next.js, Django, DRF, Three.js, WebGL, LangChain, pgvector, FastAPI, WebSockets, MQTT, Digital Twin, RAG, AI Data Platform, IoT, TypeScript, Python",
    author: "Miguel E. Rodriguez",
    canonical: "https://miguelxlerion.github.io/Mike_portfolio/",
    robots: "index, follow",
    ogImage: "https://miguelxlerion.github.io/Mike_portfolio/images/LogoMike.ico"
  };

  // Settings
  data.settings = {
    lang: "es",
    maintenance: false,
    maintenanceMsg: "",
    analyticsId: "",
    customCss: "",
    customJs: "",
    showSections: {
      hero: true,
      about: true,
      services: true,
      experience: true,
      portfolio: true,
      projects: true,
      contact: true
    }
  };

  return data;
}

// Merge with existing portfolio.json preserving 3D sections
function mergeWithExisting(newData) {
  const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'portfolio.json'), 'utf-8'));
  
  // Preserve 3D sections that are not in index.html
  const preserved = {
    threeDPage: existing.threeDPage,
    gamedev: existing.gamedev,
    gallery3d: existing.gallery3d,
    colors: existing.colors,
    background: existing.background
  };

  // Merge new data with preserved 3D sections
  return {
    ...newData,
    ...preserved
  };
}

// Main
const newData = extractIndexData();
const finalData = mergeWithExisting(newData);

// Write to portfolio.json
const outputPath = path.join(__dirname, '..', 'data', 'portfolio.json');
fs.writeFileSync(path.join(__dirname, '..', 'data', 'portfolio.json'), JSON.stringify(finalData, null, 2));
console.log('✅ portfolio.json actualizado con todos los datos del frontend');
console.log('✅ Secciones preservadas: threeDPage, gamedev, gallery3d, colors, background');