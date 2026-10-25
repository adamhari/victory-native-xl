import * as React from "react";
import { Group } from "react-native-skia";
import {
  type ViewStyle,
  type StyleProp,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import { type ContextBridge, FiberProvider, useContextBridge } from "its-fine";
import {
  PolarChartProvider,
  type PolarHoverPointer,
} from "./contexts/PolarChartContext";
import type {
  ColorFields,
  InputFields,
  NumericalFields,
  StringKeyOf,
  ChartHoverConfig,
  PieHoverState,
} from "../types";
import { type ChartTransformState } from "../cartesian/hooks/useChartTransformState";
import {
  panTransformGesture,
  pinchTransformGesture,
} from "../cartesian/utils/transformGestures";
import { getCartesianTouchCoordinates } from "../cartesian/utils/getCartesianTouchCoordinates";
import { GestureHandler } from "../shared/GestureHandler";
import { type ChartExplicitSize } from "../shared/ChartExplicitSize";
import { type ChartLayoutModeProps } from "../shared/ChartLayoutModeProps";
import { ChartWrapper } from "../shared/ChartWrapper";
import { useChartCanvasSize } from "../shared/useChartCanvasSize";

type PolarChartBaseProps = {
  onLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => void;
  hasMeasuredLayoutSize: boolean;
  canvasSize: { width: number; height: number };
  containerStyle?: StyleProp<ViewStyle>;
  canvasStyle?: StyleProp<ViewStyle>;
  transformState?: ChartTransformState;
  isHeadless: boolean;
  explicitSize?: ChartExplicitSize;
  enableHover?: boolean;
  hoverPointer: SharedValue<PolarHoverPointer>;
  chartHoverConfig?: ChartHoverConfig;
};

const PolarChartBase = (
  props: React.PropsWithChildren<PolarChartBaseProps>,
) => {
  const {
    containerStyle,
    canvasStyle,
    children,
    onLayout,
    hasMeasuredLayoutSize,
    canvasSize,
    transformState,
    isHeadless,
    explicitSize,
    enableHover,
    hoverPointer,
    chartHoverConfig,
  } = props;
  const Bridge: ContextBridge = useContextBridge();

  let composed = Gesture.Race();
  if (transformState) {
    composed = Gesture.Race(
      composed,
      pinchTransformGesture(transformState),
      panTransformGesture(transformState),
    );
  }

  /**
   * Hover gesture handling:
   * - Uses Gesture.Hover() to write the raw chart-space pointer position into
   *    `hoverPointer` while the pointer is over the chart (and `null` when it
   *    leaves). Pie charts consume this through the polar chart context to
   *    hit-test the hovered slice against their own geometry.
   * - Coordinates are inverted through the active chart transform the same
   *    way press touches are.
   */
  const hoverGesture = Gesture.Hover()
    .onStart((e) => {
      hoverPointer.value = getCartesianTouchCoordinates({
        touch: e,
        transform: transformState?.matrix.value,
      });
    })
    .onUpdate((e) => {
      hoverPointer.value = getCartesianTouchCoordinates({
        touch: e,
        transform: transformState?.matrix.value,
      });
    })
    .onEnd(() => {
      hoverPointer.value = null;
    })
    .onFinalize(() => {
      hoverPointer.value = null;
    });

  if (chartHoverConfig?.activeCursor) {
    hoverGesture.activeCursor(chartHoverConfig.activeCursor);
  }

  // The hover gesture should never compete with press/transform recognition.
  if (enableHover) {
    composed = Gesture.Simultaneous(composed, hoverGesture);
  }

  const chartContent = (
    <Group matrix={transformState?.matrix}>
      {hasMeasuredLayoutSize && children}
    </Group>
  );

  return (
    <ChartWrapper
      isHeadless={isHeadless}
      explicitSize={explicitSize}
      onLayout={onLayout}
      hasMeasuredLayoutSize={hasMeasuredLayoutSize}
      canvasSize={canvasSize}
      containerStyle={containerStyle}
      canvasStyle={canvasStyle}
      chartContent={chartContent}
      wrapCanvasContent={
        isHeadless ? undefined : (content) => <Bridge>{content}</Bridge>
      }
      gestureOverlay={
        isHeadless ? undefined : <GestureHandler gesture={composed} />
      }
    />
  );
};

type PolarChartProps<
  RawData extends Record<string, unknown>,
  LabelKey extends StringKeyOf<InputFields<RawData>>,
  ValueKey extends StringKeyOf<NumericalFields<RawData>>,
  ColorKey extends StringKeyOf<ColorFields<RawData>>,
> = {
  data: RawData[];
  colorKey: ColorKey;
  labelKey: LabelKey;
  valueKey: ValueKey;
  /**
   * Web/desktop only. When enabled, a Hover gesture (see `Gesture.Hover()`
   * from react-native-gesture-handler) tracks the pointer over the chart and
   * writes the hovered data point (slice) index into the provided
   * `hoverState`, or `-1` when the pointer is not over any slice.
   */
  enableHover?: boolean;
  /**
   * A Reanimated shared value object which is populated with the index of the
   * data point (slice) currently hovered by the pointer (requires
   * `enableHover`). `-1` means no slice is hovered.
   */
  hoverState?: PieHoverState;
  /**
   * Optional configuration for the hover gesture; requires `enableHover` to
   * be useful.
   */
  chartHoverConfig?: ChartHoverConfig;
} & ChartLayoutModeProps &
  Omit<
    PolarChartBaseProps,
    | "canvasSize"
    | "onLayout"
    | "hasMeasuredLayoutSize"
    | "isHeadless"
    | "hoverPointer"
  >;
export const PolarChart = <
  RawData extends Record<string, unknown>,
  LabelKey extends StringKeyOf<InputFields<RawData>>,
  ValueKey extends StringKeyOf<NumericalFields<RawData>>,
  ColorKey extends StringKeyOf<ColorFields<RawData>>,
>(
  props: React.PropsWithChildren<
    PolarChartProps<RawData, LabelKey, ValueKey, ColorKey>
  >,
) => {
  const { data, labelKey, colorKey, valueKey } = props;

  const {
    size: canvasSize,
    hasMeasuredLayoutSize,
    onLayout,
    isHeadless,
  } = useChartCanvasSize({
    explicitSize: props.explicitSize,
    headless: props.headless,
  });

  const hoverPointer = useSharedValue<PolarHoverPointer>(null);
  const hoverState = props.hoverState;

  return (
    <FiberProvider>
      <PolarChartProvider
        data={data}
        labelKey={labelKey.toString()}
        colorKey={colorKey.toString()}
        valueKey={valueKey.toString()}
        canvasSize={canvasSize}
        hoverPointer={hoverPointer}
        hoverState={hoverState}
      >
        <PolarChartBase
          {...props}
          onLayout={onLayout}
          hasMeasuredLayoutSize={hasMeasuredLayoutSize}
          canvasSize={canvasSize}
          isHeadless={isHeadless}
          hoverPointer={hoverPointer}
        />
      </PolarChartProvider>
    </FiberProvider>
  );
};
