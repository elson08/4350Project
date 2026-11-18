import { useEffect, useState } from "react";

import { getRecords, insertRecord, updateData } from "../../services/api.js";

import "./Inventory.css";

const CONDITIONS = ["New", "Rebuilt"];

function isValidPrice(value) {
    return value.trim() !== "" && Number(value) >= 0;
}

function isValidQuantity(value) {
    return /^\d+$/.test(value.trim());
}

async function saveRow({ part, stockRow, storeID, price, quantity }) {
    if (Number(price) !== Number(part.unitPrice)) {
        await updateData("part", {
            conditions: { partID: part.partID },
            updates: { unitPrice: Number(price) }
        });
    }

    const currentQuantity = stockRow ? stockRow.quantity : 0;
    if (Number(quantity) === currentQuantity) {
        return;
    }

    if (stockRow) {
        await updateData("inventory", {
            conditions: { inventoryID: stockRow.inventoryID },
            updates: { quantity: Number(quantity) }
        });
    } else {
        await insertRecord("inventory", { storeID, partID: part.partID, quantity: Number(quantity) });
    }
}

async function addPart({ storeID, name, category, condition, price, quantity }) {
    await insertRecord("part", { partName: name, category, condition, unitPrice: Number(price) });

    const matches = await getRecords("part", { partName: name, category, condition });
    const partID = Math.max(...matches.map((part) => part.partID));

    await insertRecord("inventory", { storeID, partID, quantity: Number(quantity) });
}

function InventoryRow({ part, stockRow, storeID, onSaved }) {
    const [price, setPrice] = useState(String(part.unitPrice));
    const [quantity, setQuantity] = useState(String(stockRow ? stockRow.quantity : 0));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const currentQuantity = stockRow ? stockRow.quantity : 0;
    const isChanged = Number(price) !== Number(part.unitPrice) || Number(quantity) !== currentQuantity;
    const isValid = isValidPrice(price) && isValidQuantity(quantity);

    async function handleSave() {
        setError("");
        setSaving(true);
        try {
            await saveRow({ part, stockRow, storeID, price, quantity });
            onSaved(`Saved ${part.partName}.`);
        } catch {
            setError("Couldn't save.");
            setSaving(false);
        }
    }

    return (
        <tr>
            <td>{part.partID}</td>
            <td>
                {part.partName}
                {error && <div className="inventory-error">{error}</div>}
            </td>
            <td>{part.category}</td>
            <td>{part.condition}</td>
            <td>
                <input
                    className="inventory-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    aria-label={`Price of ${part.partName}`}
                    onChange={(event) => setPrice(event.target.value)}
                />
            </td>
            <td>
                <input
                    className="inventory-input"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    aria-label={`Stock of ${part.partName}`}
                    onChange={(event) => setQuantity(event.target.value)}
                />
            </td>
            <td>
                <button
                    type="button"
                    className="button"
                    disabled={!isChanged || !isValid || saving}
                    onClick={handleSave}
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </td>
        </tr>
    );
}

function AddPartForm({ storeID, categories, onAdded }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [condition, setCondition] = useState(CONDITIONS[0]);
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("0");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!isValidPrice(price)) {
            setError("Invalid price.");
            return;
        }

        if (!isValidQuantity(quantity)) {
            setError("Invalid stock.");
            return;
        }

        setAdding(true);
        try {
            await addPart({
                storeID,
                name: name.trim(),
                category: category.trim(),
                condition,
                price,
                quantity
            });
            onAdded(`Added ${name.trim()}.`);
            setName("");
            setCategory("");
            setCondition(CONDITIONS[0]);
            setPrice("");
            setQuantity("0");
        } catch {
            setError("Couldn't add part.");
        } finally {
            setAdding(false);
        }
    }

    return (
        <form className="card inventory-add" onSubmit={handleSubmit} aria-labelledby="inventory-add-title">
            <h2 id="inventory-add-title">Add a part</h2>
            <div className="field">
                <label htmlFor="add-name">Name</label>
                <input id="add-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="field">
                <label htmlFor="add-category">Category</label>
                <input
                    id="add-category"
                    list="add-category-options"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                />
                <datalist id="add-category-options">
                    {categories.map((option) => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
            </div>
            <div className="field">
                <label htmlFor="add-condition">Condition</label>
                <select id="add-condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
                    {CONDITIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <div className="inventory-add-row">
                <div className="field">
                    <label htmlFor="add-price">Price</label>
                    <input
                        id="add-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="add-quantity">Stock</label>
                    <input
                        id="add-quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        required
                    />
                </div>
            </div>
            {error && (
                <p className="message message-error" role="alert">
                    {error}
                </p>
            )}
            <button type="submit" className="button button-primary" disabled={adding}>
                {adding ? "Adding..." : "Add part"}
            </button>
        </form>
    );
}

function Inventory({ selectedStore }) {
    const [parts, setParts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [message, setMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        Promise.all([getRecords("part"), getRecords("inventory", { storeID: selectedStore })])
            .then(([partRecords, inventoryRecords]) => {
                if (isCurrent) {
                    setParts(partRecords);
                    setInventory(inventoryRecords);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load inventory.");
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [selectedStore, reloadCount]);

    if (loading) {
        return <p className="muted">Loading...</p>;
    }

    if (loadError) {
        return <p className="message message-error">{loadError}</p>;
    }

    const categories = [...new Set(parts.map((part) => part.category))].sort();

    function handleChange(text) {
        setMessage(text);
        setReloadCount((count) => count + 1);
    }

    return (
        <div className="inventory">
            {message && (
                <p className="message message-success" role="status">
                    {message}
                </p>
            )}

            <div className="inventory-columns">
                <section className="card inventory-list" aria-label="Inventory">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Part #</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Condition</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.map((part) => {
                                    const stockRow = inventory.find((row) => row.partID === part.partID);
                                    const key = `${part.partID}:${part.unitPrice}:${stockRow ? stockRow.quantity : 0}`;

                                    return (
                                        <InventoryRow
                                            key={key}
                                            part={part}
                                            stockRow={stockRow}
                                            storeID={selectedStore}
                                            onSaved={handleChange}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <AddPartForm storeID={selectedStore} categories={categories} onAdded={handleChange} />
            </div>
        </div>
    );
}

export default Inventory;
