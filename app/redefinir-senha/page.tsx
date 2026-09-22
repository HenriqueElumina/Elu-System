import { Suspense } from "react";
import { RedefinirSenhaClient } from "./redefinir-senha-client";

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Redefinir senha</h1>
        </div>
        <Suspense fallback={<p className="text-sm text-gray-500">Carregando...</p>}>
          <RedefinirSenhaClient />
        </Suspense>
      </div>
    </main>
  );
}
