/**
 * Validates a Portuguese NIF (Número de Identificação Fiscal)
 * @param {string|number} nif 
 * @returns {boolean}
 */
export const isValidNIF = (nif) => {
  if (!nif) return false;
  const sNif = String(nif);
  
  if (!/^[0-9]{9}$/.test(sNif)) return false;

  const firstDigits = ['1', '2', '3', '5', '6', '8', '9'];
  if (!firstDigits.includes(sNif[0])) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(sNif[i]) * (9 - i);
  }

  const remainder = sum % 11;
  let checkDigit = remainder < 2 ? 0 : 11 - remainder;
  if (checkDigit >= 10) checkDigit = 0;

  return Number(sNif[8]) === checkDigit;
};
