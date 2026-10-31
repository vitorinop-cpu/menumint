import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you use MenuMint to build and share digital menus.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      updated="October 30, 2026"
      intro={
        <p>
          These terms apply when you create a MenuMint account and use it to build, publish and share digital menus. We&apos;ve tried
          to keep them short and readable. By creating an account you agree to them.
        </p>
      }
    >
      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must provide accurate information and be authorised to act for the restaurant you set up.</li>
          <li>Keep your login details safe. You&apos;re responsible for activity under your account and your team&apos;s accounts.</li>
          <li>Let us know promptly if you believe your account has been accessed without permission.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You own the menus, photos, logos and other content you add. You give MenuMint permission to store, process and display that
          content only as needed to run the service — for example, to show your published menu to guests who scan your QR code.
        </p>
        <p>
          <strong>You are responsible for your menu&apos;s accuracy</strong>, including prices, availability, and dietary and allergen
          information. MenuMint provides tools to display this information; it doesn&apos;t verify it. You must have the rights to
          any images you upload.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Please don&apos;t use MenuMint to:</p>
        <ul>
          <li>publish unlawful, misleading, hateful or infringing content;</li>
          <li>distribute malware, phishing links or spam, including through QR codes;</li>
          <li>attempt to break, overload or gain unauthorised access to the service or other accounts.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </section>

      <section>
        <h2>Plans and billing</h2>
        <ul>
          <li>The Free plan costs nothing and has no time limit. Free menus show a small “Menu by MenuMint” badge.</li>
          <li>
            Paid plans are billed monthly in advance through Stripe. Prices shown on our website are proposed and may change; we&apos;ll
            give existing subscribers notice before any price change applies to them.
          </li>
          <li>
            You can cancel at any time. Your paid features stay active until the end of the current billing period, after which your
            account moves to the Free plan. Except where required by law, payments for a period that has started aren&apos;t refunded.
          </li>
        </ul>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          We work hard to keep MenuMint fast and reliable, but the service is provided &ldquo;as is&rdquo; and we can&apos;t promise it
          will always be uninterrupted or error-free. We may improve, change or retire features over time; if a change materially
          reduces what a paid plan includes, we&apos;ll tell you in advance.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          To the extent permitted by law, MenuMint isn&apos;t liable for indirect or consequential losses, such as lost profits or lost
          data, and our total liability for any claim is limited to the amount you paid us in the 12 months before it arose. Nothing in
          these terms limits liability that can&apos;t be limited by law.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can stop using MenuMint and delete your account at any time. We may suspend or close accounts that seriously or
          repeatedly break these terms. When an account is closed, its published menus go offline and QR codes stop resolving.
        </p>
      </section>

      <section>
        <h2>Privacy and updates to these terms</h2>
        <p>
          Our <Link href="/privacy">privacy policy</Link> explains how we handle data for owners and for guests. If we update these
          terms in a meaningful way, we&apos;ll change the date above and notify account holders before the changes take effect.
        </p>
      </section>
    </LegalPage>
  );
}
