export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatFilename(name: string) {
  return name.replace(/\s+/g, "-").toLowerCase();
}

export function cleanExt(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

export function getFileExt(filename: string) {
  return filename.split(".").pop() || "";
}

export function downloadFile(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);

    // Some Safari versions require the element to be in the DOM and visible enough to click.
    anchor.click();

    // Cleanup: remove element and revoke the object URL to release memory.
    document.body.removeChild(anchor);
  } finally {
    // Always revoke, even if click throws.
    URL.revokeObjectURL(blobUrl);
  }
}
