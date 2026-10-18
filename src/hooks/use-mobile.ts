import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * True below the mobile breakpoint. Used to swap overlays that have
 * touch-first and pointer-first shapes (drawer vs dialog).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    query.addEventListener("change", onChange);
    onChange();
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isMobile ?? false;
}
