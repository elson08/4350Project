import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

import { getRecords } from "../services/api.js";

import "./Login.css";

async function findAccount(username, accountType) {
    const accounts = await getRecords("userAccount", { username });
    if (!accounts || accounts.length === 0) {
        throw new Error("Account not found.");
    }

    const account = accounts[0];
    if (account.accountRole.toLowerCase() !== accountType) {
        throw new Error("Wrong account type.");
    }

    return account;
}

async function checkProfile(account, accountType, storeID) {
    if (accountType === "customer") {
        const customers = await getRecords("customer", { customerID: account.customerID });
        if (!customers || customers.length === 0) {
            throw new Error("Account not found.");
        }

        return;
    }

    const employees = await getRecords("employee", { employeeID: account.employeeID });
    if (!employees || employees.length === 0) {
        throw new Error("Account not found.");
    }

    if (Number(employees[0].storeID) !== storeID) {
        throw new Error("You are not assigned to this store.");
    }
}

function Login({ selectedStore, setSelectedStore }) {
    const [stores, setStores] = useState([]);
    const [storesError, setStoresError] = useState("");
    const [accountType, setAccountType] = useState("customer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        let isCurrent = true;

        getRecords("store")
            .then((storeRecords) => {
                if (isCurrent) {
                    setStores(storeRecords);
                }
            })
            .catch((loadError) => {
                if (isCurrent) {
                    setStoresError(loadError.message);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const storeID = selectedStore ?? stores[0]?.storeID ?? null;
    const isCustomer = accountType === "customer";

    async function handleLogin(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const account = await findAccount(email.trim(), accountType);

            const passwordMatches = await bcrypt.compare(password, account.passwordHash);
            if (!passwordMatches) {
                throw new Error("Incorrect email or password.");
            }

            await checkProfile(account, accountType, storeID);

            setSelectedStore(storeID);
            navigate(isCustomer ? "/customer/parts" : "/employee/inventory");
        } catch (loginError) {
            setError(loginError.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login">
            <form className="login-card" onSubmit={handleLogin}>
                <h1>Log in</h1>

                <div className="login-field">
                    <label htmlFor="login-store">Store</label>
                    <select
                        id="login-store"
                        value={storeID ?? ""}
                        onChange={(event) => setSelectedStore(Number(event.target.value))}
                        disabled={stores.length === 0}
                        required
                    >
                        {stores.length === 0 && (
                            <option value="">{storesError ? "No stores available" : "Loading..."}</option>
                        )}
                        {stores.map((store) => (
                            <option key={store.storeID} value={store.storeID}>
                                {store.storeName} ({store.address})
                            </option>
                        ))}
                    </select>
                    {storesError && <p className="login-error">Couldn't load stores.</p>}
                </div>

                <div className="login-field">
                    <label htmlFor="login-type">Account type</label>
                    <select id="login-type" value={accountType} onChange={(event) => setAccountType(event.target.value)}>
                        <option value="customer">Customer</option>
                        <option value="employee">Employee</option>
                    </select>
                </div>

                <div className="login-field">
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" className="login-submit" disabled={loading || storeID === null}>
                    {loading ? "Logging in..." : "Log in"}
                </button>

                {isCustomer ? (
                    <p className="login-footer">
                        New customer? <Link to="/register/customer">Create an account</Link>
                    </p>
                ) : (
                    <p className="login-footer">
                        New employee?{" "}
                        <Link to="/register/employee" onClick={() => setSelectedStore(storeID)}>
                            Register
                        </Link>
                    </p>
                )}
            </form>
        </div>
    );
}

export default Login;
