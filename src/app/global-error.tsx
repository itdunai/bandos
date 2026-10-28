"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Заменяет корневой layout — globals.css и тема сюда не доходят, стили инлайн.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "#0d0d0f",
          color: "#f0f0f4",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Ошибка | BandOS</title>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#a78bfa" }}>Упс</div>
          <h1 style={{ fontSize: 18, margin: "12px 0 8px" }}>BandOS временно недоступен</h1>
          <p style={{ fontSize: 14, color: "#a5a5bc", margin: 0 }}>
            Мы уже получили отчёт об ошибке. Обновите страницу через минуту.
          </p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 24,
              padding: "8px 14px",
              border: 0,
              borderRadius: 8,
              background: "#a78bfa",
              color: "#0d0d0f",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
