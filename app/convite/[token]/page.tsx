import { ConviteClient } from "./convite-client";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Cadastro de cliente</h1>
        <p className="text-sm text-gray-500">
          Preencha os dados da sua empresa para a Elumina Partners.
        </p>
      </div>
      <ConviteClient token={token} />
    </main>
  );
}
