import React from "react";
import { Link, useNavigate } from "react-router-dom";
import CountriesApiServices from "@/features/homepage/services/countryApiServices";
import GenderToggleSignupDialog, { Gender } from "@/shared/components/singupGender/genderToogleSignUp";
import { useAuth } from "../hooks/useAuth";

export default function SignUpForm() {
    const { countriesApi } = CountriesApiServices();

    // State gender
    const [genderForm, setGenderForm] = React.useState<Gender>("male");

    // ✅ buat list umur 10–80
    const ages = Array.from({ length: 71 }, (_, i) => i + 10);

    // State form
    const [username, setUsername] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [age, setAge] = React.useState<number | "">("");
    const [country, setCountry] = React.useState("");

    const { register, error, loading } = useAuth();

    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password || age === "" || !country) {
            alert("Please fill in all fields ⚠️");
            return;
        }

        try {
            const res = await register({
                username,
                email,
                password,
                gender: genderForm,
                country,
                age: age as number,
            });

            console.log("✅ Register success:", res);

            alert("✅ Register success");

            navigate("/chat");
        } catch (err) {
            console.error("❌ Register failed:", err);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <form
                className="flex flex-col space-y-4 mt-6"
                onSubmit={handleSubmit}
            >
                <input
                    type="text"
                    placeholder="Username"
                    className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="flex space-x-2">
                    <select
                        className="w-1/2 border border-gray-400 rounded-lg px-3 py-2 text-sm"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        required
                    >
                        <option value="">Age</option>
                        {ages.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>

                    <select
                        className="w-1/2 border border-gray-400 rounded-lg px-3 py-2 text-sm"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                    >
                        <option value="">
                            {countriesApi.length === 0 ? "Loading..." : "Country"}
                        </option>
                        {countriesApi.map((cty) => (
                            <option key={cty} value={cty}>
                                {cty}
                            </option>
                        ))}
                    </select>
                </div>

                <GenderToggleSignupDialog
                    genderForm={genderForm}
                    setGenderForm={setGenderForm}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 rounded-md disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Register Now"}
                </button>
                <div className="text-center text-sm text-gray-500">Or with</div>

                <div className="flex space-x-2">
                    <button
                        type="button"
                        className="flex-1 border py-2 rounded-md"
                    >
                        Google
                    </button>
                    <button
                        type="button"
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md"
                    >
                        Facebook
                    </button>
                </div>
                <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
