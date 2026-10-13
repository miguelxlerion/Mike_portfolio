// ─────────────────────────────────────────────
//  Modelo central de contenido — TODO editable desde el panel /#/admin
//  Este archivo es la "fuente de verdad" inicial.
//  El panel guarda tus cambios en el navegador (localStorage)
//  y puedes exportarlos a JSON para versionarlos.
// ─────────────────────────────────────────────

export type CategoryId = "codigo" | "diseno3d" | "grafico" | "personajes";

export interface Category {
  id: CategoryId | "todos";
  label: string;
  color: string;
}

export interface RepoInfo {
  name: string;
  language: string;
  langColor: string;
  stars: number;
  forks: number;
  updated: string;
  snippetLang: string;
  snippet: string;
}

export interface Project {
  id: string;
  title: string;
  category: CategoryId;
  tagline: string;
  description: string;
  longDescription: string;
  image?: string;
  /** Video opcional (URL .mp4): si existe, la ficha muestra reproductor en vez de foto. */
  videoUrl?: string;
  tags: string[];
  year: string;
  demoUrl?: string;
  repoUrl?: string;
  repo?: RepoInfo;
  specs?: { label: string; value: string }[];
  featured?: boolean;
}

export interface Skill {
  name: string;
  level: number;
  color: string;
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface Social {
  label: string;
  url: string;
}

export type ModelPreset = "reactor" | "cristal" | "toroide" | "custom";

export interface Model3D {
  id: string;
  title: string;
  desc: string;
  /** Demo procedural o "custom" para cargar tu .glb */
  preset: ModelPreset;
  /** Solo si preset === "custom": URL del .glb (public/models/ o R2) */
  modelUrl?: string;
  poster?: string;
  tags: string[];
  specs?: { label: string; value: string }[];
}

export interface Showcase3D {
  title: string;
  text: string;
  models: Model3D[];
}

export interface WebWork {
  id: string;
  title: string;
  desc: string;
  url: string;
  tags: string[];
  year: string;
  /** Miniatura (hotlink verificado u otra URL). Vacío = degradado con favicon. */
  image?: string;
}

export interface WebWorks {
  title: string;
  text: string;
  items: WebWork[];
}

export interface SiteContent {
  version: 1;
  adminPassword: string;
  profile: {
    name: string;
    shortName: string;
    initials: string;
    role: string;
    tagline: string;
    location: string;
    email: string;
    phone: string;
    availability: string;
    availabilityDetail: string;
    portrait: string;
    cvText: string;
  };
  hero: {
    badge: string;
    roles: { text: string; color: string }[];
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: HeroStat[];
  };
  marquee: string[];
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    quote: string;
    languages: string[];
    disciplines: { title: string; desc: string; color: string }[];
    counters: HeroStat[];
  };
  skills: Skill[];
  categories: Category[];
  projects: Project[];
  github: {
    username: string;
    title: string;
    text: string;
    maxRepos: number;
  };
  showcase3d: Showcase3D;
  webworks: WebWorks;
  contact: {
    eyebrow: string;
    title: string;
    text: string;
    socials: Social[];
    services: string[];
    budgets: string[];
  };
  footer: {
    note: string;
    watermark: string;
  };
  appearance: {
    accent: string;
    ink: string;
    panel: string;
    showCursor: boolean;
    showParticles: boolean;
    showMarquee: boolean;
    showStats: boolean;
  };
}

export const CATEGORY_COLOR: Record<CategoryId, string> = {
  codigo: "#22d3ee",
  diseno3d: "#a78bfa",
  grafico: "#fb7185",
  personajes: "#fbbf24",
};

/** Color de una categoría según lo editado en el panel (con fallback seguro). */
export function categoryColor(categories: Category[], id: CategoryId): string {
  return categories.find((c) => c.id === id)?.color || CATEGORY_COLOR[id];
}

// <defaultContent>
export const defaultContent: SiteContent = {
  "version": 1,
  "adminPassword": "mike123",
  "profile": {
    "name": "MIGUEL RODRIGUEZ",
    "shortName": "Miguel Rodriguez",
    "initials": "MR",
    "role": "Senior Full-Stack Engineer · 3D & AI Data Platforms",
    "tagline": "Construyo plataformas donde los datos en tiempo real cobran vida en 3D interactivo.",
    "location": "Bogotá, Colombia · Remoto",
    "email": "miguelxlerion@gmail.com",
    "phone": "+57 313 226 3265",
    "availability": "Disponible para nuevos proyectos",
    "availabilityDetail": "Bogotá · respuesta en 24h",
    "portrait": "https://github.com/miguelxlerion.png",
    "cvText": "MIGUEL E. RODRIGUEZ MARTINEZ\nSenior Full-Stack Engineer | Real-Time 3D & AI Data Platforms | 10+ años\n==========================================================================\n\nBogotá, Colombia | +57 313 226 3265 | miguelxlerion@gmail.com\nLinkedIn: linkedin.com/in/miguelrodriguez-dataviz\nGitHub: github.com/miguelxlerion\n\nPERFIL\nIngeniero Full-Stack Senior con 10+ años construyendo plataformas donde\nlos datos en tiempo real cobran vida en 3D interactivo. Tres resultados\ndefinen mi trabajo: -40% en análisis de datos (AONC), -60% en toma de\ndecisiones para 12+ administradores (FOVIS), -80% en pipeline 3D.\n\nSTACK\n- Frontend: React, Next.js, TypeScript, Tailwind\n- Backend: Python, Django, Node.js, PostgreSQL\n- 3D/Real-time: Three.js, Unity, WebSockets, MQTT\n- IA: LangChain, RAG, pgvector, Claude/OpenAI API\n- DevOps: Docker, Linux, Nginx, Celery + Redis\n\nCERTIFICACIONES\n- AI/GenAI Specialization (Honors) — UC Irvine, 2024\n- PMP® — PMI, 2020 | AI Developer — IBM Watson, 2018\n\nIDIOMAS: Español (nativo) | Inglés B2"
  },
  "hero": {
    "badge": "Disponible para nuevos proyectos",
    "roles": [
      {
        "text": "Arquitectura de Software & APIs",
        "color": "#22d3ee"
      },
      {
        "text": "Plataformas 3D en Tiempo Real",
        "color": "#a78bfa"
      },
      {
        "text": "Integración de IA / RAG",
        "color": "#fb7185"
      },
      {
        "text": "Datos y Visualización",
        "color": "#fbbf24"
      }
    ],
    "description": "10+ años uniendo Full-Stack (React, Python, Django) con 3D interactivo e IA en producción real.",
    "ctaPrimary": "Ver proyectos",
    "ctaSecondary": "Descargar CV",
    "stats": [
      {
        "value": 10,
        "suffix": "+",
        "label": "Años de experiencia"
      },
      {
        "value": 45,
        "suffix": "",
        "label": "Repos públicos"
      },
      {
        "value": 99,
        "suffix": "%",
        "label": "Uptime en producción"
      },
      {
        "value": 12,
        "suffix": "+",
        "label": "Admins con dashboards"
      }
    ]
  },
  "marquee": [
    "Arquitectura de Software",
    "React + TypeScript",
    "Three.js / WebGL",
    "Python + FastAPI",
    "RAG + LangChain",
    "WebSockets / MQTT",
    "Docker + Linux",
    "Visualización de Datos"
  ],
  "about": {
    "eyebrow": "Sobre mí",
    "title": "Datos en tiempo real que cobran vida en 3D.",
    "paragraphs": [
      "Soy Miguel Rodriguez, ingeniero Full-Stack Senior y fundador de Xlerion Studio. Me muevo entre la arquitectura backend y el render en el navegador: un día diseño microservicios con WebSockets y al siguiente entrego un gemelo digital 3D a 60 FPS.",
      "Mi trabajo se mide en resultados: reduje 40% el tiempo de análisis de datos complejos (AONC), 60% el tiempo de decisiones para 12+ administradores municipales con 1.200+ unidades gestionadas (FOVIS), y 80% el tiempo de exportación de pipeline 3D con una suite de automatización propia."
    ],
    "quote": "“Si los datos no se pueden ver y tocar en tiempo real, no están trabajando para ti.”",
    "languages": [
      "Español (nativo)",
      "Inglés B2 (técnico)",
      "Remoto mundial"
    ],
    "disciplines": [
      {
        "title": "Código",
        "desc": "React, Django, FastAPI: plataformas escalables y APIs limpias.",
        "color": "#22d3ee"
      },
      {
        "title": "3D & Tiempo Real",
        "desc": "Three.js, Unity, WebSockets: gemelos digitales a 60 FPS.",
        "color": "#a78bfa"
      },
      {
        "title": "IA & Datos",
        "desc": "LangChain, RAG, pgvector: LLMs en producción sin alucinaciones.",
        "color": "#fb7185"
      },
      {
        "title": "Diseño & 3D Art",
        "desc": "3ds Max, Substance, UX/UI: del concept al asset optimizado.",
        "color": "#fbbf24"
      }
    ],
    "counters": [
      {
        "value": 10,
        "suffix": "+",
        "label": "Años"
      },
      {
        "value": 1200,
        "suffix": "+",
        "label": "Unidades gestionadas"
      },
      {
        "value": 60,
        "suffix": "%",
        "label": "Menos tiempo de decisión"
      },
      {
        "value": 99,
        "suffix": "%",
        "label": "Uptime"
      }
    ]
  },
  "skills": [
    {
      "name": "Frontend · React / TypeScript / Tailwind",
      "level": 95,
      "color": "#22d3ee"
    },
    {
      "name": "Backend · Python / Django / Node.js",
      "level": 92,
      "color": "#22d3ee"
    },
    {
      "name": "3D en Tiempo Real · Three.js / Unity / WebSockets",
      "level": 90,
      "color": "#a78bfa"
    },
    {
      "name": "IA & RAG · LangChain / pgvector / LLMs",
      "level": 85,
      "color": "#fb7185"
    },
    {
      "name": "3D Art · 3ds Max / Substance / ZBrush / Blender",
      "level": 86,
      "color": "#fbbf24"
    },
    {
      "name": "DevOps · Docker / Linux / Nginx / CI-CD",
      "level": 84,
      "color": "#a3e635"
    }
  ],
  "categories": [
    {
      "id": "todos",
      "label": "Todos",
      "color": "#a3e635"
    },
    {
      "id": "codigo",
      "label": "Código",
      "color": "#22d3ee"
    },
    {
      "id": "diseno3d",
      "label": "3D & Tiempo Real",
      "color": "#a78bfa"
    }
  ],
  "projects": [
    {
      "id": "smartfactory-3d",
      "title": "SmartFactory 3D",
      "category": "codigo",
      "tagline": "Gemelo digital industrial con telemetría en tiempo real",
      "description": "Plataforma Full-Stack (React 18 + Three.js + FastAPI): >100 msg/s vía WebSockets manteniendo 60 FPS.",
      "longDescription": "Gemelo digital industrial para monitorización de telemetría y mantenimiento predictivo. Frontend React 18 + Three.js con interpolación (Lerp), backend FastAPI con detección de anomalías Z-score (NumPy), control de acceso RBAC con JWT y despliegue containerizado con Docker Compose. Sostiene más de 100 mensajes por segundo vía WebSockets sin bajar de 60 FPS.",
      "tags": [
        "React 18",
        "Three.js",
        "FastAPI",
        "WebSockets",
        "Docker"
      ],
      "year": "2026",
      "featured": true,
      "repoUrl": "https://github.com/miguelxlerion/smartfactory-3d",
      "repo": {
        "name": "smartfactory-3d",
        "language": "JavaScript",
        "langColor": "#f1e05a",
        "stars": 0,
        "forks": 0,
        "updated": "sep 2026",
        "snippetLang": "typescript",
        "snippet": "// Telemetría en vivo: 100+ msg/s sin bajar de 60 FPS\nsocket.on(\"telemetry\", (batch: Reading[]) => {\n  for (const r of batch) {\n    const machine = scene.getObjectByName(r.id);\n    machine?.position.lerp(target(r), 0.12); // Lerp suave\n    if (zScore(r.value, history) > 3) flagAnomaly(r);\n  }\n});"
      },
      "specs": [
        {
          "label": "Arquitectura",
          "value": "React 18 + FastAPI · microservicios"
        },
        {
          "label": "Rendimiento",
          "value": ">100 msg/s · 60 FPS"
        },
        {
          "label": "Seguridad",
          "value": "RBAC con JWT"
        },
        {
          "label": "Anomalías",
          "value": "Z-score con NumPy"
        },
        {
          "label": "Despliegue",
          "value": "Docker Compose"
        }
      ]
    },
    {
      "id": "rag-x",
      "title": "Enterprise RAG Assistant",
      "category": "codigo",
      "tagline": "IA corporativa sin alucinaciones: RAG en producción",
      "description": "Sistema de integración empresarial para bases de conocimiento desestructuradas (legal, operaciones).",
      "longDescription": "Asistente RAG para entornos empresariales con procesamiento asíncrono de PDFs (Celery + Redis), chunking semántico y búsqueda híbrida (vectorial + léxica) con re-ranking para evitar alucinaciones. Integra APIs de LLMs (OpenAI/Claude) como componente dentro de una arquitectura de producción con costos optimizados y resiliencia garantizada.",
      "tags": [
        "Python",
        "Django/DRF",
        "LangChain",
        "pgvector",
        "Docker"
      ],
      "year": "2025",
      "featured": true,
      "repoUrl": "https://github.com/miguelxlerion/Rag_X",
      "repo": {
        "name": "Rag_X",
        "language": "Python",
        "langColor": "#3572A5",
        "stars": 0,
        "forks": 0,
        "updated": "sep 2026",
        "snippetLang": "python",
        "snippet": "# Búsqueda híbrida con re-ranking anti-alucinaciones\nasync def answer(query: str) -> str:\n    vec = await pgvector.search(embed(query), k=20)\n    lex = await bm25.search(query, k=20)\n    fused = reciprocal_rank_fusion(vec, lex)\n    ctx = rerank(fused)[:6]  # solo contexto verificado\n    return await llm.answer(query, context=ctx)"
      },
      "specs": [
        {
          "label": "Ingesta",
          "value": "PDFs asíncronos · Celery + Redis"
        },
        {
          "label": "Búsqueda",
          "value": "Híbrida + re-ranking"
        },
        {
          "label": "LLMs",
          "value": "OpenAI + Claude API"
        },
        {
          "label": "Vectorial",
          "value": "PostgreSQL pgvector"
        }
      ],
      "image": "/uploads/mv60rfcx-ragx.png"
    },
    {
      "id": "ingest-pipeline",
      "title": "IoT Telemetry Resilient Backend",
      "category": "codigo",
      "tagline": "Ingesta industrial tolerante a fallos con 99% de uptime",
      "description": "Backend para sensores industriales en entornos con conectividad intermitente.",
      "longDescription": "Plataforma de ingesta de datos de sensores industriales diseñada para conectividad intermitente: persistencia local (buffering) y sincronización asíncrona que garantizan 99% de uptime bajo tráfico concurrente simulado vía WebSockets/MQTT. Transforma documentos crudos multiformato (PDF, CSV, JSON, TXT) en datos limpios y trazables listos para RAG.",
      "tags": [
        "Python Asyncio",
        "Node.js",
        "MQTT",
        "PostgreSQL",
        "Docker"
      ],
      "year": "2025",
      "repoUrl": "https://github.com/miguelxlerion/Ingest_Pipeline",
      "repo": {
        "name": "Ingest_Pipeline",
        "language": "Python",
        "langColor": "#3572A5",
        "stars": 0,
        "forks": 0,
        "updated": "ago 2026",
        "snippetLang": "python",
        "snippet": "# Buffer local: ningún dato se pierde sin red\nasync def ingest(sensor_id: str, payload: dict):\n    try:\n        await broker.publish(f\"sensors/{sensor_id}\", payload)\n    except ConnectionError:\n        await local_buffer.append(sensor_id, payload)  # retry luego\n        metrics.buffered.inc()"
      },
      "specs": [
        {
          "label": "Uptime",
          "value": "99% con tráfico concurrente"
        },
        {
          "label": "Protocolos",
          "value": "WebSockets + MQTT"
        },
        {
          "label": "Resiliencia",
          "value": "Buffer local + reintento"
        },
        {
          "label": "Formatos",
          "value": "PDF · CSV · JSON · TXT"
        }
      ]
    },
    {
      "id": "fovis-platform",
      "title": "FOVIS · Gestión Habitacional",
      "category": "codigo",
      "tagline": "1.200+ unidades y KPIs en tiempo real para la Alcaldía de Caucasia",
      "description": "Plataforma construida desde cero: dashboards de KPIs que recortaron 60% el tiempo de decisiones.",
      "longDescription": "Arquitecté y desarrollé desde cero la plataforma de gestión habitacional de la Alcaldía de Caucasia (FOVIS): frontend React con biblioteca propia de componentes UI reutilizables y backend Django/MySQL desacoplado por APIs. Los dashboards de KPIs en tiempo real para 12+ administradores redujeron el tiempo de toma de decisiones un 60% y los tiempos de carga un 35%.",
      "image": "/uploads/mv60jz35-fovis_mark.jpg",
      "tags": [
        "React",
        "Tailwind",
        "Django",
        "MySQL",
        "KPIs"
      ],
      "year": "2024",
      "specs": [
        {
          "label": "Cliente",
          "value": "Alcaldía de Caucasia (FOVIS)"
        },
        {
          "label": "Escala",
          "value": "1.200+ unidades · 12+ admins"
        },
        {
          "label": "Resultado",
          "value": "-60% tiempo de decisión"
        },
        {
          "label": "Rendimiento",
          "value": "-35% tiempos de carga"
        }
      ]
    },
    {
      "id": "aonc-neuro3d",
      "title": "AONC · NeuroData 3D",
      "category": "diseno3d",
      "tagline": "Datasets masivos convertidos en mundos 3D navegables",
      "description": "Entornos 3D gamificados para análisis visual en tiempo real. −40% en tiempo de análisis.",
      "longDescription": "Como Director de Diseño 3D & Data Visualization en AONC Neuroscientific Strategies, transformé conjuntos de datos masivos y complejos en entornos 3D gamificados y navegables para análisis visual en tiempo real. Aplicando principios UX/UI de claridad visual, reduje el tiempo de análisis un 40% para usuarios no técnicos.",
      "image": "/uploads/mv6085i9-portada_aonc.jpg",
      "tags": [
        "Unity",
        "DataViz",
        "UX/UI",
        "Tiempo real"
      ],
      "year": "2019",
      "specs": [
        {
          "label": "Rol",
          "value": "Director 3D & DataViz"
        },
        {
          "label": "Resultado",
          "value": "-40% tiempo de análisis"
        },
        {
          "label": "Usuarios",
          "value": "No técnicos"
        }
      ]
    },
    {
      "id": "total-darkness",
      "title": "Total Darkness",
      "category": "diseno3d",
      "tagline": "Videojuego musical en Unity basado en la discografía de Redemthor",
      "description": "Dirección conceptual y técnica: sonido, narrativa y desarrollo unificados en Unity.",
      "longDescription": "Lideré el desarrollo conceptual y técnico de Total Darkness, videojuego musical basado en la discografía de Redemthor, unificando diseño de sonido, narrativa y desarrollo en Unity. Proyecto de Xlerion Studio que combina mi perfil técnico con el artístico.",
      "image": "/uploads/mv5zro02-total-darkness-logo.png",
      "tags": [
        "Unity",
        "Diseño de sonido",
        "Narrativa",
        "Game Dev"
      ],
      "year": "2023",
      "specs": [
        {
          "label": "Estudio",
          "value": "Xlerion Studio"
        },
        {
          "label": "Motor",
          "value": "Unity"
        },
        {
          "label": "Género",
          "value": "Videojuego musical"
        }
      ],
      "repoUrl": "https://github.com/miguelxlerion/TotalDarkness.git",
      "featured": true
    }
  ],
  "github": {
    "username": "miguelxlerion",
    "title": "Código vivo",
    "text": "Esta sección consulta mi GitHub en tiempo real: 45 repos públicos entre plataformas 3D, backends y experimentos de IA.",
    "maxRepos": 8
  },
  "webworks": {
    "title": "Sitios en producción",
    "text": "Plataformas reales, en línea hoy mismo: turismo, logística y e-commerce, todas desplegadas en Cloudflare. El punto verde verifica en vivo que cada sitio responde.",
    "items": [
      {
        "id": "tropical-biohostel",
        "title": "Tropical Biohostel",
        "desc": "Plataforma turística bilingüe (ES/EN) para un biohostel en Nocaima: hospedaje, Cosmic Bungaló, experiencias, gastronomía de la finca y buscador inteligente Zemisqua.",
        "url": "https://tropicalbiohostel.pages.dev/",
        "tags": [
          "Turismo",
          "Reservas",
          "Bilingüe",
          "Cloudflare Pages"
        ],
        "year": "2025",
        "image": "https://tropicalbiohostel.pages.dev/fotos/BioHostel10.jpg"
      },
      {
        "id": "tranxport",
        "title": "Tranxport · Rastreo",
        "desc": "Rastreador y cotizador de mensajería en moto para 5 municipios: códigos TRX, tarifario oficial, pedidos que caen directo al sistema y confirmación por WhatsApp.",
        "url": "https://tranxport-web.tranxportx.workers.dev/",
        "tags": [
          "Logística",
          "Rastreo",
          "WhatsApp",
          "Workers"
        ],
        "year": "2026",
        "image": "https://tranxport-web.tranxportx.workers.dev/logo-blanco.png"
      },
      {
        "id": "ropero-magico",
        "title": "El Ropero Mágico",
        "desc": "E-commerce de moda circular con drops cada 15 días, probador virtual 3D + AR, carrito, pagos Wompi y comunidad de +2.300 personas por WhatsApp.",
        "url": "https://elropero-magico-platform.xlerionultimate.workers.dev/",
        "tags": [
          "E-commerce",
          "3D + AR",
          "Wompi",
          "Drops"
        ],
        "year": "2026",
        "image": "https://elropero-magico-platform.xlerionultimate.workers.dev/images/hero.jpg"
      }
    ]
  },
  "showcase3d": {
    "title": "Modelos 3D",
    "text": "Una selección de piezas y demos. El visor solo carga cuando lo pides: arrastra para rotar, rueda para zoom. Para publicar tus modelos, súbelos como .glb a public/models/ (o R2) y pega la URL en el panel.",
    "models": [
      {
        "id": "nucleo-reactor",
        "title": "Núcleo Reactor",
        "desc": "Demo procedural: núcleo icosaédrico con anillos orbitales y emisivos. Marcador de posición para tus hard-surface.",
        "preset": "reactor",
        "poster": "https://picsum.photos/seed/demo-reactor/1200/800",
        "tags": [
          "Procedural",
          "Three.js",
          "Demo"
        ],
        "specs": [
          {
            "label": "Geometría",
            "value": "Procedural · baja"
          },
          {
            "label": "Material",
            "value": "PBR metálico + emisivo"
          }
        ]
      },
      {
        "id": "cristal-datos",
        "title": "Cristal de Datos",
        "desc": "Demo procedural: cluster de octaedros translúcidos. Ideal para presentar lookdev y materiales.",
        "preset": "cristal",
        "poster": "https://picsum.photos/seed/demo-cristal/1200/800",
        "tags": [
          "Procedural",
          "Lookdev",
          "Demo"
        ],
        "specs": [
          {
            "label": "Geometría",
            "value": "Procedural · instanciada"
          },
          {
            "label": "Material",
            "value": "Transmisión + emisivo"
          }
        ]
      },
      {
        "id": "toroide-industrial",
        "title": "Toroide Industrial",
        "desc": "Demo procedural: toroide con detalle anillado y giro continuo. Reemplázame con tu primer .glb desde el panel.",
        "preset": "toroide",
        "poster": "https://picsum.photos/seed/demo-toroide/1200/800",
        "tags": [
          "Procedural",
          "Turntable",
          "Demo"
        ],
        "specs": [
          {
            "label": "Geometría",
            "value": "Procedural · suavizada"
          },
          {
            "label": "Presentación",
            "value": "Turntable 360°"
          }
        ]
      }
    ]
  },
  "contact": {
    "eyebrow": "Contacto",
    "title": "¿Construimos algo que importe?",
    "text": "Arquitectura, 3D en tiempo real o IA en producción: respondo en menos de 24 horas con propuesta y tiempos.",
    "socials": [
      {
        "label": "GitHub",
        "url": "https://github.com/miguelxlerion"
      },
      {
        "label": "LinkedIn",
        "url": "https://linkedin.com/in/miguelrodriguez-dataviz"
      },
      {
        "label": "Portafolio",
        "url": "https://mike-portfolio.xlerionultimate.workers.dev/"
      }
    ],
    "services": [
      "Arquitectura de software",
      "Plataformas 3D / WebGL",
      "Integración IA / RAG",
      "Dashboards & DataViz",
      "Otro"
    ],
    "budgets": [
      "< 1k USD",
      "1–3k USD",
      "3–8k USD",
      "8k+ USD",
      "A convenir"
    ]
  },
  "footer": {
    "note": "Hecho con React, WebSockets y café.",
    "watermark": "MIKE"
  },
  "appearance": {
    "accent": "#00fffb",
    "ink": "#0a0a0b",
    "panel": "#141418",
    "showCursor": true,
    "showParticles": true,
    "showMarquee": true,
    "showStats": true
  }
};
// </defaultContent> — NO BORRAR ESTA LÍNEA.
