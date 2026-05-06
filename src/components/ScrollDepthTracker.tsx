"use client";

import { useScrollDepth } from "@/hooks/useScrollDepth";

export default function ScrollDepthTracker() {
  useScrollDepth();
  return null;
}
