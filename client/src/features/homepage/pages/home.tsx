import React from "react";
import ProfileIdentityFormDialog from "../components/profileIdentityFormDialog";
import { NavbarHomePage } from "../components/HomePageNavbar";
import { HomePageBenefitFeatures, HomePageFeatureList } from "../assets/homepageIconAssets";
import HomepageFooter from "../components/HomepageFooter";

export const SyncusHomePage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white font-sans">
            <NavbarHomePage />
            
            {/* Hero and Form Section */}
            <div className="relative">
                {/* Hero Banner */}
                <div className="relative w-full h-[480px] flex flex-col items-center justify-center bg-gradient-to-tr from-blue-800 via-blue-600 to-indigo-700 text-white px-4 text-center">
                    <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                    <div className="z-10 -mt-20 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">
                            Connect Instantly, Chat Freely
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100/90 font-light max-w-xl mx-auto drop-shadow-sm">
                            Experience a secure, user-friendly space to meet new people and stay connected with friends.
                        </p>
                    </div>
                    
                    {/* SVG Wave curve at bottom */}
                    <svg className="absolute bottom-0 left-0 w-full h-[120px] md:h-[150px]" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#FFFFFF" fillOpacity="1" d="M0,256L60,250.7C120,245,240,235,360,229.3C480,224,600,224,720,229.3C840,235,960,245,1080,245.3C1200,245,1320,235,1380,229.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                    </svg>
                </div>

                {/* Overlapping Identity Form Dialog */}
                <div className="absolute top-[280px] left-1/2 transform -translate-x-1/2 z-20 w-full max-w-[550px] px-4">
                    <ProfileIdentityFormDialog />
                </div>
            </div>

            {/* Content Container starting below the absolute dialog */}
            <div className="flex-1 flex flex-col">
                <div className="text-center mt-44 w-[85%] max-w-4xl justify-center m-auto px-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
                        <span className="text-blue-600">SyncUs</span> is a modern web chat platform where anyone can connect instantly — no sign-up, no barriers.
                    </h3>
                    <p className="text-gray-600 mt-4 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                        Join public or private group chats, enjoy voice and video calls, and share images in real time. Whether you're chatting with close friends or meeting new people from around the world, SyncUs gives you a secure, user-friendly space to stay connected.
                    </p>
                    <p className="text-gray-500 mt-3 text-sm italic">
                        Block users when needed, stay anonymous if you want, and jump right into conversations — it's chatting, your way.
                    </p>
                </div>

                {/* Section Benefit (3 columns) */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mt-28 px-8 text-center">
                    {HomePageBenefitFeatures.map((ftr, index) => {
                        const Icon = ftr.icon;
                        return (
                            <div key={index} className="flex flex-col items-center group">
                                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-600 mb-6 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg">
                                    <Icon size={40} strokeWidth={2} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{ftr.title}</h3>
                                <p className="text-sm text-gray-600 mt-2 max-w-xs">{ftr.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Section Feature (6 card grid) */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 px-8 mb-24">
                    {HomePageFeatureList.map((ftr, index) => {
                        const Icon = ftr.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 text-left flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <Icon size={20} className="" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-850">{ftr.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{ftr.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <HomepageFooter />
            </div>
        </div>
    );
};