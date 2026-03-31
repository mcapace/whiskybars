'use client';

import { useEffect, useRef } from 'react';

const PLAYER_SRC = 'https://cdn.jwplayer.com/players/W29EVIFm-w6TeWEoR.js';
/** Must match JW embed — pre-created so the loader skips document.write */
const CONTAINER_ID = 'botr_W29EVIFm_w6TeWEoR_div';

export default function JwPlayerEmbed() {
  const scriptEl = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (document.querySelector(`script[src="${PLAYER_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = PLAYER_SRC;
    script.async = true;
    scriptEl.current = script;
    document.body.appendChild(script);

    return () => {
      try {
        const w = window as typeof window & { jwplayer?: (id: string) => { remove?: () => void } };
        w.jwplayer?.(CONTAINER_ID)?.remove?.();
      } catch {
        /* noop */
      }
      scriptEl.current?.remove();
      scriptEl.current = null;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-16 sm:mt-20 pt-16 sm:pt-20 border-t border-gray-200/80">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="font-serif text-3xl sm:text-4xl font-medium text-gray-900">
          An Ode to the Whisky Bars
        </h2>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg bg-black"
        style={{ aspectRatio: '16 / 9' }}
      >
        <div id={CONTAINER_ID} className="absolute inset-0 w-full h-full [&_.jwplayer]:!h-full" />
      </div>
    </div>
  );
}
