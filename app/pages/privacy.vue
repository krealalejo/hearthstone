<template>
  <main class="legal">
    <article class="legal-sheet">
      <header class="legal-head">
        <span class="brand-mark"><img src="/favicon.png" alt="Hearth" /></span>
        <div>
          <h1>Privacy Policy</h1>
          <p class="legal-meta">Hearth · Last updated June 13, 2026</p>
        </div>
      </header>

      <section>
        <p>
          Hearth ("the app", "we", "us") is a shared household dashboard for
          managing inventory, shopping lists, tasks, and history. This policy
          explains what data we collect, why, and the choices you have. By using
          Hearth you agree to this policy.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — your name, email address, and a
            hashed password when you register. If you sign in with Google, we
            receive your name, email, and profile picture from Google.
          </li>
          <li>
            <strong>Household content</strong> — the households, members,
            inventory items, shopping lists, tasks, and activity history you and
            your household create inside the app.
          </li>
          <li>
            <strong>Profile preferences</strong> — display name, avatar, and
            interface settings such as language and theme.
          </li>
          <li>
            <strong>Technical data</strong> — standard request information (IP
            address, device and browser type) processed transiently by our
            hosting provider to deliver and secure the service.
          </li>
        </ul>
        <p>We do not collect location data, contacts, or advertising identifiers.</p>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>Provide and maintain your account and household features.</li>
          <li>Authenticate you and keep your session secure.</li>
          <li>Send transactional emails such as password resets.</li>
          <li>Operate, secure, and improve the service.</li>
        </ul>
        <p>We do not sell your data and we do not use it for advertising.</p>
      </section>

      <section>
        <h2>Cookies and sessions</h2>
        <p>
          We use strictly necessary, HTTP-only cookies (<code>access_token</code>
          and <code>refresh_token</code>) solely to keep you signed in. They are
          not used for tracking or analytics. Clearing them or logging out ends
          your session.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>We share data only with processors required to run the app:</p>
        <ul>
          <li><strong>MongoDB Atlas</strong> — encrypted database storage.</li>
          <li><strong>Vercel</strong> — application hosting and delivery.</li>
          <li><strong>Resend</strong> — transactional email delivery.</li>
          <li><strong>Google</strong> — optional sign-in (only if you use it).</li>
        </ul>
        <p>
          These providers process data on our behalf under their own security and
          privacy commitments.
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We keep your data while your account is active. When you delete your
          account, your personal data and household content are removed from our
          active systems, except where we must retain limited records to comply
          with legal obligations.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can access, correct, export, or delete your data. To exercise any
          of these rights, or to delete your account, email us at the address
          below and we will respond within a reasonable time.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Data is encrypted in transit over HTTPS, passwords are hashed, and
          access is restricted to authenticated requests. No system is perfectly
          secure, but we take reasonable measures to protect your information.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Hearth is not directed to children under 13, and we do not knowingly
          collect data from them.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be
          reflected by the "Last updated" date above.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or data requests:
          <a href="mailto:hi@krealalejo.dev">hi@krealalejo.dev</a>.
        </p>
      </section>

      <footer class="legal-foot">
        <NuxtLink to="/login">← Back to Hearth</NuxtLink>
      </footer>
    </article>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useSeoMeta({
  title: "Privacy Policy — Hearth",
  description: "How Hearth collects, uses, and protects your data.",
  robots: "index, follow",
});
</script>

<style scoped>
.legal {
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  padding: 48px 20px 80px;
  display: flex;
  justify-content: center;
}

.legal-sheet {
  width: 100%;
  max-width: 720px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-md);
  padding: clamp(24px, 5vw, 48px);
}

.legal-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--hairline-2);
}

.brand-mark img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  line-height: 1.1;
  margin: 0;
}

.legal-meta {
  margin: 4px 0 0;
  color: var(--ink-3);
  font-size: 0.875rem;
}

section {
  margin-top: 28px;
}

h2 {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin: 0 0 8px;
}

p {
  margin: 0 0 10px;
  line-height: 1.6;
  color: var(--ink-2);
}

ul {
  margin: 0 0 10px;
  padding-left: 20px;
}

li {
  line-height: 1.6;
  color: var(--ink-2);
  margin-bottom: 6px;
}

strong {
  color: var(--ink);
}

code {
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--surface-2);
  border: 1px solid var(--hairline-2);
  border-radius: var(--r-sm);
  padding: 1px 5px;
}

a {
  color: var(--accent-ink);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.legal-foot {
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--hairline-2);
}
</style>
