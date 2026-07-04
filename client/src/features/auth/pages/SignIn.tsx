import { NavbarHomePage } from "@/features/homepage/components/HomePageNavbar"
import SignInForm from "../components/SignInForm"
import { BackPreviousAuth } from "@/shared/components/goPrevious/back"
import HomepageFooter from "@/features/homepage/components/HomepageFooter"

export const SignInPage = () => {
    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
            <div className="flex flex-col">
                <NavbarHomePage />
                <BackPreviousAuth />
                
                <main className="max-w-6xl w-full mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row gap-12 items-stretch">
                    {/* Left Panel: Form */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-3xl font-extrabold text-gray-800">Welcome Back</h2>
                        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                            Sign in to join active conversations, see your friends online, and jump right back into chatting.
                        </p>
                        <SignInForm />
                    </div>

                    {/* Right Panel: Premium Brand Card */}
                    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-850 rounded-2xl p-10 text-white flex-col justify-between shadow-xl relative overflow-hidden min-h-[480px]">
                        <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 flex items-center gap-2">
                            <span className="w-3.5 h-3.5 bg-green-400 rounded-full animate-ping"></span>
                            <span className="text-xl font-bold tracking-wider">SyncUs</span>
                        </div>
                        
                        <div className="relative z-10 my-auto">
                            <h3 className="text-3xl font-extrabold leading-tight mb-4">
                                Experience Seamless Real-time Chat
                            </h3>
                            <p className="text-blue-100 text-base leading-relaxed font-light">
                                Connect, message, and call instantly with your friends or groups across a lightweight and secure interface.
                            </p>
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-center text-xs text-blue-200">
                            <span>Instant Access</span>
                            <span>•</span>
                            <span>Secure Rooms</span>
                            <span>•</span>
                            <span>Global Network</span>
                        </div>
                    </div>
                </main>
            </div>
            
            <HomepageFooter />
        </div>
    )
}