// services/estatisticasService.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/v1/";

async function requestJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const text = await res.text();
    let payload = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch (e) {
        payload = { message: text };
    }

    if (!res.ok) {
        const message = payload?.message || payload?.error || res.statusText || "Erro na requisição";
        const err = new Error(message);
        err.status = res.status;
        err.payload = payload;
        throw err;
    }
    return payload;
}

async function requestRaw(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(text || res.statusText || "Erro ao buscar recurso");
        err.status = res.status;
        throw err;
    }
    return res;
}

export async function getDashboard(token) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const url = `${API_BASE}estatisticas/dashboard`;
    return await requestJson(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
}

export async function getEstatisticasRun(id_run, token) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const url = `${API_BASE}estatisticas/run/${encodeURIComponent(id_run)}`;
    return await requestJson(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
}

export async function exportEstatisticasRunCSV(id_run, token) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const url = `${API_BASE}estatisticas/run/${encodeURIComponent(id_run)}/exportar?formato=csv`;
    // retornamos o Response para fazer download do CSV
    const res = await requestRaw(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    return text;
}

export async function getEstatisticasBike(bike_uuid, token, params = {}) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const q = new URLSearchParams(params).toString();
    const url = `${API_BASE}estatisticas/bike/${encodeURIComponent(bike_uuid)}${q ? `?${q}` : ""}`;
    return await requestJson(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
}

export async function postComparativo(runIds = [], token) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const url = `${API_BASE}estatisticas/comparativo`;
    return await requestJson(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ runs: runIds }),
    });
}

export async function postCalcular(payload, token) {
    if (!token) throw Object.assign(new Error("Token não fornecido"), { status: 401 });
    const url = `${API_BASE}estatisticas/calcular`;
    return await requestJson(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}
