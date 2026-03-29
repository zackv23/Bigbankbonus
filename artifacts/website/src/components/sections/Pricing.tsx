import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Pricing that pays for itself
          </h2>
          <p className="text-lg text-slate-600 mb-10">
            One successful bonus covers your entire year. Start for free, upgrade when you're ready to scale.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm font-semibold transition-colors", !isAnnual ? "text-slate-900" : "text-slate-500")}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 rounded-full bg-slate-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2"
              style={{ backgroundColor: isAnnual ? '#E1306C' : '#e2e8f0' }}
            >
              <motion.div 
                className="absolute top-1 bg-white w-6 h-6 rounded-full shadow-md"
                animate={{ left: isAnnual ? "2.25rem" : "0.25rem" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={cn("text-sm font-semibold transition-colors flex items-center gap-2", isAnnual ? "text-slate-900" : "text-slate-500")}>
              Annually
              <span className="bg-brand-orange/10 text-brand-orange text-xs px-2 py-0.5 rounded-full">Save 30%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 border border-slate-200 bg-white shadow-xl shadow-slate-200/50 flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500">Perfect for trying out your first bonus.</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-display font-bold text-slate-900">$0</span>
              <span className="text-slate-500 font-medium">/forever</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 shrink-0" />
                <span className="text-slate-600">Browse 5 bonus offers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 shrink-0" />
                <span className="text-slate-600">Manual bank tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 shrink-0" />
                <span className="text-slate-600">Basic filters</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X size={20} className="text-slate-400 shrink-0" />
                <span className="text-slate-500 line-through">Autopay DD Scheduler</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X size={20} className="text-slate-400 shrink-0" />
                <span className="text-slate-500 line-through">AI Bonus Agent</span>
              </li>
            </ul>
            
            <Link 
              href="/" 
              className="w-full py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
            >
              Get Started Free
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-1 bg-gradient-to-b from-brand-purple via-brand-pink to-brand-orange shadow-2xl shadow-brand-pink/20 relative"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-brand text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              Most Popular
            </div>
            <div className="bg-slate-950 rounded-[1.4rem] p-8 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Pro Earner</h3>
                <p className="text-slate-400">Everything you need to automate your earnings.</p>
              </div>
              <div className="mb-8 h-[60px]">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-display font-bold text-white">
                    ${isAnnual ? "6.99" : "9.99"}
                  </span>
                  <span className="text-slate-400 font-medium mb-1">/mo</span>
                </div>
                {isAnnual && (
                  <p className="text-brand-pink text-sm mt-1 font-medium">Billed $83.88 yearly</p>
                )}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200 font-medium">All Live DoC Deals (200+)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200 font-medium">Autopay DD Scheduler</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200 font-medium">AI Bonus Agent (GPT-4o)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200">Plaid Bank Linking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200">ROIC & APY Calculator</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200">Priority Support</span>
                </li>
              </ul>
              
              <Link 
                href="/" 
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-brand shadow-lg shadow-brand-pink/25 hover:shadow-brand-pink/40 hover:-translate-y-0.5 transition-all duration-300 text-center"
              >
                Upgrade to Pro
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
