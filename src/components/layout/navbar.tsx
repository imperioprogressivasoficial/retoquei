import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface NavBarProps {
  user: User | null;
}

export default function NavBar({ user }: NavBarProps) {
  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-gray-900">
          Retoquei
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-400">{user.email}</span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
