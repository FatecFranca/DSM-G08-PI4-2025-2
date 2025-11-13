// 📁 NOVO ARQUIVO: src/service/estatisticasService.js
import pool from '../config/config.js';
import { Distribuicoes } from '../utils/distribuicoes.js'; // 👈 FALTA ESTA LINHA

export class EstatisticasService {

    /**
     * Calcula estatísticas completas para uma run específica
     */
    static async calcularEstatisticasRun(id_run, user_id) {
        try {
            // 1. Validar se a run existe e pertence ao usuário
            const [runRows] = await pool.query(
                `SELECT R.id, R.id_run, B.circunferencia_m 
                 FROM Run R 
                 JOIN Bike B ON R.bike_id = B.id 
                 WHERE R.id_run = ? AND R.user_id = ?`,
                [id_run, user_id]
            );

            if (runRows.length === 0) {
                throw new Error('Run não encontrada ou não pertence ao usuário');
            }

            const run = runRows[0];
            const circunferencia = run.circunferencia_m;

            // 2. Buscar todos os dados da run
            const [dadosRows] = await pool.query(
                `SELECT rotacao_next, rotacao_regis 
                 FROM Dados 
                 WHERE id_run = ? AND rotacao_next > 0 
                 ORDER BY rotacao_regis`,
                [run.id]
            );

            if (dadosRows.length === 0) {
                return this.estatisticasVazias();
            }

            // 3. Converter para velocidades em km/h
            const velocidades = dadosRows.map(dado =>
                this.calcularVelocidade(circunferencia, dado.rotacao_next)
            ).filter(v => v !== null && v > 0 && v < 200); // Filtro de validação

            if (velocidades.length === 0) {
                return this.estatisticasVazias();
            }

            // 4. Calcular todas as estatísticas
            return {
                run_id: id_run,
                amostras: velocidades.length,
                periodo: {
                    inicio: dadosRows[0].rotacao_regis,
                    fim: dadosRows[dadosRows.length - 1].rotacao_regis
                },
                ...this.calcularEstatisticasCompletas(velocidades)
            };

        } catch (error) {
            console.error('Erro em calcularEstatisticasRun:', error);
            throw error;
        }
    }

    /**
     * Calcula estatísticas para uma bike em um período
     */
    static async calcularEstatisticasBike(bike_uuid, user_id, data_inicio = null, data_fim = null) {
        try {
            // Validar bike e pertencimento
            const [bikeRows] = await pool.query(
                `SELECT id, circunferencia_m FROM Bike WHERE id_bike = ? AND user_id = ?`,
                [bike_uuid, user_id]
            );

            if (bikeRows.length === 0) {
                throw new Error('Bike não encontrada ou não pertence ao usuário');
            }

            const bike = bikeRows[0];
            let query = `
                SELECT D.rotacao_next, D.rotacao_regis 
                FROM Dados D 
                JOIN Run R ON D.id_run = R.id 
                WHERE D.id_bike = ? AND R.user_id = ? AND D.rotacao_next > 0
            `;
            const params = [bike.id, user_id];

            if (data_inicio) {
                query += ' AND D.rotacao_regis >= ?';
                params.push(data_inicio);
            }

            if (data_fim) {
                query += ' AND D.rotacao_regis <= ?';
                params.push(data_fim);
            }

            query += ' ORDER BY D.rotacao_regis';

            const [dadosRows] = await pool.query(query, params);

            if (dadosRows.length === 0) {
                return this.estatisticasVazias();
            }

            // Converter para velocidades
            const velocidades = dadosRows.map(dado =>
                this.calcularVelocidade(bike.circunferencia_m, dado.rotacao_next)
            ).filter(v => v !== null && v > 0 && v < 200);

            if (velocidades.length === 0) {
                return this.estatisticasVazias();
            }

            return {
                bike_uuid,
                amostras: velocidades.length,
                periodo: {
                    inicio: dadosRows[0].rotacao_regis,
                    fim: dadosRows[dadosRows.length - 1].rotacao_regis
                },
                ...this.calcularEstatisticasCompletas(velocidades)
            };

        } catch (error) {
            console.error('Erro em calcularEstatisticasBike:', error);
            throw error;
        }
    }

    /**
     * Função principal que calcula todas as estatísticas a partir de um array de velocidades
     */
    static calcularEstatisticasCompletas(velocidades) {
        const sorted = [...velocidades].sort((a, b) => a - b);
        const n = sorted.length;

        return {
            // 1. Medidas de Tendência Central
            tendencia_central: {
                media: this.calcularMedia(velocidades),
                mediana: this.calcularMediana(sorted),
                moda: this.calcularModa(velocidades),
                media_geometrica: this.calcularMediaGeometrica(velocidades),
                media_harmonica: this.calcularMediaHarmonica(velocidades)
            },

            // 2. Medidas de Dispersão
            dispersao: {
                variancia: this.calcularVariancia(velocidades),
                desvio_padrao: this.calcularDesvioPadrao(velocidades),
                coeficiente_variacao: this.calcularCoeficienteVariacao(velocidades),
                amplitude: this.calcularAmplitude(sorted),
                amplitude_interquartil: this.calcularAmplitudeInterquartil(sorted)
            },

            // 3. Medidas de Forma da Distribuição
            forma_distribuicao: {
                assimetria: this.calcularAssimetria(velocidades),
                curtose: this.calcularCurtose(velocidades)
            },

            // 4. Quartis e Percentis
            quantis: {
                q1: this.calcularPercentil(sorted, 25),
                q2: this.calcularPercentil(sorted, 50), // Mediana
                q3: this.calcularPercentil(sorted, 75),
                percentis: this.calcularPercentis(sorted, [10, 25, 50, 75, 90, 95])
            },

            // 5. Valores Extremos
            extremos: {
                minimo: sorted[0],
                maximo: sorted[n - 1],
                outliers: this.identificarOutliers(sorted)
            },

            // 6. Probabilidades e Distribuições
            probabilidades: {
                distribuicao_frequencia: this.calcularDistribuicaoFrequencia(velocidades),
                probabilidade_acumulada: this.calcularProbabilidadeAcumulada(sorted)
            },

            // 7. Regressão e Correlação (se houver dados temporais suficientes)
            correlacao: n > 2 ? this.calcularCorrelacaoTemporal(velocidades) : null,

            // 8. Inferência Estatística
            inferencia: {
                intervalo_confianca: this.calcularIntervaloConfianca(velocidades),
                teste_normalidade: this.calcularTesteNormalidade(velocidades)
            }
        };
    }

    // =========================================================================
    // MÉTODOS DE CÁLCULO ESTATÍSTICO
    // =========================================================================

    /**
     * 1. CÁLCULOS BÁSICOS
     */
    static calcularMedia(dados) {
        const soma = dados.reduce((acc, val) => acc + val, 0);
        return Number((soma / dados.length).toFixed(4));
    }

    static calcularMediana(dadosSorted) {
        const n = dadosSorted.length;
        if (n % 2 === 0) {
            return Number(((dadosSorted[n / 2 - 1] + dadosSorted[n / 2]) / 2).toFixed(4));
        } else {
            return Number(dadosSorted[Math.floor(n / 2)].toFixed(4));
        }
    }

    static calcularModa(dados) {
        const frequencia = {};
        let maxFreq = 0;
        let moda = [];

        dados.forEach(val => {
            frequencia[val] = (frequencia[val] || 0) + 1;
            if (frequencia[val] > maxFreq) {
                maxFreq = frequencia[val];
                moda = [val];
            } else if (frequencia[val] === maxFreq) {
                moda.push(val);
            }
        });

        return maxFreq > 1 ? moda.map(m => Number(m.toFixed(4))) : ['Não há moda'];
    }

    static calcularMediaGeometrica(dados) {
        const produto = dados.reduce((acc, val) => acc * val, 1);
        return Number((Math.pow(produto, 1 / dados.length)).toFixed(4));
    }

    static calcularMediaHarmonica(dados) {
        const somaInversos = dados.reduce((acc, val) => acc + (1 / val), 0);
        return Number((dados.length / somaInversos).toFixed(4));
    }

    /**
     * 2. DISPERSÃO
     */
    static calcularVariancia(dados) {
        const media = this.calcularMedia(dados);
        const somaQuadrados = dados.reduce((acc, val) => acc + Math.pow(val - media, 2), 0);
        return Number((somaQuadrados / dados.length).toFixed(4));
    }

    static calcularDesvioPadrao(dados) {
        return Number((Math.sqrt(this.calcularVariancia(dados))).toFixed(4));
    }

    static calcularCoeficienteVariacao(dados) {
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);
        return Number(((desvioPadrao / media) * 100).toFixed(4)); // Em percentual
    }

    static calcularAmplitude(dadosSorted) {
        return Number((dadosSorted[dadosSorted.length - 1] - dadosSorted[0]).toFixed(4));
    }

    static calcularAmplitudeInterquartil(dadosSorted) {
        const q1 = this.calcularPercentil(dadosSorted, 25);
        const q3 = this.calcularPercentil(dadosSorted, 75);
        return Number((q3 - q1).toFixed(4));
    }

    /**
     * 3. FORMA DA DISTRIBUIÇÃO
     */
    static calcularAssimetria(dados) {
        const n = dados.length;
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);

        const somaCubos = dados.reduce((acc, val) => acc + Math.pow(val - media, 3), 0);
        const assimetria = (somaCubos / n) / Math.pow(desvioPadrao, 3);

        return Number(assimetria.toFixed(4));
    }

    static calcularCurtose(dados) {
        const n = dados.length;
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);

        const somaQuartas = dados.reduce((acc, val) => acc + Math.pow(val - media, 4), 0);
        const curtose = ((somaQuartas / n) / Math.pow(desvioPadrao, 4)) - 3; // Excess kurtosis

        return Number(curtose.toFixed(4));
    }

    /**
     * 4. QUANTIS E PERCENTIS
     */
    static calcularPercentil(dadosSorted, percentil) {
        const pos = (percentil / 100) * (dadosSorted.length - 1);
        const base = Math.floor(pos);
        const resto = pos - base;

        if (dadosSorted[base + 1] !== undefined) {
            return Number((dadosSorted[base] + resto * (dadosSorted[base + 1] - dadosSorted[base])).toFixed(4));
        } else {
            return Number(dadosSorted[base].toFixed(4));
        }
    }

    static calcularPercentis(dadosSorted, percentis) {
        const resultado = {};
        percentis.forEach(p => {
            resultado[`p${p}`] = this.calcularPercentil(dadosSorted, p);
        });
        return resultado;
    }

    /**
     * 5. IDENTIFICAÇÃO DE OUTLIERS
     */
    static identificarOutliers(dadosSorted) {
        const q1 = this.calcularPercentil(dadosSorted, 25);
        const q3 = this.calcularPercentil(dadosSorted, 75);
        const iqr = q3 - q1;
        const limiteInferior = q1 - 1.5 * iqr;
        const limiteSuperior = q3 + 1.5 * iqr;

        const outliers = dadosSorted.filter(val => val < limiteInferior || val > limiteSuperior);
        return {
            limite_inferior: Number(limiteInferior.toFixed(4)),
            limite_superior: Number(limiteSuperior.toFixed(4)),
            quantidade: outliers.length,
            valores: outliers.map(o => Number(o.toFixed(4)))
        };
    }

    /**
     * 6. PROBABILIDADES E DISTRIBUIÇÕES
     */
    static calcularDistribuicaoFrequencia(dados, numClasses = 10) {
        const min = Math.min(...dados);
        const max = Math.max(...dados);
        const amplitudeClasse = (max - min) / numClasses;

        const classes = [];
        for (let i = 0; i < numClasses; i++) {
            const inicio = min + i * amplitudeClasse;
            const fim = inicio + amplitudeClasse;
            const frequencia = dados.filter(val => val >= inicio && val < fim).length;
            const frequenciaRelativa = frequencia / dados.length;

            classes.push({
                classe: i + 1,
                intervalo: `${inicio.toFixed(2)} - ${fim.toFixed(2)}`,
                frequencia,
                frequencia_relativa: Number(frequenciaRelativa.toFixed(4)),
                frequencia_percentual: Number((frequenciaRelativa * 100).toFixed(2))
            });
        }

        return classes;
    }

    static calcularProbabilidadeAcumulada(dadosSorted) {
        return dadosSorted.map((valor, index) => ({
            valor: Number(valor.toFixed(4)),
            probabilidade_acumulada: Number(((index + 1) / dadosSorted.length).toFixed(4))
        }));
    }

    /**
     * 7. CORRELAÇÃO TEMPORAL
     */
    static calcularCorrelacaoTemporal(dados) {
        const n = dados.length;
        const indices = Array.from({ length: n }, (_, i) => i);

        // Correlação entre tempo e velocidade
        const correlacao = this.calcularCoeficienteCorrelacao(indices, dados);

        return {
            correlacao_temporal: Number(correlacao.toFixed(4)),
            tendencia: correlacao > 0.3 ? 'positiva' : correlacao < -0.3 ? 'negativa' : 'neutra'
        };
    }

    static calcularCoeficienteCorrelacao(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
        const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
        const sumY2 = y.reduce((acc, val) => acc + val * val, 0);

        const numerador = n * sumXY - sumX * sumY;
        const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominador === 0 ? 0 : numerador / denominador;
    }

    /**
    * 8. INFERÊNCIA ESTATÍSTICA (ATUALIZADO)
    */
    static calcularIntervaloConfianca(dados, nivelConfianca = 0.95) {
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);
        const n = dados.length;

        // Usar distribuição t para amostras pequenas, normal para grandes
        let valorCritico;
        if (n < 30) {
            // Distribuição t-Student (graus de liberdade = n-1)
            // Para 95% de confiança, aproximação simplificada
            valorCritico = 2.045; // Para n=30, 95% confidence
        } else {
            // Distribuição normal
            valorCritico = Distribuicoes.normalInverseCDF(1 - (1 - nivelConfianca) / 2);
        }

        const margemErro = valorCritico * (desvioPadrao / Math.sqrt(n));

        return {
            nivel_confianca: nivelConfianca,
            media_amostral: media,
            desvio_padrao: desvioPadrao,
            tamanho_amostra: n,
            margem_erro: Number(margemErro.toFixed(4)),
            intervalo: [
                Number((media - margemErro).toFixed(4)),
                Number((media + margemErro).toFixed(4))
            ],
            distribuicao_utilizada: n < 30 ? 't-student' : 'normal'
        };
    }

    static calcularTesteNormalidade(dados) {
        // Usar o teste de ajuste das distribuições
        const teste = Distribuicoes.testeAjusteNormal(dados);

        return {
            ...teste,
            interpretacao: teste.valor_p > 0.05 ?
                'Não rejeitamos a hipótese de normalidade' :
                'Rejeitamos a hipótese de normalidade'
        };
    }

    /**
     * 9. NOVOS MÉTODOS COM DISTRIBUIÇÕES
     */

    /**
     * Análise de probabilidades com distribuições teóricas
     */
    static analisarProbabilidades(dados, distribuicao = 'normal') {
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);

        let parametros = {};
        switch (distribuicao) {
            case 'normal':
                parametros = { media, desvioPadrao };
                break;
            case 'poisson':
                parametros = { lambda: media };
                break;
            default:
                throw new Error('Distribuição não suportada');
        }

        // Calcular probabilidades para diferentes valores
        const valores = [
            media - 2 * desvioPadrao,
            media - desvioPadrao,
            media,
            media + desvioPadrao,
            media + 2 * desvioPadrao
        ];

        const probabilidades = valores.map(valor => ({
            valor: Number(valor.toFixed(2)),
            probabilidade: Distribuicoes.calcularProbabilidade(valor, distribuicao, parametros),
            probabilidade_acumulada: Distribuicoes.calcularProbabilidadeAcumulada(valor, distribuicao, parametros)
        }));

        return {
            distribuicao,
            parametros,
            probabilidades,
            ajuste: this.calcularTesteNormalidade(dados)
        };
    }

    /**
     * Simulação Monte Carlo para previsão
     */
    static simulacaoMonteCarlo(dados, numSimulacoes = 1000, horizonte = 10) {
        const media = this.calcularMedia(dados);
        const desvioPadrao = this.calcularDesvioPadrao(dados);

        const simulacoes = [];
        for (let i = 0; i < numSimulacoes; i++) {
            const caminho = [media];
            for (let j = 1; j <= horizonte; j++) {
                // Random walk com drift
                const passo = Distribuicoes.normalRandom(0, desvioPadrao, 1)[0];
                caminho.push(Number((caminho[j - 1] + passo).toFixed(2)));
            }
            simulacoes.push(caminho);
        }

        // Calcular estatísticas das simulações
        const previsoes = Array.from({ length: horizonte + 1 }, (_, i) => {
            const valores = simulacoes.map(s => s[i]);
            return {
                periodo: i,
                media: this.calcularMedia(valores),
                desvio_padrao: this.calcularDesvioPadrao(valores),
                intervalo_confianca: this.calcularIntervaloConfianca(valores)
            };
        });

        return {
            num_simulacoes: numSimulacoes,
            horizonte,
            previsoes,
            ultima_simulacao: simulacoes[0] // Exemplo de uma simulação
        };
    }

    static calcularVelocidade(circunferencia, delta_us) {
        if (!delta_us || delta_us <= 0) return null;
        const tempoSegundos = delta_us / 1000000;
        const velocidadeMs = circunferencia / tempoSegundos;
        const velocidadeKmh = velocidadeMs * 3.6;

        // Filtro de validação
        return velocidadeKmh > 0 && velocidadeKmh < 200 ? Number(velocidadeKmh.toFixed(2)) : null;
    }

    static estatisticasVazias() {
        return {
            amostras: 0,
            periodo: { inicio: null, fim: null },
            tendencia_central: {
                media: 0, mediana: 0, moda: [], media_geometrica: 0, media_harmonica: 0
            },
            dispersao: {
                variancia: 0, desvio_padrao: 0, coeficiente_variacao: 0, amplitude: 0, amplitude_interquartil: 0
            },
            forma_distribuicao: { assimetria: 0, curtose: 0 },
            quantis: { q1: 0, q2: 0, q3: 0, percentis: {} },
            extremos: {
                minimo: 0,
                maximo: 0,
                outliers: {
                    limite_inferior: 0,
                    limite_superior: 0,
                    quantidade: 0,
                    valores: []
                }
            },
            probabilidades: {
                distribuicao_frequencia: [],
                probabilidade_acumulada: []
            },
            correlacao: null,
            inferencia: {
                intervalo_confianca: {
                    nivel_confianca: 0.95,
                    media_amostral: 0,
                    margem_erro: 0,
                    intervalo: [0, 0]
                },
                teste_normalidade: {
                    assimetria: 0,
                    curtose: 0,
                    normalidade: 'Dados insuficientes',
                    criterio: ''
                }
            }
        };
    }
}