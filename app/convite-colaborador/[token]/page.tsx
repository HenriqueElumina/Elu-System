import { ConviteColaboradorClient } from "./convite-colaborador-client";

export default async function ConviteColaboradorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Bem-vindo(a) à Elumina Partners</h1>
        <p className="text-sm text-gray-500">
          Crie sua conta de acesso ao Elu System.
        </p>
      </div>
      <ConviteColaboradorClient token={token} />
    </main>
  );
}
