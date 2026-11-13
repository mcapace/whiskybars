'use client';

/*
 * Plain HTML5 video from JW Player's CDN. The JW Player script sent analytics
 * pings to JW Player on page load, before any consent and even with GPC on;
 * the CDN file and poster carry no tracking.
 */
const JW_MEDIA_ID = 'W29EVIFm';
const VIDEO_SRC = `https://cdn.jwplayer.com/videos/${JW_MEDIA_ID}.mp4`;
const POSTER_SRC = `https://cdn.jwplayer.com/v2/media/${JW_MEDIA_ID}/poster.jpg?width=1280`;

export default function JwPlayerEmbed() {
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
        <video
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          title="An Ode to the Whisky Bars"
          className="absolute inset-0 w-full h-full object-contain"
          controls
          playsInline
          preload="none"
        />
      </div>
    </div>
  );
}
