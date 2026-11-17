
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import {
  Home,
  StoreSelection,
  CustomerLogin,
  CustomerRegister,
  PartsCatalog,
  Cart,
  Payment,
  OrderHistory,
  EmployeeLogin,
  EmployeeDashboard,
  Inventory,
  ManageOrders,
  SupplierLogin,
  SupplierDashboard,
  SupplierOrders
} from "./Pages/Pages.jsx";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link> |{" "}
      <Link to="/stores">Select Store</Link> |{" "}
      <Link to="/customer/login">Customer Login</Link> |{" "}
      <Link to="/customer/register">Register</Link> |{" "}
      <Link to="/parts">Parts</Link> |{" "}
      <Link to="/cart">Cart</Link> |{" "}
      <Link to="/payment">Payment</Link> |{" "}
      <Link to="/orders">Order History</Link> |{" "}
      <Link to="/employee/login">Employee Login</Link> |{" "}
      <Link to="/employee/dashboard">Employee Dashboard</Link> |{" "}
      <Link to="/employee/inventory">Inventory</Link> |{" "}
      <Link to="/employee/orders">Manage Orders</Link> |{" "}
      <Link to="/supplier/login">Supplier Login</Link> |{" "}
      <Link to="/supplier/dashboard">Supplier Dashboard</Link> |{" "}
      <Link to="/supplier/orders">Supplier Orders</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<StoreSelection />} />

          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/parts" element={<PartsCatalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/orders" element={<OrderHistory />} />

          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/inventory" element={<Inventory />} />
          <Route path="/employee/orders" element={<ManageOrders />} />

          <Route path="/supplier/login" element={<SupplierLogin />} />
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
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