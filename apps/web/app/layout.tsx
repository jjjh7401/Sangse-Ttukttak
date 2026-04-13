import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "상세뚝딱",
  description: "제품 이미지 편집과 상세페이지 구조 설계를 위한 전용 프로젝트"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
