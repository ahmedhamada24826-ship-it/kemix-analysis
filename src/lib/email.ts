type SendEmailInput = { to: string; subject: string; html: string; text: string };

/** Sends through Resend when configured. Returns false when delivery is unavailable. */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Transactional email delivery failed with status:", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Transactional email request failed:", error);
    return false;
  }
}
