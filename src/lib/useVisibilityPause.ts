import { useEffect, useState, type RefObject } from "react";

export function useVisibilityPause(ref: RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let inView = false;
    let pageVisible = document.visibilityState === "visible";

    const sync = () => setVisible(inView && pageVisible);

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );

    observer.observe(element);

    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
      sync();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [ref]);

  return visible;
}
