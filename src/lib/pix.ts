// Generates a Pix "copia e cola" EMV payload (BR Code) for a static key + dynamic amount.
function tlv(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function sanitize(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

// The Central Bank's Pix key registry (DICT) expects a specific format per key
// type — a raw phone number without the "+55" country code won't resolve and
// the receiving bank app rejects the whole payload as invalid.
export function formatPixKey(key: string, type: PixKeyType | undefined) {
  const trimmed = key.trim();
  if (type === "cpf" || type === "cnpj") return trimmed.replace(/\D/g, "");
  if (type === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
    return `+${withCountryCode}`;
  }
  if (type === "email") return trimmed.toLowerCase();
  return trimmed;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({
  pixKey,
  amount,
  merchantName,
  merchantCity,
  txid = "***",
}: {
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  txid?: string;
}) {
  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey);

  const payload =
    tlv("00", "01") + // payload format indicator
    tlv("26", merchantAccountInfo) + // merchant account info (pix)
    tlv("52", "0000") + // merchant category code
    tlv("53", "986") + // currency: BRL
    tlv("54", amount.toFixed(2)) + // transaction amount
    tlv("58", "BR") + // country
    tlv("59", sanitize(merchantName, 25) || "RECEBEDOR") + // merchant name
    tlv("60", sanitize(merchantCity, 15) || "BRASIL") + // merchant city
    tlv("62", tlv("05", txid)); // additional data field (txid)

  const payloadWithCrcId = `${payload}6304`;
  return `${payloadWithCrcId}${crc16(payloadWithCrcId)}`;
}
