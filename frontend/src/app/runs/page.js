"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    getDashboard,
    getEstatisticasRun,
    exportEstatisticasRunCSV,
    postComparativo,
} from "@/services/estatisticas/estatisticasServices";
import { getMyBikes } from "@/services/bike/bikeServices";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, DownloadCloud, BarChart2 } from "lucide-react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
} from "recharts";

/**
 * Dashboard de Runs
 * - Mostra resumo (bikes, runs, leituras, runs ativas)
 * - Lista runs recentes com botão "Ver estatísticas" (abre modal)
 * - Export CSV por run
 * - Comparativo entre runs selecionadas
 */

export default function RunsDashboardPage() {
    const router = useRouter();
    const TOKEN_KEY = "auth_token";

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [token, setToken] = useState(null);

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedRunForModal, setSelectedRunForModal] = useState(null);
    const [runStats, setRunStats] = useState(null);
    const [loadingRunStats, setLoadingRunStats] = useState(false);

    // comparativo
    const [selectedRuns, setSelectedRuns] = useState([]);
    const [comparativo, setComparativo] = useState(null);
    const [loadingComparativo, setLoadingComparativo] = useState(false);

    // filter/select bikes (optional)
    const [bikes, setBikes] = useState([]);
    const [bikeFilter, setBikeFilter] = useState("");

    // check token
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

    async function loadDashboard(curToken) {
        setLoading(true);
        setError(null);
        try {
            const payload = await getDashboard(curToken);
            setDashboard(payload?.data || payload);
        } catch (err) {
            console.error("Erro dashboard:", err);
            if (err.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                router.push("/login");
                return;
            }
            setError(err.message || "Erro ao carregar dashboard");
        } finally {
            setLoading(false);
        }
    }

    async function loadBikes(curToken) {
        try {
            const payload = await getMyBikes(curToken);
            const list = Array.isArray(payload) ? payload : payload?.data || payload?.bikes || [];
            setBikes(list);
        } catch (err) {
            console.error("Erro bikes (dashboard)", err);
        }
    }

    useEffect(() => {
        if (!checkingAuth && token) {
            loadDashboard(token);
            loadBikes(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkingAuth, token]);

    // abrir modal de estatísticas de uma run
    async function openRunStats(run) {
        setSelectedRunForModal(run);
        setRunStats(null);
        setLoadingRunStats(true);
        try {
            const payload = await getEstatisticasRun(run.id_run, token);
            setRunStats(payload?.data || payload);
        } catch (err) {
            console.error("Erro getEstatisticasRun:", err);
            setRunStats({ error: err.message || "Erro ao buscar estatísticas" });
        } finally {
            setLoadingRunStats(false);
        }
    }

    async function handleExportCSV(run) {
        try {
            const csvText = await exportEstatisticasRunCSV(run.id_run, token);
            const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `estatisticas_run_${run.id_run}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro export CSV:", err);
            alert("Erro ao exportar CSV: " + (err.message || ""));
        }
    }

    async function handleComparativo() {
        if (selectedRuns.length < 2) {
            alert("Selecione ao menos 2 runs para comparação.");
            return;
        }
        setLoadingComparativo(true);
        try {
            const payload = await postComparativo(selectedRuns, token);
            setComparativo(payload?.data || payload);
        } catch (err) {
            console.error("Erro comparativo:", err);
            alert("Erro no comparativo: " + (err.message || ""));
        } finally {
            setLoadingComparativo(false);
        }
    }

    // toggle select run for comparativo
    function toggleSelectRun(id_run) {
        setSelectedRuns((prev) => {
            if (prev.includes(id_run)) return prev.filter((i) => i !== id_run);
            return [...prev, id_run];
        });
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
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Dashboard — Corridas</h1>
                    <div className="text-sm text-muted-foreground">Atualizado em: {dashboard?.resumo ? new Date().toLocaleString() : "-"}</div>
                </div>

                {/* resumo cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total bikes</CardTitle>
                            <CardDescription>{dashboard?.bikes?.length ?? (dashboard?.resumo?.total_bikes ?? 0)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Bikes cadastradas</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total runs</CardTitle>
                            <CardDescription>{dashboard?.resumo?.total_runs ?? 0}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Corridas registradas</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total leituras</CardTitle>
                            <CardDescription>{dashboard?.resumo?.total_leituras ?? 0}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Pontos de leitura</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Runs ativas</CardTitle>
                            <CardDescription>{dashboard?.resumo?.runs_ativas ?? 0}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Corridas em andamento</div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* runs recentes + comparativo */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Runs recentes</h2>

                        <div className="flex items-center gap-2">
                            <Button onClick={handleComparativo} disabled={loadingComparativo}>
                                {loadingComparativo ? "Comparando..." : "Comparar selecionadas"}
                            </Button>
                            <Button variant="outline" onClick={() => { setComparativo(null); setSelectedRuns([]); }}>
                                Limpar seleção
                            </Button>
                        </div>
                    </div>

                    {/* runs list */}
                    <ScrollArea className="max-h-[48vh] p-2 border rounded">
                        <div className="space-y-3">
                            {dashboard?.runs_recentes && dashboard.runs_recentes.length > 0 ? (
                                dashboard.runs_recentes.map((r) => (
                                    <div key={r.id_run} className="flex items-start gap-3 p-3 border rounded bg-background">
                                        <div className="flex-shrink-0">
                                            <CheckboxWithSelect run={r} checked={selectedRuns.includes(r.id_run)} onToggle={() => toggleSelectRun(r.id_run)} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{r.name}</div>
                                                    <div className="text-sm text-muted-foreground">Bike: {r.bike_name ?? r.bike_uuid} • Leituras: {r.total_leituras ?? "-"}</div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openRunStats(r)}>Ver estatísticas</Button>
                                                    <Button size="sm" onClick={() => handleExportCSV(r)}><DownloadCloud className="mr-1 h-4 w-4" />Exportar CSV</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground">Nenhuma run recente encontrada.</div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* comparativo result */}
                {comparativo && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparativo</CardTitle>
                            <CardDescription>Resumo comparativo entre as runs selecionadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs overflow-auto">{JSON.stringify(comparativo, null, 2)}</pre>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal: estatísticas da run */}
            <Dialog open={!!selectedRunForModal} onOpenChange={(open) => { if (!open) { setSelectedRunForModal(null); setRunStats(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Estatísticas — {selectedRunForModal?.name || ""}</DialogTitle>
                        <DialogDescription>
                            {selectedRunForModal ? `Run: ${selectedRunForModal.id_run}` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-3">
                        {loadingRunStats ? (
                            <div className="min-h-[120px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : runStats ? (
                            runStats.error ? (
                                <div className="text-red-600">{runStats.error}</div>
                            ) : (
                                <RunStatsView stats={runStats} />
                            )
                        ) : (
                            <div className="text-sm text-muted-foreground">Selecione uma run para ver estatísticas</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => { setSelectedRunForModal(null); setRunStats(null); }}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* Checkbox + avatar small for run list */
function CheckboxWithSelect({ run, checked, onToggle }) {
    return (
        <div className="flex items-center gap-2">
            <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4" />
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8"><div className="text-sm">{(run.name || "R").charAt(0)}</div></Avatar>
            </div>
        </div>
    );
}

/* Renderiza estatísticas detalhadas (runStats) e um gráfico quando possível */
function RunStatsView({ stats }) {
    // stats follows the structure returned by your controller/service:
    // stats.tendencia_central, stats.probabilidades.distribuicao_frequencia, quantis, inferencia, etc.

    const freq = stats?.probabilidades?.distribuicao_frequencia || [];
    // transform classes for chart: expect objects with intervalo and frequencia
    const chartData = freq.map((c, i) => ({
        name: c.intervalo || `C${i + 1}`,
        freq: typeof c.frequencia === "number" ? c.frequencia : (c.frequencia || 0),
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{stats?.tendencia_central?.media ?? "-"}</div>
                        <div className="text-sm text-muted-foreground">Média amostral</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Desvio Padrão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{stats?.dispersao?.desvio_padrao ?? "-"}</div>
                        <div className="text-sm text-muted-foreground">Dispersion</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Amostras</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{stats?.amostras ?? 0}</div>
                        <div className="text-sm text-muted-foreground">N de leituras</div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Distribuição de frequência</h3>
                {chartData.length > 0 ? (
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="freq" fill="#4f46e5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">Sem dados de distribuição para plotar.</div>
                )}
            </div>

            <Separator />

            <div>
                <h4 className="font-medium">Quantis / Percentis</h4>
                <pre className="text-xs overflow-auto bg-muted/5 p-2 rounded">{JSON.stringify(stats?.quantis || {}, null, 2)}</pre>
            </div>

            <div>
                <h4 className="font-medium">Inferência</h4>
                <pre className="text-xs overflow-auto bg-muted/5 p-2 rounded">{JSON.stringify(stats?.inferencia || {}, null, 2)}</pre>
            </div>
        </div>
    );
}
