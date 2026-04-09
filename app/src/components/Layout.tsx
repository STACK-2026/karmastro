import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { appConfig } from "../app.config";

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="font-bold text-xl tracking-tight"
            style={{ color: appConfig.colors.primary }}
          >
            {appConfig.name}
          </Link>

          <div className="flex items-center gap-4">
            <a
              href={appConfig.siteUrl}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Retour au site
            </a>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Deconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
                style={{ background: appConfig.colors.primary }}
              >
                Connexion
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
