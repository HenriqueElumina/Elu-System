// Camada de adaptação pra Efí (CLAUDE.md, regra 7) -- se um dia trocarmos
// de provedor de boleto/Pix, só este arquivo muda.
// Detalhes confirmados via busca (docs oficiais bloqueadas nesta sessão,
// mesma situação do ZapSign na Etapa 1.5) -- primeiro teste real é quem
// confirma de verdade. Ver ADR 0011.
//
// Autenticação é OAuth2 + certificado mTLS (não é só um token como o
// ZapSign): o certificado precisa estar presente em toda chamada,
// inclusive a de autorização. Por isso usamos node:https em vez de
// fetch -- dá controle direto sobre o agente TLS (pfx/passphrase).

import { request } from "node:https";

type EfiTokenResponse = {
  access_token: string;
};

export type EfiChargeResponse = {
  charge_id: number;
  status: string;
  total: number;
  expire_at: string;
  barcode?: string;
  link?: string;
  pdf?: { charge?: string };
};

export type EfiCustomer = {
  name: string;
  documentType: "cpf" | "cnpj";
  document: string;
  email: string | null;
  phone: string | null;
};

export type CreateBoletoInput = {
  invoiceId: string;
  amountCents: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
  customer: EfiCustomer;
  notificationUrl: string;
};

function isSandbox(): boolean {
  // Default seguro: só usa produção se EFI_SANDBOX="false" explicitamente.
  return process.env.EFI_SANDBOX !== "false";
}

function baseHost(): string {
  return isSandbox()
    ? "cobrancas-h.api.efipay.com.br"
    : "cobrancas.api.efipay.com.br";
}

function certificateOptions() {
  const pfxBase64 = process.env.EFI_CERTIFICATE_BASE64;
  if (!pfxBase64) {
    throw new Error("EFI_CERTIFICATE_BASE64 não configurado.");
  }
  return {
    pfx: Buffer.from(pfxBase64, "base64"),
    passphrase: process.env.EFI_CERTIFICATE_PASSPHRASE || undefined,
  };
}

function efiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      const clientId = process.env.EFI_CLIENT_ID;
      const clientSecret = process.env.EFI_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        reject(new Error("EFI_CLIENT_ID/EFI_CLIENT_SECRET não configurados."));
        return;
      }
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    }
    if (payload) {
      headers["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    let certOptions;
    try {
      certOptions = certificateOptions();
    } catch (err) {
      reject(err);
      return;
    }

    const req = request(
      {
        host: baseHost(),
        path,
        method,
        headers,
        ...certOptions,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`Efí respondeu ${res.statusCode}: ${raw}`));
            return;
          }
          try {
            resolve((raw ? JSON.parse(raw) : {}) as T);
          } catch {
            reject(new Error(`Efí respondeu com corpo inesperado: ${raw}`));
          }
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getAccessToken(): Promise<string> {
  const data = await efiRequest<EfiTokenResponse>("POST", "/v1/authorize", {
    grant_type: "client_credentials",
  });
  return data.access_token;
}

// A Efí exige telefone só com dígitos, sem código de país, no formato
// DDD (2) + 9 opcional + número (8): ^[1-9]{2}9?[0-9]{8}$. O cadastro de
// cliente (Etapa 1.1) guarda o telefone como texto livre (com
// parênteses/traço, às vezes com +55), então precisa limpar aqui.
export function sanitizePhoneNumber(phone: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return /^[1-9]{2}9?[0-9]{8}$/.test(digits) ? digits : undefined;
}

export async function createBoleto(
  input: CreateBoletoInput,
): Promise<EfiChargeResponse> {
  const token = await getAccessToken();

  const bankingBillet: Record<string, unknown> = {
    expire_at: input.dueDate,
    customer: {
      name: input.customer.name,
      email: input.customer.email ?? undefined,
      phone_number: sanitizePhoneNumber(input.customer.phone),
      ...(input.customer.documentType === "cpf"
        ? { cpf: input.customer.document }
        : {}),
    },
  };

  // Pessoa jurídica vai num objeto à parte (juridical_person), junto do
  // customer -- cpf não se aplica nesse caso.
  if (input.customer.documentType === "cnpj") {
    bankingBillet.juridical_person = {
      corporate_name: input.customer.name,
      cnpj: input.customer.document,
    };
  }

  const body = {
    items: [{ name: input.description, value: input.amountCents, amount: 1 }],
    payment: { banking_billet: bankingBillet },
    metadata: {
      custom_id: input.invoiceId,
      notification_url: input.notificationUrl,
    },
  };

  return efiRequest<EfiChargeResponse>(
    "POST",
    "/v1/charge/one-step",
    body,
    token,
  );
}

export async function getCharge(chargeId: string): Promise<EfiChargeResponse> {
  const token = await getAccessToken();
  return efiRequest<EfiChargeResponse>(
    "GET",
    `/v1/charge/${chargeId}`,
    undefined,
    token,
  );
}

// A notificação que chega no webhook só traz um token -- este endpoint
// resolve quais cobranças mudaram de status. Formato exato da resposta
// não confirmado contra a API real ainda (ver ADR 0011); tenta os nomes
// de campo mais prováveis em vez de travar num só.
export async function resolveNotification(token: string): Promise<string[]> {
  const accessToken = await getAccessToken();
  const data = await efiRequest<Record<string, unknown>>(
    "GET",
    `/v1/notification/${token}`,
    undefined,
    accessToken,
  );

  const identifiers = data.identifiers ?? data.data ?? data.charge_ids;
  if (Array.isArray(identifiers)) {
    return identifiers.map(String);
  }
  return [];
}
