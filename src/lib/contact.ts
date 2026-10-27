type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const isEnglish = document.documentElement.lang === "en";

const t = isEnglish
  ? {
      nameError: "Enter your name (at least 2 characters).",
      emailError: "Enter a valid email, e.g. name@company.com.",
      messageError: "Tell me a bit more: at least 20 characters.",
      review: "Review the highlighted fields before continuing.",
      preparing: "Preparing your message.",
      sending: "Sending…",
      done: "✓ Done",
      send: "Send message",
      copy: "Copy",
      copied: "Copied",
      copyUnavailable: "Unavailable",
      copiedAnnounce: (value: string) => `Copied to clipboard: ${value}`,
      copyFail: (value: string) => `Could not copy. The value is ${value}`,
      mailSent: "Your email client opened with the message ready. Send it from there to finish.",
      fallbackTopic: "Project",
      subject: (name: string) => `New project — ${name}`,
      bodyLabels: ["Name", "Email", "Interest"],
      mailFooter: "— Sent from mike-portfolio.xlerionultimate.workers.dev",
    }
  : {
      nameError: "Escribe tu nombre (mínimo 2 caracteres).",
      emailError: "Introduce un email válido, p. ej. nombre@empresa.com.",
      messageError: "Cuéntame un poco más: al menos 20 caracteres.",
      review: "Revisa los campos marcados antes de continuar.",
      preparing: "Preparando tu mensaje.",
      sending: "Enviando…",
      done: "✓ Listo",
      send: "Enviar mensaje",
      copy: "Copiar",
      copied: "Copiado",
      copyUnavailable: "No disponible",
      copiedAnnounce: (value: string) => `Copiado al portapapeles: ${value}`,
      copyFail: (value: string) => `No se pudo copiar. El valor es ${value}`,
      mailSent: "Se abrió tu cliente de correo con el mensaje listo. Envíalo desde ahí para completar.",
      fallbackTopic: "Proyecto",
      subject: (name: string) => `Nuevo proyecto — ${name}`,
      bodyLabels: ["Nombre", "Email", "Interés"],
      mailFooter: "— Enviado desde mike-portfolio.xlerionultimate.workers.dev",
    };

const rules: Record<string, (value: string) => string | null> = {
  name: (value) => (value.trim().length >= 2 ? null : t.nameError),
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? null : t.emailError,
  message: (value) => (value.trim().length >= 20 ? null : t.messageError),
};

function announce(status: HTMLElement | null, message: string) {
  if (!status) return;
  status.textContent = "";
  window.setTimeout(() => {
    status.textContent = message;
  }, 50);
}

export function initContact() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const submit = form.querySelector<HTMLButtonElement>("[data-submit]");
  const submitLabel = form.querySelector<HTMLElement>("[data-submit-label]");
  const spinner = form.querySelector<HTMLElement>("[data-submit-spinner]");
  const formStatus = document.querySelector<HTMLElement>("[data-form-status]");
  const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");
  const fields = Array.from(form.querySelectorAll<Field>("[name]")).filter(
    (field) => field.name in rules,
  );

  let submitting = false;

  const renderField = (field: Field): boolean => {
    const rule = rules[field.name];
    const error = rule ? rule(field.value) : null;
    const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);

    field.setAttribute("aria-invalid", String(Boolean(error)));

    if (errorEl) {
      errorEl.textContent = error ?? "";
      errorEl.hidden = !error;
    }

    return !error;
  };

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.dataset.touched === "true") renderField(field);
    });
    field.addEventListener("blur", () => {
      field.dataset.touched = "true";
      renderField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submitting) return;

    let firstInvalid: Field | null = null;

    fields.forEach((field) => {
      field.dataset.touched = "true";
      if (!renderField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      (firstInvalid as Field).focus();
      announce(formStatus, t.review);
      return;
    }

    submitting = true;
    submit?.setAttribute("aria-busy", "true");
    if (submit) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = t.sending;
    spinner?.classList.remove("hidden");
    announce(formStatus, t.preparing);

    const data = new FormData(form);
    const email = form.dataset.email ?? "";
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const topic = String(data.get("topic") ?? t.fallbackTopic);
    const message = String(data.get("message") ?? "").trim();

    const subject = encodeURIComponent(t.subject(name));
    const body = encodeURIComponent(
      [
        `${t.bodyLabels[0]}: ${name}`,
        `${t.bodyLabels[1]}: ${from}`,
        `${t.bodyLabels[2]}: ${topic}`,
        "",
        message,
        "",
        t.mailFooter,
      ].join("\n"),
    );

    window.setTimeout(() => {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      submitting = false;
      submit?.removeAttribute("aria-busy");
      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = t.done;
      spinner?.classList.add("hidden");
      announce(formStatus, t.mailSent);

      form.reset();
      fields.forEach((field) => {
        field.dataset.touched = "false";
        field.removeAttribute("aria-invalid");
        const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);
        if (errorEl) {
          errorEl.textContent = "";
          errorEl.hidden = true;
        }
      });

      window.setTimeout(() => {
        if (submitLabel) submitLabel.textContent = t.send;
      }, 6000);
    }, 650);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
    const original = button.textContent?.trim() ?? t.copy;

    button.addEventListener("click", async () => {
      const value = button.dataset.copy ?? "";

      try {
        await navigator.clipboard.writeText(value);
        button.textContent = t.copied;
        announce(copyStatus, t.copiedAnnounce(value));
      } catch {
        button.textContent = t.copyUnavailable;
        announce(copyStatus, t.copyFail(value));
      }

      window.setTimeout(() => {
        button.textContent = original;
      }, 1800);
    });
  });
}
