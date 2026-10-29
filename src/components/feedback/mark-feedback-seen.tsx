"use client";

import { markFeedbackSeen } from "@/app/actions/feedback";
import { useClearUnreadFeedback } from "@/components/layout/band-shell-context";
import { useEffect } from "react";

/**
 * Отмечает обращения прочитанными после показа страницы: подсветка «новое»
 * остаётся до следующего визита, а индикатор в меню гаснет сразу.
 */
export function MarkFeedbackSeen() {
  const clearUnread = useClearUnreadFeedback();

  useEffect(() => {
    void markFeedbackSeen().then(clearUnread);
  }, [clearUnread]);

  return null;
}
