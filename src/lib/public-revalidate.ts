import { bandPath } from "@/lib/paths";
import {
  PUBLIC_CATALOG_TAG,
  publicBandTag,
} from "@/lib/public-cache";
import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublicCatalog() {
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  revalidatePath("/");
}

export function revalidatePublicBand(bandSlug: string) {
  revalidateTag(publicBandTag(bandSlug), "max");
  revalidatePath(`/rider/${bandSlug}`);
  revalidatePath(`/repertoire/${bandSlug}`);
  revalidatePath(bandPath(bandSlug));
}

export function revalidatePublicBandAndCatalog(bandSlug: string) {
  revalidatePublicBand(bandSlug);
  revalidatePublicCatalog();
}
