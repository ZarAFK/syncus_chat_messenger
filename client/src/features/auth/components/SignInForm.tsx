import { Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import React from "react"
import { useNavigate } from "react-router-dom"

export default function SignInForm() {
    const nvg = useNavigate()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const { login, loading, error } = useAuth()
    const submitHandling = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            alert("please fill all field")
            return
        }

        try {
            const resUserDt = await login(
                email, password
            )
            console.log("login berhasil", resUserDt);
            nvg("/chat")
        } catch (err) {
            console.error("login failed", err);

        }
    }
    return (
        <form className="flex flex-col space-y-4 mt-6" onSubmit={submitHandling}>
            <input
                type="text"
                placeholder="Username & email"
                className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
            />


            {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <button
                type="submit"
                disabled={loading}
                className={`py-2 rounded-md text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center text-sm text-gray-500">Or with</div>

            <div className="flex space-x-2">
                <button className="flex-1 border py-2 rounded-md">Google</button>
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-md">
                    Facebook
                </button>
            </div>

            {/* Sign in */}
            <p className="text-center text-sm text-gray-500">
                Dont have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:underline">
                    Sign Up
                </Link>
            </p>
        </form>
    )
}