import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Browse Live Deals",
    desc: "Access our real-time feed of the best bank bonuses. Filter instantly by soft pull, no Direct Deposit required, and highest bonus amount.",
    color: "from-brand-purple to-brand-pink"
  },
  {
    num: "02",
    title: "Apply & Schedule",
    desc: "Open the account, add your routing details into our Autopay modal, and we automatically handle the entire direct deposit cycle for you.",
    color: "from-brand-pink to-brand-orange"
  },
  {
    num: "03",
    title: "Collect Your Bonus",
    desc: "Sit back and wait. The bank credits your bonus (averaging $350) within 30–90 days. Withdraw it, close the account, and repeat.",
    color: "from-brand-orange to-brand-purple"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-950 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-brand-purple/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Three simple steps to generating thousands in side income per year.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange opacity-30"></div>

          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="relative text-center"
            >
              <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${step.color} p-[1px] mb-8 shadow-2xl shadow-brand-pink/20`}>
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center glass-dark">
                  <span className="text-3xl font-display font-bold text-white">{step.num}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
