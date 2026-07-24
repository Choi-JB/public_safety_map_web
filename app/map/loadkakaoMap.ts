const SCRIPT_ID = "kakao-map-sdk";

export function loadKakaoMap(): Promise<typeof window.kakao> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window is undefined"));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(window.kakao));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY is missing"));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () => reject(new Error("Failed to load Kakao Map SDK"));
    document.head.appendChild(script);
  });
}