'use client';

import Image from 'next/image';

interface SponsorsSectionProps {
  darkMode?: boolean;
}

export default function SponsorsSection({ darkMode = false }: SponsorsSectionProps) {
  return (
    <section className={`py-6 sm:py-8 border-t border-[var(--apex-line)] ${darkMode ? 'bg-[var(--apex-elevated)]' : 'bg-[var(--apex-surface)]'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center items-center">
          <div className="relative w-full max-w-3xl h-auto opacity-80">
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
