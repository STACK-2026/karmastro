import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">
        Bienvenue, {user?.email}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder cards — a remplacer par les features du projet */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-2">Commencer</h3>
          <p className="text-sm text-gray-600">
            Cette section sera personnalisee pour chaque projet.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-2">Mon compte</h3>
          <p className="text-sm text-gray-600">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Plan : Gratuit</p>
        </div>
      </div>
    </div>
  );
}
