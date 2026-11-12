// Browser-only contrast audit. Run against rendered markup, after styles/fonts load.
// Covers solid backgrounds, transparency and text opacity; gradients/images need visual review.
type Color = [number, number, number, number];

function color(value: string): Color {
  const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
  if (channels.length < 3) throw new Error(`Unsupported computed color: ${value}`);
  return [channels[0], channels[1], channels[2], channels[3] ?? 1];
}

function over(foreground: Color, background: Color): Color {
  const alpha = foreground[3];
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
    1
  ];
}

function luminance(value: Color): number {
  const [r, g, b] = value.slice(0, 3).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function auditContrast(root: HTMLElement) {
  const failures: string[] = [];
  const skipped: string[] = [];
  let checked = 0;
  for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
    const input = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element : null;
    if (
      input instanceof HTMLInputElement &&
      ["checkbox", "radio", "range", "color", "file", "hidden"].includes(input.type)
    )
      continue;
    const placeholder = input && !input.value ? input.placeholder : "";
    const text = input
      ? input.value || placeholder
      : [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim())
          .filter(Boolean)
          .join(" ");
    if (!text || element.closest("button:disabled, input:disabled, [aria-disabled=true], script, style, svg")) continue;
    // Libraries often put the disabled checkbox alongside its visible label.
    if (element.closest(".switch, .switch-big")?.querySelector("input:disabled")) continue;
    if (!element.getClientRects().length) continue;
    const ancestors: HTMLElement[] = [];
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement)
      ancestors.unshift(ancestor);
    const styles = ancestors.map((ancestor) => getComputedStyle(ancestor));
    if (styles.some((style) => style.visibility === "hidden" || style.display === "none" || style.opacity === "0"))
      continue;
    if (styles.some((style) => style.backgroundImage !== "none")) {
      skipped.push(text.slice(0, 60));
      continue;
    }
    // Composite the whole ancestor stack, including opacity groups, over the canvas.
    let background: Color = [255, 255, 255, 1];
    let foreground = color(getComputedStyle(element, placeholder ? "::placeholder" : null).color);
    if (foreground[3] === 0) {
      skipped.push(`Transparent layout placeholder: ${text.slice(0, 60)}`);
      continue;
    }
    // Find the background behind the text from the outside in.
    background = styles.reduce<Color>(
      (backdrop, style) => over(color(style.backgroundColor), backdrop),
      [255, 255, 255, 1]
    );
    foreground = over(foreground, background);
    for (let i = styles.length - 1; i >= 0; i--) {
      const opacity = Number(styles[i].opacity);
      if (opacity === 1) continue;
      const backdrop = styles
        .slice(0, i)
        .reduce<Color>((back, style) => over(color(style.backgroundColor), back), [255, 255, 255, 1]);
      foreground = over([...foreground.slice(0, 3), opacity] as Color, backdrop);
      background = over([...background.slice(0, 3), opacity] as Color, backdrop);
    }
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    const ratio = (light + 0.05) / (dark + 0.05);
    const style = getComputedStyle(element);
    const large =
      parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
    checked++;
    if (ratio < (large ? 3 : 4.5))
      failures.push(
        `${ratio.toFixed(2)}:1 ${element.tagName.toLowerCase()}.${element.className}: ${text.slice(0, 100)}`
      );
  }
  return { checked, failures: [...new Set(failures)], skipped: [...new Set(skipped)] };
}
