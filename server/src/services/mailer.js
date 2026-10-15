/**
 * mailer.js — sends allinkigali's emails through Brevo (free: 300 a day).
 *   BREVO_API_KEY    the key from brevo.com › SMTP & API › API keys
 *   MAIL_FROM        sender address on a domain verified in Brevo (default no-reply@allinkigali.rw)
 *   MAIL_FROM_NAME   sender name (default allinkigali)
 * Until a key is set, emails are only written to the server log and email
 * confirmation isn't required (mailerReady() is false), so nobody is locked out.
 */
const mailerReady = () => !!process.env.BREVO_API_KEY;

async function sendMail({ to, subject, html, text }) {
  if (!mailerReady()) {
    console.log(`[mailer] (no BREVO_API_KEY) to=${to} subject="${subject}" — ${text}`);
    return { logged: true };
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.MAIL_FROM || 'no-reply@allinkigali.rw', name: process.env.MAIL_FROM_NAME || 'allinkigali' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[mailer] Brevo ${res.status}: ${body.slice(0, 300)}`);
    throw Object.assign(new Error('We could not send the email right now. Please try again in a minute.'), { status: 502 });
  }
  return { sent: true };
}

// A short, plain email with one big code — works in every mail app.
function codeEmail({ firstName, code, purpose }) {
  const intro = purpose === 'reset'
    ? 'Use this code to set a new password for your allinkigali account.'
    : 'Use this code to confirm your email for your allinkigali account.';
  const subject = purpose === 'reset' ? `Your allinkigali password code: ${code}` : `Your allinkigali code: ${code}`;
  const text = `Hello ${firstName || ''},\n\n${intro}\n\n${code}\n\nThe code works for 15 minutes. If you didn't ask for it, you can ignore this email.\n\nallinkigali`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <div style="font-size:20px;font-weight:700;margin-bottom:16px">allinkigali</div>
  <p>Hello ${firstName ? String(firstName).replace(/[<>&"]/g, '') : ''},</p>
  <p>${intro}</p>
  <div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#F5F2EA;border-left:5px solid #91D51F;border-radius:8px;padding:14px 18px;margin:20px 0">${code}</div>
  <p style="color:#5C5850;font-size:14px">The code works for 15 minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`;
  return { subject, html, text };
}

module.exports = { sendMail, mailerReady, codeEmail };
