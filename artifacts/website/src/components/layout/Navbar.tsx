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
        isScrolled ? "glass-dark shadow-2xl shadow-black/50 py-3" : "bg-transparent py-5"
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
            <span className="font-display font-bold text-xl text-white tracking-tight">
              BigBankBonus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("features")} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</button>
            <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</button>
            <button onClick={() => scrollTo("faq")} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">FAQ</button>
            <Link 
              href="/" 
              className="bg-gradient-brand text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-pink/25 hover:shadow-brand-pink/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Get the App
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2"
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
            className="md:hidden glass-dark border-t border-white/10 mt-3"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              <button onClick={() => scrollTo("features")} className="text-left text-lg font-medium text-slate-200 py-2">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="text-left text-lg font-medium text-slate-200 py-2">How it Works</button>
              <button onClick={() => scrollTo("pricing")} className="text-left text-lg font-medium text-slate-200 py-2">Pricing</button>
              <button onClick={() => scrollTo("faq")} className="text-left text-lg font-medium text-slate-200 py-2">FAQ</button>
              <Link 
                href="/" 
                className="bg-gradient-brand text-white text-center px-5 py-3 mt-4 rounded-xl text-base font-bold shadow-lg"
              >
                Get the App
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
