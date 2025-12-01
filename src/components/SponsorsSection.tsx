'use client';

import Image from 'next/image';

export default function SponsorsSection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-xs uppercase tracking-[3px] text-gray-500 font-semibold mb-8">
          Proud Sponsors
        </h3>
        <div className="flex justify-center items-center gap-12 sm:gap-16 flex-wrap">
          <div className="relative h-16 w-40">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Maker%27s_Mark_logo.svg/200px-Maker%27s_Mark_logo.svg.png"
              alt="Maker's Mark"
              fill
              className="object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
