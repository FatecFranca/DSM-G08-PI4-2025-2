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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    Loader2,
    Plus,
    Bike,
    Settings,
    Calendar,
    Ruler,
    Hash
} from "lucide-react";

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

    const [tab, setTab] = useState("list");


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
            const list = Array.isArray(payload) ? payload : payload?.data || payload?.bikes || [];
            setBikes(list);
        } catch (err) {
            console.error("Erro ao buscar bikes", err);
            if (err.status === 401) {
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
            setCreateError("Preencha ID, nome e circunferência.");
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
            setCreateSuccess("Bicicleta cadastrada com sucesso!");
            setIdBike("");
            setName("");
            setCircunferenciaM("");
            setDescription("");
            await loadBikes(token);
            setTimeout(() => setCreateSuccess(null), 5000);
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-background">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Bike className="h-8 w-8 text-primary" />
                            Minhas Bicicletas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie e configure suas bicicletas para acompanhamento
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                        {bikes.length} {bikes.length === 1 ? 'bicicleta' : 'bicicletas'}
                    </Badge>
                </div>

                <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Bike className="h-4 w-4" />
                            Minhas Bikes
                        </TabsTrigger>
                        <TabsTrigger value="add" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Bike
                        </TabsTrigger>
                    </TabsList>

                    {/* Lista de Bikes */}
                    <TabsContent value="list" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Bicicletas</CardTitle>
                                <CardDescription>
                                    Todas as suas bicicletas cadastradas no sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-center space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="text-sm text-muted-foreground">Carregando bicicletas...</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-800 font-medium">Erro ao carregar bikes</p>
                                            <p className="text-red-700 text-sm mt-1">{error}</p>
                                        </div>
                                    </div>
                                ) : bikes.length === 0 ? (
                                    <EmptyState onAddBike={() => setTab("add")} />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {bikes.map((bike) => (
                                            <BikeCard key={bike.id || bike.id_bike} bike={bike} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Formulário de Cadastro */}
                    <TabsContent value="add">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Cadastrar Nova Bicicleta
                                </CardTitle>
                                <CardDescription>
                                    Preencha os dados para cadastrar uma nova bicicleta no sistema
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {createError && (
                                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-800 font-medium">Erro no cadastro</p>
                                            <p className="text-red-700 text-sm mt-1">{createError}</p>
                                        </div>
                                    </div>
                                )}

                                {createSuccess && (
                                    <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-green-800 font-medium">Sucesso!</p>
                                            <p className="text-green-700 text-sm mt-1">{createSuccess}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCreateSuccess(null)}
                                            className="text-green-700 hover:text-green-800 hover:bg-green-100"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                )}

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="id_bike" className="flex items-center gap-2">
                                                <Hash className="h-4 w-4" />
                                                ID da Bike
                                            </Label>
                                            <Input
                                                id="id_bike"
                                                value={idBike}
                                                onChange={(e) => setIdBike(e.target.value)}
                                                placeholder="Ex: bike-001"
                                                required
                                                className="h-11"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Identificador único para sua bike
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-2">
                                                <Bike className="h-4 w-4" />
                                                Nome da Bike
                                            </Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: MTB Pro 29"
                                                required
                                                className="h-11"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Nome de identificação da bike
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="circ" className="flex items-center gap-2">
                                                <Ruler className="h-4 w-4" />
                                                Circunferência (metros)
                                            </Label>
                                            <Input
                                                id="circ"
                                                type="number"
                                                step="0.01"
                                                min="0.1"
                                                value={circunferenciaM}
                                                onChange={(e) => setCircunferenciaM(e.target.value)}
                                                placeholder="Ex: 2.10"
                                                required
                                                className="h-11"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Circunferência da roda em metros
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="desc" className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                Descrição (Opcional)
                                            </Label>
                                            <Textarea
                                                id="desc"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Descreva características da sua bike..."
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Marca, modelo, especificações, etc.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={creating}
                                            className="flex items-center gap-2 h-11 flex-1"
                                            size="lg"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Cadastrando...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4" />
                                                    Cadastrar Bicicleta
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIdBike("");
                                                setName("");
                                                setCircunferenciaM("");
                                                setDescription("");
                                                setCreateError(null);
                                                setCreateSuccess(null);
                                            }}
                                            className="h-11"
                                            disabled={creating}
                                        >
                                            Limpar Campos
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

/* Componente para Card de Bike */
function BikeCard({ bike }) {
    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bike className="h-5 w-5 text-primary" />
                            <span className="truncate">{bike.name || bike.id_bike || "Sem nome"}</span>
                        </CardTitle>
                        <CardDescription className="truncate">
                            {bike.description || "Sem descrição"}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                        {bike.circunferencia_m}m
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Hash className="h-3 w-3" />
                            ID:
                        </span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {bike.id_bike}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Ruler className="h-3 w-3" />
                            Circunferência:
                        </span>
                        <span className="font-medium">{bike.circunferencia_m} metros</span>
                    </div>
                    {bike.id && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Registro:
                            </span>
                            <span className="text-xs text-muted-foreground">
                                #{bike.id}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="bg-muted/20 pt-3">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>Status: <Badge variant="outline" className="ml-1">Ativa</Badge></span>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                        Detalhes
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

/* Componente para Estado Vazio */
function EmptyState({ onAddBike }) {
    return (
        <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <Bike className="h-12 w-12 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma bicicleta cadastrada</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Comece cadastrando sua primeira bicicleta para acompanhar suas corridas e métricas.
            </p>
            <Button onClick={onAddBike} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Cadastrar Primeira Bike
            </Button>
        </div>
    );
}