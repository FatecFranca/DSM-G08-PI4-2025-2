// /services/auth/authService.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

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
 * login({ email, password }, { persist: 'local'|'session'|'none' })
 * Retorna payload do backend e persiste token se persist for definido.
 */
export async function login({ email, password }, options = {}) {
    if (!email || !password) throw new Error("Email e senha são obrigatórios.");

    const { persist = "local" } = options;

    const url = `${API_BASE}/v1/auth/login`;
    const payload = await requestJson(url, {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    // extrair token de várias chaves possíveis
    const token = payload?.token || payload?.accessToken || payload?.access_token || null;

    try {
        if (token) {
            if (persist === "local") localStorage.setItem("auth_token", token);
            else if (persist === "session") sessionStorage.setItem("auth_token", token);
            // else persist === 'none' -> não persiste
        }
        if (payload?.user) {
            const userJson = JSON.stringify(payload.user);
            if (persist === "local") localStorage.setItem("auth_user", userJson);
            else if (persist === "session") sessionStorage.setItem("auth_user", userJson);
        }
    } catch (e) {
        // se storage não disponível (ex: bloqueado), ignore silenciosamente
    }

    return payload;
}

export function logout() {
    try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
    } catch (e) { }
}
