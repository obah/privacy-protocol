"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface Props {
  title: string;
  description: string;
  action: string;
  children: React.ReactNode;
}

export default function DemoWrapper({
  children,
  title,
  description,
  action,
}: Props) {
  const { theme, setTheme } = useTheme();

  const triggerIncognito = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="bg-background relative min-h-screen w-full overflow-x-hidden">
      <div className="border-primary mt-10 h-10 w-screen border-y"></div>
      <section className="relative z-10 container mx-auto flex items-start justify-between gap-10 px-4 pb-20">
        <div className="w-1/2">
          <div className="mb-10 pt-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
            <div className="flex gap-2">
              <p className="text-muted-foreground text-sm">{description}</p>
              <Button
                variant={"link"}
                className="text-primary h-auto p-0 underline"
                onClick={triggerIncognito}
              >
                {theme === "dark"
                  ? `Turn off incognito mode to ${action} publicly`
                  : `Turn on incognito mode to ${action} privately`}
              </Button>
            </div>
          </div>
          {children}
        </div>
        <div className="border-primary h-screen border"></div>
        <div className="w-1/2">
          <div className="mb-10 pt-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Blockchain Explorer
            </h1>
            <p className="text-muted-foreground text-sm">
              Switch between normal and incognito mode to see the difference in
              the transaction logs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
