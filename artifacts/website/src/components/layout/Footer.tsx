import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-brand-pink/50 to-transparent"></div>
      
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
              Discover, track, and automate bank bonuses. Our AI does the heavy lifting so you can turn sign-up offers into a reliable side income.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-brand-pink transition-colors">Features</button></li>
              <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-brand-pink transition-colors">Pricing</button></li>
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-brand-pink transition-colors">How it Works</button></li>
              <li><Link href="/" className="text-slate-400 hover:text-brand-pink transition-colors">Download iOS</Link></li>
              <li><Link href="/" className="text-slate-400 hover:text-brand-pink transition-colors">Download Android</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-400 hover:text-brand-pink transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="text-slate-400 hover:text-brand-pink transition-colors">Terms of Service</Link></li>
              <li><Link href="/" className="text-slate-400 hover:text-brand-pink transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} BigBankBonus. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs text-center md:text-right max-w-md">
            We are not a financial advisor. Bank bonuses are subject to terms and conditions of the respective financial institutions and are generally considered taxable income.
          </p>
        </div>
      </div>
    </footer>
  );
}
