import { Link } from 'react-router-dom';
import { Notice } from '../components/ui/States';

export function NotFoundPage() {
  return (
    <main id="main" className="page">
      <Notice
        title="This page is not part of the publication."
        action={
          <Link to="/" className="btn">
            Back to today
          </Link>
        }
      >
        The address did not match any section of ATMOS.
      </Notice>
    </main>
  );
}
