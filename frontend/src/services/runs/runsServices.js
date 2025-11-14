// /services/runService.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/v1/";

/**
 * Helper requestJson (mesmo comportamento dos outros services)
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

/* Runs API */

/** GET /runs/ */
export async function getRuns(token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/`;
    return await requestJson(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** POST /runs/  body: { bike_uuid, bike_id, name } */
export async function createRun(body, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/`;
    return await requestJson(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
}

/** POST /runs/:id_run/stop */
export async function stopRunById(id_run, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/${encodeURIComponent(id_run)}/stop`;
    return await requestJson(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** POST /runs/:bike_uuid/stop */
export async function stopRunByBike(bike_uuid, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/${encodeURIComponent(bike_uuid)}/stop`;
    return await requestJson(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** GET /runs/:id_run/metrics */
export async function getRunMetrics(id_run, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/${encodeURIComponent(id_run)}/metrics`;
    return await requestJson(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** GET /runs/:id_run/last */
export async function getRunLast(id_run, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }

    const url = `${API_BASE}runs/${encodeURIComponent(id_run)}/last`;

    try {
        const data = await requestJson(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!data) return null;

        return data;
    } catch (err) {
        const msg = String(err?.message || err?.payload?.message || "").toLowerCase();

        if (err?.status === 404 || msg.includes("não encontradas") || msg.includes("não encontrada") || msg.includes("sem leituras")) {
            return null;
        }
        throw err;
    }
}


/** GET /runs/bike/:bike_uuid/live */
export async function getLiveByBike(bike_uuid, token) {
    if (!token) {
        const err = new Error("Token não fornecido");
        err.status = 401;
        throw err;
    }
    const url = `${API_BASE}runs/bike/${encodeURIComponent(bike_uuid)}/live`;
    return await requestJson(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
