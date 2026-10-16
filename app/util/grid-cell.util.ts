/**
 * DOM builders for AG Grid cell renderers that need more structure than a
 * plain value.
 *
 * AG Grid 31 wraps every string a function `cellRenderer` returns in a
 * `<span>` and assigns it through `innerHTML`, without sanitizing — API data
 * interpolated into such a string runs as markup in every admin session that
 * opens the grid. A returned element is used as is. These helpers therefore
 * only ever set text through `textContent` and styles through the CSSOM, so
 * the data they are given cannot become markup.
 *
 * Plain text needs none of this: a `valueGetter` (or `field`) without a
 * renderer is rendered as text by AG Grid itself.
 */

/** An element of the given tag holding `text` as text. */
export function textElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string | number | null | undefined,
  className?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = text == null ? '' : String(text);
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * A bullet list flowing over `columns` columns, one item per entry. With
 * `paragraphs` each item sits in a `<p>`, which the validity-period columns
 * use for their spacing.
 */
export function textListCell(
  items: readonly (string | number)[] | null | undefined,
  columns: number,
  paragraphs = false
): HTMLUListElement {
  const list = document.createElement('ul');
  list.style.columns = String(columns);
  list.style.setProperty('word-break', 'break-word', 'important');

  for (const item of items ?? []) {
    const listItem = document.createElement('li');
    listItem.style.marginRight = '15px';
    if (paragraphs) {
      listItem.appendChild(textElement('p', item));
    } else {
      listItem.textContent = String(item);
    }
    list.appendChild(listItem);
  }

  return list;
}

/**
 * The color value as text above a 20px swatch of it. The swatch color goes
 * through the CSSOM, which drops a value that is not a color instead of letting
 * it escape into further declarations or attributes.
 */
export function colorSwatchCell(color: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.appendChild(textElement('div', color));
  wrapper.appendChild(document.createElement('br'));

  const swatch = document.createElement('div');
  swatch.style.width = '20px';
  swatch.style.height = '20px';
  swatch.style.backgroundColor = color;
  wrapper.appendChild(swatch);

  return wrapper;
}

/** A topic path, one line per level, each level indented a step further. */
export function topicHierarchyCell(names: readonly string[]): HTMLDivElement {
  const wrapper = document.createElement('div');
  names.forEach((name, level) => {
    const line = textElement('div', name);
    line.style.paddingLeft = `${level * 0.5}em`;
    wrapper.appendChild(line);
  });
  return wrapper;
}
