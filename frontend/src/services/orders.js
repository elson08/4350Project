import { getRecords, updateData } from "./api.js";

export function timestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return `${date} ${time}`;
}

export async function loadOrders(filters) {
    const [orders, items, payments, parts, stores, customers] = await Promise.all([
        getRecords("order", filters),
        getRecords("orderItem"),
        getRecords("payment"),
        getRecords("part"),
        getRecords("store"),
        getRecords("customer")
    ]);

    return orders
        .map((order) => {
            const orderItems = items
                .filter((item) => item.orderID === order.orderID)
                .map((item) => ({ ...item, part: parts.find((part) => part.partID === item.partID) }));

            return {
                ...order,
                items: orderItems,
                payment: payments.find((payment) => payment.orderID === order.orderID),
                store: stores.find((store) => store.storeID === order.storeID),
                customer: customers.find((customer) => customer.customerID === order.customerID),
                total: orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
            };
        })
        .sort((first, second) => second.orderID - first.orderID);
}

export async function setOrderStatus(order, status) {
    await updateData("order", {
        conditions: { orderID: order.orderID },
        updates: { status, updatedAt: timestamp() }
    });
}

export async function restockAndRefund(order, status) {
    const inventory = await getRecords("inventory", { storeID: order.storeID });

    for (const item of order.items) {
        const stock = inventory.find((row) => row.partID === item.partID);
        await updateData("inventory", {
            conditions: { storeID: order.storeID, partID: item.partID },
            updates: { quantity: (stock ? stock.quantity : 0) + item.quantity }
        });
    }

    await setOrderStatus(order, status);

    if (order.payment) {
        await updateData("payment", {
            conditions: { paymentID: order.payment.paymentID },
            updates: { paymentStatus: "Refunded" }
        });
    }
}
