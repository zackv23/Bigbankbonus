import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Link2, Shield, Folder, Upload, RefreshCw, Trash2, FileText, Image as ImageIcon, File, AlertCircle, CheckCircle, Clock, LogIn } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const USER_STORAGE_KEY = "bbb_user";

function getApiUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface StoredUser {
  id: string;
  email?: string;
  name?: string;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as StoredUser;
    if (!user?.id || user.id.trim() === "" || user.id === "demo-user") return null;
    return user;
  } catch {
    return null;
  }
}

interface UploadedFile {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  objectPath: string;
  category: string;
  createdAt: string;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  subtype: string;
  mask?: string;
  balances: { available: number | null; current: number | null };
}

interface PlaidItem {
  itemId: string;
  institutionName: string | null;
  accounts: PlaidAccount[] | null;
  status: string;
}

function authHeaders(userId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userId}`,
  };
}

function PlaidPrimaryCard({ userId }: { userId: string }) {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/plaid/items?userId=${encodeURIComponent(userId)}`));
      const data = await res.json();
      setItems((data.items ?? []).filter((i: PlaidItem) => i.status === "active"));
    } catch {
      setItems([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const primaryItem = items[0];
  const primaryAccounts = (primaryItem?.accounts as PlaidAccount[] | null) ?? [];
  const totalBalance = primaryAccounts.reduce((s, a) => s + (a.balances.available ?? 0), 0);

  const handleRefresh = async () => {
    if (!primaryItem) return;
    setRefreshing(true);
    try {
      const res = await fetch(getApiUrl(`/plaid/balance?userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(primaryItem.itemId)}`));
      const data = await res.json();
      setItems(prev => prev.map(i => i.itemId === primaryItem.itemId ? { ...i, accounts: data.accounts } : i));
    } catch {}
    setRefreshing(false);
  };

  const handleConnect = async () => {
    try {
      const linkRes = await fetch(getApiUrl("/plaid/link-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const linkData = await linkRes.json();
      if (linkData.sandbox || linkData.link_token === "link-sandbox-demo-token") {
        const exchangeRes = await fetch(getApiUrl("/plaid/exchange-token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken: "demo-public-token",
            userId,
            metadata: {
              institution: { institution_id: "ins_demo", name: "Chase Bank (Demo)" },
              accounts: [
                { account_id: `demo-checking-${Date.now()}`, name: "Total Checking", type: "depository", subtype: "checking", mask: "4321", balances: { available: 5200, current: 5200, iso_currency_code: "USD" } },
                { account_id: `demo-savings-${Date.now()}`, name: "Total Savings", type: "depository", subtype: "savings", mask: "8765", balances: { available: 12000, current: 12000, iso_currency_code: "USD" } },
              ],
            },
          }),
        });
        const exchangeData = await exchangeRes.json();
        if (exchangeData.success) {
          await fetchItems();
          // Link Plaid to active autopay schedules
          try {
            await fetch(getApiUrl("/autopay/link-plaid"), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
          } catch {}
          alert("Chase Bank (Demo) linked successfully. In production, Plaid securely connects to your real bank.");
        }
      } else if (linkData.link_token) {
        window.location.href = `https://link.plaid.com/?token=${linkData.link_token}`;
      }
    } catch {}
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Primary Bank Account</h3>
          <p className="text-sm text-muted-foreground">via Plaid secure connection</p>
        </div>
      </div>

      {primaryItem ? (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(primaryItem.institutionName ?? "B").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{primaryItem.institutionName ?? "Bank"}</p>
              <p className="text-sm text-muted-foreground">
                {primaryAccounts.length} account{primaryAccounts.length !== 1 ? "s" : ""} linked
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">live balance</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {primaryAccounts.map(a => (
              <div key={a.account_id} className="flex items-center gap-3 py-2.5">
                <div className={`w-2 h-2 rounded-full ${a.subtype === "checking" ? "bg-blue-500" : "bg-green-500"}`} />
                <span className="flex-1 text-sm text-foreground">{a.name}</span>
                <span className="text-sm text-muted-foreground">••{a.mask}</span>
                <span className="text-sm font-semibold text-green-500">${(a.balances.available ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm font-semibold text-brand-purple"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Balance"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your primary bank to track balances and detect direct deposits automatically.
          </p>
          <button
            onClick={handleConnect}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Link2 className="w-4 h-4" />
            Connect Your Bank
          </button>
          <p className="text-xs text-center text-muted-foreground">
            Plaid securely connects to 12,000+ US banks. Your credentials are never shared.
          </p>
        </div>
      )}
    </div>
  );
}

function ChexSystemsCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">ChexSystems Report</h3>
          <p className="text-sm text-muted-foreground">Free annual consumer report</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold">FREE</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        ChexSystems tracks your banking history — overdrafts, unpaid fees, and closed accounts. Many banks check it before opening new accounts. Review your report before applying.
      </p>

      <div className="bg-muted/50 rounded-xl p-4 space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">Check if you're flagged before applying for a bonus account</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">Dispute inaccurate entries for free</p>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">Report covers last 5 years of banking history</p>
        </div>
      </div>

      <a
        href="https://www.chexsystems.com/web/chexsystems/consumerdebit/page/requestyourfile/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDTxNTDwM3Q0sDHxNnDz9A83cTEwcXQ31wwkpiAJKG-AAjgZA_V-MAAEQWa4!/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Get Free ChexSystems Report
      </a>
    </div>
  );
}

function FileUploadCenter({ userId }: { userId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/uploads/files"), {
        headers: { Authorization: `Bearer ${userId}` },
      });
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("File too large. Please select a file under 10MB.");
      return;
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload a PDF or image file.");
      return;
    }

    setUploading(true);
    try {
      const urlRes = await fetch(getApiUrl("/storage/uploads/request-url"), {
        method: "POST",
        headers: authHeaders(userId),
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to get upload URL");
      }
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const category = file.type.includes("pdf")
        ? "statement"
        : file.name.toLowerCase().includes("bonus") || file.name.toLowerCase().includes("confirm")
          ? "bonus_confirmation"
          : "document";

      const saveRes = await fetch(getApiUrl("/uploads/files"), {
        method: "POST",
        headers: authHeaders(userId),
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          objectPath,
          category,
        }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to save file record");
      }

      await fetchFiles();
    } catch (err: any) {
      alert(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`Delete "${file.fileName}"?`)) return;
    try {
      const res = await fetch(getApiUrl(`/uploads/files/${file.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userId}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch {
      alert("Failed to delete file.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryConfig: Record<string, { label: string; color: string }> = {
    statement: { label: "Bank Statement", color: "text-blue-500 bg-blue-500/10" },
    bonus_confirmation: { label: "Bonus Confirmation", color: "text-green-500 bg-green-500/10" },
    document: { label: "Document", color: "text-orange-500 bg-orange-500/10" },
    other: { label: "Other", color: "text-slate-500 bg-slate-500/10" },
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes("pdf")) return <FileText className="w-4 h-4" />;
    if (contentType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
          <Folder className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">File Upload Center</h3>
          <p className="text-sm text-muted-foreground">PDFs, images up to 10MB</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Upload bank statements, bonus confirmation emails, or ID documents. Files are stored securely and associated with your account.
      </p>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
          dragOver ? "border-brand-orange bg-brand-orange/5" : "border-border hover:border-brand-orange/50"
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG up to 10MB</p>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-orange to-brand-pink text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Choose File
            </>
          )}
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileInput} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="inline-block w-6 h-6 border-2 border-muted border-t-brand-orange rounded-full animate-spin" />
        </div>
      ) : files.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Uploaded Files ({files.length})
          </p>
          <div className="divide-y divide-border">
            {files.map(file => {
              const config = categoryConfig[file.category] ?? categoryConfig.other;
              return (
                <div key={file.id} className="flex items-center gap-3 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                    {getFileIcon(file.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatSize(file.fileSize)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-xl gap-2">
          <Folder className="w-7 h-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}

function LoginPrompt() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Sign in to access the Hub</h1>
          <p className="text-muted-foreground mb-8">
            The Command Hub is available to signed-in users. Download the BigBankBonus app to create your account, then access the Hub from here.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Your data is protected</p>
                <p className="text-sm text-muted-foreground">The Hub shows your personal bank data and uploaded files — sign in to access them securely.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Available to all users</p>
                <p className="text-sm text-muted-foreground">The ChexSystems report and bank linking are available to both free and paid users.</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account? Sign in via the <strong>BigBankBonus mobile app</strong>, then return here.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function HubPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <span className="inline-block w-8 h-8 border-2 border-muted border-t-brand-pink rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-brand/10 border border-brand-pink/20 text-sm font-semibold text-brand-pink mb-4">
              <span className="w-2 h-2 rounded-full bg-brand-pink inline-block" />
              Command Hub
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">Your Financial Command Center</h1>
            {user.name && (
              <p className="text-sm text-muted-foreground mb-2">Welcome back, {user.name}</p>
            )}
            <p className="text-lg text-muted-foreground">
              Manage your linked bank, check your ChexSystems report, and upload important documents — all in one place.
            </p>
          </div>

          <div className="space-y-5">
            <PlaidPrimaryCard userId={user.id} />
            <ChexSystemsCard />
            <FileUploadCenter userId={user.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
