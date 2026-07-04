import React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Gender } from "@/shared/components/genderToggle/genderToggleHomePageDialog"
import CountriesApiServices from "@/features/homepage/services/countryApiServices"

interface DialogRegisterProps {
    open: boolean
    onClose: () => void
}

export const SignUpOnUseChat: React.FC<DialogRegisterProps> = ({ open, onClose }) => {
    const [genderForm, setGenderForm] = React.useState<Gender>("male")
    const [username, setUsername] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [age, setAge] = React.useState<number | "">("")
    const [country, setCountry] = React.useState("")

    const { register, loading, error } = useAuth()
    const { countriesApi } = CountriesApiServices()
    const nvg = useNavigate()

    const ages = Array.from({ length: 71 }, (_, i) => i + 10)

    if (!open) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !email || !password || age === "" || !country) {
            alert("Isi semua field dulu coy 😅")
            return
        }

        try {
            const res = await register({
                username,
                email,
                password,
                gender: genderForm,
                country,
                age: age as number,
            })
            console.log("✅ Register success:", res)
            nvg("/chat")
            onClose()
        } catch (error) {
            console.error("❌ Register failed:", error)
        }
    }

    return (
        <div
            className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-sm mx-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
            <form className="flex flex-col space-y-3" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    className="border px-3 py-2 rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="border px-3 py-2 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="border px-3 py-2 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <select
                    className="border px-3 py-2 rounded"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value) || "")}
                >
                    <option value="">Age</option>
                    {ages.map((a) => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                    ))}
                </select>
                <select
                    className="border px-3 py-2 rounded"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                >
                    <option value="">Country</option>
                    {countriesApi?.map((cty) => (
                        <option key={cty} value={cty}>
                            {cty}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 rounded"
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>
                {error && <div className="text-red-500 text-sm">{error}</div>}
            </form>
            <button
                className="mt-4 text-blue-600 hover:underline w-full text-center"
                onClick={onClose}
            >
                Close
            </button>
        </div>
    )
}
