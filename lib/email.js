/**
 * Trimitere emailuri prin Resend (HTTP API, fără dependențe).
 * Emailurile pleacă de la EMAIL_FROM (noreply@cotaverde.ro).
 */

const RESEND_API = "https://api.resend.com/emails";

function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ro">
<body style="margin:0;padding:0;background:#0B120E;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B120E;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#EAF6EE;">Cota</span><span style="font-size:24px;font-weight:700;color:#2BE879;">Verde</span>
        </td></tr>
        <tr><td style="background:#111B15;border:1px solid #1D2B22;border-radius:14px;padding:28px;">
          <h1 style="margin:0 0 16px;font-size:19px;color:#EAF6EE;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#7E948A;line-height:1.6;">
          CotaVerde · Analize fotbal pe date reale<br/>
          Operat de PDF 33 LLC · Joacă responsabil, 18+<br/>
          Ai primit acest email pentru că ai un cont pe cotaverde.ro
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#2BE879;border-radius:10px;">
    <a href="${url}" style="display:inline-block;padding:13px 28px;color:#0B120E;font-weight:700;font-size:15px;text-decoration:none;">${label}</a>
  </td></tr></table>`;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "CotaVerde <noreply@cotaverde.ro>";

  if (!apiKey) {
    console.error("RESEND_API_KEY lipsește - emailul nu a fost trimis:", subject);
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Resend error:", res.status, t.slice(0, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { ok: false };
  }
}

export async function sendVerificationEmail(email, firstName, token) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cotaverde.ro";
  const url = `${appUrl}/api/auth/verify-email?token=${token}`;
  const html = baseTemplate(
    `Bine ai venit, ${firstName}!`,
    `<p style="margin:0 0 8px;font-size:14px;color:#B8CBC0;line-height:1.7;">
      Contul tău CotaVerde e aproape gata. Confirmă adresa de email ca să activezi toate funcțiile:
    </p>
    ${button(url, "Confirmă adresa de email")}
    <p style="margin:0;font-size:12px;color:#7E948A;line-height:1.6;">
      Ai 7 zile de acces Premium gratuit. Linkul e valabil 48 de ore.
      Dacă nu tu ai creat contul, ignoră acest email.
    </p>`
  );
  return sendEmail({ to: email, subject: "Confirmă-ți contul CotaVerde", html });
}

export async function sendPasswordResetEmail(email, firstName, token) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cotaverde.ro";
  const url = `${appUrl}/reset-password?token=${token}`;
  const html = baseTemplate(
    "Resetare parolă",
    `<p style="margin:0 0 8px;font-size:14px;color:#B8CBC0;line-height:1.7;">
      Salut, ${firstName}. Am primit o cerere de resetare a parolei pentru contul tău. Apasă butonul ca să setezi o parolă nouă:
    </p>
    ${button(url, "Setează parolă nouă")}
    <p style="margin:0;font-size:12px;color:#7E948A;line-height:1.6;">
      Linkul e valabil 1 oră și poate fi folosit o singură dată.
      Dacă nu tu ai cerut resetarea, ignoră acest email, parola rămâne neschimbată.
    </p>`
  );
  return sendEmail({ to: email, subject: "Resetare parolă CotaVerde", html });
}
