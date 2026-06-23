import type { Metadata } from "next";
import SetPasswordClient from "./SetPasswordClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SetPasswordPage() {
  return <SetPasswordClient />;
}
