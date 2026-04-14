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

// @MX:NOTE: 섹션별로 다른 공간 배치를 만들기 위한 레이아웃 프리셋.
// 각 프리셋은 캔버스 내 이미지가 차지할 영역(imageZone, 정규화된 비율)과
// 배경 그라디언트 방향, 섹션 유형을 정의한다. 히어로·베네핏·근거 등
// 섹션 특성에 맞춰 pickLayoutForSection이 자동으로 매칭한다.
export type BannerLayoutId =
  | "hero-right"
  | "benefit-left"
  | "trust-center-bottom"
  | "compare-middle"
  | "cta-left-bold"
  | "detail-center";

export interface BannerLayoutPreset {
  id: BannerLayoutId;
  name: string;
  description: string;
  // 정규화된 비율 (0~1)로 표현된 이미지 배치 존
  imageZone: { x: number; y: number; w: number; h: number };
  // 그라디언트 방향 (시작·종료)
  gradientStart: { x: number; y: number };
  gradientEnd: { x: number; y: number };
  // 이미지 그림자 오프셋 (이미지와 배경의 경계 소프트)
  shadowOffset: { x: number; y: number };
  // 이미지 크기 상한 배율 (zone 대비) — 0.92면 zone의 92%까지만 차지
  zoneFillRatio: number;
}

export const BANNER_LAYOUT_PRESETS: BannerLayoutPreset[] = [
  {
    id: "hero-right",
    name: "히어로 · 우측 대형",
    description: "우측에 제품을 크게, 좌측은 메인 헤드라인 공간",
    imageZone: { x: 0.42, y: 0.02, w: 0.58, h: 0.98 },
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    shadowOffset: { x: -18, y: 14 },
    zoneFillRatio: 1.05
  },
  {
    id: "benefit-left",
    name: "베네핏 · 좌측 중형",
    description: "좌측 제품 + 우측 3~4개 베네핏 리스트 공간",
    imageZone: { x: 0, y: 0.02, w: 0.5, h: 0.96 },
    gradientStart: { x: 1, y: 0 },
    gradientEnd: { x: 0, y: 1 },
    shadowOffset: { x: 18, y: 14 },
    zoneFillRatio: 1.05
  },
  {
    id: "trust-center-bottom",
    name: "근거 · 중앙 하단",
    description: "상단 대형 헤드라인 + 하단 중앙 소형 제품",
    imageZone: { x: 0.28, y: 0.22, w: 0.44, h: 0.78 },
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    shadowOffset: { x: 0, y: -18 },
    zoneFillRatio: 1.02
  },
  {
    id: "compare-middle",
    name: "비교 · 중앙 배치",
    description: "중앙 제품 + 좌우 대칭 설명 공간",
    imageZone: { x: 0.3, y: 0.02, w: 0.4, h: 0.96 },
    gradientStart: { x: 0, y: 0.5 },
    gradientEnd: { x: 1, y: 0.5 },
    shadowOffset: { x: 0, y: 18 },
    zoneFillRatio: 1.0
  },
  {
    id: "cta-left-bold",
    name: "CTA · 좌측 크게",
    description: "좌측 대형 제품 + 우측 CTA 버튼 공간",
    imageZone: { x: 0, y: 0, w: 0.55, h: 1 },
    gradientStart: { x: 1, y: 0 },
    gradientEnd: { x: 0, y: 1 },
    shadowOffset: { x: 22, y: 14 },
    zoneFillRatio: 1.08
  },
  {
    id: "detail-center",
    name: "상세 · 중앙 포커스",
    description: "중앙 제품 + 상하단 디테일 설명",
    imageZone: { x: 0.22, y: 0.02, w: 0.56, h: 0.96 },
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    shadowOffset: { x: 0, y: 18 },
    zoneFillRatio: 1.03
  }
];

// @MX:NOTE: 섹션 이름/목표/인덱스로 가장 적합한 레이아웃 프리셋 결정.
// 키워드 매칭이 실패하면 인덱스 기반 로테이션으로 폴백.
export function pickBannerLayoutForSection(
  sectionName: string | undefined,
  sectionGoal: string | undefined,
  index: number
): BannerLayoutId {
  const combined = `${sectionName ?? ""} ${sectionGoal ?? ""}`.toLowerCase();

  if (
    index === 0 ||
    combined.includes("히어로") ||
    combined.includes("hero") ||
    combined.includes("메인") ||
    combined.includes("intro")
  )
    return "hero-right";
  if (
    combined.includes("베네핏") ||
    combined.includes("혜택") ||
    combined.includes("benefit") ||
    combined.includes("효능")
  )
    return "benefit-left";
  if (
    combined.includes("근거") ||
    combined.includes("신뢰") ||
    combined.includes("후기") ||
    combined.includes("증거") ||
    combined.includes("trust") ||
    combined.includes("proof")
  )
    return "trust-center-bottom";
  if (
    combined.includes("비교") ||
    combined.includes("차이") ||
    combined.includes("compare")
  )
    return "compare-middle";
  if (
    combined.includes("cta") ||
    combined.includes("구매") ||
    combined.includes("행동") ||
    combined.includes("주문") ||
    combined.includes("결제")
  )
    return "cta-left-bold";
  if (combined.includes("상세") || combined.includes("detail") || combined.includes("스펙"))
    return "detail-center";

  // 폴백: 인덱스 기반 로테이션
  const fallback: BannerLayoutId[] = [
    "hero-right",
    "benefit-left",
    "trust-center-bottom",
    "compare-middle",
    "cta-left-bold",
    "detail-center"
  ];
  return fallback[index % fallback.length];
}

// @MX:NOTE: 원본 이미지 사용 모드에서 선택한 비율 + 섹션별 레이아웃에 맞춰 합성 배너 생성.
// 캔버스 크기를 1600px long side로 고정하여 이미지가 적정 공간을 차지하도록 하며,
// 섹션별 zone에 이미지를 fit-contain 방식으로 배치해 공간이 비지 않도록 한다.
export async function composeOriginalBanner(
  sourceBase64: string,
  mimeType: string,
  targetRatio: import("@runacademy/shared").AspectRatio,
  layoutId: BannerLayoutId = "hero-right"
): Promise<string> {
  const dataUrl = toDataUrl(mimeType, sourceBase64);
  const image = await loadImage(dataUrl);

  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  if (srcW === 0 || srcH === 0) return dataUrl;

  const srcRatio = srcW / srcH;
  const [rw, rh] = parseAspectRatio(targetRatio);
  const tgtRatio = rw / rh;

  const preset =
    BANNER_LAYOUT_PRESETS.find((item) => item.id === layoutId) ??
    BANNER_LAYOUT_PRESETS[0];

  // 캔버스 크기: long side 1600px 고정 (공간 확보)
  const LONG_SIDE = 1600;
  let canvasW: number;
  let canvasH: number;
  if (tgtRatio >= 1) {
    canvasW = LONG_SIDE;
    canvasH = Math.round(LONG_SIDE / tgtRatio);
  } else {
    canvasH = LONG_SIDE;
    canvasW = Math.round(LONG_SIDE * tgtRatio);
  }

  // 지배색 기반 배경 그라디언트
  const bgColor = extractDominantColor(image);
  const bgLight = lightenHex(bgColor, 0.22);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  // 프리셋별 방향성을 가진 그라디언트
  const gradient = ctx.createLinearGradient(
    preset.gradientStart.x * canvasW,
    preset.gradientStart.y * canvasH,
    preset.gradientEnd.x * canvasW,
    preset.gradientEnd.y * canvasH
  );
  gradient.addColorStop(0, bgLight);
  gradient.addColorStop(1, bgColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 프리셋의 imageZone을 절대 픽셀로 환산
  const zoneX = preset.imageZone.x * canvasW;
  const zoneY = preset.imageZone.y * canvasH;
  const zoneW = preset.imageZone.w * canvasW;
  const zoneH = preset.imageZone.h * canvasH;

  // 이미지를 zone 내부에 contain fit 방식으로 스케일
  const zoneRatio = zoneW / zoneH;
  let drawW: number;
  let drawH: number;
  if (srcRatio > zoneRatio) {
    // 원본이 더 가로형 → 존 너비 기준
    drawW = zoneW * preset.zoneFillRatio;
    drawH = drawW / srcRatio;
  } else {
    // 원본이 더 세로형 → 존 높이 기준
    drawH = zoneH * preset.zoneFillRatio;
    drawW = drawH * srcRatio;
  }

  // Zone 중앙에 이미지 배치
  const dx = zoneX + (zoneW - drawW) / 2;
  const dy = zoneY + (zoneH - drawH) / 2;

  // 이미지와 배경 경계에 soft shadow로 자연스러운 융합
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetX = preset.shadowOffset.x;
  ctx.shadowOffsetY = preset.shadowOffset.y;
  ctx.drawImage(image, dx, dy, drawW, drawH);
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

// @MX:NOTE: 4개 코너를 샘플링하여 배경이 단색에 가까운지 자동 판정.
// 코너 4곳의 평균 색상을 구한 뒤 쌍별 최대 RGB 거리로 "단순함"을 평가한다.
// maxDist < 40 이면 단색/심플 배경으로 간주해 배경 제거 UI를 노출할 수 있다.
export async function detectSimpleBackground(
  sourceBase64: string,
  mimeType: string
): Promise<{ isSimple: boolean; maxDistance: number }> {
  try {
    const dataUrl = toDataUrl(mimeType, sourceBase64);
    const image = await loadImage(dataUrl);
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { isSimple: false, maxDistance: Infinity };
    ctx.drawImage(image, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const patch = 14;
    const regions: Array<[number, number]> = [
      [0, 0],
      [size - patch, 0],
      [0, size - patch],
      [size - patch, size - patch]
    ];
    const cornerColors = regions.map(([x0, y0]) =>
      sampleAverageColor(data, size, x0, y0, patch, patch)
    );

    let maxDist = 0;
    for (let i = 0; i < cornerColors.length; i++) {
      for (let j = i + 1; j < cornerColors.length; j++) {
        const d = colorDistance(cornerColors[i], cornerColors[j]);
        if (d > maxDist) maxDist = d;
      }
    }

    return { isSimple: maxDist < 40, maxDistance: maxDist };
  } catch {
    return { isSimple: false, maxDistance: Infinity };
  }
}

// @MX:NOTE: 단색/심플 배경 제거 — 코너 평균 색상을 배경으로 가정하고
// color key + soft edge 방식으로 알파 채널을 계산한다. 외부 ML 모델 없이
// 브라우저 Canvas API만으로 동작.
// - tolerance 내: 완전 투명 (배경 확정)
// - tolerance ~ tolerance*1.6: 경계 영역, 거리에 비례한 부분 투명 (soft edge)
// - 그 밖: 원본 유지 (제품)
export async function removeSolidBackground(
  sourceBase64: string,
  mimeType: string,
  tolerance: number = 32
): Promise<{ base64: string; mimeType: "image/png" }> {
  const dataUrl = toDataUrl(mimeType, sourceBase64);
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("배경 제거 캔버스 초기화 실패");

  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 배경 색상: 4개 코너 평균 (이미지 본 좌표)
  const patch = Math.max(10, Math.floor(Math.min(width, height) * 0.05));
  const cornerRegions: Array<[number, number]> = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch]
  ];
  const cornerColors = cornerRegions.map(([x0, y0]) =>
    sampleAverageColor(data, width, x0, y0, patch, patch)
  );
  const bg = averageColors(cornerColors);

  const softBand = tolerance * 0.6;
  for (let i = 0; i < data.length; i += 4) {
    const dist = colorDistance(
      { r: data[i], g: data[i + 1], b: data[i + 2] },
      bg
    );
    if (dist < tolerance) {
      data[i + 3] = 0;
    } else if (dist < tolerance + softBand) {
      const ratio = (dist - tolerance) / softBand;
      data[i + 3] = Math.round(data[i + 3] * ratio);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const pngDataUrl = canvas.toDataURL("image/png");
  const base64 = pngDataUrl.split(",")[1] ?? "";
  if (!base64) throw new Error("배경 제거 결과 인코딩 실패");
  return { base64, mimeType: "image/png" };
}

// @MX:NOTE: 투명 배경 PNG의 투명 패딩을 제거하여 제품 영역(알파 > 임계값)의
// 바운딩 박스로 크롭. 배경 제거 후 이 함수를 거치면 composeOriginalBanner가
// 프레임 전체가 아닌 제품 자체 크기로 스케일링하므로 제품이 훨씬 크게 보인다.
export async function cropToContentBounds(
  sourceBase64: string,
  mimeType: string,
  alphaThreshold: number = 12
): Promise<{ base64: string; mimeType: "image/png" }> {
  const dataUrl = toDataUrl(mimeType, sourceBase64);
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("크롭 캔버스 초기화 실패");

  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) {
    return { base64: sourceBase64, mimeType: "image/png" };
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  // 약간의 여백(4%)으로 숨 쉴 공간 확보
  const padding = Math.round(Math.max(contentW, contentH) * 0.04);
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width - cropX, contentW + padding * 2);
  const cropH = Math.min(height - cropY, contentH + padding * 2);

  // 이미 프레임 전체가 컨텐츠라면 원본 그대로 반환
  if (cropW >= width * 0.96 && cropH >= height * 0.96) {
    return { base64: sourceBase64, mimeType: "image/png" };
  }

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("크롭 결과 캔버스 초기화 실패");
  cropCtx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const pngDataUrl = cropCanvas.toDataURL("image/png");
  const base64 = pngDataUrl.split(",")[1] ?? "";
  if (!base64) throw new Error("크롭 결과 인코딩 실패");
  return { base64, mimeType: "image/png" };
}

type RGB = { r: number; g: number; b: number };

function sampleAverageColor(
  data: Uint8ClampedArray,
  stride: number,
  x0: number,
  y0: number,
  width: number,
  height: number
): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) {
      const idx = (y * stride + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

function averageColors(colors: RGB[]): RGB {
  if (colors.length === 0) return { r: 255, g: 255, b: 255 };
  const sum = colors.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: sum.r / colors.length,
    g: sum.g / colors.length,
    b: sum.b / colors.length
  };
}

function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
