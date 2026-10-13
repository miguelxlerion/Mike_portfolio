// POST /api/contact — formulario sin backend propio.
// Si RESEND_API_KEY no está configurada responde 501 y el frontend
// cae al flujo mailto (progresivo, nunca se rompe).
// Con TURNSTILE_SECRET verifica el token anti-spam (opcional).
//
//   POST { name, email, service, budget, message, turnstile? }

interface Env {
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown> = {};
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "bad-json" }, 400);
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 160);
  const service = String(body.service ?? "").trim().slice(0, 120);
  const budget = String(body.budget ?? "").trim().slice(0, 60);
  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 12) {
    return json({ ok: false, error: "validation" }, 400);
  }

  // Anti-spam solo si hay secreto configurado (el widget va en el front)
  const token = String(body.turnstile ?? "");
  if (ctx.env.TURNSTILE_SECRET && token) {
    try {
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: ctx.env.TURNSTILE_SECRET, response: token }),
      });
      const result = (await verify.json().catch(() => null)) as { success?: boolean } | null;
      if (!result?.success) return json({ ok: false, error: "turnstile" }, 403);
    } catch {
      return json({ ok: false, error: "turnstile-error" }, 502);
    }
  }

  if (!ctx.env.RESEND_API_KEY) return json({ ok: false, error: "not-configured" }, 501);

  const to = ctx.env.CONTACT_TO ?? "miguelxlerion@gmail.com";
  const from = ctx.env.CONTACT_FROM ?? "Portafolio <onboarding@resend.dev>";

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `[Portafolio] ${service || "Contacto"} — ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\nServicio: ${service}\nPresupuesto: ${budget}\n\n${message}`,
    }),
  });

  if (!sent.ok) return json({ ok: false, error: "send-failed" }, 502);
  return json({ ok: true }, 200);
};
