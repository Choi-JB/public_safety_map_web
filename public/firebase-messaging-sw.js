importScripts(
    'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'
  );
  
  importScripts(
    'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
  );
  
  firebase.initializeApp({
    apiKey: 'AIzaSyCyxDZUT8QhohczmoSR0dAEWW8QHtLSBk0',
    authDomain: 'public-safety-map.firebaseapp.com',
    projectId: 'public-safety-map',
    storageBucket: 'public-safety-map.firebasestorage.app',
    messagingSenderId: '872205545413',
    appId: '1:872205545413:web:fed88af987041ac664a5ac',
  });
  
  const messaging = firebase.messaging();
  
  /**
   * 백그라운드 메시지 수신
   */
  messaging.onBackgroundMessage((payload) => {
    console.log(
      '[firebase-messaging-sw.js] Background message',
      payload
    );

    const data = JSON.stringify(payload.data);
    const title = payload.data?.title ?? '알림';
   
    let options = {
      body: data.body ?? '',
    };
  
    const type = payload.data?.type ?? 'info';
    switch (type) {
      case 'report':
        self.registration.showNotification(title, options);
        break;
      case 'warning':
        options.icon = '/icon.png';
        self.registration.showNotification(title, options);
        break;
    }
    
    //self.registration.showNotification(title, options);
  });