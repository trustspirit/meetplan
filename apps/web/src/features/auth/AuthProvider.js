import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);
    const signInWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };
    const signOutUser = async () => {
        await signOut(auth);
    };
    return (_jsx(AuthContext.Provider, { value: { user, loading, signInWithGoogle, signOutUser }, children: children }));
}
