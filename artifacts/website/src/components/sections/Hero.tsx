import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-950">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-purple/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-orange/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand-pink/20 blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left pt-10 lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-300">217+ Live Deals Available Today</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              Turn Bank Bonuses Into Your <span className="text-gradient">Side Income</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Discover, track, and automate $200–$1,000 cash bonuses from 7,000+ banks. Our AI does the heavy lifting — you keep the money.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                href="/" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-brand text-white px-8 py-4 rounded-xl text-lg font-bold shadow-[0_0_40px_-10px_rgba(225,48,108,0.5)] hover:shadow-[0_0_60px_-10px_rgba(225,48,108,0.7)] hover:-translate-y-1 transition-all duration-300"
              >
                Start Earning Free
                <ArrowRight size={20} />
              </Link>
              
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <PlayCircle size={20} />
                See Live Deals
              </button>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-slate-400 text-sm">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-8 h-8 rounded-full border-2 border-slate-950" alt="User avatar" />
                ))}
              </div>
              <p>Join <span className="text-white font-semibold">10,000+</span> earners today</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative perspective-1000 hidden sm:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple via-brand-pink to-brand-orange blur-[80px] opacity-30 rounded-full animate-pulse"></div>
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-mockup.png`} 
              alt="BigBankBonus App Mockup" 
              className="relative z-10 w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-3xl border border-white/10"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
