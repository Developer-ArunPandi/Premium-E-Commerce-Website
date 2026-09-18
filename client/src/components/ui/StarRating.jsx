import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ rating = 0, maxStars = 5, size = 'sm', showValue = false, className }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={cn(starClass, i < Math.floor(rating) ? 'rating-star-filled' : 'rating-star-empty')}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-neutral-600">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export function InteractiveStarRating({ value, onChange, size = 'md' }) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-8 h-8' };
  const starClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(starClass, star <= value ? 'rating-star-filled' : 'rating-star-empty')}
          />
        </button>
      ))}
    </div>
  );
}
