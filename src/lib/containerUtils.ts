/**
 * Mapeamento de letras para valores numéricos conforme a norma ISO 6346.
 * A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
 * 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38
 * (O valor 11 e múltiplos de 11 são pulados)
 */
const CHAR_TO_VALUE: { [key: string]: number } = {
  'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20,
  'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29, 'S': 30, 'T': 31,
  'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38,
};

/**
 * Calcula o dígito de checagem (11º dígito) para os primeiros 10 caracteres de um número de container.
 * @param containerPrefix Os primeiros 10 caracteres (4 letras + 6 dígitos + 1 dígito de checagem).
 * @returns O dígito de checagem calculado (0-9).
 */
export function calculateCheckDigit(containerPrefix: string): number | null {
  if (containerPrefix.length !== 10) {
    return null;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = containerPrefix[i];
    let value: number;

    if (i < 4) {
      // Primeiras 4 letras
      value = CHAR_TO_VALUE[char];
      if (!value) return null; // Caractere inválido
    } else {
      // Próximos 6 dígitos
      value = parseInt(char, 10);
      if (isNaN(value)) return null; // Não é um dígito
    }

    // Multiplica pelo peso (2^i)
    const weight = Math.pow(2, i);
    sum += value * weight;
  }

  // O dígito de checagem é o resto da divisão por 11.
  const remainder = sum % 11;
  
  // Se o resto for 10, o dígito de checagem é 0. Caso contrário, é o próprio resto.
  return remainder === 10 ? 0 : remainder;
}

/**
 * Valida e corrige um número de container de 11 caracteres.
 * Se o número tiver 11 caracteres, ele verifica se o dígito de checagem está correto.
 * Se o número tiver 10 caracteres, ele calcula e anexa o dígito de checagem.
 * @param containerNumber O número do container (10 ou 11 caracteres).
 * @returns O número de container corrigido e validado (11 caracteres) ou null se for inválido.
 */
export function validateAndCorrectContainer(containerNumber: string): string | null {
  const cleaned = containerNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length < 10 || cleaned.length > 11) {
    return null;
  }

  const prefix = cleaned.substring(0, 10);
  const calculatedDigit = calculateCheckDigit(prefix);

  if (calculatedDigit === null) {
    return null; // Prefixo inválido (contém caracteres não mapeados)
  }

  if (cleaned.length === 11) {
    const providedDigit = parseInt(cleaned[10], 10);
    
    if (providedDigit === calculatedDigit) {
      return cleaned; // Válido
    } else {
      // Incorreto, mas podemos corrigir se o prefixo estiver certo
      return prefix + calculatedDigit.toString();
    }
  }

  if (cleaned.length === 10) {
    // Apenas 10 caracteres lidos, anexa o dígito calculado
    return prefix + calculatedDigit.toString();
  }

  return null;
}

/**
 * Verifica se um container foi devolvido com base na data de saída SJP ou status.
 * @param container O objeto Container.
 * @returns true se devolvido, false caso contrário.
 */
export function isContainerDevolvido(container: { dataSaidaSJP?: string | null; status?: string | null }): boolean {
    const dataSaida = String(container.dataSaidaSJP || '').trim().toUpperCase();
    
    // Critério 1: Data de Saída SJP preenchida E não é "EMPATIO"
    if (dataSaida !== "" && dataSaida !== "EMPATIO") {
        return true;
    }
    
    // Critério 2: Status indica devolução (fallback)
    const statusLower = String(container.status || '').toLowerCase();
    return statusLower.includes("ok") || statusLower.includes("devolvido");
}