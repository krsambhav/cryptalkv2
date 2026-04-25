import type { ReactNode } from "react";
import { BrandPanel } from "@/components/auth/BrandPanel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.2fr_1fr]">
      <BrandPanel />
      <section className="flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto">{children}</div>
      </section>
    </main>
  );
}
