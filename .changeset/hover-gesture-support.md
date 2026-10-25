---
"victory-native": minor
---

Add hover gesture support to `CartesianChart`. Pass `enableHover` (optionally along with `chartHoverConfig={{ activeCursor }}`) together with `chartPressState` to keep the press value updated — and `isActive` true — while the pointer, e.g. a mouse on web or desktop, hovers over the chart. Hover is implemented with the `Gesture.Hover()` API from React Native Gesture Handler and is composed simultaneously with the press and transform gestures.
