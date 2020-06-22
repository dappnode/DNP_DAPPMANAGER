type CssClass =
  | { [className: string]: string | undefined | null | boolean }
  | string
  | undefined
  | null;

/**
 *
 * @param cssClassObj
 */
export function joinCssClass(...args: CssClass[]): string {
  return args
    .reduce(
      (classNames, arg) => {
        if (typeof arg === "string") classNames.push(arg);
        if (typeof arg === "object")
          for (const [key, val] of Object.entries(arg || {}))
            if (val) classNames.push(key);
        return classNames;
      },
      [] as string[]
    )
    .join(" ");
}
