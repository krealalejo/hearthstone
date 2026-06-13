import crypto from "node:crypto";
import { getRequestURL } from "h3";
import { Resend } from "resend";
import { User } from "#server/models/User";
import { PasswordResetToken } from "#server/models/PasswordResetToken";

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event);

  if (!email || typeof email !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Email required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    await PasswordResetToken.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const config = useRuntimeConfig(event);
    const baseUrl = config.public.baseUrl || getRequestURL(event).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const resend = new Resend(config.resendApiKey);
    await resend.emails.send({
      from: "Hearthstone <hi@krealalejo.dev>",
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
          <div style="font-size:22px;font-weight:700;margin-bottom:8px">Hearthstone</div>
          <p style="font-size:15px;color:#444;margin-bottom:24px">Hi ${user.name},</p>
          <p style="font-size:15px;color:#444;margin-bottom:24px">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#2d6a4f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">Reset password</a>
          <p style="font-size:13px;color:#888;margin-top:32px">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
      `,
    });
  }

  return { ok: true };
});
