import type { Metadata } from "next";
import { PdpMakerClient } from "./PdpMakerClient";

export const metadata: Metadata = {
  title: "상세뚝딱",
  description: "제품 이미지를 업로드하면 AI가 상세페이지 구조와 섹션 이미지를 설계해 주는 공개형 도구",
  icons: {
    icon: "/pdp-maker/icon.svg",
    shortcut: "/pdp-maker/icon.svg"
  }
};

export default function PdpMakerPage() {
  return <PdpMakerClient />;
}
