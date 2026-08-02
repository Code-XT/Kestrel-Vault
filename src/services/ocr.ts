import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { VaultField } from '@/types';

/**
 * NOTE ON NATIVE MODULES:
 * @react-native-ml-kit/text-recognition ships native iOS/Android code and is
 * NOT available inside Expo Go. Run this app via an EAS Development Build
 * (`eas build --profile development`) or `expo prebuild` into a bare project
 * for OCR to function. The rest of the app (vault, encryption, biometrics,
 * manual entry) works fine in Expo Go.
 */

export interface OcrResult {
  rawText: string;
  suggestedFields: VaultField[];
}

const CARD_NUMBER_RE = /\b(?:\d[ -]?){13,19}\b/;
const EXPIRY_RE = /\b(0[1-9]|1[0-2])\s?\/\s?(\d{2}|\d{4})\b/;
const NAME_LINE_RE = /^[A-Z][A-Z .'-]{4,32}$/; // heuristic: all-caps embossed name line

let fieldIdCounter = 0;
const nextId = () => `f_${Date.now()}_${fieldIdCounter++}`;

/**
 * Runs on-device OCR against a captured/cropped card image and applies
 * lightweight heuristics to pre-fill common fields (card number, expiry,
 * cardholder name). Anything not confidently matched is left for manual
 * entry, per the "Manual input for missing fields" requirement.
 */
export async function runCardOcr(imageUri: string): Promise<OcrResult> {
  const result = await TextRecognition.recognize(imageUri);
  const rawText = result.text ?? '';
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const suggestedFields: VaultField[] = [];

  const cardNumberMatch = rawText.match(CARD_NUMBER_RE);
  if (cardNumberMatch) {
    suggestedFields.push({
      id: nextId(),
      label: 'Card Number',
      value: cardNumberMatch[0].replace(/[ -]/g, ''),
      sensitive: true,
      format: 'card_number',
    });
  }

  const expiryMatch = rawText.match(EXPIRY_RE);
  if (expiryMatch) {
    suggestedFields.push({
      id: nextId(),
      label: 'Expiry',
      value: `${expiryMatch[1]}/${expiryMatch[2].slice(-2)}`,
      sensitive: false,
      format: 'expiry',
    });
  }

  const nameLine = lines.find((l) => NAME_LINE_RE.test(l) && !/VALID|THRU|BANK/.test(l));
  if (nameLine) {
    suggestedFields.push({
      id: nextId(),
      label: 'Full Name',
      value: nameLine,
      sensitive: false,
      format: 'generic',
    });
  }

  return { rawText, suggestedFields };
}
