import Link from 'next/link';
import {FaImages, FaUserEdit} from 'react-icons/fa';

export function EditProfileLink({
  href,
  label,
  variant = 'profile',
}: {
  href: string;
  label: string;
  variant?: 'profile' | 'photos';
}) {
  const Icon = variant === 'photos' ? FaImages : FaUserEdit;
  return (
    <Link href={href} className="edit-profile-link">
      <Icon aria-hidden size={18} />
      {label}
    </Link>
  );
}
