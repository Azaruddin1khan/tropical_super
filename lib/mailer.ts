import nodemailer from 'nodemailer';

interface SendOtpEmailParams {
  to: string;
  name?: string;
  otp: string;
}

export async function sendVerificationEmail({ to, name = 'Admin Staff', otp }: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || `"Tropical Gyros HQ" <${user}>`;

  if (!user || !pass) {
    console.warn(`[Mailer] Notice: SMTP credentials not set. OTP for ${to} is: ${otp}`);
    return { success: false, error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env' };
  }

  try {
    const cleanPass = pass.replace(/\s+/g, '');
    const transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass: cleanPass },
          tls: { rejectUnauthorized: false },
        })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass: cleanPass },
        });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
            .content { padding: 32px 28px; }
            .otp-box { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #b45309; }
            .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Tropical Gyros</h1>
              <p>Palmdale, Nassau &bull; Bahamas</p>
            </div>
            <div class="content">
              <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Password Reset Verification Code</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Hello <strong>${name}</strong>,<br>
                We received a request to reset your password for your <strong>Tropical Gyros Admin</strong> account. Use the 6-digit code below to complete the verification:
              </p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div style="font-size: 12px; color: #92400e; margin-top: 6px; font-weight: 600;">Valid for 15 minutes</div>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                If you did not request this password reset, please ignore this email or notify the system administrator immediately.
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Tropical Gyros HQ. All rights reserved.<br>
              Rosetta &amp; Mackey St, Nassau, The Bahamas
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: `Your Verification Code: ${otp} — Tropical Gyros Admin`,
      html: htmlContent,
      text: `Your Tropical Gyros verification code is: ${otp}. It will expire in 15 minutes.`,
    });

    console.log(`[Mailer] ✅ Verification email successfully sent to: ${to}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Mailer] ❌ Failed to send email to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || 'Failed to send email' };
  }
}
