import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Firebase user:", firebaseUser); // DEBUG
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe; // cleanup
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};
