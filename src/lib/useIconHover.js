import { useCallback, useRef } from "react";

// The real lucide-animated icon components only animate on their own hover
// by default, which only fires when the cursor is exactly over the small
// icon glyph - not over the button/row it sits inside. Attaching a ref
// switches the icon into "externally controlled" mode (see each icon's
// isControlledRef check), so the *parent* button can drive the animation via
// onMouseEnter/onMouseLeave over its own, much larger, hit area instead.
export function useIconHover() {
  const ref = useRef(null);
  const onMouseEnter = useCallback(() => ref.current?.startAnimation?.(), []);
  const onMouseLeave = useCallback(() => ref.current?.stopAnimation?.(), []);
  return { ref, onMouseEnter, onMouseLeave };
}
