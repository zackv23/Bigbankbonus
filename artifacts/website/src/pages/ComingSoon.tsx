import { useState, useEffect } from "react";
import { Mail, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownTimer() {
  const [countdown, setCountdown] = useState<Countdown>({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Calculate target date: 14 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[100px]">
        <span className="text-3xl md:text-5xl font-bold text-white block">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs md:text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex justify-center gap-3 md:gap-6">
      <TimeBlock value={countdown.days} label="Days" />
      <TimeBlock value={countdown.hours} label="Hours" />
      <TimeBlock value={countdown.minutes} label="Minutes" />
      <TimeBlock value={countdown.seconds} label="Seconds" />
    </div>
  );
}

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate email capture (in production, integrate with your email service)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscribed(true);
    setEmail("");
    setLoading(false);

    // Reset message after 5 seconds
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-pink/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950 to-slate-950" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo */}
        <div className="mb-12 md:mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-2xl shadow-brand-pink/50">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Main heading */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            Automate Your
            <span className="block bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange bg-clip-text text-transparent">
              Bank Bonuses
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
            Stack bonuses across personal, business, and credit card accounts.
            <br className="hidden sm:block" />
            Let AI handle the deposits. Keep 100% of the earnings.
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-12 md:mb-16">
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-6 text-center">
            Launching in
          </p>
          <CountdownTimer />
        </div>

        {/* Email signup */}
        <div className="w-full max-w-md mb-12 md:mb-16">
          <form onSubmit={handleSubscribe} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? "..." : <>Notify Me</>}
              </button>
            </div>
            {subscribed && (
              <p className="text-sm text-emerald-400 text-center font-medium">
                ✓ Thanks! We'll email you when we launch.
              </p>
            )}
          </form>
        </div>

        {/* Benefits cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {[
            {
              icon: Zap,
              title: "AI-Powered Strategy",
              description: "Get personalized bonus stacking recommendations based on your capital",
            },
            {
              icon: Shield,
              title: "Automatic Deposits",
              description: "Schedule and automate direct deposits across accounts seamlessly",
            },
            {
              icon: TrendingUp,
              title: "Maximize Returns",
              description: "Stack up to $2,000+ in bonuses with zero effort",
            },
          ].map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div
                key={i}
                className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-brand-pink/50 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* Social proof */}
        <div className="text-center text-slate-400 text-sm">
          <p>Built for bank bonus enthusiasts who don't want to leave money on the table.</p>
          <p className="mt-2">
            Coming soon to iOS, Android, and web.{" "}
            <span className="text-brand-pink font-semibold">May 7, 2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
