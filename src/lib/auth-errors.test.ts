import { describe, expect, it } from "vitest";
import { formatAuthError, isAlreadyRegisteredError } from "@/lib/auth-errors";

describe("formatAuthError", () => {
  it("explains the email rate limit", () => {
    expect(formatAuthError("email rate limit exceeded")).toMatch(/Слишком много писем/);
  });

  it("translates wrong credentials", () => {
    expect(formatAuthError("Invalid login credentials")).toBe("Неверный email или пароль");
  });

  it("translates password reset errors", () => {
    expect(
      formatAuthError("New password should be different from the old password.")
    ).toBe("Новый пароль должен отличаться от старого");
    expect(formatAuthError("Password should be at least 6 characters.")).toMatch(
      /минимум 6/
    );
  });

  it("passes unknown messages through", () => {
    expect(formatAuthError("Something odd")).toBe("Something odd");
  });
});

describe("isAlreadyRegisteredError", () => {
  it("detects duplicate signups", () => {
    expect(isAlreadyRegisteredError("User already registered")).toBe(true);
    expect(isAlreadyRegisteredError("Invalid login credentials")).toBe(false);
  });
});
