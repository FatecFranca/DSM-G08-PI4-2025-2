// 📁 NOVO ARQUIVO: src/routes/estatisticas.routes.js
import { Router } from 'express';
import { EstatisticasController } from '../controllers/estatisticasController.js';
import { authenticateUser } from '../middlewares/authUser.js';
import { authIotSimple } from '../middlewares/authIot.js';

const router = Router();

router.get('/run/:id_run', authenticateUser, EstatisticasController.getEstatisticasRun);

router.get('/run/:id_run/exportar', authenticateUser, EstatisticasController.exportarEstatisticas);

router.get('/bike/:bike_uuid', authenticateUser, EstatisticasController.getEstatisticasBike);

router.get('/bike/:bike_uuid/live', authIotSimple, EstatisticasController.getEstatisticasBike);

router.post('/comparativo', authenticateUser, EstatisticasController.getEstatisticasComparativas);


router.get('/dashboard', authenticateUser, EstatisticasController.getEstatisticasDashboard);

router.post('/calcular', authenticateUser, EstatisticasController.postCalculosCustomizados);

router.get('/health', (req, res) => {
    res.json({
        service: 'estatisticas',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /estatisticas/run/:id_run',
            'GET /estatisticas/bike/:bike_uuid', 
            'POST /estatisticas/comparativo',
            'GET /estatisticas/dashboard',
            'POST /estatisticas/calcular'
        ]
    });
});

router.get('/metodos', (req, res) => {
    res.json({
        metodos_disponiveis: {
            tendencia_central: [
                'Média Aritmética',
                'Mediana', 
                'Moda',
                'Média Geométrica',
                'Média Harmônica'
            ],
            dispersao: [
                'Variância',
                'Desvio Padrão',
                'Coeficiente de Variação',
                'Amplitude',
                'Amplitude Interquartil'
            ],
            forma_distribuicao: [
                'Assimetria (Skewness)',
                'Curtose (Kurtosis)'
            ],
            quantis: [
                'Quartis (Q1, Q2, Q3)',
                'Percentis (P10, P25, P50, P75, P90, P95)'
            ],
            probabilidades: [
                'Distribuição de Frequência',
                'Probabilidade Acumulada'
            ],
            correlacao: [
                'Correlação Temporal',
                'Coeficiente de Correlação de Pearson'
            ],
            inferencia: [
                'Intervalo de Confiança',
                'Teste de Normalidade (simplificado)'
            ]
        },
        tipos_calculo_customizado: [
            'media_simples',
            'dispersao_completa', 
            'distribuicao_frequencia',
            'analise_normalidade',
            'intervalo_confianca',
            'correlacao'
        ]
    });
});

export default router;