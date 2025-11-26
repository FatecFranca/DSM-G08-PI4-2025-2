"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    getRuns,
    createRun,
    stopRunById,
    getRunMetrics,
    getRunLast,
} from "@/services/runs/runsServices";
import { getMyBikes } from "@/services/bike/bikeServices";

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
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    AlertCircle,
    StopCircle,
    PlayCircle,
    Clock,
    Bike,
    Activity,
    BarChart3,
    Calendar,
    MapPin,
    Zap
} from "lucide-react";

export default function RunsPage() {
    const router = useRouter();
    const TOKEN_KEY = "auth_token";

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [token, setToken] = useState(null);

    const [runs, setRuns] = useState([]);
    const [bikes, setBikes] = useState([]);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [loadingBikes, setLoadingBikes] = useState(false);
    const [error, setError] = useState(null);

    // create form
    const [selectedBikeUuid, setSelectedBikeUuid] = useState("");
    const [selectedBikeId, setSelectedBikeId] = useState("");
    const [runName, setRunName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    // metrics / last reading
    const [activeLast, setActiveLast] = useState(null);
    const pollingRef = useRef(null);

    // logo abaixo dos outros useState
    const [tab, setTab] = useState("active");


    // check auth
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

    // load bikes to choose in form
    async function loadBikes(currentToken) {
        setLoadingBikes(true);
        try {
            const payload = await getMyBikes(currentToken);
            const list = Array.isArray(payload) ? payload : payload?.data || payload?.bikes || [];
            setBikes(list);
            // default select first bike if exists
            if (list.length > 0 && !selectedBikeUuid) {
                setSelectedBikeUuid(list[0].bike_uuid || list[0].id_bike || list[0].id);
                setSelectedBikeId(String(list[0].id || list[0].bike_id || list[0].id_bike));
            }
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
            setError(err.message || "Erro ao carregar bicicletas");
        } finally {
            setLoadingBikes(false);
        }
    }

    // load runs
    async function loadRuns(currentToken) {
        setLoadingRuns(true);
        setError(null);
        try {
            const payload = await getRuns(currentToken);
            const list = Array.isArray(payload) ? payload : payload?.data || payload?.runs || [];
            setRuns(list);
        } catch (err) {
            console.error("Erro ao buscar runs", err);
            if (err.status === 401) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem("auth_user");
                } catch (e) { }
                router.push("/login");
                return;
            }
            setError(err.message || "Erro ao carregar corridas");
        } finally {
            setLoadingRuns(false);
        }
    }

    useEffect(() => {
        if (!checkingAuth && token) {
            loadBikes(token);
            loadRuns(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkingAuth, token]);

    // detect active run
    const activeRun = runs.find((r) => r.status === "active" || r.status === "started");

    // polling last when activeRun exists
    useEffect(() => {
        if (!activeRun || !token) {
            // stop polling
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                setActiveLast(null);
            }
            return;
        }

        // initial fetch immediately
        let mounted = true;
        async function fetchLast() {
            try {
                const last = await getRunLast(activeRun.id_run, token);
                if (!mounted) return;
                setActiveLast(last);
            } catch (err) {
                console.error("Erro fetch last:", err);
            }
        }
        fetchLast();

        // set polling
        pollingRef.current = setInterval(fetchLast, 5000);
        return () => {
            mounted = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRun, token]);

    // create run (start)
    async function handleCreate(e) {
        e.preventDefault();
        setCreateError(null);

        if (!selectedBikeUuid || !selectedBikeId || !runName) {
            setCreateError("Preencha bike e nome da corrida.");
            return;
        }

        if (activeRun) {
            setCreateError("Já existe uma corrida ativa. Pare-a antes de iniciar outra.");
            return;
        }

        const body = {
            bike_uuid: selectedBikeUuid,
            bike_id: selectedBikeId,
            name: runName,
        };

        setCreating(true);
        try {
            await createRun(body, token);
            setRunName("");
            await loadRuns(token);
        } catch (err) {
            console.error("Erro criando run", err);
            if (err.status === 401) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem("auth_user");
                } catch (e) { }
                router.push("/login");
                return;
            }
            setCreateError(err?.payload?.message || err.message || "Erro ao criar corrida");
        } finally {
            setCreating(false);
        }
    }

    // stop run
    async function handleStop(id_run, bike_uuid) {
        try {
            // prefer stop by id_run if available
            if (id_run) {
                await stopRunById(id_run, token);
            } else if (bike_uuid) {
                await stopRunById(bike_uuid, token);
            }
            await loadRuns(token);
        } catch (err) {
            console.error("Erro parando run", err);
            if (err.status === 401) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem("auth_user");
                } catch (e) { }
                router.push("/login");
                return;
            }
            setError(err?.payload?.message || err.message || "Erro ao parar corrida");
        }
    }

    // fetch metrics modal-like (simple fetch + console or show under card)
    async function handleFetchMetrics(id_run, setMetrics) {
        try {
            const metrics = await getRunMetrics(id_run, token);
            setMetrics(metrics);
        } catch (err) {
            console.error("Erro metrics", err);
            setError(err?.message || "Erro ao buscar métricas");
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
                            <Activity className="h-8 w-8 text-primary" />
                            Gerenciar Corridas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Inicie, pare e acompanhe suas corridas em tempo real
                        </p>
                    </div>

                    {/* Active Run Indicator */}
                    {activeRun ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-800">
                                    Corrida Ativa: <strong>{activeRun.name}</strong>
                                </span>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                <Zap className="h-3 w-3 mr-1" />
                                Live
                            </Badge>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            <span className="text-sm text-muted-foreground">Nenhuma corrida ativa</span>
                        </div>
                    )}
                </div>

                <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="active" className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            Corrida Ativa
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Histórico
                        </TabsTrigger>
                        <TabsTrigger value="new" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Nova
                        </TabsTrigger>
                    </TabsList>

                    {/* Nova Corrida */}
                    <TabsContent value="new">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PlayCircle className="h-5 w-5" />
                                    Iniciar Nova Corrida
                                </CardTitle>
                                <CardDescription>
                                    Escolha uma bicicleta e inicie uma nova corrida. Apenas uma corrida pode estar ativa por vez.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {createError && (
                                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-800 font-medium">Erro ao iniciar corrida</p>
                                            <p className="text-red-700 text-sm mt-1">{createError}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="bike" className="flex items-center gap-2">
                                                <Bike className="h-4 w-4" />
                                                Bicicleta
                                            </Label>
                                            <Select value={selectedBikeUuid} onValueChange={(v) => {
                                                setSelectedBikeUuid(v);
                                                const b = bikes.find(bk => (bk.bike_uuid || bk.id_bike || String(bk.id)) == v);
                                                setSelectedBikeId(b ? String(b.id || b.bike_id || b.id_bike) : "");
                                            }}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder={loadingBikes ? "Carregando..." : bikes.length ? "Selecione uma bike" : "Nenhuma bike disponível"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bikes.map((b) => {
                                                        const uuid = b.bike_uuid || b.id_bike || String(b.id);
                                                        const label = b.name || uuid;
                                                        return (
                                                            <SelectItem key={uuid} value={uuid}>
                                                                <div className="flex items-center gap-2">
                                                                    <Bike className="h-4 w-4" />
                                                                    {label}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Selecione a bicicleta para esta corrida
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="runName" className="flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                Nome da Corrida
                                            </Label>
                                            <Input
                                                id="runName"
                                                value={runName}
                                                onChange={(e) => setRunName(e.target.value)}
                                                placeholder="Ex: Volta ao Parque, Treino Noturno..."
                                                className="h-11"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Dê um nome descritivo para esta corrida
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={!!activeRun || creating || !selectedBikeUuid || !runName.trim()}
                                            className="flex items-center gap-2 h-11 flex-1"
                                            size="lg"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Iniciando Corrida...
                                                </>
                                            ) : (
                                                <>
                                                    <PlayCircle className="h-4 w-4" />
                                                    Iniciar Corrida
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setRunName("");
                                                setCreateError(null);
                                            }}
                                            className="h-11"
                                            disabled={creating}
                                        >
                                            Limpar
                                        </Button>
                                    </div>

                                    {activeRun && (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                                <div>
                                                    <p className="text-amber-800 font-medium">Corrida ativa em andamento</p>
                                                    <p className="text-amber-700 text-sm mt-1">
                                                        Você precisa parar a corrida atual "{activeRun.name}" antes de iniciar uma nova.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Corrida Ativa */}
                    <TabsContent value="active">
                        {activeRun ? (
                            <ActiveRunView
                                run={activeRun}
                                onStop={handleStop}
                                activeLast={activeLast}
                                onFetchMetrics={handleFetchMetrics}
                            />
                        ) : (
                            <EmptyActiveState onStart={() => setTab("new")} />
                        )}
                    </TabsContent>

                    {/* Histórico */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Histórico de Corridas
                                </CardTitle>
                                <CardDescription>
                                    Todas as suas corridas anteriores e seus dados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingRuns ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="text-sm text-muted-foreground">Carregando corridas...</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
                                        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                                        <p className="text-red-800 font-medium">Erro ao carregar corridas</p>
                                        <p className="text-red-700 text-sm mt-1">{error}</p>
                                    </div>
                                ) : runs.filter(r => !(r.status === "active" || r.status === "started")).length === 0 ? (
                                    <EmptyHistoryState onStart={() => setTab("new")} />
                                ) : (
                                    <ScrollArea className="h-[600px]">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
                                            {runs
                                                .filter(r => !(r.status === "active" || r.status === "started"))
                                                .map((run) => (
                                                    <RunCard
                                                        key={run.id_run || run.id}
                                                        run={run}
                                                        onFetchMetrics={handleFetchMetrics}
                                                    />
                                                ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

/* Componente para Corrida Ativa */
function ActiveRunView({ run, onStop, activeLast, onFetchMetrics }) {
    const [metrics, setMetrics] = useState(null);

    return (
        <div className="space-y-6">
            {/* Card Principal da Corrida Ativa */}
            <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Zap className="h-6 w-6 text-green-500 animate-pulse" />
                                {run.name}
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                    AO VIVO
                                </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1">
                                    <Bike className="h-4 w-4" />
                                    {run.bike_uuid}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Iniciada: {run.started_at ? new Date(run.started_at).toLocaleString('pt-BR') : "—"}
                                </span>
                            </CardDescription>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => onStop(run.id_run, run.bike_uuid)}
                            className="flex items-center gap-2"
                        >
                            <StopCircle className="h-4 w-4" />
                            Parar Corrida
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {run.circunferencia_m}m
                            </div>
                            <div className="text-sm text-muted-foreground">Circunferência</div>
                        </div>
                        <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="text-2xl font-bold">
                                #{run.id_run}
                            </div>
                            <div className="text-sm text-muted-foreground">ID da Corrida</div>
                        </div>
                        <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="text-2xl font-bold">
                                {activeLast ? "Recebendo" : "Aguardando"}
                            </div>
                            <div className="text-sm text-muted-foreground">Dados</div>
                        </div>
                    </div>

                    {/* Última Leitura */}
                    {activeLast && (
                        <div className="mb-6">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Última Leitura em Tempo Real
                            </h4>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <pre className="text-sm overflow-auto max-h-40">
                                    {JSON.stringify(activeLast, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Métricas */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Métricas da Corrida
                            </h4>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onFetchMetrics(run.id_run, setMetrics)}
                            >
                                Atualizar Métricas
                            </Button>
                        </div>

                        {metrics ? (
                            <div className="bg-muted/10 border rounded-lg p-4">
                                <pre className="text-sm overflow-auto max-h-60">
                                    {JSON.stringify(metrics, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Clique em "Atualizar Métricas" para ver os dados</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/* Componente para Card de Run no Histórico */
function RunCard({ run, onFetchMetrics }) {
    const [metrics, setMetrics] = useState(null);
    const isActive = run.status === "active" || run.status === "started";

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { variant: "default", label: "Ativa", color: "bg-green-100 text-green-800 border-green-300" },
            started: { variant: "default", label: "Iniciada", color: "bg-green-100 text-green-800 border-green-300" },
            stopped: { variant: "secondary", label: "Parada", color: "bg-gray-100 text-gray-800" },
            completed: { variant: "outline", label: "Concluída", color: "bg-blue-100 text-blue-800 border-blue-300" },
        };

        const config = statusConfig[status] || { variant: "outline", label: status, color: "bg-gray-100 text-gray-800" };
        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-lg mb-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <span className="truncate">{run.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(run.status)}
                            <Badge variant="outline" className="text-xs">
                                <Bike className="h-3 w-3 mr-1" />
                                {run.bike_uuid}
                            </Badge>
                        </div>
                    </div>
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
                            {run.id_run}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Ruler className="h-3 w-3" />
                            Circunferência:
                        </span>
                        <span className="font-medium">{run.circunferencia_m}m</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Iniciada:
                        </span>
                        <span className="text-xs text-right">
                            {run.started_at ? new Date(run.started_at).toLocaleString('pt-BR') : "—"}
                        </span>
                    </div>

                    {run.updated_at && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Atualizada:
                            </span>
                            <span className="text-xs text-right">
                                {new Date(run.updated_at).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    )}

                    {metrics && (
                        <div className="mt-3 p-2 rounded bg-muted/5 border">
                            <div className="text-xs font-medium mb-1">Métricas</div>
                            <pre className="text-xs overflow-auto max-h-32">
                                {JSON.stringify(metrics, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="bg-muted/20 pt-3">
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                        {isActive ? "Corrida em andamento" : "Corrida finalizada"}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFetchMetrics(run.id_run, setMetrics)}
                        className="h-8 text-xs"
                    >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Métricas
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

/* Empty States */
function EmptyActiveState({ onStart }) {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                        <PlayCircle className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhuma corrida ativa</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Inicie uma nova corrida para começar a coletar dados em tempo real.
                    </p>
                    <Button
                        onClick={onStart}
                        className="flex items-center gap-2 mx-auto"
                    >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar Primeira Corrida
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyHistoryState({ onStart }) {
    return (
        <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma corrida no histórico</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Suas corridas finalizadas aparecerão aqui para análise e consulta.
            </p>
            <Button
                onClick={onStart}
                variant="outline"
                className="flex items-center gap-2 mx-auto"
            >
                <PlayCircle className="h-4 w-4" />
                Iniciar Corrida
            </Button>
        </div>
    );
}


// Missing icon components
const Plus = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const Hash = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
const Ruler = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;