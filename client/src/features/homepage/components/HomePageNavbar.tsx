import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const NavbarHomePage: React.FC = () => {
    const token = localStorage.getItem("access_token");
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/signin");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <header 
            className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 flex items-center ${
                isScrolled 
                    ? "h-[70px] bg-blue-800/85 backdrop-blur-md shadow-lg border-b border-blue-600/30" 
                    : "h-[85px] bg-blue-700"
            }`}
        >
            <div className="w-full flex items-center justify-between px-12 transition-all duration-300">
                <div>
                    <Link to="/" className="flex items-center gap-2 group">
                        <h2 className="text-3xl text-white font-extrabold tracking-wide transition-transform group-hover:scale-105">
                            SyncUs
                        </h2>
                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse mt-1"></span>
                    </Link>
                </div>
                <nav className="flex space-x-8 items-center">
                    {token ? (
                        <>
                            <Link 
                                to="/chat" 
                                className="text-white text-base font-semibold transition duration-300 hover:text-blue-200 hover:scale-105"
                            >
                                Go to Chat
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-white text-base font-semibold cursor-pointer transition duration-300 hover:text-blue-200 hover:scale-105 bg-transparent border-none"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                to="/signin" 
                                className="text-white text-base font-semibold transition duration-300 hover:text-blue-200 hover:scale-105"
                            >
                                Log in
                            </Link>
                            <Link 
                                to="/signup" 
                                className="bg-white text-blue-700 px-5 py-2 rounded-full text-base font-bold shadow-md hover:bg-blue-50 hover:shadow-lg transition duration-300 hover:scale-105"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

