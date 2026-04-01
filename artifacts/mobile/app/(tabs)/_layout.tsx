import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.gradientMid,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#0A0A0A" : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: c.separator,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "#0A0A0A" : "#fff" }]} />
          ) : null,
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="magnifyingglass.circle" tintColor={color} size={24} /> : <Feather name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="creditcard" tintColor={color} size={24} /> : <Feather name="credit-card" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="calendar" tintColor={color} size={24} /> : <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="chart.bar" tintColor={color} size={24} /> : <Feather name="bar-chart-2" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stacking"
        options={{
          title: "Stacking",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="square.stack.3d.up" tintColor={color} size={24} /> : <Feather name="layers" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: "AI Agent",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="sparkles" tintColor={color} size={24} /> : <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: "Monitor",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="shield.checkered" tintColor={color} size={24} /> : <Feather name="shield" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
