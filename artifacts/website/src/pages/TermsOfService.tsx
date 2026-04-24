import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATED = "March 29, 2026";
const COMPANY = "BigBankBonus, Inc.";
const EMAIL = "legal@bigbankbonus.com";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to BigBankBonus
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-10">

          <section>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-8">
              <p className="text-amber-300 text-sm font-semibold">IMPORTANT DISCLAIMER</p>
              <p className="text-amber-200/80 text-sm mt-1">
                BigBankBonus is a financial tools platform, not a financial advisor. Bank bonuses are
                subject to the individual terms and conditions of each financial institution. Bonus
                eligibility, amounts, and requirements may change at any time without notice. We make no
                guarantees about whether you will qualify for or receive any bonus. All cash bonuses
                earned through bank account openings are generally considered taxable income by the IRS.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the BigBankBonus mobile application, website at bigbankbonus.com, or
              any associated services (collectively, the "Service"), you agree to be bound by these Terms
              of Service ("Terms") and our{" "}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</Link>.
              If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="mt-3">
              You must be at least 18 years old and a resident of the United States to use the Service.
              By using the Service, you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>BigBankBonus provides:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>A database of bank account bonus offers aggregated from public sources</li>
              <li>Tools to track your bank bonus applications and direct deposit requirements</li>
              <li>An AI-powered assistant to help plan your bonus strategy</li>
              <li>An automated direct deposit cycling service (the "Autopay DD Scheduler")</li>
              <li>Integration with Plaid to view linked bank account balances and transactions</li>
              <li>ROIC/APY calculations based on bonus amounts and deposit requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Accounts &amp; Registration</h2>
            <p>
              You may create an account using Google Sign In, Apple Sign In, or our demo mode. You are
              responsible for maintaining the confidentiality of your account credentials and all activity
              that occurs under your account. You agree to immediately notify us of any unauthorized use
              of your account at <a href={`mailto:${EMAIL}`} className="text-pink-400 hover:text-pink-300">{EMAIL}</a>.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in
              fraudulent activity, or are otherwise determined to be harmful to the Service or other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription Plans &amp; Fees</h2>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">4.1 Free Plan</h3>
            <p>
              The Free plan provides access to up to 5 bonus offers and basic tracking features at no cost.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4">4.2 Onboarding & Pro Access</h3>
            <p>
              Early access is available through a one-time $49 onboarding fee that unlocks 6 months of
              live bonus recommendations, AI strategy guidance, and Autopay DD Scheduler access.
              After onboarding, users may transition to a recurring Pro plan for continued long-term support.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4">4.3 Autopay Service Fee</h3>
            <p>
              The Autopay DD Scheduler charges a <strong className="text-white">3% service fee</strong> on
              each direct deposit amount processed. This fee covers the cost of ACH transfers, payment
              processing, and platform operations. The fee is charged to your credit card before the ACH
              push is initiated. You receive a full refund to your card after the deposit cycle completes,
              minus the 3% service fee.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4">4.4 Refunds &amp; Cancellation</h3>
            <p>
              Subscription fees are non-refundable except as required by law. You may cancel your
              subscription at any time; your access will continue through the end of your current billing
              period. Autopay service fees are non-refundable once an ACH transfer has been initiated.
            </p>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4">4.5 Free Trial</h3>
            <p>
              We may offer free trial periods at our discretion. At the end of a trial period, your
              subscription will automatically convert to a paid plan unless you cancel before the trial ends.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Autopay DD Scheduler</h2>
            <p>
              The Autopay DD Scheduler automates a direct deposit cycle to satisfy bank bonus requirements.
              By using this feature, you authorize BigBankBonus to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Charge your credit or debit card for the deposit amount plus the 3% service fee</li>
              <li>Initiate an ACH push transfer to your linked bank account</li>
              <li>Initiate an ACH pull transfer to retrieve the deposited funds after the required holding period</li>
              <li>Refund the original charge to your card, less the 3% service fee</li>
            </ul>
            <p className="mt-4 text-amber-300/90 text-sm bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
              <strong>Risk Disclosure:</strong> ACH transfers are subject to bank processing times and
              may be rejected or delayed. BigBankBonus is not responsible for bank account fees,
              penalties, or bonus disqualification resulting from the use of the Autopay service.
              Review your bank's terms before using this feature.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Use the Service for any unlawful purpose or in violation of any bank's terms of service</li>
              <li>Attempt to circumvent bank fraud detection systems through the use of the Service</li>
              <li>Create multiple accounts to abuse trial periods or bonus offers</li>
              <li>Reverse engineer, scrape, or copy any part of the Service</li>
              <li>Use the Service to facilitate money laundering or other financial crimes</li>
              <li>Impersonate any person or entity or provide false account information</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Bank Bonus Disclaimer</h2>
            <p>
              Bonus offers displayed in the Service are sourced from publicly available information,
              including Doctor of Credit (doctorofcredit.com) and bank websites. Offer terms, eligibility
              requirements, and bonus amounts are controlled entirely by the respective financial
              institutions and <strong className="text-white">may change or expire at any time without notice</strong>.
            </p>
            <p className="mt-3">
              BigBankBonus does not guarantee that any bonus offer will be honored by the issuing bank,
              that you will qualify for any offer, or that completing the stated requirements will result
              in bonus payment. We recommend verifying all offer terms directly with the bank before
              opening an account.
            </p>
            <p className="mt-3">
              Bank bonuses, sign-up bonuses, and cash rewards from bank account openings are generally
              considered <strong className="text-white">taxable income</strong> by the IRS. Consult a
              qualified tax advisor regarding your specific tax obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p>
              All content, software, trademarks, logos, and data in the Service are owned by
              {" "}{COMPANY} or its licensors and are protected by applicable intellectual property laws.
              You are granted a limited, non-exclusive, non-transferable license to use the Service for
              personal, non-commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers &amp; Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIGBANKBONUS SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE SERVICE,
              EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE
              SERVICE SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE AMOUNT YOU PAID TO US IN
              THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless {COMPANY}, its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses (including attorneys' fees)
              arising from your use of the Service, your violation of these Terms, or your violation
              of any third party's rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law &amp; Disputes</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, without regard to conflict
              of law principles. Any dispute arising from these Terms shall be resolved by binding
              arbitration in accordance with the rules of the American Arbitration Association,
              except that either party may seek injunctive relief in a court of competent jurisdiction.
            </p>
            <p className="mt-3">
              YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTION LAWSUITS OR CLASS-WIDE ARBITRATION
              AGAINST BIGBANKBONUS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide notice of material changes by
              email or in-app notification at least 30 days before they take effect. Continued use of
              the Service after changes become effective constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact</h2>
            <p>For legal questions or notices:</p>
            <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 text-sm">
              <p className="text-white font-semibold">{COMPANY}</p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="text-pink-400 hover:text-pink-300">{EMAIL}</a></p>
              <p>Website: <a href="https://bigbankbonus.com" className="text-pink-400 hover:text-pink-300">bigbankbonus.com</a></p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:legal@bigbankbonus.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
