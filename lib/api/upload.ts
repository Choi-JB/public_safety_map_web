
export async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
  
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/image`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );
  
    const json = await res.json();
  
    if (!res.ok) {
      throw new Error(json.message ?? "이미지 업로드에 실패했습니다.");
    }
  
    return json.data as { img_url: string };
  }