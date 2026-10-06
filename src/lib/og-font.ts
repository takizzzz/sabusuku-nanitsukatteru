/** OGP画像用に、使う文字だけを含む Noto Sans JP を Google Fonts から取得する */
export async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@800&text=${encodeURIComponent(text)}`,
      { cache: "force-cache" },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}
