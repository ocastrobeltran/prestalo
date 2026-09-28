import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Installment, Loan, AppNotificationItem, NotificationSettings } from '../types';
import { storageService } from './storageService';
import { isInstallmentOverdue, addDays, formatCurrency } from './loanCalculator';

let isChannelCreated = false;

/**
 * Asegura la creación del canal de notificaciones en Android para sonido y prioridad adecuada
 */
async function ensureAndroidChannel(): Promise<void> {
  if (isChannelCreated || !Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'credipresta_reminders',
      name: 'Cobros y Vencimientos',
      description: 'Notificaciones sobre cobros del día, cuotas vencidas y recordatorios',
      importance: 5, // High importance
      visibility: 1, // Public on lockscreen
      vibration: true
    });
    isChannelCreated = true;
  } catch (e) {
    console.warn('No se pudo inicializar canal de notificaciones:', e);
  }
}

/**
 * Solicita permisos de notificación tanto en entorno nativo (Capacitor) como en navegador Web/PWA
 */
export async function requestPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureAndroidChannel();
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error('Error al solicitar permisos de notificación en Capacitor:', e);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (e) {
      console.error('Error al solicitar permisos de notificación en Web:', e);
      return false;
    }
  }

  return false;
}

/**
 * Consulta el estado actual de los permisos de notificación
 */
export async function checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch (e) {
      console.warn('Error al verificar permisos en Capacitor:', e);
      return 'denied';
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  return 'denied';
}

/**
 * Envía una notificación push/local y la registra en el historial interno de la aplicación
 */
export async function sendNotification(
  title: string,
  body: string,
  type: AppNotificationItem['type'] = 'system',
  extraData?: any
): Promise<boolean> {
  // Crear el registro de notificación para la app
  const notifItem: AppNotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    body,
    type,
    timestamp: new Date().toISOString(),
    read: false,
    data: extraData
  };

  // Persistir en el historial local
  const currentHistory = storageService.getNotificationHistory();
  storageService.saveNotificationHistory([notifItem, ...currentHistory]);

  // Si las notificaciones globales están deshabilitadas en la configuración del usuario
  const settings: NotificationSettings = storageService.getNotificationSettings();
  if (!settings.enabled && type !== 'system') {
    return true; // Se guardó en historial, pero no se emite alerta sonora/push
  }

  // 1. Entorno Capacitor (Móvil Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await checkPermissions();
      if (perm === 'granted') {
        await ensureAndroidChannel();
        const notificationId = Math.floor(Math.random() * 2000000000) + 1;
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title,
              body,
              channelId: 'credipresta_reminders',
              schedule: { at: new Date(Date.now() + 250) },
              extra: extraData
            }
          ]
        });
        return true;
      }
    } catch (e) {
      console.error('Error al emitir notificación local en Capacitor:', e);
    }
    return true;
  }

  // 2. Entorno Web / Navegador / PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              data: extraData
            });
            return true;
          }
        }

        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          data: extraData
        });
        return true;
      } catch (e) {
        console.warn('Error al mostrar notificación en navegador web:', e);
      }
    }
  }

  return true;
}

/**
 * Envía una notificación de prueba para verificar el correcto funcionamiento del sistema
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await checkPermissions();
  if (perm !== 'granted') {
    await requestPermissions();
  }

  return sendNotification(
    '🔔 Notificaciones Activas',
    'CrediPresta te avisará sobre cuotas por cobrar hoy, cuotas de mañana y mora pendiente.',
    'system',
    { isTest: true }
  );
}

/**
 * Evalúa las cuotas del sistema y emite las alertas diarias según la configuración del usuario
 */
export async function checkAndTriggerDailyNotifications(
  installments: Installment[],
  loans: Loan[],
  force: boolean = false
): Promise<{ sent: number; notifications: AppNotificationItem[] }> {
  const settings = storageService.getNotificationSettings();

  // Si las notificaciones están apagadas por el usuario, omitir
  if (!settings.enabled) {
    return { sent: 0, notifications: [] };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = addDays(todayStr, 1);

  // Evitar repetir la emisión diaria si no se fuerza manualmente
  if (!force && settings.lastCheckDate === todayStr) {
    return { sent: 0, notifications: [] };
  }

  const loansMap = new Map<string, Loan>();
  loans.forEach(loan => loansMap.set(loan.id, loan));

  // Filtrar cuotas que aún tienen saldo por cobrar
  const unpaidInstallments = installments.filter(
    i => (i.status !== 'paid' || i.isPactada) && i.amount > 0
  );

  const sentNotifications: AppNotificationItem[] = [];

  // 1. Cuotas que vencen HOY
  if (settings.notifyTodayDue) {
    const todayDueList = unpaidInstallments.filter(i => i.dueDate === todayStr);
    if (todayDueList.length > 0) {
      const count = todayDueList.length;
      const totalAmount = todayDueList.reduce((acc, curr) => acc + curr.amount, 0);
      const title = '📅 Cobros de Hoy';
      const body = `Tienes ${count} cuota${count > 1 ? 's' : ''} por cobrar hoy (${formatCurrency(totalAmount)}).`;

      await sendNotification(title, body, 'today_due', {
        count,
        total: totalAmount,
        dueDate: todayStr
      });

      sentNotifications.push({
        id: `notif_${Date.now()}_today`,
        title,
        body,
        type: 'today_due',
        timestamp: new Date().toISOString(),
        read: false,
        data: { count, total: totalAmount }
      });
    }
  }

  // 2. Cuotas en MORA (vencidas atrasadas anteriores a hoy o con estado de mora)
  if (settings.notifyOverdue) {
    const overdueList = unpaidInstallments.filter(
      i => i.dueDate !== todayStr && isInstallmentOverdue(i, loansMap.get(i.loanId))
    );
    if (overdueList.length > 0) {
      const count = overdueList.length;
      const totalAmount = overdueList.reduce((acc, curr) => acc + curr.amount, 0);
      const title = '⚠️ Mora Pendiente';
      const body = `Tienes ${count} cuota${count > 1 ? 's' : ''} vencidas atrasadas (${formatCurrency(totalAmount)}).`;

      await sendNotification(title, body, 'overdue', {
        count,
        total: totalAmount
      });

      sentNotifications.push({
        id: `notif_${Date.now()}_overdue`,
        title,
        body,
        type: 'overdue',
        timestamp: new Date().toISOString(),
        read: false,
        data: { count, total: totalAmount }
      });
    }
  }

  // 3. Cuotas de MAÑANA (recordatorio anticipado)
  if (settings.notifyTomorrowDue) {
    const tomorrowDueList = unpaidInstallments.filter(i => i.dueDate === tomorrowStr);
    if (tomorrowDueList.length > 0) {
      const count = tomorrowDueList.length;
      const totalAmount = tomorrowDueList.reduce((acc, curr) => acc + curr.amount, 0);
      const title = '⏰ Cobros de Mañana';
      const body = `Tienes ${count} cuota${count > 1 ? 's' : ''} programadas para mañana (${formatCurrency(totalAmount)}).`;

      await sendNotification(title, body, 'tomorrow_due', {
        count,
        total: totalAmount,
        dueDate: tomorrowStr
      });

      sentNotifications.push({
        id: `notif_${Date.now()}_tomorrow`,
        title,
        body,
        type: 'tomorrow_due',
        timestamp: new Date().toISOString(),
        read: false,
        data: { count, total: totalAmount }
      });
    }
  }

  // Marcar la última fecha de verificación
  storageService.saveNotificationSettings({ lastCheckDate: todayStr });

  return {
    sent: sentNotifications.length,
    notifications: sentNotifications
  };
}

export const notificationService = {
  requestPermissions,
  checkPermissions,
  sendNotification,
  sendTestNotification,
  checkAndTriggerDailyNotifications
};
