import { Fragment, useEffect, useState } from "react";

import { loadOrders, restockAndRefund, setOrderStatus } from "../../services/orders.js";

import "./ManageOrders.css";

const ALL = "";
const STATUSES = ["ordered", "shipped", "delivered", "cancelled", "returned", "lost", "received"];

const ACTIONS = {
    ordered: [
        { label: "Mark shipped", status: "shipped" },
        { label: "Cancel", status: "cancelled", restock: true }
    ],
    shipped: [{ label: "Mark delivered", status: "delivered" }],
    delivered: [{ label: "Mark returned", status: "returned", restock: true }]
};

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function OrderItems({ items }) {
    return (
        <table className="manage-items">
            <thead>
                <tr>
                    <th>Part</th>
                    <th className="number">Quantity</th>
                    <th className="number">Price</th>
                    <th className="number">Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item) => (
                    <tr key={item.orderItemID}>
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

function ManageOrders({ selectedStore }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [statusFilter, setStatusFilter] = useState(ALL);
    const [openOrderID, setOpenOrderID] = useState(null);
    const [workingID, setWorkingID] = useState(null);
    const [actionError, setActionError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        loadOrders({ storeID: selectedStore })
            .then((loadedOrders) => {
                if (isCurrent) {
                    setOrders(loadedOrders);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load orders.");
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

    const shownOrders = statusFilter === ALL ? orders : orders.filter((order) => order.status === statusFilter);

    async function handleAction(order, action) {
        if (action.restock && !window.confirm(`${action.label} order #${order.orderID}?`)) {
            return;
        }

        setActionError("");
        setWorkingID(order.orderID);
        try {
            if (action.restock) {
                await restockAndRefund(order, action.status);
            } else {
                await setOrderStatus(order, action.status);
            }
            setReloadCount((count) => count + 1);
        } catch {
            setActionError(`Couldn't update order #${order.orderID}.`);
        } finally {
            setWorkingID(null);
        }
    }

    return (
        <div className="manage">
            <div className="card manage-filters">
                <div className="field">
                    <label htmlFor="manage-status">Status</label>
                    <select id="manage-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value={ALL}>All statuses</option>
                        {STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {formatStatus(status)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {actionError && (
                <p className="message message-error" role="alert">
                    {actionError}
                </p>
            )}

            <section className="card" aria-label="Store orders">
                {shownOrders.length === 0 ? (
                    <p className="manage-empty">No orders found.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Payment</th>
                                    <th className="number">Total</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {shownOrders.map((order) => {
                                    const isOpen = order.orderID === openOrderID;
                                    const actions = ACTIONS[order.status] || [];

                                    return (
                                        <Fragment key={order.orderID}>
                                            <tr>
                                                <td>{order.orderID}</td>
                                                <td>{order.createdAt}</td>
                                                <td>{order.customer?.name}</td>
                                                <td>{order.payment?.paymentMethod}</td>
                                                <td className="number">{formatPrice(order.total)}</td>
                                                <td>{formatStatus(order.status)}</td>
                                                <td>
                                                    <div className="manage-actions">
                                                        <button
                                                            type="button"
                                                            className="button"
                                                            aria-expanded={isOpen}
                                                            onClick={() => setOpenOrderID(isOpen ? null : order.orderID)}
                                                        >
                                                            {isOpen ? "Hide items" : "Items"}
                                                        </button>
                                                        {actions.map((action) => (
                                                            <button
                                                                key={action.status}
                                                                type="button"
                                                                className="button"
                                                                disabled={workingID !== null}
                                                                onClick={() => handleAction(order, action)}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr className="manage-items-row">
                                                    <td colSpan="7">
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
        </div>
    );
}

export default ManageOrders;
