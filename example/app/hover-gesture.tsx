import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import {
  Circle,
  DashPathEffect,
  Line as SkiaLine,
  useFont,
  vec,
} from "react-native-skia";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useDarkMode } from "react-native-dark";
import { InfoCard } from "example/components/InfoCard";
import { AnimatedText } from "../components/AnimatedText";
import { appColors } from "../consts/colors";
import inter from "../assets/inter-medium.ttf";

export default function HoverGestureScreen() {
  const font = useFont(inter, 12);
  const isDark = useDarkMode();
  const textColor = isDark ? appColors.text.dark : appColors.text.light;
  const axisColor = isDark ? "#71717a" : "#d4d4d8";

  const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });

  const hoveredDay = useDerivedValue(() =>
    isActive ? `Day ${state.x.value.value}` : "Hover the chart!",
  );
  const hoveredValue = useDerivedValue(() =>
    isActive ? `${state.y.highTmp.value.value.toFixed(1)} °C` : "- °C",
  );

  return (
    <SafeAreaView style={styles.safeView}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 4 }}>
        <AnimatedText
          text={hoveredDay}
          defaultValue="Hover the chart!"
          style={[styles.readout, { color: textColor }]}
        />
        <AnimatedText
          text={hoveredValue}
          defaultValue="0 °C"
          style={[styles.readout, styles.readoutValue, { color: textColor }]}
        />
      </View>
      <View style={{ flex: 1, maxHeight: 400, padding: 32 }}>
        <CartesianChart
          data={DATA}
          xKey="day"
          yKeys={["highTmp"]}
          axisOptions={{
            font,
            lineColor: { grid: axisColor, frame: "transparent" },
            labelColor: textColor,
          }}
          /**
           * `enableHover` wires the Gesture.Hover() to the chart press state:
           * moving the pointer over the chart updates the state and its
           * `isActive` flag, and leaving the chart deactivates it again.
           */
          enableHover
          chartHoverConfig={{
            activeCursor: "pointer",
          }}
          chartPressState={state}
          renderOutside={({ chartBounds }) =>
            isActive ? (
              <Cursor
                xPosition={state.x.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                color={axisColor}
              />
            ) : null
          }
        >
          {({ points }) => (
            <>
              <Line points={points.highTmp} color="hotpink" strokeWidth={3} />
              {isActive && (
                <Circle
                  cx={state.x.position}
                  cy={state.y.highTmp.position}
                  r={9}
                  color="hotpink"
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <InfoCard>
          This page uses the built-in hover gesture (`enableHover` prop,
          implemented with Gesture.Hover() from react-native-gesture-handler) to
          update the chart press state while the pointer hovers over the chart -
          best experienced with a mouse on web or desktop. On touch-only devices
          the chart still supports the regular press interaction.
        </InfoCard>
      </View>
    </SafeAreaView>
  );
}

const DATA = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 30 * Math.random(),
}));

/**
 * Dashed vertical line that tracks the pointer while it hovers.
 */
function Cursor({
  xPosition,
  top,
  bottom,
  color,
}: {
  xPosition: SharedValue<number>;
  top: number;
  bottom: number;
  color: string;
}) {
  const start = useDerivedValue(() => vec(xPosition.value, top));
  const end = useDerivedValue(() => vec(xPosition.value, bottom));

  return (
    <SkiaLine p1={start} p2={end} color={color} strokeWidth={1}>
      <DashPathEffect intervals={[6, 4]} />
    </SkiaLine>
  );
}

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
    backgroundColor: appColors.viewBackground.light,
    $dark: {
      backgroundColor: appColors.viewBackground.dark,
    },
  },
  readout: {
    fontSize: 20,
    fontWeight: "bold",
  },
  readoutValue: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.75,
  },
});
