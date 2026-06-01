import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

const DEFAULT_ALLOWED_DOMAIN = "oppr.ai";

// Magic-link sign-in. Only addresses on ALLOWED_EMAIL_DOMAIN may sign in.
// Without AUTH_RESEND_KEY (local dev), the link is logged to the Convex logs
// instead of emailed, so sign-in is testable without an email provider.
const MagicLink = Resend({
  id: "magic-link",
  apiKey: process.env.AUTH_RESEND_KEY ?? "dev-no-key",
  async sendVerificationRequest({ identifier: email, url }) {
    const allowedDomain =
      process.env.ALLOWED_EMAIL_DOMAIN ?? DEFAULT_ALLOWED_DOMAIN;
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain !== allowedDomain) {
      throw new Error(
        `Only @${allowedDomain} email addresses are allowed to sign in.`,
      );
    }

    const key = process.env.AUTH_RESEND_KEY;
    if (!key) {
      console.log(
        `\n========== MAGIC LINK (dev — no AUTH_RESEND_KEY set) ==========\n` +
          `to:   ${email}\nlink: ${url}\n` +
          `===============================================================\n`,
      );
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.AUTH_EMAIL_FROM ??
          "Oppr Insights <onboarding@resend.dev>",
        to: [email],
        subject: "Sign in to Oppr Insights",
        html:
          `<p>Click <a href="${url}">this link</a> to sign in to Oppr Insights.</p>` +
          `<p>If you didn't request this, you can ignore this email.</p>`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [MagicLink],
  callbacks: {
    // On first sign-in, attach the user to the (single, seeded) company and
    // give them an OWNER role so the full UI is accessible in the sandbox.
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!user) return;

      const patch: Record<string, unknown> = { lastLogin: Date.now() };

      if (!user.companyId) {
        const company = await ctx.db.query("companies").first();
        if (company) {
          patch.companyId = company._id;
          patch.role = "OWNER";
          if (!user.displayName) {
            patch.displayName = user.email ?? "User";
          }
        }
      }

      await ctx.db.patch(userId, patch);
    },
  },
});
