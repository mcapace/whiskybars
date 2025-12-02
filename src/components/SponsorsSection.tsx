'use client';

import Image from 'next/image';

export default function SponsorsSection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-xs uppercase tracking-[3px] text-gray-500 font-semibold mb-8">
          Proud Sponsors
        </h3>
        <div className="flex justify-center items-center">
          <div className="relative w-full max-w-5xl h-auto">
            <Image
              src="/logos /Logos Bars Page.png"
              alt="Whisky Advocate Partners"
              width={1200}
              height={400}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
