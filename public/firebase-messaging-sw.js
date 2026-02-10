/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB59kBHCFnk8O57BSewzQNflBlChDo-aWw",
  authDomain: "websitey-9f8e4.firebaseapp.com",
  projectId: "websitey-9f8e4",
  storageBucket: "websitey-9f8e4.firebasestorage.app",
  messagingSenderId: "664030424176",
  appId: "1:664030424176:web:b778194576df5bc7e918b5",
  measurementId: "G-T02WEE7DKJ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});