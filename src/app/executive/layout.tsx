import ExecutiveLayout from "@/components/layouts/executive-layout";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <ExecutiveLayout>{children}</ExecutiveLayout>;
}
