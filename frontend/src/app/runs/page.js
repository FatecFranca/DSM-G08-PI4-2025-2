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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Loader2,
    DownloadCloud,
    BarChart2,
    Bike,
    Activity,
    Database,
    PlayCircle,
    Filter,
    Calendar,
    TrendingUp,
    PieChart,
    Table as TableIcon,
    AlertTriangle
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
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

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
    const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

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
            const data = payload?.data || payload;

            // Processar dados para garantir estrutura consistente
            const processedData = {
                ...data,
                runs_recentes: Array.isArray(data?.runs_recentes)
                    ? data.runs_recentes.map(run => ({
                        ...run,
                        bike_name: run.bike_name || `Bike ${run.bike_uuid?.substring(0, 8)}`,
                        total_leituras: run.total_leituras || 0,
                        name: run.name || `Run ${run.id_run}`
                    }))
                    : [],
                resumo: data?.resumo || {
                    total_bikes: 0,
                    total_runs: 0,
                    total_leituras: 0,
                    runs_ativas: 0
                }
            };

            setDashboard(processedData);
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

        return filtered;
    }, [dashboard?.runs_recentes, bikeFilter, dateFilter]);

    // Processar dados para gráficos de resumo
    const chartData = React.useMemo(() => {
        if (!filteredRuns.length) return [];

        return filteredRuns.map(run => ({
            name: run.name,
            leituras: run.total_leituras || 0,
            bike: run.bike_name,
            timestamp: run.created_at || run.updated_at
        }));
    }, [filteredRuns]);

    // Dados para gráfico de distribuição por bike
    const bikeDistributionData = React.useMemo(() => {
        const bikeCounts = {};
        filteredRuns.forEach(run => {
            const bikeName = run.bike_name;
            bikeCounts[bikeName] = (bikeCounts[bikeName] || 0) + 1;
        });

        return Object.entries(bikeCounts).map(([name, value]) => ({
            name: name.length > 15 ? `${name.substring(0, 12)}...` : name,
            value,
            fullName: name
        }));
    }, [filteredRuns]);

    // abrir modal de estatísticas de uma run
    async function openRunStats(run) {
        setSelectedRunForModal(run);
        setRunStats(null);
        setLoadingRunStats(true);
        try {
            const payload = await getEstatisticasRun(run.id_run, token);
            const processedStats = processRunStats(payload?.data || payload);
            setRunStats(processedStats);
        } catch (err) {
            console.error("Erro getEstatisticasRun:", err);
            setRunStats({
                error: err.message || "Erro ao buscar estatísticas",
                tendencia_central: {},
                dispersao: {},
                quantis: {},
                inferencia: {},
                amostras: 0
            });
        } finally {
            setLoadingRunStats(false);
        }
    }

    // Processar estatísticas da run para garantir estrutura consistente
    function processRunStats(stats) {
        if (!stats) return null;

        return {
            ...stats,
            tendencia_central: stats.tendencia_central || {},
            dispersao: stats.dispersao || {},
            quantis: stats.quantis || {},
            inferencia: stats.inferencia || {},
            amostras: stats.amostras || 0,
            probabilidades: stats.probabilidades || {
                distribuicao_frequencia: []
            }
        };
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

    // Selecionar/desselecionar todas as runs
    function toggleSelectAll() {
        if (selectedRuns.length === filteredRuns.length) {
            setSelectedRuns([]);
        } else {
            setSelectedRuns(filteredRuns.map(run => run.id_run));
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

                {error && (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <div>
                                <p className="font-medium text-destructive">Erro ao carregar dados</p>
                                <p className="text-sm text-destructive/80">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

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

                {/* Gráficos de Visão Geral */}
                {filteredRuns.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Visão Geral das Corridas
                            </CardTitle>
                            <CardDescription>
                                Distribuição e métricas das corridas filtradas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Gráfico de distribuição por bike */}
                                {bikeDistributionData.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Distribuição por Bike</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={bikeDistributionData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) =>
                                                            `${name}: ${(percent * 100).toFixed(1)}%`
                                                        }
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {bikeDistributionData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value, name, props) => [
                                                            value,
                                                            props.payload.fullName
                                                        ]}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Gráfico de leituras por run */}
                                <div className="space-y-4">
                                    <h4 className="font-medium">Leituras por Corrida</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="name"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar
                                                    dataKey="leituras"
                                                    fill="#4f46e5"
                                                    radius={[4, 4, 0, 0]}
                                                    name="Leituras"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filtros e Controles */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filtros e Visualização
                                </CardTitle>
                                <CardDescription>Filtre as corridas e escolha a visualização</CardDescription>
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
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bike-filter" className="text-sm font-medium">
                                        Filtrar por Bike
                                    </Label>
                                    <Select value={bikeFilter} onValueChange={setBikeFilter}>
                                        <SelectTrigger id="bike-filter">
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

                                <div className="space-y-2">
                                    <Label htmlFor="view-mode" className="text-sm font-medium">
                                        Modo de Visualização
                                    </Label>
                                    <Select value={viewMode} onValueChange={setViewMode}>
                                        <SelectTrigger id="view-mode">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cards">
                                                <div className="flex items-center gap-2">
                                                    <TableIcon className="h-4 w-4" />
                                                    Cards
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="table">
                                                <div className="flex items-center gap-2">
                                                    <TableIcon className="h-4 w-4" />
                                                    Tabela
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setBikeFilter("all");
                                        setDateFilter("all");
                                        setSelectedRuns([]);
                                    }}
                                >
                                    Limpar Filtros
                                </Button>

                                {filteredRuns.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={toggleSelectAll}
                                    >
                                        {selectedRuns.length === filteredRuns.length ? 'Desselecionar Todas' : 'Selecionar Todas'}
                                    </Button>
                                )}
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
                                <CardDescription>
                                    {selectedRuns.length > 0
                                        ? `${selectedRuns.length} run(s) selecionada(s) para comparação`
                                        : "Selecione runs para comparar ou visualize estatísticas individuais"
                                    }
                                </CardDescription>
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
                        {viewMode === "cards" ? (
                            <RunsCardsView
                                runs={filteredRuns}
                                selectedRuns={selectedRuns}
                                onToggleSelect={toggleSelectRun}
                                onViewStats={openRunStats}
                                onExportCSV={handleExportCSV}
                            />
                        ) : (
                            <RunsTableView
                                runs={filteredRuns}
                                selectedRuns={selectedRuns}
                                onToggleSelect={toggleSelectRun}
                                onToggleSelectAll={toggleSelectAll}
                                onViewStats={openRunStats}
                                onExportCSV={handleExportCSV}
                            />
                        )}
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
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" />
                            Estatísticas — {selectedRunForModal?.name || "Run"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRunForModal ? `ID: ${selectedRunForModal.id_run} • Bike: ${selectedRunForModal.bike_name || selectedRunForModal.bike_uuid} • Leituras: ${selectedRunForModal.total_leituras || 0}` : ""}
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
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                    <p className="font-medium">Erro ao carregar estatísticas</p>
                                    <p className="text-sm mt-1">{runStats.error}</p>
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
        blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
        green: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
        purple: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800",
        orange: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800",
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-0">
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

/* Runs Cards View */
function RunsCardsView({ runs, selectedRuns, onToggleSelect, onViewStats, onExportCSV }) {
    if (runs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <BarChart2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma run encontrada</p>
                <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
                {runs.map((run) => (
                    <RunCard
                        key={run.id_run}
                        run={run}
                        isSelected={selectedRuns.includes(run.id_run)}
                        onToggleSelect={() => onToggleSelect(run.id_run)}
                        onViewStats={() => onViewStats(run)}
                        onExportCSV={() => onExportCSV(run)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

/* Runs Table View */
function RunsTableView({ runs, selectedRuns, onToggleSelect, onToggleSelectAll, onViewStats, onExportCSV }) {
    if (runs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <TableIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma run encontrada</p>
                <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
            </div>
        );
    }

    const allSelected = runs.length > 0 && selectedRuns.length === runs.length;
    const someSelected = selectedRuns.length > 0 && !allSelected;

    return (
        <ScrollArea className="h-[400px] rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                                aria-label="Selecionar todas"
                                className={someSelected ? "data-[state=checked]:bg-muted" : ""}
                            />
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Bike</TableHead>
                        <TableHead className="text-right">Leituras</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {runs.map((run) => (
                        <TableRow key={run.id_run} className={selectedRuns.includes(run.id_run) ? "bg-muted/50" : ""}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedRuns.includes(run.id_run)}
                                    onCheckedChange={() => onToggleSelect(run.id_run)}
                                    aria-label={`Selecionar ${run.name}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {(run.name || "R").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {run.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Bike className="h-3 w-3 text-muted-foreground" />
                                    {run.bike_name}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {run.total_leituras?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell>
                                <Badge variant={run.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {run.status === 'active' ? 'Ativa' : 'Concluída'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onViewStats(run)}>
                                        <BarChart2 className="h-3 w-3 mr-1" />
                                        Stats
                                    </Button>
                                    <Button size="sm" onClick={() => onExportCSV(run)}>
                                        <DownloadCloud className="h-3 w-3 mr-1" />
                                        CSV
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
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
                                {run.total_leituras?.toLocaleString() || 0} leituras
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
        {
            label: "Média",
            value: stats?.tendencia_central?.media != null ? Number(stats.tendencia_central.media).toFixed(4) : "-",
            desc: "Média amostral",
            icon: TrendingUp
        },
        {
            label: "Mediana",
            value: stats?.tendencia_central?.mediana != null ? Number(stats.tendencia_central.mediana).toFixed(4) : "-",
            desc: "Valor central",
            icon: BarChart2
        },
        {
            label: "Desvio Padrão",
            value: stats?.dispersao?.desvio_padrao != null ? Number(stats.dispersao.desvio_padrao).toFixed(4) : "-",
            desc: "Dispersão dos dados",
            icon: Activity
        },
        {
            label: "Variância",
            value: stats?.dispersao?.variancia != null ? Number(stats.dispersao.variancia).toFixed(4) : "-",
            desc: "Variância amostral",
            icon: PieChart
        },
        {
            label: "Amostras",
            value: stats?.amostras ?? 0,
            desc: "Nº de leituras",
            icon: Database
        },
        {
            label: "Coef. Variação",
            value: stats?.dispersao?.coeficiente_variacao ? `${(stats.dispersao.coeficiente_variacao * 100).toFixed(2)}%` : "-",
            desc: "CV - Dispersão relativa",
            icon: TrendingUp
        },
    ];

    // Tabela de quantis
    const quantisData = stats?.quantis ? Object.entries(stats.quantis).map(([key, value]) => ({
        medida: key,
        valor: typeof value === 'number' ? value.toFixed(4) : value
    })) : [];

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Visão Geral
                </TabsTrigger>
                <TabsTrigger value="distribution" className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Distribuição
                </TabsTrigger>
                <TabsTrigger value="quantis" className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Quantis
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Detalhes
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <metric.icon className="h-4 w-4" />
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

                {/* Gráficos de Distribuição */}
                {chartData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Distribuição Acumulada</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="frequencia"
                                                stroke="#4f46e5"
                                                fill="#4f46e5"
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
                {chartData.length > 0 ? (
                    <>
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
                                            <RechartsPieChart>
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
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabela de Distribuição */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tabela de Distribuição de Frequência</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Classe</TableHead>
                                            <TableHead className="text-right">Frequência</TableHead>
                                            <TableHead className="text-right">Frequência Relativa</TableHead>
                                            <TableHead className="text-right">Frequência Acumulada</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {chartData.map((item, index) => {
                                            const total = chartData.reduce((sum, d) => sum + d.frequencia, 0);
                                            const freqRelativa = ((item.frequencia / total) * 100).toFixed(2);
                                            const freqAcumulada = chartData
                                                .slice(0, index + 1)
                                                .reduce((sum, d) => sum + d.frequencia, 0);
                                            const freqAcumuladaPercent = ((freqAcumulada / total) * 100).toFixed(2);

                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.frequencia}</TableCell>
                                                    <TableCell className="text-right">{freqRelativa}%</TableCell>
                                                    <TableCell className="text-right">
                                                        {freqAcumulada} ({freqAcumuladaPercent}%)
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        <TableRow className="bg-muted/50">
                                            <TableCell className="font-medium">Total</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {chartData.reduce((sum, d) => sum + d.frequencia, 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">100%</TableCell>
                                            <TableCell className="text-right font-bold">-</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <BarChart2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Sem dados de distribuição</p>
                        <p className="text-sm">Não há dados de distribuição de frequência disponíveis para esta run</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="quantis" className="space-y-6">
                {quantisData.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabela de Quantis e Percentis</CardTitle>
                            <CardDescription>
                                Medidas de posição que dividem a distribuição em partes iguais
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medida</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead>Descrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quantisData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium capitalize">
                                                {item.medida.replace(/_/g, ' ')}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {item.valor}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {getQuantilDescription(item.medida)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <TableIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Sem dados de quantis</p>
                        <p className="text-sm">Não há dados de quantis disponíveis para esta run</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inferência Estatística</CardTitle>
                            <CardDescription>
                                Resultados dos testes de hipóteses e intervalos de confiança
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats?.inferencia && Object.keys(stats.inferencia).length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(stats.inferencia).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b">
                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-mono text-sm">
                                                {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Sem dados de inferência disponíveis</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Brutos</CardTitle>
                            <CardDescription>
                                Estrutura completa dos dados estatísticos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-80">
                                <pre className="text-xs bg-muted/5 p-3 rounded-md">
                                    {JSON.stringify(stats, null, 2)}
                                </pre>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}

/* Função auxiliar para descrições de quantis */
function getQuantilDescription(quantil) {
    const descriptions = {
        q1: "Primeiro quartil - 25% dos dados estão abaixo deste valor",
        q2: "Segundo quartil (mediana) - 50% dos dados estão abaixo deste valor",
        q3: "Terceiro quartil - 75% dos dados estão abaixo deste valor",
        p10: "10º percentil - 10% dos dados estão abaixo deste valor",
        p25: "25º percentil - igual ao primeiro quartil",
        p50: "50º percentil - igual à mediana",
        p75: "75º percentil - igual ao terceiro quartil",
        p90: "90º percentil - 90% dos dados estão abaixo deste valor",
        p95: "95º percentil - 95% dos dados estão abaixo deste valor",
        p99: "99º percentil - 99% dos dados estão abaixo deste valor"
    };

    return descriptions[quantil] || "Medida de posição da distribuição";
}

/* Comparativo View */
function ComparativoView({ data }) {
    // Se data for um array, assumimos que é uma lista de runs com estatísticas
    if (Array.isArray(data)) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tabela Comparativa</CardTitle>
                        <CardDescription>Métricas comparativas entre as runs selecionadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Run</TableHead>
                                    <TableHead className="text-right">Média</TableHead>
                                    <TableHead className="text-right">Mediana</TableHead>
                                    <TableHead className="text-right">Desvio Padrão</TableHead>
                                    <TableHead className="text-right">Amostras</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((run, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{run.name}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {run.tendencia_central?.media != null
                                                ? Number(run.tendencia_central.media).toFixed(4)
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {run.tendencia_central?.mediana != null
                                                ? Number(run.tendencia_central.mediana).toFixed(4)
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {run.dispersao?.desvio_padrao != null
                                                ? Number(run.dispersao.desvio_padrao).toFixed(4)
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {run.amostras?.toLocaleString() || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Gráfico comparativo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Comparativo de Médias</CardTitle>
                        <CardDescription>Médias das runs selecionadas para comparação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => [Number(value).toFixed(4), 'Média']}
                                    />
                                    <Bar
                                        dataKey="tendencia_central.media"
                                        fill="#4f46e5"
                                        radius={[4, 4, 0, 0]}
                                        name="Média"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Caso contrário, mostra os dados brutos
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Comparativo</CardTitle>
                    <CardDescription>Estrutura completa dos dados retornados</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-80">
                        <pre className="text-sm bg-muted/5 p-4 rounded-md">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </ScrollArea>
                </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground">
                <p>Esta visualização será aprimorada conforme a estrutura de dados do comparativo.</p>
            </div>
        </div>
    );
}