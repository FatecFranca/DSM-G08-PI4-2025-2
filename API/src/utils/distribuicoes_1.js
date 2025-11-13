export class Distribuicoes {
    
    /**
     * DISTRIBUIÇÃO NORMAL (GAUSSIANA)
     */

    /**
     * Função de Densidade de Probabilidade (PDF) da distribuição normal
     */
    static normalPDF(x, media = 0, desvioPadrao = 1) {
        const exponent = -0.5 * Math.pow((x - media) / desvioPadrao, 2);
        return (1 / (desvioPadrao * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    }

    /**
     * Função de Distribuição Acumulada (CDF) da normal
     * Usando aproximação de Abramowitz e Stegun
     */
    static normalCDF(x, media = 0, desvioPadrao = 1) {
        const z = (x - media) / desvioPadrao;
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        let probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        
        if (z > 0) {
            probability = 1 - probability;
        }
        return Number((1 - probability).toFixed(6));
    }

    /**
     * Inverse CDF da normal (Z-score para uma probabilidade)
     */
    static normalInverseCDF(p, media = 0, desvioPadrao = 1) {
        if (p <= 0 || p >= 1) {
            throw new Error('Probabilidade deve estar entre 0 e 1');
        }

        // Aproximação de Acklam
        const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
        const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
        const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
        const b4 = 66.8013118877197, b5 = -13.2806815528857;
        const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
        const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
        const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
        const d4 = 3.75440866190742;

        let q = p - 0.5;
        let r, z;

        if (Math.abs(q) <= 0.425) {
            r = 0.180625 - q * q;
            z = q * (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) /
                (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        } else {
            r = q < 0 ? p : 1 - p;
            r = Math.sqrt(-Math.log(r));
            z = (((((c1 * r + c2) * r + c3) * r + c4) * r + c5) * r + c6) /
                ((((d1 * r + d2) * r + d3) * r + d4) * r + 1);
            if (q < 0) z = -z;
        }

        return Number((media + z * desvioPadrao).toFixed(4));
    }

    /**
     * Gera números aleatórios de uma distribuição normal (Box-Muller)
     */
    static normalRandom(media = 0, desvioPadrao = 1, n = 1) {
        const samples = [];
        for (let i = 0; i < n; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            samples.push(Number((media + desvioPadrao * z0).toFixed(4)));
        }
        return samples;
    }

    /**
     * DISTRIBUIÇÃO BINOMIAL
     */

    static binomialPMF(k, n, p) {
        if (k < 0 || k > n) return 0;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;

        const combination = this.combinacao(n, k);
        return Number((combination * Math.pow(p, k) * Math.pow(1 - p, n - k)).toFixed(6));
    }

    static binomialCDF(k, n, p) {
        let probability = 0;
        for (let i = 0; i <= k; i++) {
            probability += this.binomialPMF(i, n, p);
        }
        return Number(probability.toFixed(6));
    }

    /**
     * DISTRIBUIÇÃO DE POISSON
     */

    static poissonPMF(k, lambda) {
        if (lambda <= 0) return 0;
        return Number((Math.exp(-lambda) * Math.pow(lambda, k) / this.fatorial(k)).toFixed(6));
    }

    static poissonCDF(k, lambda) {
        let probability = 0;
        for (let i = 0; i <= k; i++) {
            probability += this.poissonPMF(i, lambda);
        }
        return Number(probability.toFixed(6));
    }

    /**
     * DISTRIBUIÇÃO EXPONENCIAL
     */

    static exponentialPDF(x, lambda) {
        if (x < 0) return 0;
        return Number((lambda * Math.exp(-lambda * x)).toFixed(6));
    }

    static exponentialCDF(x, lambda) {
        if (x < 0) return 0;
        return Number((1 - Math.exp(-lambda * x)).toFixed(6));
    }

    /**
     * DISTRIBUIÇÃO T-STUDENT
     */

    static tStudentPDF(x, grausLiberdade) {
        const numerator = this.gama((grausLiberdade + 1) / 2);
        const denominator = Math.sqrt(grausLiberdade * Math.PI) * this.gama(grausLiberdade / 2);
        const pdf = numerator / denominator * Math.pow(1 + (x * x) / grausLiberdade, -(grausLiberdade + 1) / 2);
        return Number(pdf.toFixed(6));
    }

    /**
     * DISTRIBUIÇÃO QUI-QUADRADO
     */

    static chiQuadradoPDF(x, grausLiberdade) {
        if (x < 0) return 0;
        const k = grausLiberdade;
        const pdf = (1 / (Math.pow(2, k/2) * this.gama(k/2))) * Math.pow(x, k/2 - 1) * Math.exp(-x/2);
        return Number(pdf.toFixed(6));
    }

    /**
     * FUNÇÕES AUXILIARES MATEMÁTICAS
     */

    static combinacao(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        // Usando a propriedade C(n, k) = C(n, n-k)
        k = Math.min(k, n - k);
        
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result = result * (n - k + i) / i;
        }
        return Math.round(result);
    }

    static fatorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    static gama(x) {
        // Para inteiros
        if (x === Math.floor(x)) {
            return this.fatorial(x - 1);
        }
        
        // Para meio-inteiros
        if (x === 0.5) {
            return Math.sqrt(Math.PI);
        }
        
        // Aproximação de Stirling para outros valores
        return Math.exp(this.logGama(x));
    }

    static logGama(x) {
        // Aproximação de Stirling
        return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1/(12*x);
    }

    /**
     * CÁLCULOS DE PROBABILIDADE
     */

    /**
     * Calcula a probabilidade de um valor em uma distribuição
     */
    static calcularProbabilidade(valor, distribuicao, parametros) {
        switch (distribuicao) {
            case 'normal':
                return this.normalPDF(valor, parametros.media, parametros.desvioPadrao);
            case 'binomial':
                return this.binomialPMF(valor, parametros.n, parametros.p);
            case 'poisson':
                return this.poissonPMF(valor, parametros.lambda);
            case 'exponencial':
                return this.exponentialPDF(valor, parametros.lambda);
            default:
                throw new Error('Distribuição não suportada');
        }
    }

    /**
     * Calcula a probabilidade acumulada
     */
    static calcularProbabilidadeAcumulada(valor, distribuicao, parametros) {
        switch (distribuicao) {
            case 'normal':
                return this.normalCDF(valor, parametros.media, parametros.desvioPadrao);
            case 'binomial':
                return this.binomialCDF(valor, parametros.n, parametros.p);
            case 'poisson':
                return this.poissonCDF(valor, parametros.lambda);
            case 'exponencial':
                return this.exponentialCDF(valor, parametros.lambda);
            default:
                throw new Error('Distribuição não suportada');
        }
    }

    /**
     * Gera dados simulados de uma distribuição
     */
    static simularDistribuicao(distribuicao, parametros, n = 1000) {
        switch (distribuicao) {
            case 'normal':
                return this.normalRandom(parametros.media, parametros.desvioPadrao, n);
            case 'uniforme':
                return Array.from({ length: n }, () => 
                    Number((parametros.min + Math.random() * (parametros.max - parametros.min)).toFixed(4))
                );
            default:
                throw new Error('Distribuição de simulação não suportada');
        }
    }

    /**
     * Teste de ajuste de distribuição (Goodness-of-fit)
     * Retorna o valor-p para o teste de normalidade (simplificado)
     */
    static testeAjusteNormal(dados) {
        // Teste de normalidade simplificado usando assimetria e curtose
        const n = dados.length;
        const media = dados.reduce((a, b) => a + b, 0) / n;
        const desvioPadrao = Math.sqrt(dados.reduce((a, b) => a + Math.pow(b - media, 2), 0) / n);
        
        const assimetria = dados.reduce((a, b) => a + Math.pow((b - media) / desvioPadrao, 3), 0) / n;
        const curtose = dados.reduce((a, b) => a + Math.pow((b - media) / desvioPadrao, 4), 0) / n - 3;
        
        // Estatística do teste (simplificada)
        const estatistica = Math.pow(assimetria, 2) + Math.pow(curtose, 2);
        
        // Valor-p aproximado (para grandes amostras)
        const valorP = Math.exp(-estatistica / 2);
        
        return {
            estatistica: Number(estatistica.toFixed(4)),
            valor_p: Number(valorP.toFixed(4)),
            normalidade: valorP > 0.05 ? 'Provavelmente normal' : 'Possivelmente não normal'
        };
    }
}

export default Distribuicoes;