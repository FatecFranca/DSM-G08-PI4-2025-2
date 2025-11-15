// /app/login/page.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as authLogin, register as authRegister } from "@/services/auth/authService";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, EyeOff, Loader2, UserPlus, LogIn, Bike, CheckCircle2, Sparkles } from "lucide-react";

export default function AuthPage() {
    const router = useRouter();
    const emailRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    const [activeTab, setActiveTab] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [persistLocal, setPersistLocal] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const extractToken = (payload) => {
        return payload?.token || payload?.accessToken || payload?.access_token || null;
    };

    const validateForm = () => {
        setError(null);
        setSuccess(null);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email.trim()) {
            setError("Email é obrigatório.");
            emailRef.current?.focus();
            return false;
        }

        if (!emailRegex.test(email.trim())) {
            setError("Por favor, insira um email válido.");
            emailRef.current?.focus();
            return false;
        }

        if (!password) {
            setError("Senha é obrigatória.");
            return false;
        }

        if (activeTab === "register") {
            if (!name.trim()) {
                setError("Nome é obrigatório.");
                return false;
            }
            if (password !== confirmPassword) {
                setError("As senhas não coincidem.");
                return false;
            }
            if (password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres.");
                return false;
            }
        }

        return true;
    };

    const handleTabChange = (value) => {
        setIsAnimating(true);
        setActiveTab(value);
        setError(null);
        setSuccess(null);
        setTimeout(() => setIsAnimating(false), 300);
    };

    async function handleLogin(e) {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = await authLogin(
                { email: email.trim(), password },
                { persist: persistLocal ? "local" : "session" }
            );

            const token = extractToken(payload);
            if (token) {
                try {
                    if (persistLocal) localStorage.setItem("auth_token", token);
                    else sessionStorage.setItem("auth_token", token);
                } catch (e) { }
            }

            setSuccess("Login realizado com sucesso! Redirecionando...");
            setTimeout(() => {
                router.push("/bikes");
            }, 1000);
            
        } catch (err) {
            console.error("Login error:", err);
            let message = "Erro ao efetuar login.";
            if (err?.payload?.message) message = err.payload.message;
            else if (err?.message) message = err.message;

            setError(message);
            if (err.status === 401) {
                setPassword("");
                setTimeout(() => {
                    document.getElementById("password")?.focus();
                }, 0);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = await authRegister(
                { 
                    email: email.trim(), 
                    password, 
                    name: name.trim() 
                },
                { persist: persistLocal ? "local" : "session" }
            );

            const token = extractToken(payload);
            if (token) {
                try {
                    if (persistLocal) localStorage.setItem("auth_token", token);
                    else sessionStorage.setItem("auth_token", token);
                } catch (e) { }
            }

            setSuccess("Conta criada com sucesso! Redirecionando para suas bicicletas...");
            
            setTimeout(() => {
                router.push("/bikes");
            }, 1500);
        } catch (err) {
            console.error("Register error:", err);
            let message = "Erro ao criar conta.";
            if (err?.payload?.message) message = err.payload.message;
            else if (err?.message) message = err.message;

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e) => {
        if (activeTab === "login") {
            handleLogin(e);
        } else {
            handleRegister(e);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">
                    <Bike className="h-12 w-12 text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/25">
                                <Bike className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Bike Analytics
                            </h1>
                            <p className="text-muted-foreground">Sistema de monitoramento de corridas</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-background/95">
                    <CardHeader className="text-center space-y-3 pb-6">
                        <CardTitle className="text-2xl font-bold">
                            {activeTab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {activeTab === "login" 
                                ? "Entre em sua conta para gerenciar suas bicicletas" 
                                : "Junte-se a nós e comece sua jornada no ciclismo"
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-6">
                        {/* Alert Messages */}
                        {error && (
                            <div
                                role="alert"
                                className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 animate-in fade-in duration-300"
                            >
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-destructive font-medium">Ops! Algo deu errado</p>
                                    <p className="text-destructive/90 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div
                                role="status"
                                className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 animate-in fade-in duration-300"
                            >
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-green-600 font-medium">Sucesso!</p>
                                    <p className="text-green-600/90 text-sm mt-1">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-lg">
                                <TabsTrigger 
                                    value="login" 
                                    className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Entrar
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="register" 
                                    className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Cadastrar
                                </TabsTrigger>
                            </TabsList>

                            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                <TabsContent value="login" className="space-y-5 m-0">
                                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                        <div className="space-y-3">
                                            <Label htmlFor="login-email" className="text-sm font-medium">
                                                Email
                                            </Label>
                                            <Input
                                                id="login-email"
                                                ref={emailRef}
                                                type="email"
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                required
                                                className="h-11 focus:border-primary/50 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="login-password" className="text-sm font-medium">
                                                Senha
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="login-password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="h-11 focus:border-primary/50 transition-colors pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="remember"
                                                    checked={persistLocal}
                                                    onCheckedChange={(val) => setPersistLocal(Boolean(val))}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label htmlFor="remember" className="text-sm text-muted-foreground">
                                                    Lembrar-me
                                                </Label>
                                            </div>

                                            <Button variant="link" className="p-0 h-auto text-sm text-primary hover:text-primary/80" asChild>
                                                <a href="/esqueci-senha">Esqueci a senha</a>
                                            </Button>
                                        </div>

                                        <Button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Entrando...
                                                </>
                                            ) : (
                                                <>
                                                    <LogIn className="mr-2 h-4 w-4" />
                                                    Entrar na plataforma
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="register" className="space-y-5 m-0">
                                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                        <div className="space-y-3">
                                            <Label htmlFor="register-name" className="text-sm font-medium">
                                                Nome completo
                                            </Label>
                                            <Input
                                                id="register-name"
                                                type="text"
                                                autoComplete="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Seu nome completo"
                                                required
                                                className="h-11 focus:border-primary/50 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="register-email" className="text-sm font-medium">
                                                Email
                                            </Label>
                                            <Input
                                                id="register-email"
                                                type="email"
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                required
                                                className="h-11 focus:border-primary/50 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="register-password" className="text-sm font-medium">
                                                Senha
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="register-password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="h-11 focus:border-primary/50 transition-colors pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                A senha deve ter pelo menos 6 caracteres
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="register-confirm-password" className="text-sm font-medium">
                                                Confirmar senha
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="register-confirm-password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="h-11 focus:border-primary/50 transition-colors pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                                    aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="register-remember"
                                                checked={persistLocal}
                                                onCheckedChange={(val) => setPersistLocal(Boolean(val))}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label htmlFor="register-remember" className="text-sm text-muted-foreground">
                                                Manter-me conectado
                                            </Label>
                                        </div>

                                        <Button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Criando conta...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Criar minha conta
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-6 border-t bg-muted/20 rounded-b-lg">
                        <div className="text-center text-sm text-muted-foreground">
                            {activeTab === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                            <Button 
                                variant="link" 
                                className="p-0 h-auto text-primary hover:text-primary/80 font-medium" 
                                onClick={() => handleTabChange(activeTab === "login" ? "register" : "login")}
                            >
                                {activeTab === "login" ? "Cadastre-se gratuitamente" : "Fazer login"}
                            </Button>
                        </div>
                        
                        <div className="text-xs text-center text-muted-foreground">
                            Ao continuar, você concorda com nossos{" "}
                            <Button variant="link" className="p-0 h-auto text-xs text-primary" asChild>
                                <a href="/termos">Termos de Serviço</a>
                            </Button>{" "}
                            e{" "}
                            <Button variant="link" className="p-0 h-auto text-xs text-primary" asChild>
                                <a href="/privacidade">Política de Privacidade</a>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}