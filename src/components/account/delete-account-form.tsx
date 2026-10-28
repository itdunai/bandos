"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions/account";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteAccountForm({ email }: { email: string }) {
  const [value, setValue] = useState("");
  const matches = value.trim().toLowerCase() === email.toLowerCase();

  return (
    <form action={deleteAccount} className="space-y-2">
      <label htmlFor="confirm_email" className="block text-xs text-text-secondary">
        Для подтверждения введите ваш email: <span className="text-text-primary">{email}</span>
      </label>
      <Input
        id="confirm_email"
        name="confirm_email"
        type="email"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <SubmitButton
        type="submit"
        disabled={!matches}
        loadingLabel="Удаляем…"
        className="border-red bg-red text-white hover:border-red hover:bg-red/90 hover:text-white"
      >
        Удалить аккаунт навсегда
      </SubmitButton>
    </form>
  );
}
