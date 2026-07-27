// 담당: 공통기반

export type ApiSuccess<T> = {
    success: true;
    data: T;
  };
  export type ApiError = {
    success: false;
    message?: string;
  };
  export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// TODO: API 응답 타입 정의

/** GET /grids 쿼리 (= 지도 viewport) */
export type GridBoundsQuery = {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
  };
  /** GET /grids 응답 항목 */
  export type GridItem = {
    grid_id: number;
    lat: number | null;
    lng: number | null;
    infra_count: number;
    safety_grade: string | null;
  };

/** 인프라 타입 (쿼리 ?type=) */
export type InfraType = "CCTV" | "경찰서" | "소방서" | "편의점";

/** GET /grids/{id}/infrastructures 항목 */
export type InfrastructureItem = {
  id: number;
  type: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};
