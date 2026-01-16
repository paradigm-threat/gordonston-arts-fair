import DateLocationApply from '@fragments/date-location-apply.mdx';
import Link from 'next/link';
import { Box } from '@mui/material';

interface FooterContentProps {
  showDates?: boolean
}

export function FooterContent({ showDates = false }: FooterContentProps) {
  return (
    <footer className="footer-container">
      {showDates && <DateLocationApply />}

      <Box className="m-auto flex flex-col items-center gap-4 p-4">
        <span>
          This website is managed by
          {' '}
          <Link href="mailto:ari.asulin@gmail.com" target="_blank">Ari Asulin</Link>
          {' '}
          (<Link href="https://clevertree.net/" target="_blank">CLEVERTREE</Link>)
          {' '}
          and can be edited via
          {' '}
          <Link href="https://github.com/clevertree/gordonston-arts-fair" target="_blank">Github.com</Link>
        </span>
        <span>
          For help submitting your Artist Profile please contact the admin at
          {' '}
          <Link href="mailto:admin@gordonstonartfair.com" target="_blank">admin@gordonstonartfair.com</Link>
        </span>
        <span>
          <Link href="/privacy">Privacy Policy</Link>
          {' / '}
          <Link href="/terms">Terms and Conditions</Link>
        </span>
      </Box>
    </footer>
  );
}
