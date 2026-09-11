interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amount: number;
  txId: string;
  description?: string;
}

/**
 * Calcula CRC16-CCITT (0x1021) com valor inicial 0xFFFF conforme especificação do Bacen
 */
function calculateCRC16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo TLV (Tag-Length-Value) EMV
 */
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Gera a string Pix Copia e Cola válida no padrão EMV do Banco Central
 */
export function generatePixCopiaECola(options: PixPayloadOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity = 'SAO PAULO',
    amount,
    txId,
    description = '',
  } = options;

  // Sanitiza nome (sem acentos e caracteres especiais, max 25)
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();

  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();

  // txId pode ter no máximo 25 caracteres alfanuméricos
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 00: Formato do Payload
  const payloadFormat = formatTLV('00', '01');

  // 26: Informações da conta Pix
  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const key = formatTLV('01', pixKey);
  const desc = description ? formatTLV('02', description.substring(0, 40)) : '';
  const merchantAccountInfo = formatTLV('26', `${gui}${key}${desc}`);

  // 52: Código de Categoria do Comerciante
  const merchantCategory = formatTLV('52', '0000');

  // 53: Moeda (986 = BRL)
  const currency = formatTLV('53', '986');

  // 54: Valor da Transação
  const amountStr = amount.toFixed(2);
  const transactionAmount = formatTLV('54', amountStr);

  // 58: Código do País
  const countryCode = formatTLV('58', 'BR');

  // 59: Nome do Beneficiário
  const merchant = formatTLV('59', cleanName);

  // 60: Cidade do Beneficiário
  const city = formatTLV('60', cleanCity);

  // 62: Dados adicionais (txId)
  const referenceLabel = formatTLV('05', cleanTxId);
  const additionalData = formatTLV('62', referenceLabel);

  // 63: Início do CRC16
  const payloadWithoutCRC = `${payloadFormat}${merchantAccountInfo}${merchantCategory}${currency}${transactionAmount}${countryCode}${merchant}${city}${additionalData}6304`;

  // Calcula checksum
  const crc = calculateCRC16(payloadWithoutCRC);

  return `${payloadWithoutCRC}${crc}`;
}
