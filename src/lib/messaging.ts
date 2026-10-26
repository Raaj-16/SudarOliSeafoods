import { timingSafeEqual } from 'node:crypto';

export type NotificationPayload = {
  submissionId?: string;
  orderId?: string;
  kind: 'order' | 'bulk' | 'contact';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  summary: string;
};

export async function queueAndSendNotification(_payload: NotificationPayload) {
  void _payload;
  return { status: 'queued' as const, outboxId: 'manual-checkout-disabled' };
}

export async function dispatchPendingNotifications() {
  return { sent: 0, failed: 0, skipped: true };
}

export function validDispatchSecret(received: string | null) {
  const secrets = [process.env.NOTIFICATION_DISPATCH_SECRET, process.env.CRON_SECRET].filter((value): value is string => Boolean(value));
  if (!secrets.length || !received) return false;
  const receivedBuffer = Buffer.from(received);
  return secrets.some((secret) => {
    const expectedBuffer = Buffer.from(`Bearer ${secret}`);
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
  });
}
