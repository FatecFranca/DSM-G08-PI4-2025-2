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
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    DownloadCloud,
    BarChart2,
    Bike,
    Activity,
    Database,
    PlayCircle,
    Filter,
    Calendar
} from "lucide-react";

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
    PieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
    const [bikeFilter, setBikeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

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

    // Filter runs based on selected filters
    const filteredRuns = React.useMemo(() => {
        if (!dashboard?.runs_recentes) return [];

        let filtered = dashboard.runs_recentes;

        if (bikeFilter && bikeFilter !== "all") {
            filtered = filtered.filter(run =>
                run.bike_uuid === bikeFilter || run.bike_name === bikeFilter
            );
        }

        // Add date filtering logic here if needed

        return filtered;
    }, [dashboard?.runs_recentes, bikeFilter, dateFilter]);

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
            a.download = `estatisticas_run_${run.id_run}_${run.name || ''}.csv`.replace(/\s+/g, '_');
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Corridas</h1>
                        <p className="text-muted-foreground mt-1">
                            Visualize e analise o desempenho das suas corridas
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Atualizado em: {dashboard?.resumo ? new Date().toLocaleString('pt-BR') : "-"}</span>
                    </div>
                </div>

                {/* resumo cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        title="Total Bikes"
                        value={dashboard?.bikes?.length ?? (dashboard?.resumo?.total_bikes ?? 0)}
                        description="Bikes cadastradas"
                        icon={<Bike className="h-5 w-5" />}
                        color="blue"
                    />
                    <SummaryCard
                        title="Total Runs"
                        value={dashboard?.resumo?.total_runs ?? 0}
                        description="Corridas registradas"
                        icon={<Activity className="h-5 w-5" />}
                        color="green"
                    />
                    <SummaryCard
                        title="Total Leituras"
                        value={dashboard?.resumo?.total_leituras ?? 0}
                        description="Pontos de leitura"
                        icon={<Database className="h-5 w-5" />}
                        color="purple"
                    />
                    <SummaryCard
                        title="Runs Ativas"
                        value={dashboard?.resumo?.runs_ativas ?? 0}
                        description="Corridas em andamento"
                        icon={<PlayCircle className="h-5 w-5" />}
                        color="orange"
                    />
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filtros
                                </CardTitle>
                                <CardDescription>Filtre as corridas por bike</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {filteredRuns.length} {filteredRuns.length === 1 ? 'run' : 'runs'} encontrada(s)
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {selectedRuns.length} selecionada(s)
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="bike-filter" className="text-sm font-medium">Filtrar por Bike</Label>
                                <Select value={bikeFilter} onValueChange={setBikeFilter}>
                                    <SelectTrigger id="bike-filter" className="mt-1">
                                        <SelectValue placeholder="Todas as bikes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as bikes</SelectItem>
                                        {bikes.map((bike) => (
                                            <SelectItem key={bike.uuid || bike.id} value={bike.uuid || bike.id}>
                                                {bike.name || bike.modelo || `Bike ${bike.uuid?.substring(0, 8)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setBikeFilter("all");
                                        setDateFilter("all");
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* runs recentes + comparativo */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Runs Recentes</CardTitle>
                                <CardDescription>Selecione runs para comparar ou visualize estatísticas individuais</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleComparativo}
                                    disabled={loadingComparativo || selectedRuns.length < 2}
                                    className="flex items-center gap-2"
                                >
                                    {loadingComparativo ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <BarChart2 className="h-4 w-4" />
                                    )}
                                    {loadingComparativo ? "Comparando..." : `Comparar (${selectedRuns.length})`}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => { setComparativo(null); setSelectedRuns([]); }}
                                    disabled={selectedRuns.length === 0}
                                >
                                    Limpar Seleção
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* runs list */}
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {filteredRuns.length > 0 ? (
                                    filteredRuns.map((r) => (
                                        <RunCard
                                            key={r.id_run}
                                            run={r}
                                            isSelected={selectedRuns.includes(r.id_run)}
                                            onToggleSelect={() => toggleSelectRun(r.id_run)}
                                            onViewStats={() => openRunStats(r)}
                                            onExportCSV={() => handleExportCSV(r)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhuma run encontrada com os filtros atuais.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* comparativo result */}
                {comparativo && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparativo entre Runs</CardTitle>
                            <CardDescription>Análise comparativa das runs selecionadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ComparativoView data={comparativo} />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal: estatísticas da run */}
            <Dialog open={!!selectedRunForModal} onOpenChange={(open) => { if (!open) { setSelectedRunForModal(null); setRunStats(null); } }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" />
                            Estatísticas — {selectedRunForModal?.name || "Run"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRunForModal ? `ID: ${selectedRunForModal.id_run} • Bike: ${selectedRunForModal.bike_name || selectedRunForModal.bike_uuid}` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-3">
                        {loadingRunStats ? (
                            <div className="min-h-[200px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : runStats ? (
                            runStats.error ? (
                                <div className="text-red-600 text-center py-8">
                                    <p>Erro ao carregar estatísticas:</p>
                                    <p className="text-sm">{runStats.error}</p>
                                </div>
                            ) : (
                                <RunStatsView stats={runStats} run={selectedRunForModal} />
                            )
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => { setSelectedRunForModal(null); setRunStats(null); }}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* Summary Card Component */
function SummaryCard({ title, value, description, icon, color = "blue" }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-200",
        green: "bg-green-50 text-green-600 border-green-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
        orange: "bg-orange-50 text-orange-600 border-orange-200",
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-0">
                <div className="flex items-center p-6">
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* Run Card Component */
function RunCard({ run, isSelected, onToggleSelect, onViewStats, onExportCSV }) {
    return (
        <div className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${isSelected ? 'bg-primary/5 border-primary' : 'bg-background hover:bg-muted/50'}`}>
            <div className="flex-shrink-0 mt-1">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelect}
                    className="h-5 w-5"
                />
            </div>

            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                    {(run.name || "R").charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="font-semibold truncate">{run.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Bike className="h-3 w-3" />
                                {run.bike_name || run.bike_uuid}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {run.total_leituras ?? 0} leituras
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={onViewStats}>
                            <BarChart2 className="h-4 w-4 mr-1" />
                            Estatísticas
                        </Button>
                        <Button size="sm" onClick={onExportCSV}>
                            <DownloadCloud className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Renderiza estatísticas detalhadas (runStats) */
function RunStatsView({ stats, run }) {
    const freq = stats?.probabilidades?.distribuicao_frequencia || [];
    const chartData = freq.map((c, i) => ({
        name: c.intervalo || `Classe ${i + 1}`,
        frequencia: typeof c.frequencia === 'number' ? c.frequencia : (c.frequencia || 0),
    }));

    // Data for metrics cards
    const metrics = [
        { label: "Média", value: stats?.tendencia_central?.media ?? "-", desc: "Média amostral" },
        { label: "Mediana", value: stats?.tendencia_central?.mediana ?? "-", desc: "Valor central" },
        { label: "Desvio Padrão", value: stats?.dispersao?.desvio_padrao ?? "-", desc: "Dispersão dos dados" },
        { label: "Variância", value: stats?.dispersao?.variancia ?? "-", desc: "Variância amostral" },
        { label: "Amostras", value: stats?.amostras ?? 0, desc: "Nº de leituras" },
        { label: "Coef. Variação", value: stats?.dispersao?.coeficiente_variacao ? `${(stats.dispersao.coeficiente_variacao * 100).toFixed(2)}%` : "-", desc: "CV" },
    ];

    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="distribution">Distribuição</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {metric.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metric.value}</div>
                                <p className="text-xs text-muted-foreground">{metric.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {chartData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Distribuição de Frequência</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="frequencia" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
                {chartData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição de Frequência</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="frequencia" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição Percentual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="frequencia"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} ocorrências`, 'Frequência']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Sem dados de distribuição para exibir.
                    </div>
                )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quantis / Percentis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs overflow-auto bg-muted/5 p-3 rounded-md max-h-80">
                                {JSON.stringify(stats?.quantis || {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Inferência Estatística</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs overflow-auto bg-muted/5 p-3 rounded-md max-h-80">
                                {JSON.stringify(stats?.inferencia || {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}

/* Comparativo View */
function ComparativoView({ data }) {
    // Adapte esta função conforme a estrutura retornada pela API de comparativo
    return (
        <div className="space-y-4">
            <div className="bg-muted/5 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
            <div className="text-sm text-muted-foreground">
                <p>Esta visualização será aprimorada conforme a estrutura de dados do comparativo.</p>
            </div>
        </div>
    );
}