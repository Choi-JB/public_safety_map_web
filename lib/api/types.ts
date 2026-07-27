// 담당: 공통기반


//report
export type ReportItem = {
  id: number;
  type: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  img_url: string | null;
  user_nickname: string | null;
  created_at: string | null;
  expire_at: string | null;
  is_admin_posted: boolean;
};

//city-envents
export type CityEventItem = {
  id: number;
  type: string | null;
  title: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  start_at: string | null;
  end_at: string | null;
};



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
    infra_count: number | null;
    safety_grade: string | null;
  };

/** 인프라 타입 (쿼리 ?type=) */
export type InfraType = "CCTV" | "경찰서" | "소방서" | "편의점";

/** GET /grids/{id}/infrastructures 항목 */
export type InfrastructureItem = {
  id: number;
  type: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

/** GET /grids/{id}/detail 최근 피드백(feedback 테이블) */
export type GridDetailFeedback = {
  id: number;
  safety_feeling: string | null;
  comment: string | null;
  created_at: string | null;
};

/** GET /grids/{id}/detail 활성 제보(report 테이블) */
export type GridDetailReport = {
  id: number;
  type: string | null;
  description: string | null;
  expire_at: string | null;
};

/** GET /grids/{id}/detail 응답 */
export type GridDetail = {
  grid_id: number;
  lat: number | null;
  lng: number | null;
  infra_count: number | null;
  safety_grade: string | null;
  tags: string[];
  safety_feeling_ratio: {
    안전: number;
    보통: number;
    불안: number; 
  };
  recent_feedbacks: GridDetailFeedback[];
  active_reports: GridDetailReport[];
};