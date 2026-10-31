import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How MenuMint handles data for restaurant owners and for the guests who view their menus.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="October 30, 2026"
      intro={
        <p>
          MenuMint helps restaurants publish digital menus. We collect what we need to run the service for restaurant owners, and as
          little as possible about the guests who read their menus. We don&apos;t sell personal data and we don&apos;t run advertising.
        </p>
      }
    >
      <section>
        <h2>Guests viewing a menu</h2>
        <p>
          If you opened a restaurant&apos;s menu by scanning a QR code or following a link, this is everything that happens on our
          side:
        </p>
        <ul>
          <li>
            <strong>No cookies.</strong> Public menu pages don&apos;t set cookies, local storage identifiers or any other tracking
            identifiers for diners.
          </li>
          <li>
            <strong>No IP addresses or user agents are stored.</strong> Your browser&apos;s user-agent string is read once, at the
            moment of the request, to work out a coarse device class (mobile, tablet or desktop) and to filter out bots. It is then
            discarded.
          </li>
          <li>
            <strong>What we do record</strong> so the restaurant can see how its menu is used: the type of event (a menu view, a QR
            code scan or a dish being opened), the restaurant, menu, dish or QR code it relates to, the coarse device class, the host
            name of the referring website (for example <code>instagram.com</code> — never the full address), and the time.
          </li>
          <li>
            <strong>Do Not Track and Global Privacy Control are honoured.</strong> If your browser sends either signal, no event is
            recorded at all.
          </li>
        </ul>
        <p>
          These events can&apos;t be used to identify you or to follow you between visits or between restaurants. Like any website,
          the infrastructure that delivers the page necessarily sees your IP address in order to send it to you; MenuMint does not
          keep it as part of its analytics.
        </p>
        <p>
          Menu content — dishes, prices, allergen and dietary information — is provided by the restaurant, which is responsible for
          its accuracy. Please always tell the restaurant&apos;s team about allergies before ordering.
        </p>
      </section>

      <section>
        <h2>Restaurant owners and team members</h2>
        <h3>What we collect</h3>
        <ul>
          <li>Account details: your name, email address and a securely hashed password (or sign-in managed by our authentication provider).</li>
          <li>
            Restaurant content you add: restaurant details, menus, dishes, photos, logos, branding choices and QR code settings.
          </li>
          <li>Team members you invite: their name, email address and role.</li>
          <li>
            Billing: payments are handled by Stripe. We never see or store your full card number; we keep your plan, subscription
            status and the Stripe customer and subscription identifiers needed to manage it.
          </li>
          <li>A session cookie that keeps you signed in. It is strictly necessary and isn&apos;t used for tracking.</li>
        </ul>
        <h3>How we use it</h3>
        <ul>
          <li>To provide the service: hosting your menus, generating QR codes and showing you analytics.</li>
          <li>To process subscriptions and send essential account and billing messages.</li>
          <li>To keep the service secure and prevent abuse.</li>
        </ul>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>
          We use a small number of providers to run MenuMint: a hosting provider to serve the website, Supabase for our database,
          authentication and file storage, and Stripe for payments. They process data on our behalf and only as needed to provide
          their service.
        </p>
      </section>

      <section>
        <h2>Retention and deletion</h2>
        <p>
          We keep your account and restaurant content for as long as your account is active. When you delete your account, or ask us
          to, we delete your content and the analytics events tied to your restaurants, except where we must keep limited records
          (such as invoices) to meet legal obligations.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete your personal data, and to object
          to or restrict how it&apos;s used. Account holders can update most information directly in the dashboard. For anything
          else, contact the MenuMint team and we&apos;ll respond within 30 days. Because we don&apos;t store identifiers for diners,
          we can&apos;t link analytics events to an individual guest.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we make material changes to this policy we&apos;ll update the date above and, for account holders, let you know before
          the changes take effect. See also our <Link href="/terms">terms of service</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
