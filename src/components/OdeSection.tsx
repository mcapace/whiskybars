'use client';

export default function OdeSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl font-medium text-gray-900 mb-4">
          An Ode to the Whisky Bar
        </h2>
        <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
          A visual tribute to the culture, character and charm of America's top whisky bars.
        </p>
        <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src="https://cdn.jwplayer.com/players/NyYwjSUW-w6TeWEoR.html"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="auto"
            title="An Ode to the Whisky Bar"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
