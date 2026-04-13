"use client";

import { useEffect, useState } from "react";
import styles from "./pdp-announcement-popup.module.css";

const STORAGE_KEY = "hanirum:pdp-announcement:hideUntil";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function PdpAnnouncementPopup() {
  const [visible, setVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const hideUntil = raw ? Number.parseInt(raw, 10) : 0;
      if (!Number.isFinite(hideUntil) || Date.now() >= hideUntil) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    if (dontShowToday) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          String(Date.now() + ONE_DAY_MS)
        );
      } catch {
        // localStorage 사용 불가 시 무시
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-announcement-title"
      onClick={handleClose}
    >
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className={styles.header}>
          <div>
            <span className={styles.label}>안내 사항</span>
            <h2 id="pdp-announcement-title" className={styles.title}>
              사용 전 꼭 확인해 주세요
            </h2>
          </div>
          <span className={styles.badge}>개인 브라우저 기준 저장</span>
        </div>

        <div className={styles.grid}>
          <article className={styles.item}>
            <strong>Gemini API 키는 개인용으로 사용됩니다.</strong>
            <p>이미지 생성 비용은 각자 입력한 본인 Gemini API 키 기준으로 과금됩니다.</p>
          </article>

          <article className={styles.item}>
            <strong>생성 속도는 Gemini API 서버 영향이 가장 큽니다.</strong>
            <p>상세페이지 분석과 이미지 생성 시간은 Vercel보다 Gemini 응답 시간의 영향이 더 큽니다.</p>
          </article>

          <article className={styles.item}>
            <strong>API 키와 작업 내용은 서버에 저장되지 않습니다.</strong>
            <p>입력한 API 키와 작업 초안은 각자 사용자의 PC 브라우저에만 저장되므로 안심하고 사용할 수 있습니다.</p>
          </article>

          <article className={styles.item}>
            <strong>시크릿 모드에서는 저장 내용이 사라질 수 있습니다.</strong>
            <p>시크릿 모드나 브라우저 저장 공간 초기화 환경에서는 다시 접속했을 때 저장된 작업이 보이지 않을 수 있습니다.</p>
          </article>
        </div>

        <div className={styles.footer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(event) => setDontShowToday(event.target.checked)}
            />
            <span>하루동안 안보기</span>
          </label>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
