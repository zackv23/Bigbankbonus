import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { PlaidAccount, PlaidItem, usePlaid } from "@/context/PlaidContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UploadedFile {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  objectPath: string;
  category: string;
  createdAt: string;
}

function getApiUrl(path: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api${path}`;
  return `http://localhost:8080/api${path}`;
}

async function getUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem("bbb_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user?.id ?? user?.email;
    if (!id || String(id).length < 3) return null;
    return String(id);
  } catch {
    return null;
  }
}

function authHeaders(userId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userId}`,
  };
}

function PlaidPrimaryCard({ isDark }: { isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const { items, isLoading, linkBank, refreshBalance } = usePlaid();
  const [refreshing, setRefreshing] = useState(false);

  const activeItems = items.filter(i => i.status === "active");
  const primaryItem: PlaidItem | undefined = activeItems[0];
  const primaryAccounts = (primaryItem?.accounts as PlaidAccount[] | null) ?? [];
  const totalBalance = primaryAccounts.reduce((s, a) => s + (a.balances.available ?? 0), 0);
  const primaryChecking = primaryAccounts.find(a => a.subtype === "checking") ?? primaryAccounts[0];

  const handleRefresh = async () => {
    if (!primaryItem) return;
    setRefreshing(true);
    await refreshBalance(primaryItem.itemId);
    setRefreshing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.cardHeader}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={styles.cardIconBg}>
          <Feather name="link" size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Primary Bank Account</Text>
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>via Plaid secure connection</Text>
        </View>
      </View>

      {primaryItem ? (
        <View style={styles.plaidLinkedContent}>
          <View style={[styles.bankBadge, { backgroundColor: c.backgroundSecondary }]}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} style={styles.bankInitialBg}>
              <Text style={styles.bankInitialText}>{(primaryItem.institutionName ?? "B").charAt(0)}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.bankName, { color: c.text }]}>{primaryItem.institutionName ?? "Bank"}</Text>
              {primaryChecking && (
                <Text style={[styles.bankAccount, { color: c.textSecondary }]}>
                  {primaryChecking.name} ••{primaryChecking.mask}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.balanceAmount, { color: c.text }]}>
                ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.balanceLabel, { color: c.textSecondary }]}>available</Text>
            </View>
          </View>

          <View style={styles.accountsList}>
            {primaryAccounts.map(a => (
              <View key={a.account_id} style={[styles.accountRow, { borderColor: c.cardBorder }]}>
                <View style={[styles.accountDot, { backgroundColor: a.subtype === "checking" ? "#2196F3" : "#4CAF50" }]} />
                <Text style={[styles.accountRowName, { color: c.text }]}>{a.name}</Text>
                <Text style={[styles.accountRowMask, { color: c.textSecondary }]}>••{a.mask}</Text>
                <Text style={[styles.accountRowBal, { color: "#4CAF50" }]}>
                  ${(a.balances.available ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.refreshBtn, { backgroundColor: c.backgroundSecondary }]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size={14} color="#833AB4" />
            ) : (
              <Feather name="refresh-cw" size={14} color="#833AB4" />
            )}
            <Text style={[styles.refreshBtnText, { color: "#833AB4" }]}>
              {refreshing ? "Refreshing..." : "Refresh Balance"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.plaidUnlinkedContent}>
          <Text style={[styles.unlinkedText, { color: c.textSecondary }]}>
            Connect your primary bank to track balances and detect direct deposits automatically.
          </Text>
          <Pressable style={styles.connectBtn} onPress={linkBank} disabled={isLoading}>
            <LinearGradient
              colors={["#833AB4", "#E1306C", "#F77737"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectBtnGrad}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size={16} />
              ) : (
                <Feather name="link" size={16} color="#fff" />
              )}
              <Text style={styles.connectBtnText}>
                {isLoading ? "Connecting..." : "Connect Your Bank"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.plaidDisclaimer, { color: c.textTertiary }]}>
            Plaid securely connects to 12,000+ US banks. Your credentials are never shared.
          </Text>
        </View>
      )}
    </View>
  );
}

function ChexSystemsCard({ isDark }: { isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;

  const handleOpen = () => {
    Linking.openURL("https://www.chexsystems.com/web/chexsystems/consumerdebit/page/requestyourfile/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDTxNTDwM3Q0sDHxNnDz9A83cTEwcXQ31wwkpiAJKG-AAjgZA_V-MAAEQWa4!/");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBg, { backgroundColor: "#1565C0" }]}>
          <Feather name="shield" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: c.text }]}>ChexSystems Report</Text>
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>Free annual consumer report</Text>
        </View>
        <View style={[styles.freeBadge, { backgroundColor: "#4CAF5022" }]}>
          <Text style={styles.freeBadgeText}>FREE</Text>
        </View>
      </View>

      <Text style={[styles.chexExplain, { color: c.textSecondary }]}>
        ChexSystems tracks banking history — overdrafts, unpaid fees, and closed accounts. Many banks check it before opening new accounts. Review your report before applying.
      </Text>

      <View style={[styles.chexTips, { backgroundColor: c.backgroundSecondary }]}>
        <View style={styles.chexTipRow}>
          <Feather name="alert-circle" size={13} color="#F77737" />
          <Text style={[styles.chexTipText, { color: c.textSecondary }]}>Check if you're flagged before applying for a bonus account</Text>
        </View>
        <View style={styles.chexTipRow}>
          <Feather name="check-circle" size={13} color="#4CAF50" />
          <Text style={[styles.chexTipText, { color: c.textSecondary }]}>Dispute inaccurate entries for free</Text>
        </View>
        <View style={styles.chexTipRow}>
          <Feather name="clock" size={13} color="#2196F3" />
          <Text style={[styles.chexTipText, { color: c.textSecondary }]}>Report covers last 5 years of banking history</Text>
        </View>
      </View>

      <Pressable style={styles.chexBtn} onPress={handleOpen}>
        <LinearGradient
          colors={["#1565C0", "#1976D2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chexBtnGrad}
        >
          <Feather name="external-link" size={15} color="#fff" />
          <Text style={styles.chexBtnText}>Get Free ChexSystems Report</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function FileUploadCenter({ isDark }: { isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { setLoading(false); return; }
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
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      if (asset.size && asset.size > MAX_FILE_SIZE) {
        Alert.alert("File Too Large", "Please select a file under 10MB.");
        return;
      }

      setUploading(true);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userId = await getUserId();
      if (!userId) throw new Error("Sign in required to upload files.");

      const urlRes = await fetch(getApiUrl("/storage/uploads/request-url"), {
        method: "POST",
        headers: authHeaders(userId),
        body: JSON.stringify({
          name: asset.name,
          size: asset.size ?? 1,
          contentType: asset.mimeType ?? "application/octet-stream",
        }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to get upload URL");
      }
      const { uploadURL, objectPath } = await urlRes.json();

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": asset.mimeType ?? "application/octet-stream" },
        body: blob,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const category = asset.mimeType?.includes("pdf")
        ? "statement"
        : asset.name.toLowerCase().includes("bonus") || asset.name.toLowerCase().includes("confirm")
          ? "bonus_confirmation"
          : "document";

      const saveRes = await fetch(getApiUrl("/uploads/files"), {
        method: "POST",
        headers: authHeaders(userId),
        body: JSON.stringify({
          fileName: asset.name,
          fileSize: asset.size ?? 0,
          contentType: asset.mimeType ?? "application/octet-stream",
          objectPath,
          category,
        }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to save file record");
      }

      await fetchFiles();
      Alert.alert("Uploaded", `${asset.name} uploaded successfully.`);
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message ?? "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (file: UploadedFile) => {
    Alert.alert("Delete File", `Remove "${file.fileName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const userId = await getUserId();
          if (!userId) { Alert.alert("Error", "Sign in required."); return; }
          try {
            const res = await fetch(getApiUrl(`/uploads/files/${file.id}`), {
              method: "DELETE",
              headers: { Authorization: `Bearer ${userId}` },
            });
            if (!res.ok) throw new Error("Delete failed");
            setFiles(prev => prev.filter(f => f.id !== file.id));
          } catch {
            Alert.alert("Error", "Failed to delete file.");
          }
        },
      },
    ]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      statement: "Bank Statement",
      bonus_confirmation: "Bonus Confirmation",
      document: "Document",
      other: "Other",
    };
    return labels[cat] ?? cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      statement: "#2196F3",
      bonus_confirmation: "#4CAF50",
      document: "#F77737",
      other: "#9E9E9E",
    };
    return colors[cat] ?? "#9E9E9E";
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes("pdf")) return "file-text";
    if (contentType.includes("image")) return "image";
    return "file";
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBg, { backgroundColor: "#F77737" }]}>
          <Feather name="folder" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: c.text }]}>File Upload Center</Text>
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>PDFs, images up to 10MB</Text>
        </View>
      </View>

      <Text style={[styles.uploadExplain, { color: c.textSecondary }]}>
        Upload bank statements, bonus confirmation emails, or ID documents. Files are stored securely and associated with your account.
      </Text>

      <Pressable style={[styles.uploadBtn, { opacity: uploading ? 0.7 : 1 }]} onPress={handlePickFile} disabled={uploading}>
        <LinearGradient
          colors={["#F77737", "#E1306C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.uploadBtnGrad}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size={16} />
          ) : (
            <Feather name="upload" size={16} color="#fff" />
          )}
          <Text style={styles.uploadBtnText}>
            {uploading ? "Uploading..." : "Choose File to Upload"}
          </Text>
        </LinearGradient>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#F77737" />
      ) : files.length > 0 ? (
        <View style={styles.filesList}>
          <Text style={[styles.filesListTitle, { color: c.textSecondary }]}>Uploaded Files ({files.length})</Text>
          {files.map(file => (
            <View key={file.id} style={[styles.fileRow, { borderColor: c.cardBorder }]}>
              <View style={[styles.fileIconBg, { backgroundColor: getCategoryColor(file.category) + "22" }]}>
                <Feather name={getFileIcon(file.contentType) as any} size={16} color={getCategoryColor(file.category)} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.fileName, { color: c.text }]} numberOfLines={1}>{file.fileName}</Text>
                <View style={styles.fileMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(file.category) + "22" }]}>
                    <Text style={[styles.categoryBadgeText, { color: getCategoryColor(file.category) }]}>
                      {getCategoryLabel(file.category)}
                    </Text>
                  </View>
                  <Text style={[styles.fileSize, { color: c.textTertiary }]}>{formatSize(file.fileSize)}</Text>
                </View>
              </View>
              <Pressable onPress={() => handleDelete(file)} style={styles.deleteBtn}>
                <Feather name="trash-2" size={15} color="#F44336" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyFiles, { backgroundColor: c.backgroundSecondary }]}>
          <Feather name="inbox" size={28} color={c.textTertiary} />
          <Text style={[styles.emptyFilesText, { color: c.textTertiary }]}>No files uploaded yet</Text>
        </View>
      )}
    </View>
  );
}

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient
          colors={["#833AB4", "#E1306C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>Command Hub</Text>
        <Text style={styles.headerSubtitle}>Your financial command center</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 96),
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PlaidPrimaryCard isDark={isDark} />
        <ChexSystemsCard isDark={isDark} />
        <FileUploadCenter isDark={isDark} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: "Inter_400Regular",
  },
  plaidLinkedContent: {
    gap: 10,
  },
  bankBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  bankInitialBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bankInitialText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  bankName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  bankAccount: {
    fontSize: 12,
    marginTop: 1,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  balanceLabel: {
    fontSize: 11,
  },
  accountsList: {
    gap: 0,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  accountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountRowName: {
    flex: 1,
    fontSize: 13,
  },
  accountRowMask: {
    fontSize: 12,
  },
  accountRowBal: {
    fontSize: 14,
    fontWeight: "600",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  plaidUnlinkedContent: {
    gap: 12,
  },
  unlinkedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  connectBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  connectBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  connectBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  plaidDisclaimer: {
    fontSize: 11,
    textAlign: "center",
  },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "700",
  },
  chexExplain: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  chexTips: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  chexTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  chexTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  chexBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  chexBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  chexBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  uploadExplain: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  uploadBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  uploadBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  filesList: {
    gap: 0,
  },
  filesListTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  fileIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 13,
    fontWeight: "500",
  },
  fileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  fileSize: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyFiles: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyFilesText: {
    fontSize: 13,
  },
});
