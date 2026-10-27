type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const rules: Record<string, (value: string) => string | null> = {
  name: (value) =>
    value.trim().length >= 2 ? null : "Escribe tu nombre (mínimo 2 caracteres).",
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
      ? null
      : "Introduce un email válido, p. ej. nombre@empresa.com.",
  message: (value) =>
    value.trim().length >= 20
      ? null
      : "Cuéntame un poco más: al menos 20 caracteres.",
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
      announce(formStatus, "Revisa los campos marcados antes de continuar.");
      return;
    }

    submitting = true;
    submit?.setAttribute("aria-busy", "true");
    if (submit) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = "Enviando…";
    spinner?.classList.remove("hidden");
    announce(formStatus, "Preparando tu mensaje.");

    const data = new FormData(form);
    const email = form.dataset.email ?? "";
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const topic = String(data.get("topic") ?? "Proyecto");
    const message = String(data.get("message") ?? "").trim();

    const subject = encodeURIComponent(`Nuevo proyecto — ${name}`);
    const body = encodeURIComponent(
      [
        `Nombre: ${name}`,
        `Email: ${from}`,
        `Interés: ${topic}`,
        "",
        message,
        "",
        "— Enviado desde mike-portfolio.xlerionultimate.workers.dev",
      ].join("\n"),
    );

    window.setTimeout(() => {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      submitting = false;
      submit?.removeAttribute("aria-busy");
      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = "✓ Listo";
      spinner?.classList.add("hidden");
      announce(
        formStatus,
        "Se abrió tu cliente de correo con el mensaje listo. Envíalo desde ahí para completar.",
      );

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
        if (submitLabel) submitLabel.textContent = "Enviar mensaje";
      }, 6000);
    }, 650);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
    const original = button.textContent?.trim() ?? "Copiar";

    button.addEventListener("click", async () => {
      const value = button.dataset.copy ?? "";

      try {
        await navigator.clipboard.writeText(value);
        button.textContent = "Copiado";
        announce(copyStatus, `Copiado al portapapeles: ${value}`);
      } catch {
        button.textContent = "No disponible";
        announce(copyStatus, `No se pudo copiar. El valor es ${value}`);
      }

      window.setTimeout(() => {
        button.textContent = original;
      }, 1800);
    });
  });
}
