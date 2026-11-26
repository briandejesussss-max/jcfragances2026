import { loadAdminReviews } from '@/controllers/admin-data.controller';
import { ReviewsModeration } from '@/views/admin/reviews/ReviewsModeration';

export default async function ReviewsPage() {
  const { reviews, names } = await loadAdminReviews();
  return <ReviewsModeration reviews={reviews} names={names} />;
}
