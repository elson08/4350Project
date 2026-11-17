import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import "./App.css";

import {
    StoreSelection,
    Login,
    CustomerRegister,
    EmployeeRegister,
    PartsCatalog,
    Cart,
    PaymentOrderHistory,
    Inventory,
    ManageOrders,
    Suppliers
} from "./Pages/Pages.jsx";

function App() {
    const [selectedStore, setSelectedStore] = useState(null);

    return (
        <BrowserRouter>
            <main>
                <Routes>
                    {/* Main Home Page */}
                    <Route path="/" element={<Home />} />

                    {/* Store Selection and Shared Login */}
                    <Route
                        path="/stores"
                        element={
                            <StoreSelection
                                setSelectedStore={setSelectedStore}
                            />
                        }
                    />

                    <Route
                        path="/login"
                        element={
                            <Login selectedStore={selectedStore} />
                        }
                    />

                    {/* Registration */}
                    <Route path="/register/customer" element={<CustomerRegister selectedStore={selectedStore} />} />
                    <Route path="/register/employee" element={<EmployeeRegister selectedStore={selectedStore} />} />

                    {/* Customer Pages */}
                    <Route
                        path="/customer/parts"
                        element={<PartsCatalog selectedStore={selectedStore} />}
                    />
                    <Route path="/customer/cart" element={<Cart />} />
                    <Route path="/customer/orders" element={<PaymentOrderHistory />} />

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
                        path="/stores"
                        element={<StoreSelection setSelectedStore={setSelectedStore} />}
                    />

                    <Route
                        path="/login"
                        element={<Login selectedStore={selectedStore} />}
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
            </main>
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