import { patch, post } from "./client";

export async function registerFcmToken(fcmToken: string) {
  return post(`/notification/register`, {
    fcmToken,
    device_type: "web",
  });
}

export async function unregisterFcmToken(fcmToken: string) {
  return patch(`/notification/unregister`, { fcmToken });
}