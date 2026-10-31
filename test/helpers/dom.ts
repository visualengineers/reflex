/** Query required test elements and fail at the missing selector, before assertions. */
export function queryElement<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}
