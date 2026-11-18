import { Fragment, useEffect, useState } from "react";

import { getRecords, insertRecord, updateData } from "../../services/api.js";
import { timestamp } from "../../services/orders.js";

import "./Suppliers.css";

const OPEN_STATUSES = ["ordered", "shipped", "delivered"];

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function emptyLine(parts) {
    const part = parts[0];
    return { partID: part ? part.partID : "", quantity: "1", unitCost: part ? String(part.unitPrice) : "" };
}

function lineTotal(lines) {
    return lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unitCost), 0);
}

function isValidLine(line) {
    const isValidQuantity = /^\d+$/.test(line.quantity) && Number(line.quantity) > 0;
    const isValidCost = line.unitCost !== "" && Number(line.unitCost) >= 0;
    return isValidQuantity && isValidCost;
}

async function loadSupplierOrders(storeID) {
    const [orders, items, suppliers, parts] = await Promise.all([
        getRecords("supplierOrder", { storeID }),
        getRecords("supplierOrderItem"),
        getRecords("supplier"),
        getRecords("part")
    ]);

    const supplierOrders = orders
        .map((order) => ({
            ...order,
            supplier: suppliers.find((supplier) => supplier.suppID === order.suppID),
            items: items
                .filter((item) => item.orderNumber === order.orderNumber)
                .map((item) => ({ ...item, partID: Number(item.partID) }))
                .map((item) => ({ ...item, part: parts.find((part) => part.partID === item.partID) }))
        }))
        .sort((first, second) => second.orderNumber - first.orderNumber);

    return { orders: supplierOrders, suppliers, parts };
}

async function placeSupplierOrder({ storeID, suppID, expectedDate, lines }) {
    const orderDate = timestamp();
    await insertRecord("supplierOrder", {
        status: "ordered",
        orderDate,
        expectedDate: expectedDate || null,
        payment: Number(lineTotal(lines).toFixed(2)),
        suppID,
        storeID
    });

    const matches = await getRecords("supplierOrder", { storeID, orderDate });
    const orderNumber = Math.max(...matches.map((order) => order.orderNumber));

    for (const line of lines) {
        await insertRecord("supplierOrderItem", {
            orderNumber,
            partID: line.partID,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitCost)
        });
    }

    return orderNumber;
}

async function receiveSupplierOrder(order) {
    const inventory = await getRecords("inventory", { storeID: order.storeID });

    for (const item of order.items) {
        const stock = inventory.find((row) => row.partID === item.partID);
        if (stock) {
            await updateData("inventory", {
                conditions: { inventoryID: stock.inventoryID },
                updates: { quantity: stock.quantity + item.quantity }
            });
        } else {
            await insertRecord("inventory", { storeID: order.storeID, partID: item.partID, quantity: item.quantity });
        }
    }

    await updateData("supplierOrder", {
        conditions: { orderNumber: order.orderNumber },
        updates: { status: "received", actualDate: timestamp() }
    });
}

async function stopSupplierOrder(order) {
    await updateData("supplierOrder", {
        conditions: { orderNumber: order.orderNumber },
        updates: { status: "cancelled" }
    });
}

function mergeLines(lines) {
    const partIDs = [...new Set(lines.map((line) => line.partID))];

    return partIDs.map((partID) => {
        const matching = lines.filter((line) => line.partID === partID);
        const quantity = matching.reduce((sum, line) => sum + Number(line.quantity), 0);
        return { ...matching[0], quantity: String(quantity) };
    });
}

function NewOrderForm({ storeID, suppliers, parts, draft, onPlaced }) {
    const [suppID, setSuppID] = useState(draft ? draft.suppID : suppliers[0]?.suppID ?? "");
    const [expectedDate, setExpectedDate] = useState("");
    const [lines, setLines] = useState(draft ? draft.lines : [emptyLine(parts)]);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    const total = lineTotal(lines);
    const canPlace = suppID !== "" && lines.length > 0 && lines.every(isValidLine);

    function updateLine(index, changes) {
        setLines(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...changes } : line)));
    }

    function choosePart(index, partID) {
        const part = parts.find((candidate) => candidate.partID === partID);
        updateLine(index, { partID, unitCost: part ? String(part.unitPrice) : "" });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setPlacing(true);
        try {
            const orderNumber = await placeSupplierOrder({ storeID, suppID, expectedDate, lines: mergeLines(lines) });
            onPlaced(`Supplier order #${orderNumber} placed.`);
        } catch {
            setError("Couldn't place order.");
            setPlacing(false);
        }
    }

    return (
        <form className="card suppliers-form" onSubmit={handleSubmit} aria-labelledby="suppliers-form-title">
            <h2 id="suppliers-form-title">New supplier order</h2>
            <div className="field">
                <label htmlFor="supplier-select">Supplier</label>
                <select id="supplier-select" value={suppID} onChange={(event) => setSuppID(Number(event.target.value))}>
                    {suppliers.map((supplier) => (
                        <option key={supplier.suppID} value={supplier.suppID}>
                            {supplier.suppName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label htmlFor="supplier-expected">Expected date</label>
                <input
                    id="supplier-expected"
                    type="date"
                    value={expectedDate}
                    onChange={(event) => setExpectedDate(event.target.value)}
                />
            </div>

            {lines.map((line, index) => (
                <div className="suppliers-line" key={index}>
                    <div className="field suppliers-line-part">
                        <label htmlFor={`line-part-${index}`}>Part</label>
                        <select
                            id={`line-part-${index}`}
                            value={line.partID}
                            onChange={(event) => choosePart(index, Number(event.target.value))}
                        >
                            {parts.map((part) => (
                                <option key={part.partID} value={part.partID}>
                                    {part.partName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor={`line-quantity-${index}`}>Quantity</label>
                        <input
                            id={`line-quantity-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(event) => updateLine(index, { quantity: event.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor={`line-cost-${index}`}>Unit cost</label>
                        <input
                            id={`line-cost-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={(event) => updateLine(index, { unitCost: event.target.value })}
                        />
                    </div>
                    {lines.length > 1 && (
                        <button
                            type="button"
                            className="button"
                            onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}

            <button type="button" className="button" onClick={() => setLines([...lines, emptyLine(parts)])}>
                Add part
            </button>

            <div className="suppliers-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
            </div>

            {error && (
                <p className="message message-error" role="alert">
                    {error}
                </p>
            )}
            <button type="submit" className="button button-primary" disabled={!canPlace || placing}>
                {placing ? "Placing order..." : "Place order"}
            </button>
        </form>
    );
}

function OrderItems({ items }) {
    return (
        <table className="suppliers-items">
            <thead>
                <tr>
                    <th>Part</th>
                    <th className="number">Quantity</th>
                    <th className="number">Unit cost</th>
                    <th className="number">Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item) => (
                    <tr key={item.partID}>
                        <td>{item.part?.partName}</td>
                        <td className="number">{item.quantity}</td>
                        <td className="number">{formatPrice(item.unitPrice)}</td>
                        <td className="number">{formatPrice(item.quantity * item.unitPrice)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Suppliers({ selectedStore }) {
    const [data, setData] = useState({ orders: [], suppliers: [], parts: [] });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [message, setMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [openOrderNumber, setOpenOrderNumber] = useState(null);
    const [workingNumber, setWorkingNumber] = useState(null);
    const [draft, setDraft] = useState(null);
    const [formKey, setFormKey] = useState(0);
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        loadSupplierOrders(selectedStore)
            .then((loaded) => {
                if (isCurrent) {
                    setData(loaded);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load supplier orders.");
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

    function handlePlaced(text) {
        setMessage(text);
        setDraft(null);
        setFormKey((key) => key + 1);
        setReloadCount((count) => count + 1);
    }

    function handleReorder(order) {
        const lines = order.items.map((item) => ({
            partID: item.partID,
            quantity: String(item.quantity),
            unitCost: String(item.unitPrice)
        }));
        setMessage("");
        setDraft({ suppID: order.suppID, lines });
        setFormKey((key) => key + 1);
    }

    async function runAction(order, action, doneText) {
        setActionError("");
        setMessage("");
        setWorkingNumber(order.orderNumber);
        try {
            await action();
            setMessage(doneText);
            setReloadCount((count) => count + 1);
        } catch {
            setActionError(`Couldn't update supplier order #${order.orderNumber}.`);
        } finally {
            setWorkingNumber(null);
        }
    }

    function toggleItems(orderNumber) {
        setOpenOrderNumber(orderNumber === openOrderNumber ? null : orderNumber);
    }

    function handleReceive(order) {
        runAction(order, () => receiveSupplierOrder(order), `Supplier order #${order.orderNumber} received.`);
    }

    function handleStop(order) {
        if (!window.confirm(`Stop supplier order #${order.orderNumber}?`)) {
            return;
        }

        runAction(order, () => stopSupplierOrder(order), `Supplier order #${order.orderNumber} stopped.`);
    }

    return (
        <div className="suppliers">
            {message && (
                <p className="message message-success" role="status">
                    {message}
                </p>
            )}
            {actionError && (
                <p className="message message-error" role="alert">
                    {actionError}
                </p>
            )}

            <div className="suppliers-columns">
                <section className="card suppliers-list" aria-label="Supplier orders">
                    {data.orders.length === 0 ? (
                        <p className="suppliers-empty">No supplier orders yet.</p>
                    ) : (
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Supplier</th>
                                        <th>Ordered</th>
                                        <th>Expected</th>
                                        <th>Received</th>
                                        <th className="number">Total</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.orders.map((order) => {
                                        const isOpen = order.orderNumber === openOrderNumber;
                                        const isOpenOrder = OPEN_STATUSES.includes(order.status);
                                        const isBusy = workingNumber !== null;

                                        return (
                                            <Fragment key={order.orderNumber}>
                                                <tr>
                                                    <td>{order.orderNumber}</td>
                                                    <td>{order.supplier?.suppName}</td>
                                                    <td>{order.orderDate}</td>
                                                    <td>{order.expectedDate}</td>
                                                    <td>{order.actualDate}</td>
                                                    <td className="number">{formatPrice(order.payment)}</td>
                                                    <td>{formatStatus(order.status)}</td>
                                                    <td>
                                                        <div className="suppliers-actions">
                                                            <button
                                                                type="button"
                                                                className="button"
                                                                aria-expanded={isOpen}
                                                                onClick={() => toggleItems(order.orderNumber)}
                                                            >
                                                                {isOpen ? "Hide items" : "Items"}
                                                            </button>
                                                            {isOpenOrder && (
                                                                <button
                                                                    type="button"
                                                                    className="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => handleReceive(order)}
                                                                >
                                                                    Mark received
                                                                </button>
                                                            )}
                                                            {order.status === "ordered" && (
                                                                <button
                                                                    type="button"
                                                                    className="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => handleStop(order)}
                                                                >
                                                                    Stop
                                                                </button>
                                                            )}
                                                            {!isOpenOrder && (
                                                                <button
                                                                    type="button"
                                                                    className="button"
                                                                    onClick={() => handleReorder(order)}
                                                                >
                                                                    Reorder
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isOpen && (
                                                    <tr className="suppliers-items-row">
                                                        <td colSpan="8">
                                                            <OrderItems items={order.items} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {data.suppliers.length === 0 || data.parts.length === 0 ? (
                    <p className="card suppliers-empty">No suppliers yet.</p>
                ) : (
                    <NewOrderForm
                        key={formKey}
                        storeID={selectedStore}
                        suppliers={data.suppliers}
                        parts={data.parts}
                        draft={draft}
                        onPlaced={handlePlaced}
                    />
                )}
            </div>
        </div>
    );
}

export default Suppliers;
