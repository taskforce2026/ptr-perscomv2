"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function TabGuard({
  abas,
  eComando,
}: {
  abas: string[];
  eComando: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (eComando) return;
    if (path === "/sem-permissao" || path === "/conta" || path.startsWith("/conta/")) return;
    const ok = abas.some((a) => (a === "/" ? path === "/" : path === a || path.startsWith(`${a}/`)));
    if (!ok) router.replace("/sem-permissao");
  }, [path, abas, eComando, router]);
  return null;
}
