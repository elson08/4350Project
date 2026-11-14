
const API_BASE = "http://127.0.0.1:5000";

// GET request
export async function getData(table) {
  const response = await fetch(`${API_BASE}/${table}`);

  if (!response.ok) {
    throw new Error(`GET failed: ${response.status}`);
  }

  return await response.json();
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

  if (!response.ok) {
    throw new Error(`POST failed: ${response.status}`);
  }

  return await response.json();
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

  if (!response.ok) {
    throw new Error(`PATCH failed: ${response.status}`);
  }

  return await response.json();
}

// DELETE request
export async function deleteData(table) {
  const response = await fetch(`${API_BASE}/${table}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`DELETE failed: ${response.status}`);
  }

  return await response.json();
}
