import { motion } from "framer-motion";

const stats = [
  { value: "$2.1M+", label: "Earned by members" },
  { value: "7,000+", label: "Banks tracked" },
  { value: "217", label: "Live DoC deals" },
  { value: "730%", label: "Average APY" },
];

export function Stats() {
  return (
    <section className="relative z-20 -mt-10 mb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-dark rounded-2xl p-8 shadow-2xl shadow-black/50"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-white/10">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center px-4">
              <p className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
