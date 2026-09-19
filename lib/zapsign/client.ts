// Camada de adaptação pro ZapSign (CLAUDE.md, regra 7) -- se um dia
// trocarmos de provedor de assinatura digital, só este arquivo muda.
// Detalhes de API confirmados em docs.zapsign.com.br (setembro/2026):
// POST /api/v1/docs/ cria documento a partir de PDF em base64;
// GET /api/v1/docs/{token}/ consulta status ("pending" | "signed" | ...).

type ZapSignSigner = {
  name: string;
  email: string;
};

type CreateDocumentInput = {
  name: string;
  base64Pdf: string;
  signers: ZapSignSigner[];
};

type ZapSignDocumentResponse = {
  token: string;
  status: string;
  signers: Array<{
    token: string;
    sign_url: string;
    name: string;
    email: string;
    status: string;
  }>;
};

function baseUrl(): string {
  return process.env.ZAPSIGN_API_BASE_URL ?? "https://api.zapsign.com.br";
}

function apiToken(): string {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) throw new Error("ZAPSIGN_API_TOKEN não configurado.");
  return token;
}

async function zapSignFetch(path: string, init: RequestInit) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ZapSign respondeu ${response.status}: ${body}`);
  }

  return response.json();
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<ZapSignDocumentResponse> {
  return zapSignFetch("/api/v1/docs/", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      base64_pdf: input.base64Pdf,
      signers: input.signers,
      send_automatic_email: true,
    }),
  });
}

export async function getDocument(
  token: string,
): Promise<ZapSignDocumentResponse> {
  return zapSignFetch(`/api/v1/docs/${token}/`, { method: "GET" });
}
