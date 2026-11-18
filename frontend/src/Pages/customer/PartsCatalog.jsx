import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRecords } from "../../services/api.js";

import "./PartsCatalog.css";

const ALL = "";

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function stockAt(inventory, partID, storeID) {
    const row = inventory.find((item) => item.partID === partID && item.storeID === storeID);
    return row ? row.quantity : 0;
}

function quantityInCart(cart, partID) {
    const item = cart.find((cartItem) => cartItem.partID === partID);
    return item ? item.quantity : 0;
}

function addToCart(cart, partID, quantity) {
    const current = quantityInCart(cart, partID);
    if (current === 0) {
        return [...cart, { partID, quantity }];
    }

    return cart.map((item) => (item.partID === partID ? { ...item, quantity: current + quantity } : item));
}

function filterParts(parts, inventory, storeID, filters) {
    const query = filters.query.trim().toLowerCase();

    return parts.filter((part) => {
        if (filters.category !== ALL && part.category !== filters.category) {
            return false;
        }

        if (filters.condition !== ALL && part.condition !== filters.condition) {
            return false;
        }

        if (filters.inStockOnly && stockAt(inventory, part.partID, storeID) === 0) {
            return false;
        }

        const matchesNumber = String(part.partID) === query;
        return query === "" || matchesNumber || part.partName.toLowerCase().includes(query);
    });
}

function PartDetails({ part, stores, inventory, storeID, cart, onAdd }) {
    const [quantity, setQuantity] = useState(1);

    const inStockHere = stockAt(inventory, part.partID, storeID);
    const alreadyInCart = quantityInCart(cart, part.partID);
    const canAdd = inStockHere - alreadyInCart;
    const isQuantityValid = Number.isInteger(quantity) && quantity >= 1 && quantity <= canAdd;

    return (
        <aside className="card catalog-details" aria-label="Part details">
            <h2>{part.partName}</h2>

            <div className="catalog-price">
                <strong>{formatPrice(part.unitPrice)}</strong>
                <span className="muted">{part.condition}</span>
            </div>

            <div>
                <h3 className="catalog-small">Availability</h3>
                <table>
                    <tbody>
                        {stores.map((store) => (
                            <tr key={store.storeID}>
                                <td>{store.storeName}</td>
                                <td className="number">{stockAt(inventory, part.partID, store.storeID)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {inStockHere > 0 && alreadyInCart > 0 && (
                <p className="muted catalog-small">
                    {alreadyInCart} in your cart.
                </p>
            )}

            <div className="catalog-add">
                <div className="field">
                    <label htmlFor="catalog-quantity">Quantity</label>
                    <input
                        id="catalog-quantity"
                        type="number"
                        min="1"
                        max={Math.max(canAdd, 1)}
                        value={quantity}
                        disabled={canAdd <= 0}
                        onChange={(event) => setQuantity(Number(event.target.value))}
                    />
                </div>
                <button
                    type="button"
                    className="button button-primary"
                    disabled={!isQuantityValid}
                    onClick={() => onAdd(part.partID, quantity)}
                >
                    Add to cart
                </button>
            </div>

            {canAdd > 0 && quantity > canAdd && (
                <p className="message message-error">Only {canAdd} more available.</p>
            )}
        </aside>
    );
}

function PartsCatalog({ selectedStore, cart, setCart }) {
    const [parts, setParts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [filters, setFilters] = useState({ query: "", category: ALL, condition: ALL, inStockOnly: false });
    const [selectedPartID, setSelectedPartID] = useState(null);
    const [addedMessage, setAddedMessage] = useState("");

    useEffect(() => {
        let isCurrent = true;

        Promise.all([getRecords("part"), getRecords("inventory"), getRecords("store")])
            .then(([partRecords, inventoryRecords, storeRecords]) => {
                if (isCurrent) {
                    setParts(partRecords);
                    setInventory(inventoryRecords);
                    setStores(storeRecords);
                }
            })
            .catch((error) => {
                if (isCurrent) {
                    setLoadError(error.message);
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
    }, []);

    if (selectedStore === null) {
        return (
            <p>
                <Link to="/login">Select a store</Link> first.
            </p>
        );
    }

    const categories = [...new Set(parts.map((part) => part.category))].sort();
    const visibleParts = filterParts(parts, inventory, selectedStore, filters);
    const selectedPart = parts.find((part) => part.partID === selectedPartID);

    function updateFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value }));
    }

    function handleAdd(partID, quantity) {
        setCart(addToCart(cart, partID, quantity));
        setAddedMessage(`Added ${quantity}x ${selectedPart.partName} to your cart.`);
    }

    function selectPart(partID) {
        setSelectedPartID(partID);
        setAddedMessage("");
    }

    return (
        <div className="catalog">
            <form className="card catalog-filters" onSubmit={(event) => event.preventDefault()}>
                <div className="field catalog-search">
                    <label htmlFor="catalog-query">Search</label>
                    <input
                        id="catalog-query"
                        type="search"
                        value={filters.query}
                        onChange={(event) => updateFilter("query", event.target.value)}
                    />
                </div>
                <div className="field">
                    <label htmlFor="catalog-category">Category</label>
                    <select
                        id="catalog-category"
                        value={filters.category}
                        onChange={(event) => updateFilter("category", event.target.value)}
                    >
                        <option value={ALL}>All categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="catalog-condition">Condition</label>
                    <select
                        id="catalog-condition"
                        value={filters.condition}
                        onChange={(event) => updateFilter("condition", event.target.value)}
                    >
                        <option value={ALL}>All conditions</option>
                        <option value="New">New</option>
                        <option value="Rebuilt">Rebuilt</option>
                    </select>
                </div>
                <label className="catalog-check">
                    <input
                        type="checkbox"
                        checked={filters.inStockOnly}
                        onChange={(event) => updateFilter("inStockOnly", event.target.checked)}
                    />
                    In stock only
                </label>
            </form>

            {addedMessage && (
                <p className="message message-success" role="status">
                    {addedMessage}
                </p>
            )}

            {loading && <p className="muted">Loading...</p>}
            {loadError && <p className="message message-error">Couldn't load parts.</p>}

            {!loading && !loadError && (
                <div className="catalog-columns">
                    <section className="card catalog-list" aria-label="Parts list">
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Part #</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Condition</th>
                                        <th className="number">Price</th>
                                        <th className="number">In stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleParts.map((part) => (
                                        <tr
                                            key={part.partID}
                                            className={part.partID === selectedPartID ? "catalog-selected" : ""}
                                        >
                                            <td className="muted">{part.partID}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="catalog-name"
                                                    onClick={() => selectPart(part.partID)}
                                                >
                                                    {part.partName}
                                                </button>
                                            </td>
                                            <td>{part.category}</td>
                                            <td>{part.condition}</td>
                                            <td className="number">{formatPrice(part.unitPrice)}</td>
                                            <td className="number">{stockAt(inventory, part.partID, selectedStore)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {visibleParts.length === 0 && (
                            <p className="muted catalog-small catalog-count">No parts found.</p>
                        )}
                    </section>

                    {selectedPart ? (
                        <PartDetails
                            key={selectedPart.partID}
                            part={selectedPart}
                            stores={stores}
                            inventory={inventory}
                            storeID={selectedStore}
                            cart={cart}
                            onAdd={handleAdd}
                        />
                    ) : (
                        <aside className="card catalog-details catalog-empty">
                            <p className="muted">Select a part</p>
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
}

export default PartsCatalog;
