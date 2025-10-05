import Image from "next/image";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth0.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="font-sans min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold">Adsett.</h2>
        <div className="flex gap-4">
          <a href="/" className="text-sm hover:underline">Home</a>
          <a href="/auth/logout" className="text-sm hover:underline">Logout</a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            {session.user.picture && (
              <Image
                src={session.user.picture}
                alt={session.user.name || 'User'}
                width={120}
                height={120}
                className="rounded-full mb-4"
              />
            )}
            <h1 className="text-3xl font-bold mb-2">{session.user.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{session.user.email}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">User ID:</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm font-mono">{session.user.sub}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                <span className="text-gray-600 dark:text-gray-400">{session.user.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <span className="text-gray-600 dark:text-gray-400">{session.user.email}</span>
              </div>
              {session.user.email_verified !== undefined && (
                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email Verified:</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {session.user.email_verified ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {session.user.updated_at 
                    ? new Date(session.user.updated_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="flex-1 text-center rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] transition-colors py-3 hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm"
            >
              Back to Home
            </a>
            <a
              href="/auth/logout"
              className="flex-1 text-center rounded-lg border border-solid border-red-500 text-red-500 transition-colors py-3 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm"
            >
              Logout
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
