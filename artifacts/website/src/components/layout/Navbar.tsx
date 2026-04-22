import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/88 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl py-3 border-b border-slate-200/70"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={`${import.meta.env.BASE_URL}images/logo-icon.png`} 
              alt="BigBankBonus Logo" 
              className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
            />
            <span className={`font-display font-bold text-xl tracking-tight transition-colors ${isScrolled ? "text-slate-950" : "text-slate-950"}`}>
              BigBankBonus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo("problem")} className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors">Problem</button>
            <button onClick={() => scrollTo("workflow")} className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors">Workflow</button>
            <button onClick={() => scrollTo("solution")} className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors">Solution</button>
            <button onClick={() => scrollTo("faq")} className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors">FAQ</button>
            <Link href="/dashboard" className="text-sm font-medium text-emerald-800 hover:text-emerald-950 transition-colors">Client</Link>
            <Link href="/sales" className="text-sm font-medium text-indigo-700 hover:text-indigo-950 transition-colors">Sales</Link>
            <Link href="/owner" className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors">Owner</Link>
            <Link
              href="/dashboard"
              className="bg-slate-950 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-slate-950 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-3 border-t border-slate-200 bg-white/95 backdrop-blur-xl"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              <button onClick={() => scrollTo("problem")} className="text-left text-lg font-medium text-slate-900 py-2">Problem</button>
              <button onClick={() => scrollTo("workflow")} className="text-left text-lg font-medium text-slate-900 py-2">Workflow</button>
              <button onClick={() => scrollTo("solution")} className="text-left text-lg font-medium text-slate-900 py-2">Solution</button>
              <button onClick={() => scrollTo("faq")} className="text-left text-lg font-medium text-slate-900 py-2">FAQ</button>
              <Link href="/dashboard" className="text-left text-lg font-medium text-emerald-800 py-2">Client Dashboard</Link>
              <Link href="/sales" className="text-left text-lg font-medium text-indigo-700 py-2">Sales Portal</Link>
              <Link href="/owner" className="text-left text-lg font-medium text-slate-700 py-2">Owner Dashboard</Link>
              <Link href="/hub" className="text-left text-lg font-medium text-slate-600 py-2">Command Hub</Link>
              <Link
                href="/dashboard"
                className="bg-slate-950 text-white text-center px-5 py-3 mt-4 rounded-xl text-base font-bold"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
