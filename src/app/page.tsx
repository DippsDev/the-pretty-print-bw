"use client";

import localFont from "next/font/local";

const fsBrabo = localFont({
  src: [
    {
      path: "../fonts/FS Brabo Pro Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/FS Brabo Pro SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/FS Brabo Pro SemiBold Italic.otf",
      weight: "600",
      style: "italic",
    },
  ],
  display: "swap",
});

const WORDMARK = "ThePRETTYPRINT";

export default function Home() {
  return (
    <div className={`relative flex h-[100dvh] w-full flex-col items-center justify-start overflow-hidden px-4 pt-[34vh] sm:px-6 md:pt-[32vh] ${fsBrabo.className}`}>
      <h1
        aria-label={WORDMARK}
        className="relative inline-block max-w-full whitespace-nowrap text-center text-[clamp(1.15rem,7.6vw,5.5rem)] font-semibold tracking-[0.04em] text-black sm:tracking-[0.06em]"
      >
        <span className="sr-only">{WORDMARK}</span>
        <span aria-hidden="true">
          {WORDMARK.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="wordmark-letter"
              style={{ animationDelay: `${index * 0.09}s` }}
            >
              {letter}
            </span>
          ))}
        </span>
        <span
          aria-hidden="true"
          className="wordmark-caret"
          style={{ animationDelay: `${WORDMARK.length * 0.09}s` }}
        />
      </h1>
    </div>
  );
}
