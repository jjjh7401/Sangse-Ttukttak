import type { AspectRatio, PdpValidateApiKeyResponse } from "@runacademy/shared";
import { resolveGeminiApiKeyHeaderValue } from "./pdp-settings";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const RATIO_OPTIONS: Array<{
  value: AspectRatio;
  label: string;
  description: string;
  icon: "square" | "portrait" | "phone" | "landscape" | "wide";
}> = [
  { value: "1:1", label: "정방형", description: "썸네일, 마켓 대표 이미지", icon: "square" },
  { value: "3:4", label: "일반 세로", description: "상세페이지 기본형", icon: "portrait" },
  { value: "9:16", label: "모바일 세로", description: "모바일 집중형 상세페이지", icon: "phone" },
  { value: "4:3", label: "일반 가로", description: "배너, 중간 섹션 컷", icon: "landscape" },
  { value: "16:9", label: "와이드", description: "히어로 배너형", icon: "wide" }
];

export const TONE_OPTIONS = [
  "AI 자동 추천",
  "프리미엄",
  "모던",
  "테크",
  "미니멀",
  "팝아트",
  "인스타감성",
  "레트로"
];

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  options?: { geminiApiKey?: string | null }
): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  const customGeminiApiKey =
    typeof options?.geminiApiKey === "string"
      ? resolveGeminiApiKeyHeaderValue({ customGeminiApiKey: options.geminiApiKey })
      : resolveGeminiApiKeyHeaderValue();
  if (customGeminiApiKey) {
    headers.set("X-Gemini-Api-Key", customGeminiApiKey);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  return response.json() as Promise<T>;
}

export async function validateGeminiApiKey(geminiApiKey: string) {
  return apiJson<PdpValidateApiKeyResponse>(
    "/pdp/validate-key",
    {
      method: "GET"
    },
    { geminiApiKey }
  );
}

export function toDataUrl(mimeType: string, base64: string) {
  return `data:${mimeType};base64,${base64}`;
}

export async function prepareImageFile(file: File) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const sourceImage = await loadImage(sourceDataUrl);

  const maxDimension = 1024;
  let width = sourceImage.width;
  let height = sourceImage.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지 캔버스를 초기화하지 못했습니다.");
  }

  context.drawImage(sourceImage, 0, 0, width, height);

  const previewUrl = canvas.toDataURL("image/jpeg", 0.84);
  const base64 = previewUrl.split(",")[1] ?? "";

  if (!base64) {
    throw new Error("이미지 변환 결과가 비어 있습니다.");
  }

  return {
    base64,
    mimeType: "image/jpeg" as const,
    previewUrl,
    fileName: file.name
  };
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

// @MX:NOTE: 원본 이미지 사용 모드에서 선택한 비율에 맞춰 배경 여백과 함께 합성 배너 생성.
// 원본 비율과 타겟 비율이 다르면 지배색 기반 배경을 채우고 원본을 한쪽에 배치하여
// 반대편 여백이 카피·마케팅 문구가 들어갈 텍스트 존이 된다.
export async function composeOriginalBanner(
  sourceBase64: string,
  mimeType: string,
  targetRatio: import("@runacademy/shared").AspectRatio
): Promise<string> {
  const dataUrl = toDataUrl(mimeType, sourceBase64);
  const image = await loadImage(dataUrl);

  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  if (srcW === 0 || srcH === 0) return dataUrl;

  const srcRatio = srcW / srcH;
  const [rw, rh] = parseAspectRatio(targetRatio);
  const tgtRatio = rw / rh;

  // 동일 비율(오차 < 2%)이면 원본 그대로 반환
  if (Math.abs(srcRatio - tgtRatio) / tgtRatio < 0.02) {
    return dataUrl;
  }

  // 원본이 전부 들어가도록 캔버스 크기 결정
  let canvasW: number;
  let canvasH: number;
  if (tgtRatio > srcRatio) {
    // 타겟이 더 가로형 → 높이를 원본 기준으로 고정, 너비는 비율대로 확장
    canvasH = srcH;
    canvasW = Math.round(srcH * tgtRatio);
  } else {
    // 타겟이 더 세로형 → 너비를 원본 기준으로 고정, 높이는 비율대로 확장
    canvasW = srcW;
    canvasH = Math.round(srcW / tgtRatio);
  }

  // 지배색 추출 (샘플링 + 평균 + 라이튼)
  const bgColor = extractDominantColor(image);
  const bgLight = lightenHex(bgColor, 0.2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  // 배경: 은은한 선형 그라디언트 (텍스트 가독성 + 자연스러운 전환)
  const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
  gradient.addColorStop(0, bgLight);
  gradient.addColorStop(1, bgColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 원본 이미지 배치 결정
  //  - 가로 타겟 + 세로 원본: 원본을 우측에, 좌측은 텍스트 존
  //  - 세로 타겟 + 가로 원본: 원본을 상단에, 하단은 텍스트 존
  let dx: number;
  let dy: number;
  if (tgtRatio > srcRatio) {
    // 가로형 캔버스 → 원본 우측 정렬, 좌측 빈 공간 = 텍스트 존
    dx = canvasW - srcW;
    dy = Math.round((canvasH - srcH) / 2);
  } else {
    // 세로형 캔버스 → 원본 상단 정렬, 하단 빈 공간 = 텍스트 존
    dx = Math.round((canvasW - srcW) / 2);
    dy = 0;
  }

  // 원본과 배경 사이 자연스러운 페이드를 위해 살짝의 soft shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetX = tgtRatio > srcRatio ? -12 : 0;
  ctx.shadowOffsetY = tgtRatio > srcRatio ? 0 : 14;
  ctx.drawImage(image, dx, dy, srcW, srcH);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

function parseAspectRatio(
  ratio: import("@runacademy/shared").AspectRatio
): [number, number] {
  const [w, h] = ratio.split(":").map((value) => Number.parseInt(value, 10));
  return [w || 1, h || 1];
}

// @MX:NOTE: 이미지 샘플링으로 평균 색상을 구한 뒤 soft 라이트 톤으로 이동시켜 텍스트 가독성이 좋은 배경색을 얻는다.
function extractDominantColor(image: HTMLImageElement): string {
  const size = 64;
  const sample = document.createElement("canvas");
  sample.width = size;
  sample.height = size;
  const ctx = sample.getContext("2d");
  if (!ctx) return "#F3EEE5";

  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  if (count === 0) return "#F3EEE5";
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  // soft 톤으로 이동 (원본 색조는 유지하되 명도를 올림)
  const mix = 0.5;
  const softR = Math.round(r + (255 - r) * mix);
  const softG = Math.round(g + (255 - g) * mix);
  const softB = Math.round(b + (255 - b) * mix);
  return rgbToHex(softR, softG, softB);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const nr = r + (255 - r) * amount;
  const ng = g + (255 - g) * amount;
  const nb = b + (255 - b) * amount;
  return rgbToHex(nr, ng, nb);
}
