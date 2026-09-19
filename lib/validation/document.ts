function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  for (const checkPosition of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < checkPosition; i++) {
      sum += digits[i]! * (checkPosition + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    const expected = remainder === 10 ? 0 : remainder;
    if (expected !== digits[checkPosition]) return false;
  }

  return true;
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split("").map(Number);
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  function calculateCheckDigit(base: number[], weights: number[]): number {
    const sum = base.reduce((acc, digit, i) => acc + digit * weights[i]!, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstCheck = calculateCheckDigit(digits.slice(0, 12), weightsFirst);
  if (firstCheck !== digits[12]) return false;

  const secondCheck = calculateCheckDigit(digits.slice(0, 13), weightsSecond);
  if (secondCheck !== digits[13]) return false;

  return true;
}

export function isValidDocument(
  value: string,
  type: "cpf" | "cnpj",
): boolean {
  return type === "cpf" ? isValidCPF(value) : isValidCNPJ(value);
}
