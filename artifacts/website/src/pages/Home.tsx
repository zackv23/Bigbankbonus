import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const painPoints = [
  {
    title: "Too many offers, no structure",
    description:
      "Most churners juggle screenshots, spreadsheets, legal terms, cutoff dates, and ACH rules with no reliable system.",
    icon: Layers3,
  },
  {
    title: "The last step is where people drop",
    description:
      "Opening an account is easy. Triggering the qualifying deposit, timing transfers, and proving completion is where offers get lost.",
    icon: TimerReset,
  },
  {
    title: "Capital sits idle",
    description:
      "Without a coordinated plan, the same deposit dollars cannot be reused intelligently across stacked checking, savings, and card bonuses.",
    icon: CircleDollarSign,
  },
];

const workflow = [
  {
    step: "01",
    title: "Pick the right offers",
    description:
      "We narrow the field to automatable bank bonuses that match your cash on hand, payroll setup, timing, and tolerance for complexity.",
  },
  {
    step: "02",
    title: "Link funding and build the stack",
    description:
      "Plaid-powered account linking and transfer planning create a clean operating map before money moves anywhere.",
  },
  {
    step: "03",
    title: "Trigger and monitor requirements",
    description:
      "We coordinate direct deposit substitutes, ACH transfers, minimum balances, and completion windows so every action has a reason.",
  },
  {
    step: "04",
    title: "Track payout and exit cleanly",
    description:
      "The system monitors bonus posts, notes clawback windows, and tells you when to hold, downgrade, or close an account.",
  },
];

const pillars = [
  {
    title: "Automation-first execution",
    description:
      "Built around repetitive banking tasks: routing cash, tracking requirements, validating timelines, and reducing manual follow-up.",
  },
  {
    title: "Deposit leverage planning",
    description:
      "A single pool of capital can be sequenced across multiple offers instead of getting stranded in disconnected accounts.",
  },
  {
    title: "High-intent client focus",
    description:
      "The first audience is experienced churners and high-income operators who already understand the value of organized execution.",
  },
  {
    title: "A real operating system, not content alone",
    description:
      "BigBankBonus is positioned as structured workflow software with expert guidance, not just another list of offers and blog posts.",
  },
];

const roadmap = [
  {
    title: "Premium member layer",
    description:
      "Monthly memberships, guided playbooks, and AI-assisted strategy for checking, savings, and credit card stacks.",
  },
  {
    title: "Financial wellness distribution",
    description:
      "Employer-facing programs for major workforces that turn bonus optimization into a structured employee benefit.",
  },
  {
    title: "Bank and insurance partnerships",
    description:
      "Longer term, the business can expand into exclusive bonus partnerships, protection products, and other adjacent financial services.",
  },
];

const faqs = [
  {
    question: "What is the core product?",
    answer:
      "An automation layer for bank bonus execution: offer selection, funding plans, requirement tracking, payout monitoring, and clean account lifecycle management.",
  },
  {
    question: "Who is the first ideal customer?",
    answer:
      "Experienced bank bonus users with strong credit, stable income, and available deposits who want a faster, more organized system than spreadsheets.",
  },
  {
    question: "What makes this different from bonus blogs?",
    answer:
      "Most sites publish offers. BigBankBonus is designed to help users actually complete them with operational structure, transfer planning, and ongoing monitoring.",
  },
  {
    question: "Does the site promise results?",
    answer:
      "No. Bank approvals, qualifying activity, and bonus payouts always depend on each institution's rules. The product's value is better execution and less leakage.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-900">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,#f8fbfa_0%,#eef5f2_100%)] pt-28 pb-20 sm:pt-32 lg:pt-40 lg:pb-28">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Built for automated bank bonus execution
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Automated bank bonuses, without the spreadsheet chaos.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                BigBankBonus helps serious churners organize offers, route deposits,
                monitor requirements, and turn scattered bonus chasing into a repeatable operating system.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/hub"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Preview the platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#workflow"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-10 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-semibold text-slate-950">$200 to $1,000+</div>
                  <p className="mt-1">Target bonus range the system is built to coordinate.</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-semibold text-slate-950">1 deposit pool</div>
                  <p className="mt-1">Planned across multiple offers instead of sitting idle.</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-semibold text-slate-950">4 core layers</div>
                  <p className="mt-1">Selection, funding, monitoring, and payout management.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 translate-y-4 rounded-[2rem] bg-emerald-200/40 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_32px_80px_-40px_rgba(15,23,42,0.7)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
                      Operations snapshot
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">Bonus Stack Engine</h3>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Live workflow
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ["Chase checking", "Funded and waiting for qualifying ACH"],
                    ["Discover savings", "Minimum balance tracked until payout window closes"],
                    ["Wells Fargo checking", "Queued after capital is released from current stack"],
                  ].map(([bank, status]) => (
                    <div
                      key={bank}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{bank}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{status}</p>
                        </div>
                        <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-300" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">What the product automates</p>
                    <p className="mt-2 text-lg font-medium">
                      Offer timing, ACH routing, requirement reminders, and closure windows.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/10 p-4">
                    <p className="text-sm text-emerald-200">Positioning</p>
                    <p className="mt-2 text-lg font-medium text-white">
                      Less leakage. More completed bonuses. Better use of idle cash.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="problem" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="The Problem"
              title="Most people do not fail on the signup page. They fail in the operational gap afterward."
              description="The market already understands that bank bonuses can be profitable. What it lacks is software that handles the messy middle between approval and payout."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {painPoints.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-slate-200 bg-slate-950 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Workflow"
              title="A streamlined system for stacked offers"
              description="The homepage now centers on the practical flow users care about most: choosing offers, moving money, qualifying properly, and knowing when the bonus is truly complete."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-4">
              {workflow.map(({ step, title, description }) => (
                <div
                  key={step}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
                >
                  <div className="text-sm font-semibold tracking-[0.28em] text-emerald-300">
                    {step}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solution" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Why BigBankBonus"
              title="Position the company around execution, not hype"
              description="Your original notes contain a strong core insight: this niche is profitable, under-structured, and full of repetitive work. The site should present that insight as disciplined product strategy."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {pillars.map(({ title, description }) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7"
                >
                  <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h3 className="text-2xl font-semibold text-slate-950">
                    Near-term message for the market
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">
                    Automate the most tedious part of bank bonus chasing: deciding where to move cash,
                    when to move it, how to qualify, and when you are actually safe to exit.
                  </p>
                </div>
                <Link
                  href="/hub"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white"
                >
                  Open command hub
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="audience" className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Workflow className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold">Start with the high-intent niche.</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                The first win is not serving everyone. It is serving the segment that already knows
                bank bonuses are valuable and feels the friction of running them manually.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7">
                <div className="flex items-center gap-3 text-slate-950">
                  <CircleDollarSign className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-lg font-semibold">Ideal early customer</h3>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  High-credit, high-income users who have churned for years and are tired of managing
                  it with spreadsheets and memory.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7">
                <div className="flex items-center gap-3 text-slate-950">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-lg font-semibold">Value proposition</h3>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Better compliance with offer terms, better visibility into timelines, and more
                  confidence when reusing deposits across multiple plays.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7">
                <div className="flex items-center gap-3 text-slate-950">
                  <Layers3 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-lg font-semibold">Core offer</h3>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Structured bank bonus stacks across checking, savings, and cards, with funding
                  logic and reminders managed in one place.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7">
                <div className="flex items-center gap-3 text-slate-950">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-lg font-semibold">Business model path</h3>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Software access, premium guidance, and future adjacent products once the workflow
                  layer earns trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="roadmap" className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Future Plans"
              title="Keep the roadmap visible, but separate from the core pitch"
              description="The biggest change in this rewrite is structural. The homepage leads with automated bank bonuses. Longer-horizon expansion lives here as a distinct second chapter."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {roadmap.map(({ title, description }) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    {title.includes("Employer") ? (
                      <Building2 className="h-6 w-6" />
                    ) : (
                      <Sparkles className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Answer the obvious questions directly"
              description="This keeps the site credible and grounded, especially for a category that can sound sensational if it is not explained carefully."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {faqs.map(({ question, answer }) => (
                <div
                  key={question}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-7"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{question}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              BigBankBonus
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Build the category around structured execution.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              The strongest version of this business is not just “find bonuses.” It is “run the entire
              bonus workflow better than anyone else.”
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/hub"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950"
              >
                Explore the product
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:support@bigbankbonus.com"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white"
              >
                Talk to us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
