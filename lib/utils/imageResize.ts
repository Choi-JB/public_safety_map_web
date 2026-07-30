/**
 * 이미지 파일을 지정된 최대 크기로 리사이징하고 JPEG로 압축
 * @param file 원본 이미지 파일
 * @param maxDimension 긴 변 최대 길이(px)
 * @param quality JPEG 압축 품질 (0~1)
 */
export async function resizeImage(
    file: File,
    maxDimension = 800,
    quality = 0.7
  ): Promise<File> {
    /** 이미지 비트맵 생성 - 파일을 디코딩해 픽셀 크기를 알아냄  */
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  
    const { width, height } = bitmap;
    /** 원본 이미지의 크기를 최대 크기로 조정하기 위한 스케일 계산 */
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    /** 조정된 너비 */
    const targetWidth = Math.round(width * scale);
    /** 조정된 높이 */
    const targetHeight = Math.round(height * scale);
  
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스를 생성할 수 없습니다.");
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  
    /** 캔버스를 JPEG로 압축 */
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) throw new Error("이미지 압축에 실패했습니다.");
  
    /** 압축된 이미지 파일 생성 */
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }