import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Mike T.",
    role: "Part-time Bonus Hunter",
    text: "Made $1,200 in my first 3 months. The autopay feature is genius. I used to manage spreadsheets and set calendar reminders, now I just click a button.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80"
  },
  {
    name: "Sarah K.",
    role: "Finance Enthusiast",
    text: "I track 8 bank accounts through BigBankBonus. Found $3,400 in bonuses last year alone. The ROIC calculator helps me pick only the highest returning offers.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80"
  },
  {
    name: "James R.",
    role: "Pro Earner",
    text: "The AI agent told me exactly which 3 banks to open based on my $2,000 capital for maximum return. Incredible tool, easily pays for the annual subscription tenfold.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Loved by thousands of earners
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="glass-dark p-8 rounded-3xl"
            >
              <div className="flex gap-1 mb-6 text-yellow-500">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 italic">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="text-white font-bold">{t.name}</h4>
                  <p className="text-slate-400 text-sm">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
