// /app/bikes/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyBikes, createBike } from "@/services/bike/bikeServices";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, Plus } from "lucide-react";

export default function BikesPage() {
    const router = useRouter();
    const TOKEN_KEY = "auth_token";

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [token, setToken] = useState(null);

    const [loading, setLoading] = useState(false);
    const [bikes, setBikes] = useState([]);
    const [error, setError] = useState(null);

    // form
    const [idBike, setIdBike] = useState("");
    const [name, setName] = useState("");
    const [circunferenciaM, setCircunferenciaM] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [createSuccess, setCreateSuccess] = useState(null);

    // checa token e redireciona se necessário
    useEffect(() => {
        try {
            const t = localStorage.getItem(TOKEN_KEY);
            if (!t) {
                router.push("/login");
                return;
            }
            setToken(t);
        } catch (e) {
            router.push("/login");
            return;
        } finally {
            setCheckingAuth(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // carregar bikes
    async function loadBikes(currentToken) {
        setLoading(true);
        setError(null);
        try {
            const payload = await getMyBikes(currentToken);
            // backend pode retornar o array diretamente ou em payload.data / payload.bikes
            const list = Array.isArray(payload) ? payload : payload?.data || payload?.bikes || [];
            setBikes(list);
        } catch (err) {
            console.error("Erro ao buscar bikes", err);
            if (err.status === 401) {
                // token inválido -> limpar e redirecionar
                try {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem("auth_user");
                } catch (e) { }
                router.push("/login");
                return;
            }
            setError(err?.message || "Erro ao buscar bikes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!checkingAuth && token) {
            loadBikes(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkingAuth, token]);

    // criar bike
    async function handleCreate(e) {
        e.preventDefault();
        setCreateError(null);
        setCreateSuccess(null);

        if (!idBike.trim() || !name.trim() || !circunferenciaM) {
            setCreateError("Preencha id, nome e circunferência.");
            return;
        }
        const circ = parseFloat(circunferenciaM);
        if (Number.isNaN(circ) || circ <= 0) {
            setCreateError("Circunferência deve ser um número positivo.");
            return;
        }

        const payload = {
            id_bike: idBike.trim(),
            name: name.trim(),
            circunferencia_m: circ,
            description: description ? description.trim() : "",
        };

        setCreating(true);
        try {
            await createBike(payload, token);
            setCreateSuccess("Bicicleta cadastrada com sucesso.");
            setIdBike("");
            setName("");
            setCircunferenciaM("");
            setDescription("");
            await loadBikes(token);
            setTimeout(() => setCreateSuccess(null), 3000);
        } catch (err) {
            console.error("Erro criando bike", err);
            if (err.status === 401) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem("auth_user");
                } catch (e) { }
                router.push("/login");
                return;
            }
            const msg = err?.payload?.message || err?.message || "Erro ao criar bike.";
            setCreateError(msg);
        } finally {
            setCreating(false);
        }
    }

    if (checkingAuth) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Minhas Bicicletas</h1>
                </div>

                {/* Formulário de cadastro */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cadastrar nova bike</CardTitle>
                        <CardDescription>Informe os dados para cadastrar uma nova bicicleta.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {createError && (
                            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div className="text-sm">{createError}</div>
                            </div>
                        )}
                        {createSuccess && (
                            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-green-700">
                                {createSuccess}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="id_bike">ID</Label>
                                <Input id="id_bike" value={idBike} onChange={(e) => setIdBike(e.target.value)} placeholder="id interno da bike" required />
                            </div>

                            <div>
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da bike" required />
                            </div>

                            <div>
                                <Label htmlFor="circ">Circunferência (m)</Label>
                                <Input id="circ" type="number" step="0.01" value={circunferenciaM} onChange={(e) => setCircunferenciaM(e.target.value)} placeholder="Ex: 2.00" required />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="desc">Descrição</Label>
                                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" />
                            </div>

                            <div className="sm:col-span-2 flex items-center gap-3">
                                <Button type="submit" disabled={creating}>
                                    {creating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cadastrando...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Cadastrar bike
                                        </>
                                    )}
                                </Button>

                                <Button type="button" variant="outline" onClick={() => {
                                    setIdBike("");
                                    setName("");
                                    setCircunferenciaM("");
                                    setDescription("");
                                    setCreateError(null);
                                    setCreateSuccess(null);
                                }}>
                                    Limpar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Separator />

                {/* Lista em cards */}
                <div>
                    <h2 className="text-lg font-medium mb-3">Lista</h2>

                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                        </div>
                    ) : error ? (
                        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="text-sm">{error}</div>
                        </div>
                    ) : bikes.length === 0 ? (
                        <div className="rounded-md bg-muted/10 p-4 text-sm">Nenhuma bicicleta cadastrada.</div>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                                {bikes.map((b) => (
                                    <Card key={b.id || b.id_bike}>
                                        <CardHeader>
                                            <CardTitle>{b.name || b.id_bike || "Sem nome"}</CardTitle>
                                            <CardDescription className="text-sm">{b.description || "—"}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm space-y-2">
                                                <div><strong>ID:</strong> {b.id_bike}</div>
                                                <div><strong>Circunferência (m):</strong> {b.circunferencia_m}</div>
                                                <div><strong>Registro:</strong> {b.id || "—"}</div>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            {/* espaço para ações futuras (editar / excluir) */}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
