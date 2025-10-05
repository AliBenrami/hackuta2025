import Image from "next/image";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="font-sans min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold">Adssent.</h2>
        <div className="flex gap-4 items-center">
          {session ? (
            <>
              <a href="/profile" className="hover:opacity-80 transition-opacity">
                {session.user.picture && (
                  <Image
                    src={session.user.picture}
                    alt={session.user.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
              </a>
              <a href="/auth/logout" className="text-sm hover:underline">Logout</a>
            </>
          ) : (
            <a href="/auth/login" className="text-sm hover:underline">Login</a>
          )}
        </div>
      </nav>

      <main className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
        {!session ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">Please log in to continue</p>
            <a
              href="/auth/login"
              className="inline-flex rounded-full border border-solid border-transparent transition-colors items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-10 px-6"
            >
              Login with Auth0
            </a>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
            {session.user.picture && (
              <Image
                src={session.user.picture}
                alt={session.user.name || 'User'}
                width={80}
                height={80}
                className="rounded-full mx-auto"
              />
            )}
            <p className="text-gray-600 dark:text-gray-400">{session.user.email}</p>
            <div className="flex gap-4 justify-center">
              <a
                href="/profile"
                className="inline-flex rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm h-10 px-6"
              >
                View Profile
              </a>
              <a
                href="/auth/logout"
                className="inline-flex rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm h-10 px-6"
              >
                Logout
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
