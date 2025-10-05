'use client';

import { useUser } from '@auth0/nextjs-auth0';
import Image from 'next/image';

export default function LoginButton() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div className="text-sm">Loading...</div>;
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <Image
              src={user.picture}
              alt={user.name || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <a
          href="/auth/logout"
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a
      href="/auth/login"
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-10 px-4"
    >
      Login
    </a>
  );
}
