// 📁 NOVO ARQUIVO: src/controllers/EstatisticasController.js
import { EstatisticasService } from '../service/estatisticasService.js';

export class EstatisticasController {
    
    /**
     * Estatísticas completas para uma run específica
     */
    static async getEstatisticasRun(req, res) {
        try {
            const { id_run } = req.params;
            const user_id = req.user.user_id;

            const estatisticas = await EstatisticasService.calcularEstatisticasRun(id_run, user_id);
            
            res.json({
                success: true,
                data: estatisticas,
                message: 'Estatísticas calculadas com sucesso'
            });

        } catch (error) {
            console.error('Erro em getEstatisticasRun:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao calcular estatísticas da run'
            });
        }
    }

    /**
     * Estatísticas para uma bike em um período
     */
    static async getEstatisticasBike(req, res) {
        try {
            const { bike_uuid } = req.params;
            const { data_inicio, data_fim } = req.query;
            const user_id = req.user.user_id;

            // Validar e converter datas se fornecidas
            const dataInicioValidada = data_inicio ? new Date(data_inicio) : null;
            const dataFimValidada = data_fim ? new Date(data_fim) : null;

            if (data_inicio && isNaN(dataInicioValidada.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Data de início inválida'
                });
            }

            if (data_fim && isNaN(dataFimValidada.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Data de fim inválida'
                });
            }

            const estatisticas = await EstatisticasService.calcularEstatisticasBike(
                bike_uuid, 
                user_id, 
                dataInicioValidada, 
                dataFimValidada
            );
            
            res.json({
                success: true,
                data: estatisticas,
                message: 'Estatísticas da bike calculadas com sucesso'
            });

        } catch (error) {
            console.error('Erro em getEstatisticasBike:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao calcular estatísticas da bike'
            });
        }
    }

    /**
     * Estatísticas comparativas entre múltiplas runs
     */
    static async getEstatisticasComparativas(req, res) {
        try {
            const { runs } = req.body; // Array de id_runs
            const user_id = req.user.user_id;

            if (!runs || !Array.isArray(runs) || runs.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Array de runs é obrigatório'
                });
            }

            // Calcular estatísticas para cada run
            const estatisticasPromises = runs.map(runId => 
                EstatisticasService.calcularEstatisticasRun(runId, user_id)
            );

            const resultados = await Promise.allSettled(estatisticasPromises);

            const comparativo = resultados
                .map((result, index) => {
                    if (result.status === 'fulfilled') {
                        return {
                            run_id: runs[index],
                            ...result.value
                        };
                    } else {
                        return {
                            run_id: runs[index],
                            error: result.reason.message,
                            amostras: 0
                        };
                    }
                })
                .filter(item => item.amostras > 0); // Filtrar apenas runs com dados

            res.json({
                success: true,
                data: {
                    total_runs: runs.length,
                    runs_com_dados: comparativo.length,
                    comparativo: comparativo
                },
                message: `Análise comparativa de ${comparativo.length} runs com dados`
            });

        } catch (error) {
            console.error('Erro em getEstatisticasComparativas:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao calcular estatísticas comparativas'
            });
        }
    }

    /**
     * Estatísticas resumidas para dashboard
     */
    static async getEstatisticasDashboard(req, res) {
        try {
            const user_id = req.user.user_id;

            // Buscar bikes do usuário
            const [bikes] = await pool.query(
                'SELECT id_bike, name FROM Bike WHERE user_id = ?',
                [user_id]
            );

            // Buscar runs recentes
            const [runs] = await pool.query(
                `SELECT R.id_run, R.name, R.started_at, R.ended_at, R.status, 
                        B.id_bike, B.name as bike_name,
                        COUNT(D.id) as total_leituras
                 FROM Run R 
                 JOIN Bike B ON R.bike_id = B.id 
                 LEFT JOIN Dados D ON R.id = D.id_run
                 WHERE R.user_id = ? 
                 GROUP BY R.id
                 ORDER BY R.started_at DESC 
                 LIMIT 10`,
                [user_id]
            );

            // Calcular estatísticas para a run mais recente com dados
            let estatisticasRecentes = null;
            if (runs.length > 0) {
                const runRecente = runs.find(run => run.total_leituras > 0);
                if (runRecente) {
                    try {
                        estatisticasRecentes = await EstatisticasService.calcularEstatisticasRun(runRecente.id_run, user_id);
                    } catch (error) {
                        console.error('Erro ao calcular estatísticas da run recente:', error);
                    }
                }
            }

            // Estatísticas gerais
            const [estatisticasGerais] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT B.id) as total_bikes,
                    COUNT(DISTINCT R.id) as total_runs,
                    COUNT(D.id) as total_leituras,
                    SUM(CASE WHEN R.status = 'active' THEN 1 ELSE 0 END) as runs_ativas,
                    MIN(D.rotacao_regis) as primeira_leitura,
                    MAX(D.rotacao_regis) as ultima_leitura
                 FROM Bike B
                 LEFT JOIN Run R ON B.id = R.bike_id
                 LEFT JOIN Dados D ON R.id = D.id_run
                 WHERE B.user_id = ?`,
                [user_id]
            );

            res.json({
                success: true,
                data: {
                    resumo: estatisticasGerais[0],
                    bikes: bikes,
                    runs_recentes: runs,
                    estatisticas_recentes: estatisticasRecentes
                },
                message: 'Dados do dashboard carregados com sucesso'
            });

        } catch (error) {
            console.error('Erro em getEstatisticasDashboard:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao carregar dados do dashboard'
            });
        }
    }

    /**
     * Cálculos estatísticos customizados
     */
    static async postCalculosCustomizados(req, res) {
        try {
            const { tipo_calculo, dados, parametros } = req.body;
            const user_id = req.user.user_id;

            if (!tipo_calculo || !dados) {
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de cálculo e dados são obrigatórios'
                });
            }

            let resultado;

            switch (tipo_calculo) {
                case 'media_simples':
                    resultado = {
                        media: EstatisticasService.calcularMedia(dados),
                        tipo: 'Média Aritmética Simples'
                    };
                    break;

                case 'dispersao_completa':
                    resultado = {
                        variancia: EstatisticasService.calcularVariancia(dados),
                        desvio_padrao: EstatisticasService.calcularDesvioPadrao(dados),
                        coeficiente_variacao: EstatisticasService.calcularCoeficienteVariacao(dados),
                        tipo: 'Análise de Dispersão Completa'
                    };
                    break;

                case 'distribuicao_frequencia':
                    const numClasses = parametros?.num_classes || 10;
                    resultado = {
                        distribuicao: EstatisticasService.calcularDistribuicaoFrequencia(dados, numClasses),
                        tipo: 'Distribuição de Frequência'
                    };
                    break;

                case 'analise_normalidade':
                    resultado = {
                        ...EstatisticasService.calcularTesteNormalidade(dados),
                        tipo: 'Análise de Normalidade'
                    };
                    break;

                case 'intervalo_confianca':
                    const nivelConfianca = parametros?.nivel_confianca || 0.95;
                    resultado = {
                        ...EstatisticasService.calcularIntervaloConfianca(dados, nivelConfianca),
                        tipo: 'Intervalo de Confiança'
                    };
                    break;

                case 'correlacao':
                    if (!parametros?.variavel_y) {
                        return res.status(400).json({
                            success: false,
                            error: 'Variável Y é obrigatória para cálculo de correlação'
                        });
                    }
                    resultado = {
                        correlacao: EstatisticasService.calcularCoeficienteCorrelacao(dados, parametros.variavel_y),
                        tipo: 'Coeficiente de Correlação'
                    };
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Tipo de cálculo não suportado'
                    });
            }

            res.json({
                success: true,
                data: resultado,
                message: `Cálculo '${tipo_calculo}' executado com sucesso`
            });

        } catch (error) {
            console.error('Erro em postCalculosCustomizados:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao executar cálculo customizado'
            });
        }
    }

    /**
     * Exportar estatísticas em formato CSV
     */
    static async exportarEstatisticas(req, res) {
        try {
            const { id_run } = req.params;
            const { formato = 'csv' } = req.query;
            const user_id = req.user.user_id;

            if (formato !== 'csv') {
                return res.status(400).json({
                    success: false,
                    error: 'Apenas formato CSV é suportado no momento'
                });
            }

            const estatisticas = await EstatisticasService.calcularEstatisticasRun(id_run, user_id);

            // Converter para CSV
            const csvData = this.converterParaCSV(estatisticas);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=estatisticas_run_${id_run}.csv`);
            res.send(csvData);

        } catch (error) {
            console.error('Erro em exportarEstatisticas:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao exportar estatísticas'
            });
        }
    }

    /**
     * Método auxiliar para converter estatísticas para CSV
     */
    static converterParaCSV(estatisticas) {
        const lines = [];
        
        // Cabeçalho
        lines.push('Categoria,Indicador,Valor');
        
        // Tendência Central
        Object.entries(estatisticas.tendencia_central).forEach(([key, value]) => {
            lines.push(`Tendência Central,${key},${Array.isArray(value) ? value.join('; ') : value}`);
        });
        
        // Dispersão
        Object.entries(estatisticas.dispersao).forEach(([key, value]) => {
            lines.push(`Dispersão,${key},${value}`);
        });
        
        // Forma da Distribuição
        Object.entries(estatisticas.forma_distribuicao).forEach(([key, value]) => {
            lines.push(`Forma Distribuição,${key},${value}`);
        });
        
        // Quantis
        Object.entries(estatisticas.quantis).forEach(([key, value]) => {
            if (typeof value === 'object') {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    lines.push(`Quantis,${key}_${subKey},${subValue}`);
                });
            } else {
                lines.push(`Quantis,${key},${value}`);
            }
        });
        
        return lines.join('\n');
    }
}

// Import do pool para o método do dashboard
import pool from '../config/config.js';