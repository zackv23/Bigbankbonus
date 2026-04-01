import { useState } from "react";
import { motion } from "framer-motion";

type Step = "account" | "confirm" | "routing" | "done";

export function AccountSetupForm() {
  const [step, setStep] = useState<Step>("account");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountConfirm, setAccountConfirm] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routingValid = routingNumber.length === 9;

  const handleNextAccount = () => {
    if (accountNumber.length < 4) {
      setError("Please enter a valid account number (min 4 digits).");
      return;
    }
    setError(null);
    setStep("confirm");
  };

  const handleConfirmAccount = () => {
    if (accountNumber !== accountConfirm) {
      setMismatch(true);
      setError("Account numbers don't match — please re-enter.");
      return;
    }
    setMismatch(false);
    setError(null);
    setStep("routing");
  };

  const handleSubmitRouting = () => {
    if (!routingValid) {
      setError("Routing number must be exactly 9 digits.");
      return;
    }
    setError(null);
    setStep("done");
  };

  const handleReset = () => {
    setStep("account");
    setAccountNumber("");
    setAccountConfirm("");
    setRoutingNumber("");
    setMismatch(false);
    setError(null);
  };

  const stepNum = step === "account" ? 1 : step === "confirm" ? 2 : step === "routing" ? 3 : 4;

  return (
    <section id="setup-demo" className="py-24 bg-slate-950 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-brand-pink/5 to-brand-orange/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Secure Account Setup
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Our step-by-step form verifies your account number with a double-entry check, and validates your 9-digit routing number in real time.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  stepNum > n
                    ? "bg-gradient-to-br from-brand-purple to-brand-pink text-white"
                    : stepNum === n
                    ? "bg-gradient-to-br from-brand-purple to-brand-orange text-white shadow-[0_0_16px_rgba(131,58,180,0.5)]"
                    : "bg-slate-800 text-slate-500"
                }`}>
                  {stepNum > n ? "✓" : n}
                </div>
                {n < 3 && (
                  <div className={`w-12 h-0.5 transition-all duration-500 ${stepNum > n ? "bg-brand-pink" : "bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
          >
            {step === "account" && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-brand-purple text-white text-xs flex items-center justify-center font-bold">1</span>
                    <h3 className="text-xl font-bold text-white">Enter Account Number</h3>
                  </div>
                  <p className="text-slate-400 text-sm ml-7">Your bank account number (digits only).</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Account Number</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg tracking-widest font-semibold placeholder-slate-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition"
                    placeholder="••••••••••"
                    maxLength={17}
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleNextAccount}
                  className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-xs flex items-center justify-center font-bold">2</span>
                    <h3 className="text-xl font-bold text-white">Confirm Account Number</h3>
                  </div>
                  <p className="text-slate-400 text-sm ml-7">Re-enter your account number to confirm it's correct.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Re-enter Account Number</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-lg tracking-widest font-semibold placeholder-slate-500 focus:outline-none transition ${
                      mismatch ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-slate-700 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    }`}
                    placeholder="••••••••••"
                    maxLength={17}
                    value={accountConfirm}
                    onChange={e => { setAccountConfirm(e.target.value.replace(/\D/g, "")); setMismatch(false); setError(null); }}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleConfirmAccount}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-orange text-white font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  Verify & Continue ✓
                </button>
                <button onClick={() => { setStep("account"); setError(null); }} className="w-full text-slate-400 hover:text-slate-200 text-sm py-1 transition">
                  ← Back
                </button>
              </div>
            )}

            {step === "routing" && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center font-bold">3</span>
                    <h3 className="text-xl font-bold text-white">Enter Routing Number</h3>
                  </div>
                  <p className="text-slate-400 text-sm ml-7">Your 9-digit ABA routing number (bottom-left of a check).</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Routing Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg tracking-widest font-semibold placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition"
                    placeholder="123456789"
                    maxLength={9}
                    value={routingNumber}
                    onChange={e => { setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9)); setError(null); }}
                  />
                  <div className={`text-right text-sm mt-1 font-semibold transition-colors ${routingValid ? "text-green-400" : "text-slate-500"}`}>
                    {routingNumber.length}/9 digits{routingValid ? " ✓" : ""}
                  </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleSubmitRouting}
                  disabled={!routingValid}
                  className={`w-full text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                    routingValid ? "bg-gradient-to-r from-brand-orange to-brand-purple hover:opacity-90" : "bg-slate-700 cursor-not-allowed opacity-60"
                  }`}
                >
                  Save & Continue
                </button>
                <button onClick={() => { setStep("confirm"); setError(null); }} className="w-full text-slate-400 hover:text-slate-200 text-sm py-1 transition">
                  ← Back
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange flex items-center justify-center">
                  <span className="text-white text-3xl">✓</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Account Details Saved</h3>
                  <p className="text-slate-400 text-sm">Your account and routing numbers were verified and saved securely.</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Account Number</span>
                    <span className="text-white font-semibold">••••{accountNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Routing Number</span>
                    <span className="text-white font-semibold">{routingNumber}</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold py-3 rounded-xl transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>

          <p className="text-center text-slate-600 text-xs mt-4">
            This is a demo of our secure double-entry form. Your data is never submitted here.
          </p>
        </div>
      </div>
    </section>
  );
}
