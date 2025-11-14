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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, StopCircle } from "lucide-react";

/**
 * Página de gerenciamento de runs
 *
 * Regras:
 * - O usuário só pode criar (iniciar) uma run se não houver nenhuma run com status 'active'
 * - Pode parar a run ativa via botão (usa stopRunById)
 * - Mostra última leitura em polling enquanto houver run ativa
 */

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
                await stopRunById(bike_uuid, token); // fallback; your API supports bike_uuid/stop as well
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
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Corridas</h1>
                    <div>
                        {activeRun ? (
                            <div className="text-sm text-muted-foreground">Corrida ativa: <strong>{activeRun.name}</strong></div>
                        ) : (
                            <div className="text-sm text-muted-foreground">Nenhuma corrida ativa</div>
                        )}
                    </div>
                </div>

                {/* criar nova run */}
                <Card>
                    <CardHeader>
                        <CardTitle>Iniciar nova corrida</CardTitle>
                        <CardDescription>Inicie apenas quando não houver nenhuma corrida ativa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {createError && (
                            <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5" />
                                <div>{createError}</div>
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-1">
                                <Label htmlFor="bike">Bicicleta</Label>
                                <Select value={selectedBikeUuid} onValueChange={(v) => {
                                    setSelectedBikeUuid(v);
                                    // find bike id
                                    const b = bikes.find(bk => (bk.bike_uuid || bk.id_bike || String(bk.id)) == v);
                                    setSelectedBikeId(b ? String(b.id || b.bike_id || b.id_bike) : "");
                                }}>
                                    <SelectTrigger aria-label="Selecionar bicicleta">
                                        <SelectValue placeholder={loadingBikes ? "Carregando..." : bikes.length ? "Selecione uma bike" : "Nenhuma bike"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bikes.map((b) => {
                                            const uuid = b.bike_uuid || b.id_bike || String(b.id);
                                            const label = b.name || uuid;
                                            return <SelectItem key={uuid} value={uuid}>{label}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="runName">Nome da corrida</Label>
                                <Input id="runName" value={runName} onChange={(e) => setRunName(e.target.value)} placeholder="Ex: Volta ao Parque" />
                            </div>

                            <div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={!!activeRun || creating}>
                                        {creating ? "Iniciando..." : "Iniciar corrida"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => { setRunName(""); setCreateError(null); }}>
                                        Limpar
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Separator />

                {/* lista de runs */}
                <div>
                    <h2 className="text-lg font-medium mb-3">Histórico de Corridas</h2>

                    {loadingRuns ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                        </div>
                    ) : error ? (
                        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <div className="text-sm">{error}</div>
                        </div>
                    ) : runs.length === 0 ? (
                        <div className="rounded-md bg-muted/10 p-4 text-sm">Nenhuma corrida encontrada.</div>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                                {runs.map((r) => (
                                    <RunCard
                                        key={r.id_run || r.id}
                                        run={r}
                                        activeRunId={activeRun?.id_run}
                                        onStop={() => handleStop(r.id_run, r.bike_uuid)}
                                        token={token}
                                        onFetchMetrics={handleFetchMetrics}
                                        activeLast={activeRun?.id_run === r.id_run ? activeLast : null}
                                    />
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

/* Subcomponent: RunCard */
function RunCard({ run, onStop, token, onFetchMetrics, activeRunId, activeLast }) {
    const [metrics, setMetrics] = useState(null);
    const isActive = run.status === "active" || run.status === "started";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{run.name}</CardTitle>
                <CardDescription className="text-sm">
                    {isActive ? "Ativa" : run.status || "—"} • Iniciada: {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="text-sm space-y-2">
                    <div><strong>ID run:</strong> {run.id_run}</div>
                    <div><strong>Bike uuid:</strong> {run.bike_uuid}</div>
                    <div><strong>Circunferência (m):</strong> {run.circunferencia_m}</div>
                    <div><strong>Atualizado:</strong> {run.updated_at ? new Date(run.updated_at).toLocaleString() : "—"}</div>

                    {activeLast && (
                        <div className="mt-2 p-2 rounded bg-muted/5">
                            <div className="text-xs font-medium">Última leitura (live)</div>
                            <pre className="text-xs overflow-auto">{JSON.stringify(activeLast, null, 2)}</pre>
                        </div>
                    )}

                    {metrics && (
                        <div className="mt-2 p-2 rounded bg-muted/5">
                            <div className="text-xs font-medium">Métricas</div>
                            <pre className="text-xs overflow-auto">{JSON.stringify(metrics, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter>
                <div className="flex items-center gap-2 w-full">
                    <div className="flex-1">
                        {isActive ? (
                            <div className="text-sm text-green-600">Corrida em andamento</div>
                        ) : (
                            <div className="text-sm text-muted-foreground">Inativa</div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onFetchMetrics ? onFetchMetrics(run.id_run, setMetrics) : null}>
                            Ver métricas
                        </Button>

                        {isActive ? (
                            <Button size="sm" variant="destructive" onClick={onStop} title="Parar corrida">
                                <StopCircle className="h-4 w-4 mr-1" /> Parar
                            </Button>
                        ) : (
                            <div className="text-sm text-muted-foreground px-2 py-1 rounded">—</div>
                        )}
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
