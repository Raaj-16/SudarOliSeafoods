import { FavoritesList } from '@/components/favorites-list';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const dynamic = 'force-dynamic';

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <main><FavoritesList /></main>
      <SiteFooter />
    </>
  );
}
