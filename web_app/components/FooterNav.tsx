"use client";

import Link from "next/link";
import { HomeIcon, ChartBarIcon, ChatBubbleLeftRightIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";

export default function FooterNav() {
    const pathname = usePathname();

    // Don't show footer on Lesson pages (they have their own action bar)
    // or Login page
    if (pathname.includes("/lesson/") || pathname.includes("/login")) return null;

    const navItems = [
        { href: "/", label: "Home", icon: "🏠" },
        { href: "/stats", label: "Stats", icon: "🔥" },
        { href: "/tutor", label: "Tutor", icon: "🤖" },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 pb-6 flex justify-around shadow-lg z-50 safe-pb">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                    >
                        <span className="text-2xl mb-0.5">{item.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
