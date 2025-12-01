'use client';

import Image from 'next/image';

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
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1400&h=600&fit=crop"
            alt="An Ode to the Whisky Bar"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 text-left">
            <div className="max-w-xl">
              <p className="font-serif text-white text-2xl sm:text-3xl italic">
                "Whisky is liquid sunshine."
              </p>
              <p className="text-white/80 mt-2">— George Bernard Shaw</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
