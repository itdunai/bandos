/** Человекочитаемые сообщения об ошибках Supabase Auth */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return (
      "Слишком много писем за короткое время (лимит Supabase). " +
      "Подождите 30–60 минут и попробуйте снова. " +
      "Если вы уже регистрировались — войдите по ссылке ниже, не создавайте аккаунт повторно."
    );
  }

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists")
  ) {
    return "Этот email уже зарегистрирован. Войдите в аккаунт — приглашение применится после входа.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Неверный email или пароль";
  }

  if (lower.includes("email not confirmed")) {
    return "Подтвердите email по ссылке из письма, затем войдите снова";
  }

  return message;
}

export function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists")
  );
}
