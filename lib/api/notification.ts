import { post } from "./client";

export async function registerFcmToken(fcmToken: string) {
  return post(`/notification/register`, {
    fcmToken,
    device_type: "web",
  });
}
