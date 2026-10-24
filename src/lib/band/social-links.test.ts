import { describe, expect, it } from "vitest";
import {
  getSocialLinkList,
  parseSocialLinksForm,
} from "@/lib/band/social-links";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("parseSocialLinksForm", () => {
  it("keeps fixed platforms and valid custom links", () => {
    const links = parseSocialLinksForm(
      form({
        social_vk: "vk.com/band",
        social_telegram: "",
        social_custom_json: JSON.stringify([
          { label: " Bandcamp ", url: "band.bandcamp.com" },
          { label: "", url: "https://no-label.example" },
          { label: "Bad", url: "javascript:alert(1)" },
        ]),
      })
    );
    expect(links).toEqual({
      vk: "https://vk.com/band",
      custom: [{ label: "Bandcamp", url: "https://band.bandcamp.com/" }],
    });
  });

  it("ignores malformed custom JSON", () => {
    expect(parseSocialLinksForm(form({ social_custom_json: "{oops" }))).toEqual({});
  });
});

describe("getSocialLinkList", () => {
  it("lists fixed platforms first, then custom links", () => {
    const list = getSocialLinkList({
      website: "https://band.example",
      vk: "https://vk.com/band",
      custom: [{ label: "Яндекс Музыка", url: "https://music.yandex.ru/x" }],
    });
    expect(list.map((l) => l.label)).toEqual(["ВКонтакте", "Сайт", "Яндекс Музыка"]);
  });

  it("drops unsafe or malformed stored values", () => {
    const list = getSocialLinkList({
      vk: "javascript:alert(1)",
      custom: [{ label: "x" } as never, "junk" as never],
    });
    expect(list).toEqual([]);
  });
});
