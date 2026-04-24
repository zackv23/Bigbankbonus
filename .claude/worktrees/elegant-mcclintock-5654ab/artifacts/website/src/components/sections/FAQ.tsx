import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is this legal?",
    a: "Yes, absolutely. Bank sign-up bonuses are promotional incentives offered by banks to acquire new customers. It is completely legal to open an account, meet the requirements, and collect the bonus. Note that bonuses are generally considered taxable interest income in the US."
  },
  {
    q: "How does the Autopay Scheduler work?",
    a: "When you apply for a bonus that requires a Direct Deposit (DD), you can use our Autopay feature. We charge your credit card for the required amount (+3% fee), push it to your new bank account via ACH to trigger the bonus, pull the money back after 5 business days, and refund your credit card."
  },
  {
    q: "What's the catch?",
    a: "There's no hidden catch. You keep 100% of the bank bonus. Our platform makes money through our monthly/annual subscription, and a transparent 3% service fee strictly on the funds processed through the Autopay DD Scheduler to cover Stripe processing costs."
  },
  {
    q: "Will opening bank accounts hurt my credit score?",
    a: "No. Checking and savings accounts generally perform a 'Soft Pull' on your credit report to verify your identity, which does not impact your credit score. We specifically tag and filter 'Hard Pull' banks so you can easily avoid them."
  },
  {
    q: "How much money can I realistically earn?",
    a: "Our active members average $1,800 per year by working 2-3 bonuses at a time. High-tier members who cycle larger amounts can earn upwards of $4,000+ per year simply by moving money around efficiently."
  }
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx} 
                className={cn(
                  "bg-white border rounded-2xl overflow-hidden transition-colors duration-300",
                  isOpen ? "border-brand-pink shadow-md shadow-brand-pink/5" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <span className="text-lg font-bold text-slate-900">{faq.q}</span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 shrink-0",
                    isOpen ? "bg-brand-pink text-white rotate-180" : "bg-slate-100 text-slate-500"
                  )}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
