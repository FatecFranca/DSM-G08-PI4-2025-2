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

/* ----------------- Helpers & Sparkline ----------------- */
const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("pt-BR");
    } catch (e) {
        return String(iso);
    }
};
const fmtDuration = (s) => {
    if (s == null) return "—";
    const sec = Number(s);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const r = sec % 60;
    return (h ? h + "h " : "") + (m ? m + "m " : "") + r + "s";
};
const fmtDistance = (m) => {
    if (m == null) return "—";
    if (m >= 1000) return (m / 1000).toFixed(2) + " km";
    return m + " m";
};
const fmtNum = (v, digits = 1) => (v == null ? "—" : Number(v).toFixed(digits));

function Sparkline({ data }) {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const DPR = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * DPR;
        canvas.height = canvas.clientHeight * DPR;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!data || data.length === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.font = `${12 * DPR}px sans-serif`;
            ctx.fillText("Sem dados para gráfico", 8 * DPR, canvas.height / 2);
            return;
        }
        const pad = 6 * DPR;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = Math.max(0.1, max - min);
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = pad + (i / (data.length - 1)) * (canvas.width - pad * 2);
            const y = canvas.height - pad - ((v - min) / range) * (canvas.height - pad * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineWidth = 2 * DPR;
        ctx.strokeStyle = "rgba(96,165,250,0.95)";
        ctx.stroke();
        ctx.lineTo(canvas.width - pad, canvas.height - pad);
        ctx.lineTo(pad, canvas.height - pad);
        ctx.closePath();
        ctx.fillStyle = "rgba(96,165,250,0.08)";
        ctx.fill();
    }, [data]);

    return <canvas ref={ref} className="w-full h-20 rounded" />;
}

/* Componente para Corrida Ativa */
function ActiveRunView({ run, onStop, activeLast, onFetchMetrics }) {
    const [metrics, setMetrics] = useState(null);
    console.log(metrics)
    const [showRawLast, setShowRawLast] = useState(false);
    const [showRawMetrics, setShowRawMetrics] = useState(false);

    // auto-update toggle e ref para interval
    const [autoUpdateMetrics, setAutoUpdateMetrics] = useState(true);
    const pollingMetricsRef = useRef(null);

    // derive useful numbers (safe)
    // PRIORIDADE: activeLast (ao vivo) -> metrics (fetch) -> run (fallback)
    // const avgKmh = activeLast?.avg_kmh ?? activeLast?.kmh ?? metrics?.avg_kmh ?? run.avg_kmh ?? null;
    const avgKmh = metrics?.last?.speed_kmh ?? run.avg_kmh ?? null;
    const maxKmh = activeLast?.max_kmh ?? run.max_kmh ?? metrics?.max_kmh ?? null;
    const readingsCount = activeLast?.readings_count ?? run.readings_count ?? metrics?.readings_count ?? 0;
    const distance_m = activeLast?.distance_m ?? run.distance_m ?? metrics?.distance_m ?? 0;
    const duration_s = activeLast?.duration_s ?? run.duration_s ?? metrics?.duration_s ?? 0;

    // build sparkline data from activeLast.last (if array) or from metrics.series
    const series = (() => {
        if (!activeLast) return [];
        if (Array.isArray(activeLast.last)) return activeLast.last.map(x => (x.kmh ?? x.speed ?? null)).filter(v => v != null);
        if (Array.isArray(activeLast.samples)) return activeLast.samples.map(x => (x.kmh ?? x.speed ?? null)).filter(v => v != null);
        if (activeLast.kmh != null) return [activeLast.kmh];
        return [];
    })();

    // função para fazer fetch imediato de métricas (com try/catch)
    async function fetchMetricsNow() {
        try {
            await onFetchMetrics(run.id_run, setMetrics);
        } catch (err) {
            console.error('Erro ao buscar métricas (auto):', err);
        }
    }

    // iniciar/limpar polling de métricas quando autoUpdateMetrics mudar ou run mudar
    useEffect(() => {
        // sempre buscar imediatamente ao mudar run ou habilitar auto-update
        let mounted = true;

        if (!run || !onFetchMetrics) return;

        // se autoUpdate ligado, faz fetch imediato e agenda interval
        if (autoUpdateMetrics) {
            fetchMetricsNow();

            // safety: limpa se já houver
            if (pollingMetricsRef.current) {
                clearInterval(pollingMetricsRef.current);
                pollingMetricsRef.current = null;
            }

            pollingMetricsRef.current = setInterval(() => {
                // não faz nada se componente desmontado
                if (!mounted) return;
                fetchMetricsNow();
            }, 5000); // 5s (ajuste se quiser menor/maior)
        } else {
            // se desligou autoUpdate, limpa interval mas mantém metrics atuais
            if (pollingMetricsRef.current) {
                clearInterval(pollingMetricsRef.current);
                pollingMetricsRef.current = null;
            }
        }

        return () => {
            mounted = false;
            if (pollingMetricsRef.current) {
                clearInterval(pollingMetricsRef.current);
                pollingMetricsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run?.id_run, autoUpdateMetrics, onFetchMetrics]);

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
                                    Iniciada: {run.started_at ? fmtDate(run.started_at) : "—"}
                                </span>
                            </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Velocidade</div>
                                <div className="text-3xl font-bold text-green-600">{avgKmh != null ? fmtNum(avgKmh, 1) + ' km/h' : '—'}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={() => onStop(run.id_run, run.bike_uuid)}
                                    className="flex items-center gap-2"
                                >
                                    <StopCircle className="h-4 w-4" />
                                    Parar
                                </Button>

                                {/* Toggle Auto-Update */}
                                <Button
                                    size="sm"
                                    variant={autoUpdateMetrics ? "default" : "outline"}
                                    onClick={() => setAutoUpdateMetrics(v => !v)}
                                    className="h-8 flex items-center gap-2"
                                    title={autoUpdateMetrics ? "Auto-update ligado" : "Auto-update desligado"}
                                >
                                    <Zap className="h-4 w-4" />
                                    {autoUpdateMetrics ? "Auto ON" : "Auto OFF"}
                                </Button>

                                {/* Manual refresh still available */}
                                <Button size="sm" variant="outline" onClick={() => fetchMetricsNow()}>
                                    Atualizar Métricas
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-muted/10 text-center">
                            <div className="text-xs text-muted-foreground">Leituras</div>
                            <div className="text-xl font-bold">{readingsCount}</div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/10 text-center">
                            <div className="text-xs text-muted-foreground">Máx km/h</div>
                            <div className="text-xl font-bold">{maxKmh != null ? fmtNum(maxKmh, 1) + ' km/h' : '—'}</div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/10 text-center">
                            <div className="text-xs text-muted-foreground">Distância • Duração</div>
                            <div className="text-xl font-bold">{fmtDistance(distance_m)} • {fmtDuration(duration_s)}</div>
                        </div>
                    </div>

                    {/* Sparkline + last reading quick view */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <div className="md:col-span-2 bg-muted/5 border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />Últimas velocidades</div>
                                <div className="text-xs text-muted-foreground">Última atualização: {activeLast ? fmtDate(activeLast?.updated_at || activeLast?.timestamp || activeLast?.time || new Date().toISOString()) : '—'}</div>
                            </div>
                            <Sparkline data={series} />
                        </div>

                        <div className="bg-muted/5 border rounded-lg p-4">
                            <div className="text-sm font-medium mb-2">Última Leitura</div>
                            {activeLast ? (
                                <div className="space-y-2 text-sm">
                                    <div><strong>km/h:</strong> {activeLast.kmh ?? activeLast.speed ?? '—'}</div>
                                    {activeLast.latitude && activeLast.longitude && (
                                        <div><strong>Local:</strong> {Number(activeLast.latitude).toFixed(5)}, {Number(activeLast.longitude).toFixed(5)}</div>
                                    )}
                                    {activeLast.timestamp && <div><strong>Hora:</strong> {fmtDate(activeLast.timestamp)}</div>}
                                    {activeLast.count != null && <div><strong>Contagem:</strong> {activeLast.count}</div>}

                                    <div className="pt-2 flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(JSON.stringify(activeLast, null, 2))}>
                                            Copiar Leitura (JSON)
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowRawLast(s => !s)}>
                                            {showRawLast ? "Esconder JSON" : "Mostrar JSON"}
                                        </Button>
                                    </div>

                                    {showRawLast && (
                                        <div className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto max-h-44">
                                            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(activeLast, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">Aguardando primeira leitura...</div>
                            )}
                        </div>
                    </div> */}

                    {/* Métricas expandidas */}
                    <div className="mt-6">
                        <h4 className="font-medium flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4" />Métricas</h4>
                        {metrics ? (
                            <div className="bg-muted/10 border rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-xs text-muted-foreground">avg_kmh</div>
                                        <div className="font-medium">{fmtNum(metrics.avg_kmh ?? avgKmh, 1)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">distance_m</div>
                                        <div className="font-medium">{fmtDistance(metrics.distance_m ?? distance_m)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">duration_s</div>
                                        <div className="font-medium">{fmtDuration(metrics.duration_s ?? duration_s)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">readings_count</div>
                                        <div className="font-medium">{metrics.readings_count ?? readingsCount}</div>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(JSON.stringify(metrics, null, 2))}>Copiar métricas (JSON)</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowRawMetrics(s => !s)}>{showRawMetrics ? "Esconder JSON" : "Mostrar JSON"}</Button>
                                </div>

                                {showRawMetrics && (
                                    <div className="mt-3 p-2 bg-black/10 rounded text-xs overflow-auto max-h-44">
                                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(metrics, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground border rounded-lg">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">As métricas são atualizadas automaticamente (ou clique em "Atualizar Métricas")</p>
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

const Plus = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const Hash = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
const Ruler = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
