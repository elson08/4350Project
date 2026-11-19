import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login.jsx";
import PartsCatalog from "./Pages/customer/PartsCatalog.jsx";
import Cart from "./Pages/customer/Cart.jsx";
import PaymentOrderHistory from "./Pages/customer/PaymentOrderHistory.jsx";
import Inventory from "./Pages/employee/Inventory.jsx";
import ManageOrders from "./Pages/employee/ManageOrders.jsx";
import Employees from "./Pages/employee/Employees.jsx";
import Suppliers from "./Pages/employee/Suppliers.jsx";
import Reports from "./Pages/employee/Reports.jsx";
import PageLayout from "./components/PageLayout.jsx";
import RequireRole from "./components/RequireRole.jsx";
import { useSavedState } from "./useSavedState.js";
import "./App.css";
import { CustomerRegister, EmployeeRegister } from "./Pages/Pages.jsx";

function App() {
    const [selectedStore, setSelectedStore] = useSavedState("selectedStore", null);
    const [user, setUser] = useSavedState("user", null);
    const [cart, setCart] = useSavedState("cart", []);

    function logout() {
        setUser(null);
        setCart([]);
    }

    return (
        <BrowserRouter>
            <PageLayout user={user} onLogout={logout}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route
                        path="/login"
                        element={
                            <Login selectedStore={selectedStore} setSelectedStore={setSelectedStore} setUser={setUser} />
                        }
                    />
                    <Route path="/register/customer" element={<CustomerRegister />} />
                    <Route path="/register/employee" element={<EmployeeRegister selectedStore={selectedStore} />} />

                    <Route
                        path="/customer/parts"
                        element={<PartsCatalog selectedStore={selectedStore} cart={cart} setCart={setCart} />}
                    />
                    <Route
                        path="/customer/cart"
                        element={<Cart selectedStore={selectedStore} user={user} cart={cart} setCart={setCart} />}
                    />
                    <Route path="/customer/orders" element={<PaymentOrderHistory user={user} />} />
                    <Route
                        path="/employee/inventory"
                        element={
                            <RequireRole user={user} role="employee">
                                <Inventory selectedStore={selectedStore} />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/employee/orders"
                        element={
                            <RequireRole user={user} role="employee">
                                <ManageOrders selectedStore={selectedStore} />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/employee/suppliers"
                        element={
                            <RequireRole user={user} role="employee">
                                <Suppliers selectedStore={selectedStore} />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/employee/employees"
                        element={
                            <RequireRole user={user} role="employee">
                                <Employees selectedStore={selectedStore} user={user} />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/employee/reports"
                        element={
                            <RequireRole user={user} role="employee">
                                <Reports selectedStore={selectedStore} />
                            </RequireRole>
                        }
                    />
                </Routes>
            </PageLayout>
        </BrowserRouter>
    );
}

export default App;
