"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 420, damping: 28 };

export default function HeroDesktopNav() {
  return (
    <div className="hidden md:flex gap-4 justify-center">
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
        <Link
          href="/services"
          className="block border border-white/60 text-white text-xs font-semibold tracking-[0.3em] uppercase px-6 py-3 hover:border-white hover:text-white transition-colors duration-300 hero-text-shadow"
        >
          View Services
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
        <Link
          href="/about"
          className="block text-white/70 text-xs font-semibold tracking-[0.3em] uppercase px-6 py-3 hover:text-white transition-colors duration-300 hero-text-shadow"
        >
          About Us
        </Link>
      </motion.div>
    </div>
  );
}
