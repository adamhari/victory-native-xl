---
"victory-native": minor
---

Add hover gesture support.

- `CartesianChart`: pass `enableHover` (optionally along with `chartHoverConfig={{ activeCursor }}`) together with `chartPressState` to keep the press value updated — and `isActive` true — while the pointer, e.g. a mouse on web or desktop, hovers over the chart. Hover is implemented with the `Gesture.Hover()` API from React Native Gesture Handler and is composed simultaneously with the press and transform gestures.
- `PolarChart`: pass `enableHover` (and optionally `chartHoverConfig`) together with `hoverState={{ index }}` — a Reanimated shared value — to receive the index of the hovered data point (slice), or `-1` when the pointer is over the donut hole, outside the pie, or off the chart entirely.
