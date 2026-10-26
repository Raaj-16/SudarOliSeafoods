import { redirect, notFound } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export async function requireCustomer() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) notFound();
  return user;
}
