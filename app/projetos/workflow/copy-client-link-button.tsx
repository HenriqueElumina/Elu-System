"use client";

import { useState } from "react";

export function CopyClientLinkButton({ demandId }: { demandId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/portal/${demandId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API pode falhar (contexto não seguro, permissão negada) --
      // mostra o link pra copiar na mão em vez de falhar silenciosamente.
      window.prompt("Copie o link pra mandar ao cliente:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium"
    >
      {copied ? "Link copiado!" : "Copiar link para o cliente"}
    </button>
  );
}
