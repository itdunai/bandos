import Link from "next/link";

export function PrivacyConsentField({ id = "privacy_consent" }: { id?: string }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary"
    >
      <input
        id={id}
        name="privacy_consent"
        type="checkbox"
        required
        className="mt-0.5 rounded border-border accent-accent"
      />
      <span>
        Я согласен(на) с{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Политикой конфиденциальности
        </Link>
      </span>
    </label>
  );
}
