'use client';

import Link from 'next/link';
import { Button, ButtonProps } from '@mui/material';

interface LinkButtonProps extends Omit<ButtonProps<typeof Link>, 'component'> {
  href: string;
}

export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}
