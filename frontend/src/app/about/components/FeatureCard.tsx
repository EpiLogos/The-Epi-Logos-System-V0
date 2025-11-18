'use client';

import React from 'react';
import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  benefits?: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}

export function FeatureCard({
  title,
  description,
  benefits,
  imageSrc,
  imageAlt,
  reverse = false
}: FeatureCardProps) {
  return (
    <div
      className={`flex flex-col ${
        reverse ? 'md:flex-row-reverse' : 'md:flex-row'
      } gap-8 items-center mb-16`}
    >
      {/* Image */}
      <div className="w-full md:w-1/3 flex-shrink-0">
        <div className="relative w-full aspect-square border border-gray-700 rounded-sm overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Text Content */}
      <div className="w-full md:w-2/3">
        <h3 className="text-xl font-normal tracking-[2px] text-white mb-4">
          {title}
        </h3>
        <p className="text-base text-gray-300 leading-[1.8] mb-4 tracking-[0.5px]">
          {description}
        </p>

        {benefits && benefits.length > 0 && (
          <ul className="space-y-2">
            {benefits.map((benefit, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-400 flex items-start gap-2"
              >
                <span className="text-gray-600">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
