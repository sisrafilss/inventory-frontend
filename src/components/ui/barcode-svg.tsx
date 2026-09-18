'use client';

import React from 'react';

// Code128 pattern dictionary for numeric and alphanumeric barcode generation
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211312',
  '231112', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '313112', '331121', '312113', '312311', '332111', '314111', '221411', '431111',
  '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412',
  '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112',
  '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212',
  '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141',
  '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131',
  '211412', '211214', '211232', '2331112' // Stop code
];

function encodeCode128(text: string): string[] {
  if (!text) return [];
  // Use Code128 Code B (Start B = 104)
  const codeSequence: number[] = [104];
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codeSequence.push(value);
    checksum += value * (i + 1);
  }

  const checkValue = checksum % 103;
  codeSequence.push(checkValue);
  codeSequence.push(106); // Stop code (index 106)

  return codeSequence.map((val) => CODE128_PATTERNS[val] || CODE128_PATTERNS[0]);
}

interface BarcodeSVGProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export function BarcodeSVG({
  value,
  width = 1.8,
  height = 50,
  showText = true,
  className = '',
}: BarcodeSVGProps) {
  if (!value) return null;

  // Safe bar width: if a large number (e.g. > 10) was mistakenly passed as container px width, clamp to standard 1.5px
  const safeBarWidth = width > 10 ? 1.5 : (width || 1.8);

  const patterns = encodeCode128(value);
  let currentX = 10;
  const bars: { x: number; width: number }[] = [];

  patterns.forEach((pattern) => {
    let isBar = true;
    for (let i = 0; i < pattern.length; i++) {
      const barWidth = parseInt(pattern[i], 10) * safeBarWidth;
      if (isBar) {
        bars.push({ x: currentX, width: barWidth });
      }
      currentX += barWidth;
      isBar = !isBar;
    }
  });

  const totalWidth = currentX + 10;
  const svgHeight = showText ? height + 20 : height;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={svgHeight}
        viewBox={`0 0 ${totalWidth} ${svgHeight}`}
        className="overflow-visible"
      >
        <rect width={totalWidth} height={svgHeight} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={5}
            width={bar.width}
            height={height}
            fill="#000000"
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 16}
            textAnchor="middle"
            fill="#000000"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}
