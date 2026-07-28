/**
 * Animated overlay shown over the captured badge while OCR runs: a viewfinder
 * frame, a breathing brand-green tint, a glowing scan line sweeping down the
 * image, and a "Reading badge" label with bouncing dots.
 */
export function ScanningOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      {/* Breathing tint */}
      <div className="absolute inset-0 animate-scanpulse bg-brand mix-blend-multiply" />

      {/* Viewfinder corner brackets */}
      {[
        "left-2 top-2 border-l-2 border-t-2",
        "right-2 top-2 border-r-2 border-t-2",
        "left-2 bottom-2 border-l-2 border-b-2",
        "right-2 bottom-2 border-r-2 border-b-2",
      ].map((pos) => (
        <div key={pos} className={`absolute h-6 w-6 border-white/90 ${pos}`} />
      ))}

      {/* Glowing scan line sweeping top → bottom */}
      <div className="absolute left-0 right-0 top-0 animate-scanline">
        <div className="h-0.5 -translate-y-1/2 bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.9)]" />
        <div className="h-10 -translate-y-full bg-gradient-to-b from-transparent to-brand/50" />
      </div>

      {/* Label */}
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 text-sm font-semibold text-white drop-shadow">
        <span>Reading badge</span>
        <span className="flex gap-0.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1 w-1 animate-bounce rounded-full bg-white"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
