export const isEncrypted = (message: string) => {
  if (typeof message !== "string") return false;

  const [ivHex, encryptedData] = message.split(":");

  // Verifica se ambos os valores existem
  if (!ivHex || !encryptedData) return false;

  // Verifica se o IV tem 32 caracteres e é um valor hexadecimal válido
  return /^[0-9A-Fa-f]{32}$/.test(ivHex) && encryptedData.length > 0;
};
