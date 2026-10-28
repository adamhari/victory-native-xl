import React, {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";
import type { SharedValue } from "react-native-reanimated";
import type { PieHoverState } from "../../types";

/** Chart-space pointer position while hovering (`null` otherwise). */
export type PolarHoverPointer = { x: number; y: number } | null;

interface PolarChartContext {
  data: Record<string, unknown>[];
  canvasSize: { width: number; height: number };
  labelKey: string;
  valueKey: string;
  colorKey: string;
  hoverPointer?: SharedValue<PolarHoverPointer>;
  hoverState?: PieHoverState;
}

const PolarChartContext = createContext<PolarChartContext | undefined>(
  undefined,
);

interface PolarChartProviderProps {
  data: Record<string, unknown>[];
  canvasSize: { width: number; height: number };
  labelKey: string;
  valueKey: string;
  colorKey: string;
  hoverPointer?: SharedValue<PolarHoverPointer>;
  hoverState?: PieHoverState;
}

export const PolarChartProvider = (
  props: PropsWithChildren<PolarChartProviderProps>,
) => {
  const {
    children,
    data,
    canvasSize,
    labelKey,
    valueKey,
    colorKey,
    hoverPointer,
    hoverState,
  } = props;

  return (
    <PolarChartContext.Provider
      value={{
        data,
        canvasSize,
        labelKey,
        valueKey,
        colorKey,
        hoverPointer,
        hoverState,
      }}
    >
      {children}
    </PolarChartContext.Provider>
  );
};

export const usePolarChartContext = () => {
  const context = useContext(PolarChartContext);

  if (context === undefined) {
    throw new Error(
      "usePolarChartContext must be used within a PolarChartProvider",
    );
  }

  return context;
};
