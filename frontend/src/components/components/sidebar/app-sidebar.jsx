"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Sun, Moon } from "lucide-react";

/**
 * Sample data (mantive sua estrutura de exemplo)
 */
const data = {
    navMain: [
        {
            title: "Bikes",
            url: "#",
            items: [{ title: "Gerenciamento", url: "/bikes" }],
        },
        {
            title: "Runs",
            url: "#",
            items: [
                { title: "Dashboard", url: "/runs" },
                { title: "Gerenciamento", url: "/runs/gerenciamento" },
            ],
        },
    ],
};

/**
 * ThemeSwitcher (mantido exatamente como você tinha)
 */
function ThemeSwitcher() {
    const [mode, setMode] = useState("system"); // escolha atual
    const prefersDarkMQ =
        typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia("(prefers-color-scheme: dark)")
            : null;

    function applyTheme(nextMode) {
        if (nextMode === "system") {
            const shouldDark = prefersDarkMQ ? prefersDarkMQ.matches : false;
            document.documentElement.classList.toggle("dark", shouldDark);
        } else {
            document.documentElement.classList.toggle("dark", nextMode === "dark");
        }
    }

    useEffect(() => {
        try {
            const stored = localStorage.getItem("theme");
            if (stored === "light" || stored === "dark") {
                setMode(stored);
                applyTheme(stored);
            } else {
                setMode("system");
                applyTheme("system");
            }
        } catch (e) {
            setMode("system");
            applyTheme("system");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!prefersDarkMQ) return;
        const handler = () => {
            if (mode === "system") applyTheme("system");
        };
        prefersDarkMQ.addEventListener
            ? prefersDarkMQ.addEventListener("change", handler)
            : prefersDarkMQ.addListener(handler);
        return () => {
            prefersDarkMQ.removeEventListener
                ? prefersDarkMQ.removeEventListener("change", handler)
                : prefersDarkMQ.removeListener(handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    function selectMode(next) {
        setMode(next);
        try {
            if (next === "system") localStorage.removeItem("theme");
            else localStorage.setItem("theme", next);
        } catch (e) { }
        applyTheme(next);
    }

    function IconForMode(m) {
        if (m === "dark") return <Moon className="size-4" />;
        if (m === "light") return <Sun className="size-4" />;
        return <ChevronsUpDown className="size-4" />;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                {IconForMode(mode)}
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-medium">Tema</span>
                                <span className="text-sm">
                                    {mode === "system"
                                        ? "Sistema"
                                        : mode === "dark"
                                            ? "Escuro"
                                            : "Claro"}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuItem onSelect={() => selectMode("system")}>
                            Sistema {mode === "system" && <Check className="ml-auto" />}
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={() => selectMode("light")}>
                            Claro {mode === "light" && <Check className="ml-auto" />}
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={() => selectMode("dark")}>
                            Escuro {mode === "dark" && <Check className="ml-auto" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

/**
 * AppSidebar (mantém as cores e usa Link sem <a>)
 */
export function AppSidebar(props) {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const TOKEN_KEY = "auth_token";

    useEffect(() => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            setIsLoggedIn(!!token);
        } catch (e) {
            setIsLoggedIn(false);
        }

        const onStorage = (e) => {
            if (e.key === TOKEN_KEY) {
                setIsLoggedIn(!!e.newValue);
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function handleLogout() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("auth_user");
        } catch (e) { }
        setIsLoggedIn(false);
        router.push("/login");
    }

    // Se não autenticado: mostra apenas um botão para login (Link sem <a>, sem mudar cores)
    if (!isLoggedIn) {
        return (
            <Sidebar {...props}>
                <SidebarHeader>
                    <ThemeSwitcher />
                </SidebarHeader>

                <SidebarContent className="flex items-center justify-center h-full">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link
                                    href="/login"
                                    className="flex w-full items-center justify-center gap-3 px-3 py-2 rounded-md hover:bg-muted/20 focus:outline-none"
                                >
                                    Entrar
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>

                <SidebarRail />
            </Sidebar>
        );
    }

    // Se autenticado: sidebar completa (Links sem <a>)
    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <ThemeSwitcher />
            </SidebarHeader>

            <ScrollArea className="h-screen rounded-md whitespace-nowrap">
                <SidebarContent>
                    {data.navMain.map((group) => (
                        <SidebarGroup key={group.title}>
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={!!item.isActive}>
                                                <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/20 focus:outline-none">
                                                    {item.title}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>
                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <div className="px-3 py-3 border-t">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handleLogout}
                        className="rounded-md px-3 py-2 hover:bg-muted/20 focus:outline-none"
                    >
                        Sair
                    </button>
                </div>
            </div>

            <SidebarRail />
        </Sidebar>
    );
}
