import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md text-center glass-dark p-12 rounded-3xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-brand p-[1px] mb-8">
          <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-display font-bold text-white">404</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          href="/" 
          className="inline-block bg-gradient-brand text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
