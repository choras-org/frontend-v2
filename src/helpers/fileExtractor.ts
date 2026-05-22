import type { ExtractedFile } from "@/types/file";
import JSZip from "jszip";

export async function downloadAndExtractFiles(
  url: string,
  targetExtension: string = ".3dm",
): Promise<ExtractedFile[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const zipData = await response.arrayBuffer();

    const zip = await JSZip.loadAsync(zipData);

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
