// /app/login/page.jsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { login as authLogin } from "@/services/auth/authService";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const emailRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // persist: 'local' (remember me) or 'session' (no remember)
    const [persistLocal, setPersistLocal] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // extrai token conforme retorno do backend (se você já persiste no service, não precisa duplicar)
    function extractToken(payload) {
        return payload?.token || payload?.accessToken || payload?.access_token || null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        // validação simples
        if (!email.trim() || !password) {
            setError("Preencha email e senha.");
            // foco no email (ou no campo com erro)
            if (!email.trim()) emailRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            // chama auth service e informa persistência
            const payload = await authLogin(
                { email: email.trim(), password },
                { persist: persistLocal ? "local" : "session" }
            );

            const token = extractToken(payload);
            // Se o serviço já gravou o token, não é necessário fazer nada aqui.
            // Mas guardamos também por segurança caso o service não grave.
            if (token) {
                try {
                    if (persistLocal) localStorage.setItem("auth_token", token);
                    else sessionStorage.setItem("auth_token", token);
                } catch (e) { }
            }

            // redireciona para /corridas
            router.push("/corridas");
        } catch (err) {
            console.error("Login error:", err);
            // Priorizar mensagens do backend, se existirem
            let message = "Erro ao efetuar login.";
            if (err?.payload?.message) message = err.payload.message;
            else if (err?.message) message = err.message;

            setError(message);
            // foco no campo apropriado se for 401
            if (err.status === 401) {
                // limpar senha por segurança e focar nela
                setPassword("");
                // esperar um tick para focar
                setTimeout(() => {
                    const el = document.getElementById("password");
                    el?.focus();
                }, 0);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Entrar</CardTitle>
                    <CardDescription>Informe suas credenciais para acessar o painel.</CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2"
                        >
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="text-sm">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                ref={emailRef}
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@exemplo.com"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                                    className="absolute inset-y-0 right-2 flex items-center px-2"
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
                                />
                                <Label htmlFor="remember" className="text-sm">
                                    Lembrar-me
                                </Label>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <a href="/esqueci-senha" className="underline">
                                    Esqueci a senha
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
