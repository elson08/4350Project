import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login.jsx";
import PartsCatalog from "./Pages/customer/PartsCatalog.jsx";
import Cart from "./Pages/customer/Cart.jsx";
import PaymentOrderHistory from "./Pages/customer/PaymentOrderHistory.jsx";
import PageLayout from "./components/PageLayout.jsx";
import { useSavedState } from "./useSavedState.js";
import "./App.css";

import {
    CustomerRegister,
    EmployeeRegister,
    Inventory,
    ManageOrders,
    Suppliers
} from "./Pages/Pages.jsx";

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

                    <Route path="/stores" element={<Navigate to="/login" replace />} />
                    <Route
                        path="/login"
                        element={
                            <Login selectedStore={selectedStore} setSelectedStore={setSelectedStore} setUser={setUser} />
                        }
                    />

                    {/* Registration */}
                    <Route path="/register/customer" element={<CustomerRegister selectedStore={selectedStore} />} />
                    <Route path="/register/employee" element={<EmployeeRegister selectedStore={selectedStore} />} />

                    {/* Customer Pages */}
                    <Route
                        path="/customer/parts"
                        element={<PartsCatalog selectedStore={selectedStore} cart={cart} setCart={setCart} />}
                    />
                    <Route
                        path="/customer/cart"
                        element={<Cart selectedStore={selectedStore} user={user} cart={cart} setCart={setCart} />}
                    />
                    <Route path="/customer/orders" element={<PaymentOrderHistory user={user} />} />

                    {/* Employee Pages */}
                    <Route
                        path="/employee/inventory"
                        element={<Inventory selectedStore={selectedStore} />}
                    />
                    <Route
                        path="/employee/orders"
                        element={<ManageOrders selectedStore={selectedStore} />}
                    />
                    <Route
                        path="/employee/suppliers"
                        element={<Suppliers selectedStore={selectedStore} />}
                    />
                    <Route
                        path="/register/customer"
                        element={<CustomerRegister />}
                    />

                    <Route
                        path="/register/employee"
                        element={<EmployeeRegister selectedStore={selectedStore} />}
                    />
                </Routes>
            </PageLayout>
        </BrowserRouter>
    );
}

export default App;


// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App