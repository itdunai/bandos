import Image from "next/image";
import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="BandOS"
      width={400}
      height={400}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
