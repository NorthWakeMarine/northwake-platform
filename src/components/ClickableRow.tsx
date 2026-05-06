"use client";

import { useRouter } from "next/navigation";

export default function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        router.push(href);
      }}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}
