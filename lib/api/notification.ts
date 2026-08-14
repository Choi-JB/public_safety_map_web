import { post } from "./client";

export async function registerFcmToken(fcmToken: string) {
  return post(`/notification/set-token`, {
    fcmToken,
    device_type: "web",
  });
}
