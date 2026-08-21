'use client';

import {
  getMessaging,
  getToken,
  onMessage,
} from 'firebase/messaging';

import { firebaseApp } from './config';
import { showNotificationToast } from '@/components/shared/notification/toastEvents';

export async function getFcmToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof Notification === 'undefined') {
    return null;
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return null;
    }
  }

  const registration =
    await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  //console.log('FCM Token:', token);

  return token;
}

export function listenForegroundMessage() {
    const messaging = getMessaging(firebaseApp);
  
    return onMessage(messaging, (payload) => {
      console.log('Foreground 메시지:', payload);
  
      const type = payload.data?.type;

      switch (type) {
        case 'report':
          showNotificationToast('신규 제보 등록');
          break;
        case 'warning':
          showNotificationToast('경고 알림');
          break;
        default:
          showNotificationToast('새로운 제보가 등록되었습니다.'); 
      }

    });
  }