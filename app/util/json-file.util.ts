// Generic browser helpers for reading and downloading JSON files. Extracted
// from the admin indicator modals, where the FileReader and Blob/anchor
// boilerplate was duplicated across several components.

/**
 * Reads a file as text and parses it as JSON. Rejects when the file cannot be
 * read or does not contain valid JSON.
 */
export function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Triggers a browser download of `data` as a JSON file named `fileName`.
 * Accepts either an already-serialised JSON string or an arbitrary value that
 * is then serialised with `JSON.stringify`.
 */
export function downloadJson(fileName: string, data: unknown): void {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.download = fileName;
  a.href = url;
  a.textContent = 'JSON';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();

  a.remove();
  URL.revokeObjectURL(url);
}
