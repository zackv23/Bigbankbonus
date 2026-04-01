import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AccountSetupForm } from "@/components/sections/AccountSetupForm";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <AccountSetupForm />
        <Pricing />
        <Testimonials />
        <FAQ />
        
        {/* Bottom CTA */}
        <section className="py-24 bg-slate-900 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 via-brand-pink/10 to-brand-orange/20 blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-5xl font-bold text-white mb-6">Ready to start earning?</h2>
            <p className="text-xl text-slate-300 mb-10">
              Download the app today and find your first $300 bonus in minutes.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-gradient-brand text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-[0_0_40px_-10px_rgba(225,48,108,0.5)] hover:shadow-[0_0_60px_-10px_rgba(225,48,108,0.7)] hover:-translate-y-1 transition-all duration-300"
            >
              Get BigBankBonus Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
