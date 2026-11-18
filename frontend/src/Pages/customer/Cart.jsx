import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRecords, insertRecord, updateData } from "../../services/api.js";
import { timestamp } from "../../services/orders.js";

import "./Cart.css";

const CARD_TYPES = ["Visa", "Mastercard", "American Express", "Discover"];

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function isValidCardNumber(digits) {
    if (!/^\d{13,19}$/.test(digits)) {
        return false;
    }

    const sum = [...digits].reverse().reduce((total, digit, index) => {
        const doubled = index % 2 === 1 ? Number(digit) * 2 : Number(digit);
        return total + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);

    return sum % 10 === 0;
}

function buildLines(cart, parts, inventory, storeID) {
    return cart
        .map((item) => {
            const part = parts.find((candidate) => candidate.partID === item.partID);
            const stock = inventory.find((row) => row.partID === item.partID && row.storeID === storeID);
            return { ...item, part, available: stock ? stock.quantity : 0 };
        })
        .filter((line) => line.part);
}

async function placeOrder({ lines, storeID, customerID, paymentMethod, total }) {
    const inventory = await getRecords("inventory", { storeID });
    for (const line of lines) {
        const stock = inventory.find((row) => row.partID === line.partID);
        if (!stock || stock.quantity < line.quantity) {
            throw new Error(`Not enough ${line.part.partName} in stock.`);
        }
    }

    const createdAt = timestamp();
    await insertRecord("order", { storeID, customerID, createdAt, updatedAt: createdAt, status: "ordered" });

    const orders = await getRecords("order", { customerID, createdAt });
    const orderID = orders[orders.length - 1].orderID;

    for (const line of lines) {
        const stock = inventory.find((row) => row.partID === line.partID);
        await insertRecord("orderItem", {
            orderID,
            partID: line.partID,
            quantity: line.quantity,
            unitPrice: line.part.unitPrice
        });
        await updateData("inventory", {
            conditions: { storeID, partID: line.partID },
            updates: { quantity: stock.quantity - line.quantity }
        });
    }

    await insertRecord("payment", {
        orderID,
        amount: total,
        paymentMethod,
        paymentStatus: "Completed",
        paymentDate: createdAt
    });

    return orderID;
}

function Cart({ selectedStore, user, cart, setCart }) {
    const [parts, setParts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [cardType, setCardType] = useState(CARD_TYPES[0]);
    const [cardNumber, setCardNumber] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [placing, setPlacing] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [placedOrderID, setPlacedOrderID] = useState(null);

    useEffect(() => {
        let isCurrent = true;

        Promise.all([getRecords("part"), getRecords("inventory")])
            .then(([partRecords, inventoryRecords]) => {
                if (isCurrent) {
                    setParts(partRecords);
                    setInventory(inventoryRecords);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load your cart.");
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

    if (placedOrderID !== null) {
        return (
            <div className="card cart-done">
                <h1>Order #{placedOrderID} placed</h1>
            </div>
        );
    }

    if (!user || user.role !== "customer") {
        return (
            <p>
                <Link to="/login">Log in</Link> as a customer to see your cart.
            </p>
        );
    }

    if (loading) {
        return <p className="muted">Loading...</p>;
    }

    if (loadError) {
        return <p className="message message-error">{loadError}</p>;
    }

    const lines = buildLines(cart, parts, inventory, selectedStore);
    if (lines.length === 0) {
        return (
            <div className="card cart-done">
                <p>Your cart is empty.</p>
            </div>
        );
    }

    const total = lines.reduce((sum, line) => sum + line.quantity * line.part.unitPrice, 0);
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const hasQuantityProblem = lines.some(
        (line) => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > line.available
    );
    const cardDigits = cardNumber.replace(/[\s-]/g, "");

    function setQuantity(partID, quantity) {
        setCart(cart.map((item) => (item.partID === partID ? { ...item, quantity } : item)));
    }

    function removeItem(partID) {
        setCart(cart.filter((item) => item.partID !== partID));
    }

    async function handleCheckout(event) {
        event.preventDefault();
        setOrderError("");

        if (!isValidCardNumber(cardDigits)) {
            setOrderError("Invalid card number.");
            return;
        }

        setPlacing(true);
        try {
            const orderID = await placeOrder({
                lines,
                storeID: selectedStore,
                customerID: user.customerID,
                paymentMethod: `${cardType} ending ${cardDigits.slice(-4)}`,
                total: Number(total.toFixed(2))
            });
            setCart([]);
            setPlacedOrderID(orderID);
        } catch (error) {
            setOrderError(error.message || "Order failed.");
        } finally {
            setPlacing(false);
        }
    }

    return (
        <form className="cart" onSubmit={handleCheckout}>
            <div className="cart-main">
                <section className="card" aria-label="Items in cart">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th className="number">Price</th>
                                    <th>Quantity</th>
                                    <th className="number">Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line) => (
                                    <tr key={line.partID}>
                                        <td>
                                            {line.part.partName}
                                            {line.quantity > line.available && (
                                                <div className="cart-warning">Only {line.available} available.</div>
                                            )}
                                        </td>
                                        <td className="number">{formatPrice(line.part.unitPrice)}</td>
                                        <td>
                                            <input
                                                className="cart-quantity"
                                                type="number"
                                                min="1"
                                                max={line.available}
                                                value={line.quantity}
                                                aria-label={`Quantity of ${line.part.partName}`}
                                                onChange={(event) => setQuantity(line.partID, Number(event.target.value))}
                                            />
                                        </td>
                                        <td className="number">{formatPrice(line.quantity * line.part.unitPrice)}</td>
                                        <td>
                                            <button type="button" className="button" onClick={() => removeItem(line.partID)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="card cart-payment" aria-labelledby="cart-payment-title">
                    <h2 id="cart-payment-title">Payment</h2>
                    <div className="cart-row">
                        <div className="field">
                            <label htmlFor="cart-card-type">Card type</label>
                            <select id="cart-card-type" value={cardType} onChange={(event) => setCardType(event.target.value)}>
                                {CARD_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field cart-card-number">
                            <label htmlFor="cart-card-number">Card number</label>
                            <input
                                id="cart-card-number"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                value={cardNumber}
                                onChange={(event) => setCardNumber(event.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="cart-billing">Billing address</label>
                        <input
                            id="cart-billing"
                            autoComplete="street-address"
                            value={billingAddress}
                            onChange={(event) => setBillingAddress(event.target.value)}
                            required
                        />
                    </div>
                </section>
            </div>

            <aside className="card cart-summary" aria-labelledby="cart-summary-title">
                <h2 id="cart-summary-title">Summary</h2>
                <div className="cart-summary-row">
                    <span className="muted">Items</span>
                    <span>{itemCount}</span>
                </div>
                <div className="cart-summary-row cart-total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>
                {orderError && (
                    <p className="message message-error" role="alert">
                        {orderError}
                    </p>
                )}
                <button type="submit" className="button button-primary" disabled={placing || hasQuantityProblem}>
                    {placing ? "Placing order..." : "Place order"}
                </button>
            </aside>
        </form>
    );
}

export default Cart;
