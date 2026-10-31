import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How MenuMint handles account data, restaurant content, and privacy-conscious menu analytics.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="October 31, 2026"
      contents={[
        { href: "#scope", label: "Scope and roles" },
        { href: "#guests", label: "Guest menu analytics" },
        { href: "#accounts", label: "Account and restaurant data" },
        { href: "#use", label: "How we use data" },
        { href: "#sharing", label: "Sharing and providers" },
        { href: "#retention", label: "Retention and deletion" },
        { href: "#rights", label: "Your rights" },
        { href: "#changes", label: "Changes" },
      ]}
      intro={<p>MenuMint is a digital-menu service for restaurants. We process only the information needed to run the service for restaurant owners and their teams, and to provide privacy-conscious menu analytics. We do not sell personal data or use it for behavioural advertising.</p>}
    >
      <section id="scope">
        <h2>Scope and roles</h2>
        <p>This policy covers menumint.vertexstudio.studio, the MenuMint dashboard, and menus published through MenuMint. A restaurant decides what business details and menu content it publishes. The restaurant remains responsible for its menu content and for any information it independently collects from guests. MenuMint processes information to provide the platform.</p>
      </section>

      <section id="guests">
        <h2>Guests viewing a menu</h2>
        <p>When you open a public menu from a QR code or link, MenuMint records limited, non-identifying service analytics so the restaurant can understand menu use:</p>
        <ul>
          <li>the event type, such as a menu view, QR scan or dish view;</li>
          <li>the restaurant, menu, dish or QR code related to the event;</li>
          <li>a coarse device category (mobile, tablet or desktop);</li>
          <li>the referring website host, such as <code>instagram.com</code>, rather than a full referring URL; and</li>
          <li>the time of the event.</li>
        </ul>
        <p>Public menus do not set MenuMint advertising or analytics cookies, local-storage identifiers, or cross-site identifiers. We do not store IP addresses or full user-agent strings in MenuMint analytics. The user-agent is read only to determine a coarse device category and filter bots, then discarded. The delivery and security providers that serve any website necessarily receive connection information, including an IP address, to provide and protect the service.</p>
        <p>We honour Do Not Track and Global Privacy Control. If your browser sends either signal, the analytics endpoint records no event. These analytics cannot be used by MenuMint to identify you or track you across restaurants.</p>
        <p>Menu descriptions, prices, dietary information and allergen information are supplied by the restaurant. Always confirm allergy information directly with the restaurant before ordering.</p>
      </section>

      <section id="accounts">
        <h2>Restaurant owners and team members</h2>
        <h3>Information we process</h3>
        <ul>
          <li>Account information: name, email address, account identifier, session and account-security information.</li>
          <li>Restaurant content: business details, menus, dishes, pricing, images, logos, branding and QR-code settings.</li>
          <li>Team information: the names, email addresses and roles of people you invite.</li>
          <li>Billing information: plan, subscription status, and Stripe customer and subscription identifiers. We do not store full payment-card numbers.</li>
          <li>Strictly necessary authentication and security cookies used to protect dashboard sessions; they are not advertising cookies.</li>
        </ul>
        <p>Clerk manages authentication, so MenuMint does not receive or store your password. hCaptcha may be shown during account-security checks. hCaptcha processes challenge-related information to help detect abuse under its own privacy terms.</p>
      </section>

      <section id="use">
        <h2>How we use information</h2>
        <ul>
          <li>to create and secure accounts, host menus, generate QR codes and provide the dashboard;</li>
          <li>to show restaurant owners aggregated analytics for their published menus;</li>
          <li>to process subscriptions and send essential account or billing communications;</li>
          <li>to prevent fraud, abuse, unauthorised access and service disruption; and</li>
          <li>to comply with legal obligations and enforce our <Link href="/terms">terms of service</Link>.</li>
        </ul>
      </section>

      <section id="sharing">
        <h2>Sharing and service providers</h2>
        <p>We use providers to operate MenuMint: Render and Cloudflare for hosting, delivery and security; Supabase for the database and file storage; Clerk for authentication; Stripe for payments; and hCaptcha for bot protection when a challenge is shown. They process information as needed to supply their services. We may also disclose information when required by law, to protect MenuMint and its users, or during a financing, acquisition or similar corporate transaction with appropriate safeguards.</p>
      </section>

      <section id="retention">
        <h2>Retention and deletion</h2>
        <p>We retain account and restaurant content while an account is active. When an account is deleted or closed, we delete associated restaurant content and analytics records, except for limited information we must retain for legal, accounting, fraud-prevention or dispute-resolution purposes, such as invoices and payment records.</p>
        <p>You can update restaurant details in the dashboard. To request account deletion or a copy of information associated with an account, use the support channel available in the dashboard. Closing a restaurant account takes its published menus offline and stops its QR codes from resolving.</p>
      </section>

      <section id="security">
        <h2>Security</h2>
        <p>We use reasonable technical and organisational safeguards designed to protect the service, including authenticated sessions, access controls, encrypted connections and rate limits. No online service can guarantee absolute security. Keep your credentials confidential and report suspected unauthorised access through the dashboard.</p>
      </section>

      <section id="rights">
        <h2>Your rights</h2>
        <p>Depending on where you live, you may have rights to access, correct, export or delete personal information, or to object to or restrict certain processing. Account holders can update much of their information in the dashboard. For other requests, use the dashboard support channel; we aim to respond within 30 days. Because we do not retain individual identifiers in restaurant analytics, we cannot connect an analytics event to a particular menu guest.</p>
      </section>

      <section id="changes">
        <h2>Changes to this policy</h2>
        <p>We may update this policy as the service or applicable law changes. We will post the updated version here and change the date above. For material changes affecting account holders, we will provide notice before the change takes effect where reasonably possible. See also our <Link href="/terms">terms of service</Link>.</p>
      </section>
    </LegalPage>
  );
}
