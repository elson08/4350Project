import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { loadOrders, restockAndRefund } from "../../services/orders.js";

import "./PaymentOrderHistory.css";

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function PaymentOrderHistory({ user }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [openOrderID, setOpenOrderID] = useState(null);
    const [cancellingID, setCancellingID] = useState(null);
    const [cancelError, setCancelError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    const customerID = user?.role === "customer" ? user.customerID : null;

    useEffect(() => {
        if (customerID === null) {
            return;
        }

        let isCurrent = true;

        loadOrders({ customerID })
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
    }, [customerID, reloadCount]);

    if (customerID === null) {
        return (
            <p>
                <Link to="/login">Log in</Link> as a customer to see your orders.
            </p>
        );
    }

    if (loading) {
        return <p className="muted">Loading...</p>;
    }

    if (loadError) {
        return <p className="message message-error">{loadError}</p>;
    }

    if (orders.length === 0) {
        return (
            <div className="card orders-empty">
                <p>No orders yet.</p>
            </div>
        );
    }

    async function handleCancel(order) {
        if (!window.confirm(`Cancel order #${order.orderID}?`)) {
            return;
        }

        setCancelError("");
        setCancellingID(order.orderID);
        try {
            await restockAndRefund(order, "cancelled");
            setReloadCount((count) => count + 1);
        } catch {
            setCancelError(`Couldn't cancel order #${order.orderID}.`);
        } finally {
            setCancellingID(null);
        }
    }

    return (
        <div className="orders">
            {cancelError && (
                <p className="message message-error" role="alert">
                    {cancelError}
                </p>
            )}

            <section className="card" aria-label="Order history">
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Store</th>
                                <th>Payment</th>
                                <th className="number">Total</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const isOpen = order.orderID === openOrderID;
                                const canCancel = order.status === "ordered";

                                return (
                                    <Fragment key={order.orderID}>
                                        <tr>
                                            <td>{order.orderID}</td>
                                            <td>{order.createdAt}</td>
                                            <td>{order.store?.storeName}</td>
                                            <td>{order.payment?.paymentMethod}</td>
                                            <td className="number">{formatPrice(order.total)}</td>
                                            <td>{formatStatus(order.status)}</td>
                                            <td>
                                                <div className="orders-actions">
                                                    <button
                                                        type="button"
                                                        className="button"
                                                        aria-expanded={isOpen}
                                                        onClick={() => setOpenOrderID(isOpen ? null : order.orderID)}
                                                    >
                                                        {isOpen ? "Hide items" : "Items"}
                                                    </button>
                                                    {canCancel && (
                                                        <button
                                                            type="button"
                                                            className="button"
                                                            disabled={cancellingID !== null}
                                                            onClick={() => handleCancel(order)}
                                                        >
                                                            {cancellingID === order.orderID ? "Cancelling..." : "Cancel"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="orders-items-row">
                                                <td colSpan="7">
                                                    <table className="orders-items">
                                                        <thead>
                                                            <tr>
                                                                <th>Part</th>
                                                                <th className="number">Quantity</th>
                                                                <th className="number">Price</th>
                                                                <th className="number">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items.map((item) => (
                                                                <tr key={item.orderItemID}>
                                                                    <td>{item.part?.partName}</td>
                                                                    <td className="number">{item.quantity}</td>
                                                                    <td className="number">{formatPrice(item.unitPrice)}</td>
                                                                    <td className="number">
                                                                        {formatPrice(item.quantity * item.unitPrice)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default PaymentOrderHistory;
