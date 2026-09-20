-- Onda 1, Etapa 1.8 (correção) — guardar o link do boleto na criação.
--
-- "Ver boleto" buscava um link novo a cada clique (GET /v1/charge/:id),
-- por cautela achando que pudesse expirar como o PDF do ZapSign. No
-- teste real, a resposta de detalhe da cobrança não trouxe o link no
-- mesmo formato da resposta de criação (que já confirmei que traz
-- link/pdf.charge direto) -- então virou fonte de outro campo pra
-- adivinhar. Mais simples e mais confiável: guardar o link já na hora
-- que o boleto é criado, sem depender do formato de detalhe.

alter table invoice
  add column boleto_url text;
