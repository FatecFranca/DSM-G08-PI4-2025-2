// app/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, LogIn, LogOut, BarChart3, Activity, User } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const TOKEN_KEY = "auth_token";

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userData = localStorage.getItem("auth_user");

        setIsLoggedIn(!!token);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();

    // Listen for storage changes (like logout from other tabs)
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) {
        checkAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_user");
    } catch (e) { }
    setIsLoggedIn(false);
    setUser(null);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen">

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
              <Bike className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Bem-vindo ao{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Bike Analytics
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Sistema completo de monitoramento e análise de corridas de bicicleta
            </p>
          </div>

          {/* Status Card */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                {isLoggedIn ? (
                  <>
                    <User className="h-6 w-6 text-green-500" />
                    Logado
                  </>
                ) : (
                  <>
                    <LogIn className="h-6 w-6 text-blue-500" />
                    Não Logado
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isLoggedIn
                  ? "Você está autenticado no sistema"
                  : "Faça login para acessar todas as funcionalidades"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoggedIn ? (
                <>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      ✓ Sessão ativa
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Acesse o dashboard para começar
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGoToDashboard}
                      className="flex-1 gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Ir para Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="flex-1 gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">
                      ⓘ Faça login para continuar
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Acesse todas as funcionalidades do sistema
                    </p>
                  </div>
                  <Button
                    onClick={handleLogin}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <LogIn className="h-4 w-4" />
                    Fazer Login
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Bike className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Gerenciar Bikes</CardTitle>
                <CardDescription>
                  Cadastre e gerencie suas bicicletas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Monitorar Corridas</CardTitle>
                <CardDescription>
                  Acompanhe suas corridas em tempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Analisar Dados</CardTitle>
                <CardDescription>
                  Estatísticas detalhadas e relatórios
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Actions */}
          {isLoggedIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
                <CardDescription>
                  Acesse rapidamente as principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-14"
                    onClick={() => router.push("/bikes")}
                  >
                    <Bike className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Bikes</div>
                      <div className="text-xs text-muted-foreground">Gerenciar bicicletas</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-14"
                    onClick={() => router.push("/runs")}
                  >
                    <Activity className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Corridas</div>
                      <div className="text-xs text-muted-foreground">Monitorar corridas</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}