import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms for using MenuMint to create, publish and share digital restaurant menus.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      updated="October 31, 2026"
      contents={[
        { href: "#service", label: "The service" },
        { href: "#accounts", label: "Accounts and teams" },
        { href: "#content", label: "Your content" },
        { href: "#acceptable-use", label: "Acceptable use" },
        { href: "#billing", label: "Plans and billing" },
        { href: "#availability", label: "Availability" },
        { href: "#liability", label: "Liability" },
        { href: "#ending", label: "Ending service" },
      ]}
      intro={<p>These terms apply when you create a MenuMint account or use the dashboard to build, publish and share digital menus. By creating an account, inviting a team member or using the service, you agree to these terms and our <Link href="/privacy">privacy policy</Link>.</p>}
    >
      <section id="service">
        <h2>The service</h2>
        <p>MenuMint provides tools for restaurants to create and publish digital menus, brand them, generate QR codes and review menu analytics. The service is intended for business use by restaurants, cafés, bars and their authorised teams. You must be old enough to form a binding agreement where you live and have authority to accept these terms for the restaurant or organisation you represent.</p>
      </section>

      <section id="accounts">
        <h2>Accounts and teams</h2>
        <ul>
          <li>Provide accurate, current account information and keep it updated.</li>
          <li>Keep login credentials secure. You are responsible for activity under your account and for access you grant to team members.</li>
          <li>Assign only appropriate roles to team members and remove access when it is no longer needed.</li>
          <li>Notify us promptly through the dashboard if you believe an account has been accessed without authorisation.</li>
        </ul>
      </section>

      <section id="content">
        <h2>Your content and restaurant responsibilities</h2>
        <p>You retain ownership of menus, logos, images and other content you submit. You grant MenuMint a non-exclusive, worldwide, royalty-free licence to host, reproduce, process and display that content only as needed to operate, improve and secure the service, including displaying a published menu to a guest who opens its QR code.</p>
        <p><strong>You are responsible for menu accuracy</strong>, including prices, availability, ingredients, dietary and allergen information, legally required notices and business contact information. MenuMint provides presentation tools; it does not verify menu content or give food-safety, legal, regulatory or nutritional advice. You must have all rights and permissions necessary for content you upload.</p>
      </section>

      <section id="acceptable-use">
        <h2>Acceptable use</h2>
        <p>You may not use MenuMint to:</p>
        <ul>
          <li>publish unlawful, deceptive, harmful, discriminatory, infringing or otherwise objectionable content;</li>
          <li>use QR codes, links or menu content to distribute malware, phishing, spam or fraudulent material;</li>
          <li>interfere with, probe, overload, scrape or gain unauthorised access to the service, accounts or data;</li>
          <li>circumvent plan limits, security controls, payment obligations or usage limits; or</li>
          <li>use the service in a way that violates applicable law or another person&apos;s rights.</li>
        </ul>
        <p>We may remove content, limit access, suspend or terminate accounts that violate these terms or create a security, legal or reputational risk.</p>
      </section>

      <section id="billing">
        <h2>Plans, billing and cancellation</h2>
        <ul>
          <li>The Free plan has no recurring charge and may include product limits or a MenuMint badge on public menus.</li>
          <li>Paid subscriptions are billed in advance on a recurring monthly basis through Stripe. Applicable prices and plan features are shown when you subscribe.</li>
          <li>You authorise Stripe to charge the applicable subscription fees and taxes. Keep billing details current.</li>
          <li>You may cancel a paid plan at any time. Paid features remain available until the end of the current paid period, after which the account moves to the available free plan or its content may be subject to the free-plan limits.</li>
          <li>Except where required by law, fees for a billing period already started are non-refundable. We will provide reasonable notice before a price change applies to an existing paid subscription.</li>
        </ul>
      </section>

      <section id="availability">
        <h2>Availability and changes</h2>
        <p>We aim to keep MenuMint reliable and secure, but it is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee uninterrupted, error-free or perfectly secure operation. We may modify, add or retire features to maintain, improve or comply with law. If a change materially reduces a paid plan&apos;s core functionality, we will provide advance notice where reasonably practicable.</p>
      </section>

      <section id="liability">
        <h2>Disclaimers and liability</h2>
        <p>To the maximum extent permitted by law, MenuMint disclaims implied warranties, including merchantability, fitness for a particular purpose and non-infringement. MenuMint is not liable for indirect, incidental, special, consequential or punitive losses, including lost profits, revenue, goodwill or data. Our total liability for a claim arising from the service is limited to the amount you paid to MenuMint for the service in the 12 months before the event giving rise to the claim. Nothing in these terms excludes liability that cannot be excluded under applicable law.</p>
      </section>

      <section id="ending">
        <h2>Ending service</h2>
        <p>You may stop using MenuMint and delete your account at any time. We may suspend or terminate access for a material or repeated breach of these terms, non-payment, security risk, legal requirement, or prolonged inactivity on a free account. On termination, published menus may go offline and QR codes may stop resolving. Provisions that by their nature should survive termination, including payment obligations, disclaimers, liability limits and content rights needed to resolve a dispute, will survive.</p>
      </section>

      <section id="terms-changes">
        <h2>Changes and interpretation</h2>
        <p>We may revise these terms as the service or law changes. The updated terms will appear on this page with a new effective date. For material changes affecting existing account holders, we will provide advance notice where reasonably possible. If any provision is unenforceable, the remaining provisions remain in effect. These terms do not create rights for third parties. Questions about an account or these terms can be submitted using the support channel in the MenuMint dashboard.</p>
      </section>
    </LegalPage>
  );
}
