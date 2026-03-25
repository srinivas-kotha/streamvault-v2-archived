// Shared IntersectionObserver singleton to avoid creating multiple observers.
// Observer pool is intentionally unbounded — in practice limited to 2-3 entries
// (one per unique rootMargin/threshold combo used in the app). Elements are tracked
// via WeakMap for automatic GC when removed from DOM.
const observerMap = new Map<string, IntersectionObserver>();
const callbacks = new WeakMap<
  Element,
  (entry: IntersectionObserverEntry) => void
>();

function getObserver(
  options: IntersectionObserverInit = {},
): IntersectionObserver {
  const key = JSON.stringify({
    root: null,
    rootMargin: options.rootMargin ?? "200px 0px",
    threshold: options.threshold ?? 0,
  });

  if (!observerMap.has(key)) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cb = callbacks.get(entry.target);
          if (cb) cb(entry);
        });
      },
      {
        root: null,
        rootMargin: options.rootMargin ?? "200px 0px",
        threshold: options.threshold ?? 0,
      },
    );
    observerMap.set(key, observer);
  }

  return observerMap.get(key)!;
}

export function observe(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit,
): () => void {
  const observer = getObserver(options);
  callbacks.set(element, callback);
  observer.observe(element);

  return () => {
    observer.unobserve(element);
    callbacks.delete(element);
  };
}
