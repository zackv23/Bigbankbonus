import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");
const BILL_W = Math.min(width * 0.7, 260);
const BILL_H = BILL_W * 0.44;

function BillSVG({ color = "#2E7D32", opacity = 1, amt = "$100" }: { color?: string; opacity?: number; amt?: string }) {
  return (
    <View style={[styles.bill, { width: BILL_W, height: BILL_H, opacity, backgroundColor: color, borderRadius: 6, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }]}>
      <View style={[styles.billInner, { borderColor: "rgba(255,255,255,0.35)" }]}>
        <View style={styles.billCenter}>
          <View style={[styles.billOval, { backgroundColor: "rgba(255,255,255,0.18)" }]} />
          <Text style={styles.billAmt}>{amt}</Text>
          <Text style={styles.billLabel}>BONUS</Text>
        </View>
        <View style={styles.billStripes}>
          {[0,1,2].map(i => (
            <View key={i} style={[styles.billStripe, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Roller({ x, animated }: { x: number; animated: Animated.Value }) {
  const spin = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  return (
    <Animated.View style={[styles.roller, { left: x, transform: [{ rotate: spin }] }]}>
      {[0,1,2,3].map(i => (
        <View key={i} style={[styles.rollerLine, { transform: [{ rotate: `${i * 45}deg` }] }]} />
      ))}
    </Animated.View>
  );
}

export default function MoneyAnimation() {
  const billX = useRef(new Animated.Value(-BILL_W)).current;
  const roller = useRef(new Animated.Value(0)).current;
  const magicWords = useRef(new Animated.Value(0)).current;
  const bill2X = useRef(new Animated.Value(-BILL_W)).current;
  const dispenseY = useRef(new Animated.Value(0)).current;
  const cycle = useRef(0);

  const runCycle = () => {
    const c = cycle.current;
    billX.setValue(-BILL_W);
    bill2X.setValue(-BILL_W);
    magicWords.setValue(0);
    dispenseY.setValue(0);

    const rollerAnim = Animated.loop(
      Animated.timing(roller, { toValue: 1, duration: 600, useNativeDriver: false }),
      { iterations: -1 }
    );
    rollerAnim.start();

    if (c < 3) {
      Animated.sequence([
        Animated.timing(billX, { toValue: BILL_W + 40, duration: 900, useNativeDriver: false }),
        Animated.delay(200),
        Animated.timing(billX, { toValue: -BILL_W, duration: 900, useNativeDriver: false }),
        Animated.delay(300),
      ]).start(() => {
        rollerAnim.stop();
        cycle.current = c + 1;
        runCycle();
      });
    } else {
      Animated.parallel([
        Animated.timing(billX, { toValue: BILL_W + 20, duration: 1000, useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(bill2X, { toValue: BILL_W + 80, duration: 1000, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(magicWords, { toValue: 1, duration: 400, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(dispenseY, { toValue: -30, duration: 500, useNativeDriver: false }),
        ]),
      ]).start(() => {
        rollerAnim.stop();
        setTimeout(() => {
          cycle.current = 0;
          runCycle();
        }, 1500);
      });
    }
  };

  useEffect(() => {
    runCycle();
    return () => {
      billX.stopAnimation();
      bill2X.stopAnimation();
      roller.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.press}>
        <View style={styles.pressTop}>
          <Text style={styles.pressLabel}>PRINTING PRESS</Text>
        </View>
        <View style={styles.pressBody}>
          <View style={styles.rollers}>
            <Roller x={12} animated={roller} />
            <Roller x={BILL_W / 2 - 14} animated={roller} />
            <Roller x={BILL_W - 40} animated={roller} />
          </View>
          <View style={styles.slot}>
            <Animated.View style={{ transform: [{ translateX: billX }] }}>
              <BillSVG color="#1B5E20" amt={`$${[200, 300, 500, 750][cycle.current % 4]}`} />
            </Animated.View>
            {cycle.current >= 3 && (
              <Animated.View style={[styles.bill2, { transform: [{ translateX: bill2X }] }]}>
                <BillSVG color="#2E7D32" amt="$500" />
              </Animated.View>
            )}
          </View>
        </View>

        <Animated.View style={[styles.dispenseSlot, { transform: [{ translateY: dispenseY }] }]}>
          <View style={styles.dispenseTrack} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.magicWords, { opacity: magicWords, transform: [{ scale: magicWords.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}>
        <Text style={styles.magicText}>💸 Magic Money 💸</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 16 },
  press: {
    width: BILL_W + 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  pressTop: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    alignItems: "center",
  },
  pressLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
  },
  pressBody: { padding: 8, position: "relative" },
  rollers: { flexDirection: "row", height: 28, position: "relative", marginBottom: 4 },
  roller: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#555",
    borderWidth: 2,
    borderColor: "#777",
    alignItems: "center",
    justifyContent: "center",
  },
  rollerLine: { position: "absolute", width: 2, height: 20, backgroundColor: "#888", borderRadius: 1 },
  slot: {
    height: BILL_H + 8,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bill: { overflow: "hidden" },
  billInner: { flex: 1, margin: 4, borderWidth: 1, borderRadius: 4, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  billCenter: { alignItems: "center", justifyContent: "center", flex: 1 },
  billOval: { position: "absolute", width: 60, height: 60, borderRadius: 30 },
  billAmt: { fontFamily: "Inter_700Bold", fontSize: 18, color: "rgba(255,255,255,0.9)" },
  billLabel: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, marginTop: 2 },
  billStripes: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "space-around" },
  billStripe: { height: 1 },
  bill2: { position: "absolute" },
  dispenseSlot: { height: 12, backgroundColor: "#222", marginHorizontal: 20, marginBottom: 8, borderRadius: 4 },
  dispenseTrack: { flex: 1, backgroundColor: "#1A1A1A" },
  magicWords: { alignItems: "center" },
  magicText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
});
