
const API_BASE = "/api";

// GET request
export async function getData(table, filters = {}) {
    const query = new URLSearchParams(filters);
    const url = `${API_BASE}/${table}?${query.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `GET failed: ${response.status}`);
    }

    return data.result;
}

// POST request
export async function postData(table, data) {
    const response = await fetch(`${API_BASE}/${table}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.result !== 0) {
        throw new Error(result.message || `POST failed: ${response.status}`);
    }

    return result.result;
}

// PATCH request
export async function updateData(table, data) {
    const response = await fetch(`${API_BASE}/${table}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.result === 1) {
        throw new Error(result.message || `PATCH failed: ${response.status}`);
    }

    return result.result;
}

// DELETE request
export async function deleteData(table, data) {
    const response = await fetch(`${API_BASE}/${table}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.result === 1) {
        throw new Error(result.message || `DELETE failed: ${response.status}`);
    }

    return result.result;
}

// Compatibility names for existing login and registration code
export const getRecords = getData;
export const insertRecord = postData;

