import * as React from "react";
import { type Color } from "react-native-skia";
import { useAnimatedReaction } from "react-native-reanimated";
import { PieSlice, type PieSliceData } from "./PieSlice";
import { handleTranslateInnerRadius } from "./utils/innerRadius";
import { getPieLayout } from "./utils/pieLayout";
import { PieSliceProvider } from "./contexts/PieSliceContext";
import { usePolarChartContext } from "../polar/contexts/PolarChartContext";

const CIRCLE_SWEEP_DEGREES = 360;

type PieChartProps = {
  children?: (args: { slice: PieSliceData }) => React.ReactNode;
  innerRadius?: number | string;
  circleSweepDegrees?: number;
  startAngle?: number;
  size?: number;
};

export const PieChart = (props: PieChartProps) => {
  const {
    innerRadius = 0,
    circleSweepDegrees = CIRCLE_SWEEP_DEGREES,
    startAngle: _startAngle = 0,
    children,
    size,
  } = props;
  const {
    canvasSize,
    data: _data,
    labelKey,
    valueKey,
    colorKey,
  } = usePolarChartContext();

  // The sum all the slices' values
  const totalCircleValue = _data.reduce(
    (sum, entry) => sum + Number(entry[valueKey]),
    0,
  );

  const { center, radius } = getPieLayout({ canvasSize, size });

  const data = React.useMemo(() => {
    let startAngle = _startAngle; // Initialize the start angle for the first slice

    const enhanced = _data.map((datum): PieSliceData => {
      const sliceValue = datum[valueKey] as number;
      const sliceLabel = datum[labelKey] as string;
      const sliceColor = datum[colorKey] as Color;

      const initialStartAngle = startAngle; // grab the initial start angle
      const sweepAngle = (sliceValue / totalCircleValue) * circleSweepDegrees; // Calculate the sweep angle for the slice as a part of the entire pie
      const endAngle = initialStartAngle + sweepAngle; // the sum of sweep + start

      startAngle += sweepAngle; // the next startAngle is the accumulation of each sweep
      return {
        value: sliceValue,
        label: sliceLabel,
        color: sliceColor,
        innerRadius: handleTranslateInnerRadius(innerRadius, radius),
        startAngle: initialStartAngle,
        endAngle: endAngle,
        sweepAngle,
        sliceIsEntireCircle:
          sweepAngle === CIRCLE_SWEEP_DEGREES || _data.length === 1,
        radius,
        center,
      };
    });

    return enhanced;
  }, [
    valueKey,
    _data,
    totalCircleValue,
    colorKey,
    labelKey,
    radius,
    center,
    innerRadius,
    circleSweepDegrees,
    _startAngle,
  ]);

  /**
   * Hover support (see `enableHover` on `PolarChart`):
   * The polar chart exposes the raw pointer position while the pointer is over
   * the chart; here we map that position onto the slice geometry above to
   * determine the hovered slice index (or -1 when the pointer is outside the
   * pie / donut, in the hole, or off the chart entirely).
   */
  const { hoverPointer, hoverState } = usePolarChartContext();
  useAnimatedReaction(
    () => hoverPointer?.value ?? null,
    (pointer) => {
      "worklet";
      if (!hoverState) return;

      if (!pointer) {
        hoverState.index.value = -1;
        return;
      }

      const dx = pointer.x - center.x;
      const dy = pointer.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        hoverState.index.value = -1;
        return;
      }

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      // Pointer angle relative to the chart's start angle, wrapped into
      // [0, 360) so it can be compared against unwrapped slice angles.
      let rel = angle - _startAngle;
      rel = ((rel % 360) + 360) % 360;
      if (rel > circleSweepDegrees) {
        hoverState.index.value = -1;
        return;
      }

      let hoveredIndex = -1;
      for (let i = 0; i < data.length; i++) {
        const slice = data[i];
        if (!slice) continue;
        if (dist < slice.innerRadius || dist > slice.radius) continue;
        const sliceStart = slice.startAngle - _startAngle;
        if (rel >= sliceStart && rel <= sliceStart + slice.sweepAngle) {
          hoveredIndex = i;
          break;
        }
      }

      hoverState.index.value = hoveredIndex;
    },
  );

  return (
    <>
      {data.map((slice, index) => {
        return (
          <PieSliceProvider key={index} slice={slice}>
            {children ? children({ slice }) : <PieSlice />}
          </PieSliceProvider>
        );
      })}
    </>
  );
};
