import { useEffect } from "react";
import supabase from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      // Vérifie si la connexion via le lien email Supabase est OK
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erreur callback Supabase :", error);
        navigate("/login");
        return;
      }

      // Si l'utilisateur est authentifié → on l’envoie au tableau de bord
      if (data?.session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Connexion en cours…</p>
    </div>
  );
};

export default AuthCallback;
