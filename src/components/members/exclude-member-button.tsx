"use client";

import { excludeMember } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ExcludeMemberButton({
  memberId,
  memberName,
  bandId,
  bandSlug,
}: {
  memberId: string;
  memberName: string;
  bandId: string;
  bandSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="default"
      disabled={pending}
      className="mt-3 w-full text-red hover:border-red hover:text-red"
      onClick={() => {
        if (
          !confirm(
            `Исключить ${memberName} из группы? Участник потеряет доступ.`
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await excludeMember(memberId, bandId, bandSlug);
          if (result.error) {
            alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <UserMinus className="h-3.5 w-3.5" />
      Исключить
    </Button>
  );
}
