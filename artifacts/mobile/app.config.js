const isIos = process.env.EAS_BUILD_PLATFORM === "ios" || process.env.EXPO_OS === "ios";

export default {
  expo: {
    name: "BigBankBonus",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0A",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.bigbankbonus.app",
      buildNumber: "1",
      minimumOsVersion: "16.0",
      usesAppleSignIn: true,
      infoPlist: {
        NSFaceIDUsageDescription:
          "BigBankBonus uses Face ID to securely authenticate you and protect your financial data.",
      },
    },
    android: {
      package: "com.bigbankbonus.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0A0A0A",
      },
      minSdkVersion: 24,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
        "android.permission.READ_EXTERNAL_STORAGE",
      ],
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://replit.com/",
        },
      ],
      "expo-font",
      "expo-web-browser",
      "expo-local-authentication",
      "expo-secure-store",
      ...(isIos ? ["expo-apple-authentication"] : []),
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
