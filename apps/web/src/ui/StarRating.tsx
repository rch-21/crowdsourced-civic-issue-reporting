import { useState } from 'react';

export function StarRating({
  value,
  onChange,
  readOnly = false,
  max = 5
}: {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  max?: number;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  const labels: Record<number, string> = {
    1: 'Poor / Needs attention',
    2: 'Fair / Minor improvement needed',
    3: 'Satisfactory / Resolved',
    4: 'Good / Well resolved',
    5: 'Excellent / Exceeded expectations'
  };

  return (
    <div className="star-rating-wrapper">
      <div className="star-rating" role="radiogroup" aria-label="Satisfaction rating">
        {Array.from({ length: max }, (_, i) => {
          const ratingValue = i + 1;
          const isFilled = ratingValue <= activeValue;

          return (
            <button
              key={ratingValue}
              type="button"
              className={`star-btn ${isFilled ? 'filled' : 'empty'} ${readOnly ? 'readonly' : ''}`}
              disabled={readOnly}
              onClick={() => onChange?.(ratingValue)}
              onMouseEnter={() => !readOnly && setHoverValue(ratingValue)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              aria-label={`${ratingValue} of ${max} stars`}
              aria-checked={ratingValue === value}
              role="radio"
            >
              ★
            </button>
          );
        })}
      </div>
      {!readOnly && (
        <span className="star-rating-description">
          {labels[activeValue] || `${activeValue} out of ${max} stars`}
        </span>
      )}
    </div>
  );
}
