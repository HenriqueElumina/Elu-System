import { renderToBuffer } from "@react-pdf/renderer";
import { ContractDocument, type ContractPdfProps } from "./contract-document";

export async function renderContractPdfBase64(
  props: ContractPdfProps,
): Promise<string> {
  const buffer = await renderToBuffer(<ContractDocument {...props} />);
  return buffer.toString("base64");
}
