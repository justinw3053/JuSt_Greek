"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from 'aws-amplify/auth';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        getCurrentUser().then(() => {
            router.push('/');
        }).catch(() => { });
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl mb-4 block">🏠</Link>
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Join JuSt_Greek</h1>
                    <p className="text-gray-500">Track your XP, streaks, and progress.</p>
                </div>

                <Authenticator>
                    {({ signOut, user }) => (
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-4">Welcome back, {user?.username}!</h2>
                            <button
                                onClick={signOut}
                                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600"
                            >
                                Sign Out
                            </button>
                            <div className="mt-4">
                                <Link href="/" className="text-blue-500 underline">Return Home</Link>
                            </div>
                        </div>
                    )}
                </Authenticator>
            </div>
        </div>
    );
}
