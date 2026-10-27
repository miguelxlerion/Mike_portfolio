import type { ImageMetadata } from "astro";
import ragX from "../assets/projects/rag-x.png";
import fovis from "../assets/projects/fovis.jpg";
import iotPipeline from "../assets/projects/iot-pipeline.jpg";
import aonc from "../assets/projects/aonc.jpg";

export type Lang = "es" | "en";

const profileBase = {
  name: "Miguel E. Rodriguez Martinez",
  shortName: "Miguel E. Rodriguez",
  role: "Senior Full-Stack Engineer",
  focus: "Real-Time 3D & AI Data Platforms",
  email: "miguelxlerion@gmail.com",
  phone: "+57 313 226 3265",
  phoneHref: "+573132263265",
  studio: "Xlerion Studio",
  github: "https://github.com/miguelxlerion",
  linkedin: "https://linkedin.com/in/miguelrodriguez-dataviz",
  cvEs: "/cv/Miguel_Rodriguez_FullStack_Senior_Esp.pdf",
  cvEn: "/cv/Miguel_Rodriguez_FullStack_Senior_CV_Eng.pdf",
} as const;

const profileCopy: Record<Lang, { location: string; availability: string }> = {
  es: {
    location: "Bogotá, Colombia · Remoto",
    availability: "Disponible para proyectos · Respuesta en 24h",
  },
  en: {
    location: "Bogotá, Colombia · Remote",
    availability: "Available for projects · Reply within 24h",
  },
};

export function getProfile(lang: Lang) {
  return { ...profileBase, ...profileCopy[lang] };
}

const navCopy: Record<Lang, { href: string; label: string }[]> = {
  es: [
    { href: "#impacto", label: "Impacto" },
    { href: "#proyectos", label: "Proyectos" },
    { href: "#sitios", label: "Sitios" },
    { href: "#stack", label: "Stack" },
    { href: "#contacto", label: "Contacto" },
  ],
  en: [
    { href: "#impacto", label: "Impact" },
    { href: "#proyectos", label: "Projects" },
    { href: "#sitios", label: "Sites" },
    { href: "#stack", label: "Stack" },
    { href: "#contacto", label: "Contact" },
  ],
};

export type Metric = {
  value: number;
  suffix: string;
  label: string;
  context: string;
};

const metricsCopy: Record<Lang, Metric[]> = {
  es: [
    {
      value: 60,
      suffix: "%",
      label: "más rápido en toma de decisiones",
      context: "FOVIS · 12+ municipios, 1.200+ viviendas",
    },
    {
      value: 80,
      suffix: "%",
      label: "menos tiempo en exportación de assets 3D",
      context: "Pipeline propio · Xlerion Studio",
    },
    {
      value: 40,
      suffix: "%",
      label: "menos tiempo de análisis de datos",
      context: "AONC · entornos 3D navegables",
    },
    {
      value: 99,
      suffix: "%",
      label: "uptime en sistemas críticos",
      context: "CI/CD + diseño tolerante a fallos",
    },
  ],
  en: [
    {
      value: 60,
      suffix: "%",
      label: "faster decision-making",
      context: "FOVIS · 12+ municipalities, 1,200+ homes",
    },
    {
      value: 80,
      suffix: "%",
      label: "less time exporting 3D assets",
      context: "In-house pipeline · Xlerion Studio",
    },
    {
      value: 40,
      suffix: "%",
      label: "less data analysis time",
      context: "AONC · navigable 3D environments",
    },
    {
      value: 99,
      suffix: "%",
      label: "uptime across critical systems",
      context: "CI/CD + fault-tolerant design",
    },
  ],
};

export type FilterId = "todos" | "ai-data" | "frontend-3d" | "devops";
export type ProjectCategory = Exclude<FilterId, "todos">;

export type Filter = { id: FilterId; label: string };

const filtersCopy: Record<Lang, Filter[]> = {
  es: [
    { id: "todos", label: "Todos" },
    { id: "ai-data", label: "AI & Data" },
    { id: "frontend-3d", label: "Frontend & 3D" },
    { id: "devops", label: "DevOps" },
  ],
  en: [
    { id: "todos", label: "All" },
    { id: "ai-data", label: "AI & Data" },
    { id: "frontend-3d", label: "Frontend & 3D" },
    { id: "devops", label: "DevOps" },
  ],
};

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  year: string;
  description: string;
  impact: string;
  tags: string[];
  image: ImageMetadata;
  imageAlt: string;
  imageFit: "contain" | "cover";
  href?: string;
  hrefLabel?: string;
};

type ProjectMedia = Omit<Project, "title" | "description" | "impact" | "imageAlt" | "hrefLabel">;

const projectMedia: ProjectMedia[] = [
  {
    id: "rag-assistant",
    category: "ai-data",
    categoryLabel: "AI & Data",
    year: "2025",
    tags: ["Python", "Django", "LangChain", "pgvector"],
    image: ragX,
    imageFit: "contain",
    href: "https://github.com/miguelxlerion/Rag_X",
  },
  {
    id: "fovis",
    category: "frontend-3d",
    categoryLabel: "Frontend & 3D",
    year: "2024",
    tags: ["React 18", "Tailwind", "WebSockets", "KPIs"],
    image: fovis,
    imageFit: "contain",
  },
  {
    id: "iot-telemetry",
    category: "devops",
    categoryLabel: "DevOps",
    year: "2025",
    tags: ["Node.js", "Python", "MQTT", "Locust"],
    image: iotPipeline,
    imageFit: "contain",
    href: "https://github.com/miguelxlerion/Ingest_Pipeline",
  },
  {
    id: "aonc",
    category: "frontend-3d",
    categoryLabel: "Frontend & 3D",
    year: "2019",
    tags: ["Three.js", "WebGL", "DataViz", "UX/UI"],
    image: aonc,
    imageFit: "cover",
  },
];

type ProjectCopy = { title: string; description: string; impact: string; imageAlt: string; hrefLabel?: string };

const projectCopy: Record<Lang, Record<string, ProjectCopy>> = {
  es: {
    "rag-assistant": {
      title: "Enterprise RAG Assistant",
      description:
        "Asistente empresarial con ingesta asíncrona de PDFs, chunking semántico y búsqueda híbrida (vectorial + léxica) con re-ranking. Respuestas trazables sobre conocimiento interno, sin alucinaciones.",
      impact: "Contexto verificado en segundos",
      imageAlt: "Logotipo de Enterprise RAG Assistant",
      hrefLabel: "Ver repositorio",
    },
    fovis: {
      title: "FOVIS · Gestión Habitacional",
      description:
        "Plataforma de gestión habitacional para 12+ administradores y 1.200+ unidades. Dashboards de KPI en tiempo real que recortaron el tiempo de decisión un 60%.",
      impact: "-60% tiempo de decisión",
      imageAlt: "Identidad visual del proyecto FOVIS",
    },
    "iot-telemetry": {
      title: "IoT Resilient Telemetry",
      description:
        "Ingesta de telemetría industrial tolerante a conectividad intermitente: buffer local, sincronización asíncrona y 99% de uptime bajo carga concurrente.",
      impact: "99% uptime · cero pérdida de datos",
      imageAlt: "Pipeline de ingesta de telemetría IoT",
      hrefLabel: "Ver repositorio",
    },
    aonc: {
      title: "AONC · NeuroData 3D",
      description:
        "Datasets masivos convertidos en entornos 3D navegables para analistas no técnicos. La visualización en tiempo real redujo el tiempo de análisis un 40%.",
      impact: "-40% tiempo de análisis",
      imageAlt: "Portada del proyecto AONC NeuroData 3D",
    },
  },
  en: {
    "rag-assistant": {
      title: "Enterprise RAG Assistant",
      description:
        "Enterprise assistant with asynchronous PDF ingestion, semantic chunking and hybrid search (vector + lexical) with re-ranking. Traceable answers over internal knowledge, without hallucinations.",
      impact: "Verified context in seconds",
      imageAlt: "Enterprise RAG Assistant logo",
      hrefLabel: "View repository",
    },
    fovis: {
      title: "FOVIS · Housing Management",
      description:
        "Housing management platform for 12+ administrators and 1,200+ units. Real-time KPI dashboards that cut decision time by 60%.",
      impact: "-60% decision time",
      imageAlt: "FOVIS project visual identity",
    },
    "iot-telemetry": {
      title: "IoT Resilient Telemetry",
      description:
        "Industrial telemetry ingestion tolerant of intermittent connectivity: local buffer, asynchronous sync and 99% uptime under concurrent load.",
      impact: "99% uptime · zero data loss",
      imageAlt: "IoT telemetry ingestion pipeline",
      hrefLabel: "View repository",
    },
    aonc: {
      title: "AONC · NeuroData 3D",
      description:
        "Massive datasets turned into navigable 3D environments for non-technical analysts. Real-time visualization reduced analysis time by 40%.",
      impact: "-40% analysis time",
      imageAlt: "AONC NeuroData 3D project cover",
    },
  },
};

function getProjects(lang: Lang): Project[] {
  return projectMedia.map((project) => {
    const copy = projectCopy[lang][project.id];
    return { ...project, ...copy, hrefLabel: copy.hrefLabel };
  });
}

export type LiveSite = {
  id: string;
  name: string;
  host: string;
  url: string;
  description: string;
  tags: string[];
  year: string;
  monogram: string;
  accent: string;
};

type LiveSiteMedia = Omit<LiveSite, "name" | "description" | "tags">;

const liveSiteMedia: LiveSiteMedia[] = [
  {
    id: "tropical-biohostel",
    host: "tropicalbiohostel.pages.dev",
    url: "https://tropicalbiohostel.pages.dev/",
    year: "2025",
    monogram: "TB",
    accent: "#22d3ee",
  },
  {
    id: "alma-semilla",
    host: "alma-semilla.xlerionultimate.workers.dev",
    url: "https://alma-semilla.xlerionultimate.workers.dev/",
    year: "2026",
    monogram: "AS",
    accent: "#a3e635",
  },
  {
    id: "tranxport",
    host: "tranxport-web.tranxportx.workers.dev",
    url: "https://tranxport-web.tranxportx.workers.dev/",
    year: "2026",
    monogram: "TX",
    accent: "#fb923c",
  },
  {
    id: "ropero-magico",
    host: "elropero-magico-platform.xlerionultimate.workers.dev",
    url: "https://elropero-magico-platform.xlerionultimate.workers.dev/",
    year: "2026",
    monogram: "ER",
    accent: "#f472b6",
  },
];

type LiveSiteCopy = Pick<LiveSite, "name" | "description" | "tags">;

const liveSiteCopy: Record<Lang, Record<string, LiveSiteCopy>> = {
  es: {
    "tropical-biohostel": {
      name: "Tropical Biohostel",
      description:
        "Plataforma turística bilingüe (ES/EN) enfocada en reserva directa, SEO y experiencias de la finca. Hospedaje, gastronomía y buscador inteligente.",
      tags: ["Turismo", "Reservas", "Bilingüe", "Cloudflare Pages"],
    },
    "alma-semilla": {
      name: "Alma Semilla",
      description:
        "Plataforma de agricultura regenerativa y trazabilidad de semillas: marketplace B2B, certificación y dashboard de impacto ambiental.",
      tags: ["AgriTech", "Trazabilidad", "B2B", "Cloudflare Workers"],
    },
    tranxport: {
      name: "Tranxport · Rastreo",
      description:
        "Rastreador y cotizador de mensajería en moto para 5 municipios: códigos TRX, tarifario oficial, pedidos integrados al sistema y confirmación por WhatsApp.",
      tags: ["Logística", "Rastreo", "WhatsApp", "Workers"],
    },
    "ropero-magico": {
      name: "El Ropero Mágico",
      description:
        "E-commerce de moda circular con drops cada 15 días, probador virtual 3D + AR, carrito, pagos Wompi y comunidad de +2.300 personas por WhatsApp.",
      tags: ["E-commerce", "3D + AR", "Wompi", "Drops"],
    },
  },
  en: {
    "tropical-biohostel": {
      name: "Tropical Biohostel",
      description:
        "Bilingual tourism platform (ES/EN) focused on direct bookings, SEO and farm experiences. Lodging, dining and a smart search engine.",
      tags: ["Tourism", "Bookings", "Bilingual", "Cloudflare Pages"],
    },
    "alma-semilla": {
      name: "Alma Semilla",
      description:
        "Regenerative agriculture and seed traceability platform: B2B marketplace, certification and environmental impact dashboard.",
      tags: ["AgriTech", "Traceability", "B2B", "Cloudflare Workers"],
    },
    tranxport: {
      name: "Tranxport · Tracking",
      description:
        "Motorcycle courier tracking and quoting for 5 municipalities: TRX codes, official rate card, orders fed straight into the system and WhatsApp confirmation.",
      tags: ["Logistics", "Tracking", "WhatsApp", "Workers"],
    },
    "ropero-magico": {
      name: "El Ropero Mágico",
      description:
        "Circular fashion e-commerce with drops every 15 days, 3D + AR virtual try-on, cart, Wompi payments and a 2,300+ person WhatsApp community.",
      tags: ["E-commerce", "3D + AR", "Wompi", "Drops"],
    },
  },
};

function getLiveSites(lang: Lang): LiveSite[] {
  return liveSiteMedia.map((site) => ({ ...site, ...liveSiteCopy[lang][site.id] }));
}

export type SkillIcon = "layout" | "server" | "terminal" | "sparkles";

export type SkillGroup = {
  title: string;
  icon: SkillIcon;
  items: string[];
};

const skillBase: { icon: SkillIcon; items: string[] }[] = [
  { icon: "layout", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "R3F"] },
  { icon: "server", items: ["Python", "FastAPI", "Node.js", "Django", "WebSockets"] },
  { icon: "terminal", items: ["Docker", "GitHub Actions", "Linux", "Nginx", "Cloudflare"] },
  { icon: "sparkles", items: ["LangChain", "pgvector", "RAG", "Blender", "MaxScript"] },
];

const skillTitles: Record<Lang, string[]> = {
  es: ["Frontend", "Backend", "DevOps", "IA & 3D"],
  en: ["Frontend", "Backend", "DevOps", "AI & 3D"],
};

function getSkillGroups(lang: Lang): SkillGroup[] {
  return skillBase.map((group, index) => ({ ...group, title: skillTitles[lang][index] }));
}

export const credentials = [
  { label: "AI/GenAI Specialization", issuer: "UC Irvine · Honors", year: "2024" },
  { label: "PMP®", issuer: "Project Management Institute", year: "2020" },
  { label: "AI Developer", issuer: "IBM Watson", year: "2018" },
] as const;

export function getSite(lang: Lang) {
  return {
    lang,
    profile: getProfile(lang),
    navLinks: navCopy[lang],
    metrics: metricsCopy[lang],
    filters: filtersCopy[lang],
    projects: getProjects(lang),
    liveSites: getLiveSites(lang),
    skillGroups: getSkillGroups(lang),
    credentials,
  };
}
