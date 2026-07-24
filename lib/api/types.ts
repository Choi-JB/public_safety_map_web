// 담당: 공통기반

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiMessage = {
  success: true;
  message: string;
};

export type ApiFail = {
  success: false;
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiMessage | ApiFail;
