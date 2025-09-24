
export const getNumberId = (number: string): string => {
    const numberStr = number.toString();
    // Verifica se o número tem exatamente 12 dígitos
    if (numberStr.length !== 12) {
        return '';
    }
    // Retorna o número no formato desejado
    return `${numberStr}@c.us`;
}