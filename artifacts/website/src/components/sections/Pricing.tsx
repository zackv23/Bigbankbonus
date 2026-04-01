import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Shield, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Simple, approval-gated pricing
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Sign up is always free — no credit card required. You're only charged after your bank account application is approved.
          </p>

          {/* Free to sign up callout */}
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-full text-sm font-semibold">
            <Shield size={16} className="text-green-600" />
            Free to sign up · No credit card required · Charged only after approval
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-10">
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 border border-slate-200 bg-white shadow-xl shadow-slate-200/50 flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500">Perfect for trying out your first bonus. Always free.</p>
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
              Approval-Gated
            </div>
            <div className="bg-slate-950 rounded-[1.4rem] p-8 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Pro Earner</h3>
                <p className="text-slate-400">Everything you need to automate your earnings — billed after approval.</p>
              </div>
              <div className="mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-display font-bold text-white">$6</span>
                  <span className="text-slate-400 font-medium mb-1">/mo</span>
                </div>
                <p className="text-brand-pink text-sm mt-1 font-medium">+ $99 one-time service fee</p>
                <p className="text-slate-500 text-xs mt-1">Both charged only after account approval</p>
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
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-brand-pink shrink-0" />
                  <span className="text-slate-200">Post-Approval Checklist</span>
                </li>
              </ul>
              
              <Link 
                href="/" 
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-brand shadow-lg shadow-brand-pink/25 hover:shadow-brand-pink/40 hover:-translate-y-0.5 transition-all duration-300 text-center"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>

        {/* How billing works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle size={18} className="text-brand-purple" />
            <h4 className="text-lg font-bold text-slate-900">How approval-gated billing works</h4>
          </div>
          <div className="space-y-4">
            {[
              { step: "1", text: "Sign up for free — no credit card, no commitment." },
              { step: "2", text: "Apply for a bank account through the app." },
              { step: "3", text: "A BigBankBonus operator reviews and approves your account." },
              { step: "4", text: "Once approved, your $6/mo subscription and $99 service fee are activated." },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
