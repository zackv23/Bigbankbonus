import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATED = "March 29, 2026";
const COMPANY = "BigBankBonus, Inc.";
const EMAIL = "privacy@bigbankbonus.com";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to BigBankBonus
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-10">

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              {COMPANY} ("BigBankBonus," "we," "us," or "our") operates the BigBankBonus mobile application
              and website at bigbankbonus.com (collectively, the "Service"). This Privacy Policy explains
              how we collect, use, disclose, and protect information about you when you use the Service.
            </p>
            <p className="mt-3">
              By using the Service, you agree to the collection and use of information as described in this
              Policy. If you do not agree, please discontinue use of the Service immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">2.1 Account Information</h3>
            <p>
              When you create an account via Google Sign In, Apple Sign In, or our demo mode, we collect
              your name, email address, and a unique user identifier from your identity provider. We do not
              store your Google or Apple passwords.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-5">2.2 Bank Account Information (via Plaid)</h3>
            <p>
              If you choose to link your bank accounts, we use <strong className="text-white">Plaid Technologies, Inc.</strong> to
              facilitate read-only access to your bank account data. We do not collect or store your bank
              username or password. Plaid accesses account balances, transaction history, and direct deposit
              records on your behalf. Plaid's privacy policy is available at{" "}
              <a href="https://plaid.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                plaid.com/legal/privacy-policy
              </a>.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-5">2.3 Payment Information (via Stripe)</h3>
            <p>
              Subscription payments and ACH transfers are processed by <strong className="text-white">Stripe, Inc.</strong> We do
              not store your credit card number, bank routing number, or account number on our servers.
              This data is tokenized and handled by Stripe in accordance with PCI-DSS standards. Stripe's
              privacy policy is available at{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                stripe.com/privacy
              </a>.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-5">2.4 Usage Data</h3>
            <p>
              We automatically collect information about how you interact with the Service, including pages
              visited, features used, clicks, and crash reports. This data is used to improve the Service
              and is not sold to third parties.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-5">2.5 AI Interaction Data</h3>
            <p>
              When you use our AI Bonus Agent, your messages are sent to <strong className="text-white">OpenAI, L.L.C.</strong> for
              processing. We do not permanently store the content of your AI conversations beyond your active
              session. OpenAI's privacy policy is available at{" "}
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                openai.com/policies/privacy-policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process subscriptions and ACH direct deposit cycles</li>
              <li>Send transactional emails (e.g., payment receipts, deposit schedule notifications)</li>
              <li>Respond to your support requests</li>
              <li>Detect and prevent fraud or unauthorized access</li>
              <li>Comply with legal obligations</li>
              <li>Analyze aggregated usage data to improve our bank bonus recommendation engine</li>
            </ul>
            <p className="mt-4">
              We do <strong className="text-white">not</strong> sell your personal data to third parties or use it for
              targeted advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing &amp; Third Parties</h2>
            <p>We share your information only with:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong className="text-white">Plaid</strong> — bank account linking and verification</li>
              <li><strong className="text-white">Stripe</strong> — payment processing and ACH transfers</li>
              <li><strong className="text-white">OpenAI</strong> — AI agent query processing</li>
              <li><strong className="text-white">Google / Apple</strong> — identity verification (sign-in only)</li>
              <li><strong className="text-white">Cloud infrastructure providers</strong> (hosting, databases) under strict confidentiality agreements</li>
              <li><strong className="text-white">Law enforcement or regulatory authorities</strong> when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. If you close your
              account, we will delete or anonymize your personal data within 90 days, unless we are
              required to retain it for legal or regulatory purposes. Aggregated, non-identifiable data
              may be retained indefinitely for analytics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Security</h2>
            <p>
              We implement industry-standard security measures including TLS encryption in transit, AES-256
              encryption at rest, and role-based access controls. Sensitive credentials (PINs, API tokens)
              are stored using secure platform keystores (iOS Keychain / Android Keystore) and are never
              transmitted to our servers in plaintext.
            </p>
            <p className="mt-3">
              No system is 100% secure. In the event of a data breach affecting your personal information,
              we will notify you within 72 hours of discovery, as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong className="text-white">Access</strong> — Request a copy of your personal data</li>
              <li><strong className="text-white">Correction</strong> — Request correction of inaccurate data</li>
              <li><strong className="text-white">Deletion</strong> — Request deletion of your account and personal data</li>
              <li><strong className="text-white">Portability</strong> — Request your data in a machine-readable format</li>
              <li><strong className="text-white">Opt-out of sale</strong> — We do not sell data; this right is always honored</li>
              <li><strong className="text-white">Do Not Track</strong> — We respect DNT signals from your browser</li>
            </ul>
            <p className="mt-4">
              California residents have additional rights under CCPA. EU/EEA residents have rights under
              GDPR. To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-pink-400 hover:text-pink-300">{EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
            <p>
              The Service is not directed to children under 18. We do not knowingly collect personal
              information from minors. If you believe a child has provided us personal information,
              please contact us immediately at <a href={`mailto:${EMAIL}`} className="text-pink-400 hover:text-pink-300">{EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies &amp; Tracking</h2>
            <p>
              The website uses minimal cookies for session management and analytics. We do not use
              third-party advertising cookies. You can disable cookies in your browser settings; however,
              some features of the Service may not function correctly without them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email or via an in-app notification at least 30 days before they take effect. Continued
              use of the Service after the effective date constitutes acceptance of the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 text-sm">
              <p className="text-white font-semibold">{COMPANY}</p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="text-pink-400 hover:text-pink-300">{EMAIL}</a></p>
              <p>Website: <a href="https://bigbankbonus.com" className="text-pink-400 hover:text-pink-300">bigbankbonus.com</a></p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <a href="mailto:privacy@bigbankbonus.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
