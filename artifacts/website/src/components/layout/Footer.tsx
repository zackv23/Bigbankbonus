import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo-icon.png`} 
                alt="BigBankBonus Logo" 
                className="w-8 h-8"
              />
              <span className="font-display font-bold text-2xl text-white tracking-tight">
                BigBankBonus
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm">
              Structured software for automated bank bonus execution, deposit planning, and offer monitoring.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Explore</h4>
            <ul className="space-y-3">
              <li><button onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-emerald-300 transition-colors">Problem</button></li>
              <li><button onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-emerald-300 transition-colors">Workflow</button></li>
              <li><button onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-emerald-300 transition-colors">Solution</button></li>
              <li><button onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-emerald-300 transition-colors">Future Plans</button></li>
              <li><Link href="/hub" className="text-slate-400 hover:text-emerald-300 transition-colors">Product Hub</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-slate-400 hover:text-emerald-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-emerald-300 transition-colors">Terms of Service</Link></li>
              <li><a href="mailto:support@bigbankbonus.com" className="text-slate-400 hover:text-emerald-300 transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} BigBankBonus. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs text-center md:text-right max-w-md">
            BigBankBonus does not guarantee approvals or bonus payouts. Offers remain subject to each financial institution's terms, conditions, and tax treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
