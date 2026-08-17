import {ImpersonateComplete} from '@components/Admin/ImpersonateComplete';

export const metadata = {
  title: 'Log in as artist',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ImpersonatePage() {
  return <ImpersonateComplete />;
}
