import Link from 'next/link';
import { formatPrice, type Product } from '@/lib/store-data';
import { formatWeightLabel } from '@/lib/availability';

type ProductCardProps = {
  product: Product;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
};

/** One product card used on the home page, shop page and favourites page. */
export function ProductCard({ product, isFavourite = false, onToggleFavourite }: ProductCardProps) {
  const { availability } = product;
  const soldOut = availability.state === 'out';
  const badgeClass = soldOut ? 'out' : availability.state === 'ok' ? 'ok' : 'low';

  return (
    <article className={`card${soldOut ? ' disabled' : ''}`}>
      <div className="card-img-wrap">
        <Link href={`/products/${product.slug}`} className="card-img" aria-label={`View ${product.name}`}>
          <span className={`badge ${badgeClass}`}>{availability.badge}</span>
          {product.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={product.image} alt={product.name} />
            : <span className="empty-product-image" aria-hidden="true">{product.name.slice(0, 1)}</span>}
        </Link>
        {onToggleFavourite && (
          <button
            type="button"
            className={`card-fav${isFavourite ? ' active' : ''}`}
            onClick={() => onToggleFavourite(product.id)}
            aria-pressed={isFavourite}
            aria-label={isFavourite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {isFavourite ? '♥' : '♡'}
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="local">{product.local}</div>
        <h3>{product.name}</h3>
        <div className="desc">{product.shortDescription}</div>
        {product.variants.length > 0 && (
          <ul className="pack-list" aria-label="Pack sizes">
            {product.variants.map((variant) => (
              <li key={variant.label} className={variant.stock <= 0 ? 'gone' : variant.stock === 1 ? 'last' : ''}>
                {variant.label}{variant.stock <= 0 ? ' · sold out' : variant.stock === 1 ? ` · only ${formatWeightLabel(variant.label)} pending` : ''}
              </li>
            ))}
          </ul>
        )}
        <div className="card-foot">
          <div className="price-from">{soldOut ? null : <span>From</span>}{soldOut ? 'Currently unavailable' : formatPrice(product.price)}</div>
          <Link className="view" href={`/products/${product.slug}`}>{soldOut ? 'View' : 'Select'}</Link>
        </div>
      </div>
    </article>
  );
}
