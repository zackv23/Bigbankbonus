import { motion } from "framer-motion";
import { ListFilter, Sparkles, Zap, Link as LinkIcon, Calculator, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: <ListFilter size={24} className="text-brand-pink" />,
    title: "Live Bonus Feed",
    description: "Real-time DoC.com deals, ranked and filtered. Instantly find soft pull, no-DD, and nationwide offers that match your criteria."
  },
  {
    icon: <Sparkles size={24} className="text-brand-purple" />,
    title: "AI Bonus Agent",
    description: "Chat with our GPT-4o powered assistant to formulate the perfect bonus strategy tailored to your exact deposit profile."
  },
  {
    icon: <Zap size={24} className="text-brand-orange" />,
    title: "Autopay DD Scheduler",
    description: "Auto-cycle deposits. We charge your CC, ACH push to the bank, pull it back, and refund you. You keep 100% of the bonus."
  },
  {
    icon: <LinkIcon size={24} className="text-brand-pink" />,
    title: "Plaid Bank Linking",
    description: "Connect any US bank securely in seconds. Monitor balances, track transactions, and verify Direct Deposit history in one place."
  },
  {
    icon: <Calculator size={24} className="text-brand-purple" />,
    title: "ROIC Calculator",
    description: "See the true APY % on every bonus. Project your returns with 1× and 3× monthly cycle analysis over a 15-day window."
  },
  {
    icon: <ShieldCheck size={24} className="text-brand-orange" />,
    title: "No-EWS Filter",
    description: "Find banks that don't report to the Early Warning System (EWS). Open unlimited accounts without hitting velocity limits."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-pink font-bold tracking-wider uppercase text-sm mb-4 block"
          >
            Powerful Features
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-pink">stack bonuses</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600"
          >
            We've automated the hard parts of bank bonus hunting. Stop managing spreadsheets and start maximizing your returns.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-pink/10 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
