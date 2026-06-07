import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { PublicFooter } from "@/components/PublicFooter";

export function StaticPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-14">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
        <div className="prose prose-sm mt-8 max-w-none text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:my-3 [&_p]:text-muted-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:my-1">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
