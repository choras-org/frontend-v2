import type { ExtractedFile } from "@/types/file";
import JSZip from "jszip";

// ZIP archives start with the local file header signature "PK\x03\x04".
function isZipArchive(data: ArrayBuffer): boolean {
  if (data.byteLength < 4) return false;
  const header = new Uint8Array(data, 0, 4);
  return header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
}

function fileNameFromUrl(url: string, targetExtension: string): string {
  const path = url.split(/[?#]/)[0];
  const name = path.substring(path.lastIndexOf("/") + 1);
  return name || `model${targetExtension}`;
}

export async function downloadAndExtractFiles(
  url: string,
  targetExtension: string = ".3dm",
): Promise<ExtractedFile[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileData = await response.arrayBuffer();

    // Repaired/stage models are served as raw .3dm files, not zip archives.
    if (!isZipArchive(fileData)) {
      return [{ name: fileNameFromUrl(url, targetExtension), data: fileData }];
    }

    const zip = await JSZip.loadAsync(fileData);

    const extractedFiles: ExtractedFile[] = [];
    const files = Object.values(zip.files);

    for (const file of files) {
      if (!file.dir && file.name.toLowerCase().includes(targetExtension.toLowerCase())) {
        const data = await file.async("arraybuffer");
        extractedFiles.push({
          name: file.name,
          data,
        });
      }
    }

    if (extractedFiles.length === 0) {
      throw new Error(`No ${targetExtension} files found in the archive`);
    }

    return extractedFiles;
  } catch (error) {
    throw new Error(
      `Failed to extract files: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function extractFirstFile(
  zipData: ArrayBuffer,
  targetExtension: string = ".3dm",
): Promise<ExtractedFile> {
  try {
    const zip = await JSZip.loadAsync(zipData);
    const files = Object.values(zip.files);

    const targetFile = files.find(
      (file) => !file.dir && file.name.toLowerCase().includes(targetExtension.toLowerCase()),
    );

    if (!targetFile) {
      throw new Error(`No ${targetExtension} files found in the archive`);
    }

    const data = await targetFile.async("arraybuffer");

    return {
      name: targetFile.name,
      data,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function listZipContents(zipData: ArrayBuffer): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(zipData);
    return Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  } catch (error) {
    throw new Error(
      `Failed to list ZIP contents: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
