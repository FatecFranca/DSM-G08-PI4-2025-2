const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/v1";

/**
 * Helper: faz request e tenta parsear JSON, lança erro com payload quando status !== ok
 */
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

/**
 * Recupera as bikes do usuário logado via GET /bikes/my-bikes
 * token: string do tipo 'ey...'
 */
export async function getMyBikes(token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }

    const url = `${API_BASE}bikes/my-bikes`;
    return await requestJson(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/**
 * Cria uma nova bike via POST /bikes
 * bikeData deve seguir o body:
 * {
 *   id_bike: "ars",
 *   circunferencia_m: 2.00,
 *   description: "ars",
 *   name: "ars"
 * }
 *
 * Retorna payload do backend.
 */
export async function createBike(bikeData, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }

    const url = `${API_BASE}bikes`;
    return await requestJson(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bikeData),
    });
}
