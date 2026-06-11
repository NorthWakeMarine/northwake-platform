export default function HeroAmbientGlow() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="hero-ambient-glow absolute top-1/4 left-1/2 w-[75vw] h-[75vw] max-w-[1000px] max-h-[1000px] -translate-x-1/2 -translate-y-1/4 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(110, 130, 255, 0.7) 0%, rgba(40, 60, 200, 0.55) 30%, rgba(0, 0, 128, 0.3) 55%, rgba(0, 0, 80, 0) 75%)",
          mixBlendMode: "screen",
          opacity: 0.42,
          filter: "blur(50px)",
          animation: "ambient-drift 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}
