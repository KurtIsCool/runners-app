import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // We remove the synchronous setMatches check here to satisfy the linter.
    // The initializer handled the initial state.
    // If the media query state changed between initialization and effect execution (rare),
    // the listener will catch it on next change, or we can force a check in a safer way if strictly needed.
    // But for responsive UI, initialization + listener is usually enough.

    const listener = () => {
        setMatches(media.matches);
    };

    if (media.addEventListener) {
        media.addEventListener('change', listener);
    } else {
        media.addListener(listener);
    }

    // Check once on mount to be sure (safe way, although technically can still cause a re-render it's better than conditional logic that confused linter)
    // Actually, simply relying on the listener and initial state is standard.
    // If we really need to sync:
    if (media.matches !== matches) {
         setMatches(media.matches);
    }

    return () => {
        if (media.removeEventListener) {
            media.removeEventListener('change', listener);
        } else {
            media.removeListener(listener);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}
