import type { ImageMetadata } from "astro";
import ragX from "../assets/projects/rag-x.png";
import fovis from "../assets/projects/fovis.jpg";
import iotPipeline from "../assets/projects/iot-pipeline.jpg";
import aonc from "../assets/projects/aonc.jpg";

export const profile = {
  name: "Miguel E. Rodriguez Martinez",
  shortName: "Miguel E. Rodriguez",
  role: "Senior Full-Stack Engineer",
  focus: "Real-Time 3D & AI Data Platforms",
  location: "Bogotá, Colombia · Remoto",
  email: "miguelxlerion@gmail.com",
  phone: "+57 313 226 3265",
  phoneHref: "+573132263265",
  availability: "Disponible para proyectos · Respuesta en 24h",
  studio: "Xlerion Studio",
  github: "https://github.com/miguelxlerion",
  linkedin: "https://linkedin.com/in/miguelrodriguez-dataviz",
  cvEs: "/cv/Miguel_Rodriguez_FullStack_Senior_Esp.pdf",
  cvEn: "/cv/Miguel_Rodriguez_FullStack_Senior_CV_Eng.pdf",
} as const;

export const navLinks = [
  { href: "#impacto", label: "Impacto" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#sitios", label: "Sitios" },
  { href: "#stack", label: "Stack" },
  { href: "#contacto", label: "Contacto" },
] as const;

export const metrics = [
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
] as const;

export type FilterId = "todos" | "ai-data" | "frontend-3d" | "devops";

export const filters: { id: FilterId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ai-data", label: "AI & Data" },
  { id: "frontend-3d", label: "Frontend & 3D" },
  { id: "devops", label: "DevOps" },
];

export type Project = {
  id: string;
  title: string;
  category: Exclude<FilterId, "todos">;
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

export const projects: Project[] = [
  {
    id: "rag-assistant",
    title: "Enterprise RAG Assistant",
    category: "ai-data",
    categoryLabel: "AI & Data",
    year: "2025",
    description:
      "Asistente empresarial con ingesta asíncrona de PDFs, chunking semántico y búsqueda híbrida (vectorial + léxica) con re-ranking. Respuestas trazables sobre conocimiento interno, sin alucinaciones.",
    impact: "Contexto verificado en segundos",
    tags: ["Python", "Django", "LangChain", "pgvector"],
    image: ragX,
    imageAlt: "Logotipo de Enterprise RAG Assistant",
    imageFit: "contain",
    href: "https://github.com/miguelxlerion/Rag_X",
    hrefLabel: "Ver repositorio",
  },
  {
    id: "fovis",
    title: "FOVIS · Gestión Habitacional",
    category: "frontend-3d",
    categoryLabel: "Frontend & 3D",
    year: "2024",
    description:
      "Plataforma de gestión habitacional para 12+ administradores y 1.200+ unidades. Dashboards de KPI en tiempo real que recortaron el tiempo de decisión un 60%.",
    impact: "-60% tiempo de decisión",
    tags: ["React 18", "Tailwind", "WebSockets", "KPIs"],
    image: fovis,
    imageAlt: "Identidad visual del proyecto FOVIS",
    imageFit: "contain",
  },
  {
    id: "iot-telemetry",
    title: "IoT Resilient Telemetry",
    category: "devops",
    categoryLabel: "DevOps",
    year: "2025",
    description:
      "Ingesta de telemetría industrial tolerante a conectividad intermitente: buffer local, sincronización asíncrona y 99% de uptime bajo carga concurrente.",
    impact: "99% uptime · cero pérdida de datos",
    tags: ["Node.js", "Python", "MQTT", "Locust"],
    image: iotPipeline,
    imageAlt: "Pipeline de ingesta de telemetría IoT",
    imageFit: "contain",
    href: "https://github.com/miguelxlerion/Ingest_Pipeline",
    hrefLabel: "Ver repositorio",
  },
  {
    id: "aonc",
    title: "AONC · NeuroData 3D",
    category: "frontend-3d",
    categoryLabel: "Frontend & 3D",
    year: "2019",
    description:
      "Datasets masivos convertidos en entornos 3D navegables para analistas no técnicos. La visualización en tiempo real redujo el tiempo de análisis un 40%.",
    impact: "-40% tiempo de análisis",
    tags: ["Three.js", "WebGL", "DataViz", "UX/UI"],
    image: aonc,
    imageAlt: "Portada del proyecto AONC NeuroData 3D",
    imageFit: "cover",
  },
];

export const liveSites = [
  {
    id: "tropical-biohostel",
    name: "Tropical Biohostel",
    host: "tropicalbiohostel.pages.dev",
    url: "https://tropicalbiohostel.pages.dev/",
    description:
      "Plataforma turística bilingüe (ES/EN) enfocada en reserva directa, SEO y experiencias de la finca. Hospedaje, gastronomía y buscador inteligente.",
    tags: ["Turismo", "Reservas", "Bilingüe", "Cloudflare Pages"],
    year: "2025",
    monogram: "TB",
    accent: "#22d3ee",
  },
  {
    id: "alma-semilla",
    name: "Alma Semilla",
    host: "alma-semilla.xlerionultimate.workers.dev",
    url: "https://alma-semilla.xlerionultimate.workers.dev/",
    description:
      "Plataforma de agricultura regenerativa y trazabilidad de semillas: marketplace B2B, certificación y dashboard de impacto ambiental.",
    tags: ["AgriTech", "Trazabilidad", "B2B", "Cloudflare Workers"],
    year: "2026",
    monogram: "AS",
    accent: "#a3e635",
  },
  {
    id: "tranxport",
    name: "Tranxport · Rastreo",
    host: "tranxport-web.tranxportx.workers.dev",
    url: "https://tranxport-web.tranxportx.workers.dev/",
    description:
      "Rastreador y cotizador de mensajería en moto para 5 municipios: códigos TRX, tarifario oficial, pedidos integrados al sistema y confirmación por WhatsApp.",
    tags: ["Logística", "Rastreo", "WhatsApp", "Workers"],
    year: "2026",
    monogram: "TX",
    accent: "#fb923c",
  },
  {
    id: "ropero-magico",
    name: "El Ropero Mágico",
    host: "elropero-magico-platform.xlerionultimate.workers.dev",
    url: "https://elropero-magico-platform.xlerionultimate.workers.dev/",
    description:
      "E-commerce de moda circular con drops cada 15 días, probador virtual 3D + AR, carrito, pagos Wompi y comunidad de +2.300 personas por WhatsApp.",
    tags: ["E-commerce", "3D + AR", "Wompi", "Drops"],
    year: "2026",
    monogram: "ER",
    accent: "#f472b6",
  },
] as const;

export const skillGroups = [
  {
    title: "Frontend",
    icon: "layout",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "R3F"],
  },
  {
    title: "Backend",
    icon: "server",
    items: ["Python", "FastAPI", "Node.js", "Django", "WebSockets"],
  },
  {
    title: "DevOps",
    icon: "terminal",
    items: ["Docker", "GitHub Actions", "Linux", "Nginx", "Cloudflare"],
  },
  {
    title: "IA & 3D",
    icon: "sparkles",
    items: ["LangChain", "pgvector", "RAG", "Blender", "MaxScript"],
  },
] as const;

export const credentials = [
  { label: "AI/GenAI Specialization", issuer: "UC Irvine · Honors", year: "2024" },
  { label: "PMP®", issuer: "Project Management Institute", year: "2020" },
  { label: "AI Developer", issuer: "IBM Watson", year: "2018" },
] as const;
