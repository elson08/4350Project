import { useEffect, useState } from "react";

import { getRecords } from "../../services/api.js";

import "./Reports.css";

const PERIODS = [
    { value: "daily", label: "Daily", heading: "Day" },
    { value: "weekly", label: "Weekly", heading: "Week of" },
    { value: "monthly", label: "Monthly", heading: "Month" }
];
const NOT_SALES = ["cancelled", "returned"];
const LOW_STOCK = 5;

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function formatDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(text) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text || "");
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

function periodKey(date, period) {
    if (period === "monthly") {
        return formatDate(date).slice(0, 7);
    }

    if (period === "weekly") {
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        return formatDate(monday);
    }

    return formatDate(date);
}

function buildSales(orders, items, period) {
    const rows = new Map();

    for (const order of orders) {
        const date = parseDate(order.createdAt);
        if (!date || NOT_SALES.includes(order.status)) {
            continue;
        }

        const key = periodKey(date, period);
        const row = rows.get(key) || { key, orders: 0, itemsSold: 0, revenue: 0 };
        const orderItems = items.filter((item) => item.orderID === order.orderID);

        row.orders += 1;
        row.itemsSold += orderItems.reduce((sum, item) => sum + item.quantity, 0);
        row.revenue += orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        rows.set(key, row);
    }

    return [...rows.values()].sort((first, second) => second.key.localeCompare(first.key));
}

function buildLowStock(parts, inventory) {
    return parts
        .map((part) => {
            const stock = inventory.find((row) => row.partID === part.partID);
            return { ...part, quantity: stock ? stock.quantity : 0 };
        })
        .filter((part) => part.quantity < LOW_STOCK)
        .sort((first, second) => first.quantity - second.quantity);
}

function buildEmployeeCounts(stores, employees) {
    return stores.map((store) => ({
        ...store,
        employeeCount: employees.filter((employee) => employee.storeID === store.storeID).length
    }));
}

async function loadReportData(storeID) {
    const [orders, items, parts, inventory, stores, employees] = await Promise.all([
        getRecords("order", { storeID }),
        getRecords("orderItem"),
        getRecords("part"),
        getRecords("inventory", { storeID }),
        getRecords("store"),
        getRecords("employee")
    ]);

    return { orders, items, parts, inventory, stores, employees };
}

function Reports({ selectedStore }) {
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [period, setPeriod] = useState(PERIODS[0].value);

    useEffect(() => {
        let isCurrent = true;

        loadReportData(selectedStore)
            .then((loaded) => {
                if (isCurrent) {
                    setData(loaded);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load reports.");
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [selectedStore]);

    if (loadError) {
        return <p className="message message-error">{loadError}</p>;
    }

    if (!data) {
        return <p className="muted">Loading...</p>;
    }

    const periodInfo = PERIODS.find((option) => option.value === period);
    const sales = buildSales(data.orders, data.items, period);
    const lowStock = buildLowStock(data.parts, data.inventory);
    const employeeCounts = buildEmployeeCounts(data.stores, data.employees);

    return (
        <div className="reports">
            <section className="card" aria-labelledby="reports-sales-title">
                <div className="reports-header">
                    <h2 id="reports-sales-title">Sales</h2>
                    <div className="field">
                        <label htmlFor="reports-period">Period</label>
                        <select id="reports-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
                            {PERIODS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {sales.length === 0 ? (
                    <p className="reports-empty">No sales yet.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>{periodInfo.heading}</th>
                                    <th className="number">Orders</th>
                                    <th className="number">Items sold</th>
                                    <th className="number">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.key}</td>
                                        <td className="number">{row.orders}</td>
                                        <td className="number">{row.itemsSold}</td>
                                        <td className="number">{formatPrice(row.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <div className="reports-columns">
                <section className="card reports-column" aria-labelledby="reports-stock-title">
                    <h2 id="reports-stock-title" className="reports-title">
                        Low stock
                    </h2>
                    {lowStock.length === 0 ? (
                        <p className="reports-empty">No parts below {LOW_STOCK}.</p>
                    ) : (
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Part #</th>
                                        <th>Name</th>
                                        <th className="number">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStock.map((part) => (
                                        <tr key={part.partID}>
                                            <td>{part.partID}</td>
                                            <td>{part.partName}</td>
                                            <td className="number">{part.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="card reports-column" aria-labelledby="reports-employees-title">
                    <h2 id="reports-employees-title" className="reports-title">
                        Employees per store
                    </h2>
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Store</th>
                                    <th className="number">Employees</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeCounts.map((store) => (
                                    <tr key={store.storeID}>
                                        <td>{store.storeName}</td>
                                        <td className="number">{store.employeeCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Reports;
