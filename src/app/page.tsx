export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="w-full px-8 py-5 flex items-center justify-between bg-obsidian border-b border-steel-dark">
        <span className="text-wake text-xl font-semibold tracking-widest uppercase">
          NorthWake Marine
        </span>
        <div className="flex gap-8 text-sm text-steel-light tracking-wide uppercase">
          <a href="#" className="hover:text-wake transition-colors">Home</a>
          <a href="#" className="hover:text-wake transition-colors">About</a>
          <a href="#" className="hover:text-wake transition-colors">Services</a>
          <a href="#" className="hover:text-wake transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center bg-obsidian text-center px-8 py-32 gap-8">
        <p className="text-navy text-sm tracking-[0.3em] uppercase font-medium">
          Jacksonville&apos;s Premier Maritime Partner
        </p>
        <h1 className="text-wake text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl">
          Hello, NorthWake
        </h1>
        <p className="text-steel-light text-lg max-w-xl leading-relaxed">
          Expert vessel service, meticulous care, and unmatched expertise — built
          for those who demand the best on the water.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <a
            href="#"
            className="px-8 py-3 bg-navy text-wake text-sm font-semibold tracking-widest uppercase hover:bg-navy-light transition-colors"
          >
            Get in Touch
          </a>
          <a
            href="#"
            className="px-8 py-3 border border-steel text-steel-light text-sm font-semibold tracking-widest uppercase hover:border-wake hover:text-wake transition-colors"
          >
            Our Services
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-8 py-6 bg-obsidian border-t border-steel-dark text-center text-steel text-xs tracking-wide">
        © {new Date().getFullYear()} NorthWake Marine — Jacksonville, FL
      </footer>
    </main>
  );
}
