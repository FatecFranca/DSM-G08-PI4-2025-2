"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Check,
    ChevronsUpDown,
    Sun,
    Moon,
    LogOut,
    User,
    Settings,
    Bike,
    Activity,
    BarChart3,
    Home,
    LogIn
} from "lucide-react";

/**
 * Sample data (estrutura melhorada com ícones)
 */
const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: <BarChart3 className="h-4 w-4" />,
            items: []
        },
        {
            title: "Bikes",
            url: "/bikes",
            icon: <Bike className="h-4 w-4" />,
            items: []
        },
        {
            title: "Corridas",
            url: "/runs",
            icon: <Activity className="h-4 w-4" />,
            items: [
                { title: "Gerenciamento", url: "/runs/gerenciamento" },
            ],
        },
    ],
};

/**
 * ThemeSwitcher (melhorado)
 */
function ThemeSwitcher() {
    const [mode, setMode] = useState("system");
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

    const modeLabels = {
        system: "Sistema",
        light: "Claro",
        dark: "Escuro"
    };

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
                                    {modeLabels[mode]}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuItem
                            onSelect={() => selectMode("system")}
                            className="flex items-center gap-2"
                        >
                            <ChevronsUpDown className="size-4" />
                            Sistema
                            {mode === "system" && <Check className="ml-auto size-4" />}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onSelect={() => selectMode("light")}
                            className="flex items-center gap-2"
                        >
                            <Sun className="size-4" />
                            Claro
                            {mode === "light" && <Check className="ml-auto size-4" />}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onSelect={() => selectMode("dark")}
                            className="flex items-center gap-2"
                        >
                            <Moon className="size-4" />
                            Escuro
                            {mode === "dark" && <Check className="ml-auto size-4" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

/**
 * UserProfile - Componente para perfil do usuário com logout
 */
function UserProfile({ onLogout }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const userData = localStorage.getItem("auth_user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.error("Erro ao carregar dados do usuário:", e);
        }
    }, []);

    const getUserInitials = () => {
        if (!user?.name) return "U";
        return user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserName = () => {
        return user?.name || "Usuário";
    };

    const getUserEmail = () => {
        return user?.email || "user@example.com";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                    <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {getUserInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="font-medium text-sm truncate w-full">
                                {getUserName()}
                            </span>
                            <span className="text-xs text-muted-foreground truncate w-full">
                                {getUserEmail()}
                            </span>
                        </div>
                        <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="start">
                <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getUserInitials()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{getUserName()}</span>
                        <span className="text-xs text-muted-foreground">{getUserEmail()}</span>
                    </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Meu Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2">
                    <Settings className="size-4" />
                    <span>Configurações</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onSelect={onLogout}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                    <LogOut className="size-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * SimpleLogoutButton - Botão simples de logout sem dropdown
 */
function SimpleLogoutButton({ onLogout }) {
    return (
        <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
            <LogOut className="size-4" />
            <span>Sair</span>
        </Button>
    );
}

/**
 * AppSidebar
 */
export function AppSidebar(props) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const TOKEN_KEY = "auth_token";

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                setIsLoggedIn(!!token);
            } catch (e) {
                setIsLoggedIn(false);
            }
        };

        checkAuth();

        const onStorage = (e) => {
            if (e.key === TOKEN_KEY) {
                checkAuth();
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function handleLogout() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("auth_user");
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_user");
        } catch (e) { }
        setIsLoggedIn(false);
        router.push("/login");
    }

    // Função para verificar se um item está ativo
    const isItemActive = (url) => {
        return pathname === url || (url !== '/' && pathname.startsWith(url));
    };

    // Se não autenticado
    if (!isLoggedIn) {
        return (
            <Sidebar {...props}>
                <SidebarHeader className="p-4 border-b">
                    <div className="flex items-center gap-2 px-2">
                        <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Bike className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none">
                            <span className="font-semibold">Bike Analytics</span>
                            <span className="text-xs text-muted-foreground">Não logado</span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent className="flex flex-col justify-between h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center p-6">
                            <div className="mx-auto w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                                <User className="h-6 w-6 text-muted-foreground/60" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Faça login para acessar o sistema
                            </p>
                            <Button asChild className="w-full">
                                <Link href="/login">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Fazer Login
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 border-t">
                        <ThemeSwitcher />
                    </div>
                </SidebarContent>

                <SidebarRail />
            </Sidebar>
        );
    }

    // Se autenticado: sidebar completa
    return (
        <Sidebar {...props}>
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center gap-2 px-2">
                    <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Bike className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold">Bike Analytics</span>
                        <span className="text-xs text-muted-foreground">Painel</span>
                    </div>
                </div>
            </SidebarHeader>

            <ScrollArea className="flex-1">
                <SidebarContent className="p-4">
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Navegação
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {data.navMain.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isItemActive(item.url)}
                                            className="flex items-center gap-3"
                                        >
                                            <Link href={item.url}>
                                                {item.icon}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>

                                        {/* Subitens se existirem */}
                                        {item.items && item.items.length > 0 && (
                                            <SidebarMenu className="ml-4 mt-1 space-y-1">
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuItem key={subItem.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={isItemActive(subItem.url)}
                                                            size="sm"
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <Link href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenu>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </ScrollArea>

            {/* Área do usuário e configurações no rodapé */}
            <div className="border-t p-4 space-y-4">
                <ThemeSwitcher />

                {/* Versão simples com apenas botão de logout */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                U
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="font-medium text-sm truncate w-full">
                                Usuário
                            </span>
                        </div>
                    </div>
                    <SimpleLogoutButton onLogout={handleLogout} />
                </div>
            </div>

            <SidebarRail />
        </Sidebar>
    );
}