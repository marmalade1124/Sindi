import "./global.css";
import React, { useEffect, useRef } from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications, addNotificationResponseListener } from './src/services/notifications';

export default function App() {
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications();

    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[App] Notification tapped, data:', data);
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
