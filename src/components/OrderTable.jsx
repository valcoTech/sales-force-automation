// import { Fragment, useState } from "react";
// import StatusBadge from "./StatusBadge";

// export default function OrderTable({
//   orders = [],
//   showSalesman = false,
//   showItems = false,
//   showClaimStatus = false,
//   onStatusChange,
//   onClaimStatusChange,
// }) {
//   const [openOrderId, setOpenOrderId] = useState(null);

//   const colSpan =
//     5 +
//     (showSalesman ? 1 : 0) +
//     (showClaimStatus ? 1 : 0) +
//     (onStatusChange ? 1 : 0) +
//     (onClaimStatusChange ? 1 : 0);

//   const toggleOrder = (orderId) => {
//     setOpenOrderId((prev) => (prev === orderId ? null : orderId));
//   };

//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//         <h3 className="text-xl font-bold text-slate-900">Recent Invoices</h3>
//         <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
//           {orders.length} Items
//         </span>
//       </div>

//       <div className="hidden overflow-x-auto lg:block">
//         <table className="w-full min-w-[1100px] text-left text-sm">
//           <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//             <tr>
//               <th className="px-5 py-4">Invoice</th>
//               <th className="px-5 py-4">Tanggal</th>
//               <th className="px-5 py-4">Customer</th>
//               {showSalesman && <th className="px-5 py-4">Salesman</th>}
//               <th className="px-5 py-4 text-right">Total</th>
//               <th className="px-5 py-4">Status Order</th>
//               {showClaimStatus && <th className="px-5 py-4">Status Claim</th>}
//               {onStatusChange && <th className="px-5 py-4">Update Order</th>}
//               {onClaimStatusChange && (
//                 <th className="px-5 py-4">Update Claim</th>
//               )}
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-slate-200">
//             {orders.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={colSpan}
//                   className="px-5 py-10 text-center text-slate-400"
//                 >
//                   Belum ada order
//                 </td>
//               </tr>
//             ) : (
//               orders.map((order) => {
//                 const isOpen = openOrderId === order.id;
//                 const items = order.transaction_items || [];
//                 const salesmanName =
//                   order.salesman?.full_name ||
//                   order.users?.full_name ||
//                   order.salesman_id ||
//                   "-";

//                 return (
//                   <Fragment key={order.id}>
//                     <tr className="hover:bg-slate-50">
//                       <td className="px-5 py-4">
//                         {showItems ? (
//                           <button
//                             type="button"
//                             onClick={() => toggleOrder(order.id)}
//                             className="inline-flex items-center gap-2 font-extrabold text-blue-700 hover:underline"
//                           >
//                             <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 text-xs font-bold">
//                               {isOpen ? "v" : ">"}
//                             </span>
//                             <span>
//                               {order.invoice_number || `INV-${order.id}`}
//                             </span>
//                           </button>
//                         ) : (
//                           <span className="font-bold text-blue-700">
//                             {order.invoice_number || `INV-${order.id}`}
//                           </span>
//                         )}
//                       </td>

//                       <td className="px-5 py-4">{order.date || "-"}</td>

//                       <td className="px-5 py-4 font-bold text-slate-900">
//                         {order.customers?.customer_name || "-"}
//                       </td>

//                       {showSalesman && (
//                         <td className="px-5 py-4">
//                           <div className="flex items-center gap-2">
//                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
//                               {String(salesmanName).charAt(0).toUpperCase()}
//                             </div>
//                             <span>{salesmanName}</span>
//                           </div>
//                         </td>
//                       )}

//                       <td className="px-5 py-4 text-right font-bold">
//                         Rp{" "}
//                         {Number(order.total_amount || 0).toLocaleString(
//                           "id-ID",
//                         )}
//                       </td>

//                       <td className="px-5 py-4">
//                         <StatusBadge status={order.status} />
//                       </td>

//                       {showClaimStatus && (
//                         <td className="px-5 py-4">
//                           <StatusBadge
//                             status={order.claim_status || "pending"}
//                           />
//                         </td>
//                       )}

//                       {onStatusChange && (
//                         <td className="px-5 py-4">
//                           <select
//                             value={order.status || "pending"}
//                             onChange={(e) =>
//                               onStatusChange(order.id, e.target.value)
//                             }
//                             className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           >
//                             <option value="pending">Pending</option>
//                             <option value="proses">Proses</option>
//                             <option value="done">Done</option>
//                           </select>
//                         </td>
//                       )}

//                       {onClaimStatusChange && (
//                         <td className="px-5 py-4">
//                           <select
//                             value={order.claim_status || "pending"}
//                             onChange={(e) =>
//                               onClaimStatusChange(order.id, e.target.value)
//                             }
//                             className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           >
//                             <option value="pending">Pending</option>
//                             <option value="proses">Proses</option>
//                             <option value="done">Done</option>
//                           </select>
//                         </td>
//                       )}
//                     </tr>

//                     {showItems && isOpen && (
//                       <tr>
//                         <td colSpan={colSpan} className="bg-slate-50 px-5 py-5">
//                           <OrderItems items={items} />
//                         </td>
//                       </tr>
//                     )}
//                   </Fragment>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="space-y-4 p-4 lg:hidden">
//         {orders.length === 0 ? (
//           <p className="py-8 text-center text-sm text-slate-400">
//             Belum ada order
//           </p>
//         ) : (
//           orders.map((order) => {
//             const isOpen = openOrderId === order.id;
//             const items = order.transaction_items || [];
//             const salesmanName =
//               order.salesman?.full_name ||
//               order.users?.full_name ||
//               order.salesman_id ||
//               "-";

//             return (
//               <div
//                 key={order.id}
//                 className={`rounded-xl border bg-white ${
//                   isOpen ? "border-blue-700" : "border-slate-200"
//                 }`}
//               >
//                 <button
//                   type="button"
//                   onClick={() => toggleOrder(order.id)}
//                   className="flex w-full items-start justify-between gap-3 px-5 py-5 text-left"
//                 >
//                   <div>
//                     <div className="flex flex-wrap items-center gap-2">
//                       <p className="text-xl font-extrabold text-slate-950">
//                         {order.invoice_number || `INV-${order.id}`}
//                       </p>
//                       <StatusBadge status={order.status} />
//                     </div>

//                     <p className="mt-3 text-sm font-semibold uppercase leading-6 text-slate-700">
//                       {order.customers?.customer_name || "-"}
//                     </p>

//                     {showSalesman && (
//                       <p className="mt-1 text-sm text-slate-500">
//                         Salesman: {salesmanName}
//                       </p>
//                     )}
//                   </div>

//                   <span className="text-xl font-bold text-blue-700">
//                     {isOpen ? "v" : ">"}
//                   </span>
//                 </button>

//                 <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-5 py-4">
//                   <div>
//                     <p className="text-xs font-bold text-slate-500">Tanggal</p>
//                     <p className="mt-1 text-lg font-semibold">
//                       {order.date || "-"}
//                     </p>
//                   </div>

//                   <div className="text-right">
//                     <p className="text-xs font-bold text-slate-500">
//                       Total Amount
//                     </p>
//                     <p className="mt-1 text-xl font-extrabold text-blue-700">
//                       Rp{" "}
//                       {Number(order.total_amount || 0).toLocaleString("id-ID")}
//                     </p>
//                   </div>
//                 </div>

//                 {showClaimStatus && (
//                   <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
//                     <span className="text-xs font-bold text-slate-500">
//                       Status Claim
//                     </span>
//                     <StatusBadge status={order.claim_status || "pending"} />
//                   </div>
//                 )}

//                 {onStatusChange && (
//                   <div className="border-t border-slate-200 px-5 py-3">
//                     <select
//                       value={order.status || "pending"}
//                       onChange={(e) => onStatusChange(order.id, e.target.value)}
//                       className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="pending">Pending</option>
//                       <option value="proses">Proses</option>
//                       <option value="done">Done</option>
//                     </select>
//                   </div>
//                 )}

//                 {onClaimStatusChange && (
//                   <div className="border-t border-slate-200 px-5 py-3">
//                     <select
//                       value={order.claim_status || "pending"}
//                       onChange={(e) =>
//                         onClaimStatusChange(order.id, e.target.value)
//                       }
//                       className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="pending">Pending</option>
//                       <option value="proses">Proses</option>
//                       <option value="done">Done</option>
//                     </select>
//                   </div>
//                 )}

//                 {isOpen && showItems && (
//                   <div className="border-t border-slate-200 px-5 py-4">
//                     <OrderItems items={items} compact />
//                   </div>
//                 )}
//               </div>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }

// function OrderItems({ items = [], compact = false }) {
//   if (items.length === 0) {
//     return (
//       <p className="py-6 text-center text-sm text-slate-400">
//         Item order tidak ditemukan
//       </p>
//     );
//   }

//   return (
//     <div>
//       <div className="mb-4 flex items-center gap-2">
//         <span className="text-base font-bold text-slate-700">#</span>
//         <p className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
//           Order Details
//         </p>
//       </div>

//       <div className={compact ? "space-y-4" : "overflow-x-auto"}>
//         {compact ? (
//           items.map((item) => (
//             <div
//               key={item.id}
//               className="border-b border-slate-200 pb-4 last:border-0"
//             >
//               <div className="grid grid-cols-[1fr_auto_auto] gap-3">
//                 <div>
//                   <p className="font-semibold text-slate-950">
//                     {item.products?.product_name || item.product_id || "-"}
//                   </p>
//                   <p className="text-sm text-slate-500">{item.product_id}</p>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Price: Rp{" "}
//                     {Number(item.price_at_time || 0).toLocaleString("id-ID")}
//                     <span className="ml-3 text-red-600">
//                       Disc: {Number(item.discount || 0).toLocaleString("id-ID")}
//                       %
//                     </span>
//                   </p>
//                 </div>

//                 <p className="text-center font-semibold">{item.qty || 0}</p>
//                 <p className="text-right font-bold text-blue-700">
//                   Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
//                 </p>
//               </div>
//             </div>
//           ))
//         ) : (
//           <table className="w-full min-w-[800px] text-sm">
//             <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
//               <tr>
//                 <th className="px-4 py-3 text-left">Product Details</th>
//                 <th className="px-4 py-3 text-left">Qty</th>
//                 <th className="px-4 py-3 text-left">Harga</th>
//                 <th className="px-4 py-3 text-left">Disc</th>
//                 <th className="px-4 py-3 text-right">Subtotal</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-200">
//               {items.map((item) => (
//                 <tr key={item.id}>
//                   <td className="px-4 py-3">
//                     <p className="font-bold text-slate-900">
//                       {item.products?.product_name || "-"}
//                     </p>
//                     <p className="text-xs text-slate-500">{item.product_id}</p>
//                   </td>

//                   <td className="px-4 py-3">{item.qty || 0}</td>

//                   <td className="px-4 py-3">
//                     Rp {Number(item.price_at_time || 0).toLocaleString("id-ID")}
//                   </td>

//                   <td className="px-4 py-3 text-red-600">
//                     {Number(item.discount || 0).toLocaleString("id-ID")}%
//                   </td>

//                   <td className="px-4 py-3 text-right font-bold">
//                     Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }

//** new code */

// import { Fragment, useState } from "react";
// import StatusBadge from "./StatusBadge";

// export default function OrderTable({
//   orders = [],
//   showSalesman = false,
//   showItems = false,
//   showClaimStatus = false,
//   onStatusChange,
//   onClaimStatusChange,
// }) {
//   const [openOrderId, setOpenOrderId] = useState(null);

//   const colSpan =
//     5 +
//     (showSalesman ? 1 : 0) +
//     (showClaimStatus ? 1 : 0) +
//     (onStatusChange ? 1 : 0) +
//     (onClaimStatusChange ? 1 : 0);

//   const toggleOrder = (orderId) => {
//     setOpenOrderId((prev) => (prev === orderId ? null : orderId));
//   };

//   return (
//     <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
//       <table className="w-full min-w-[1000px] text-left text-sm">
//         <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
//           <tr>
//             <th className="px-4 py-3">Invoice</th>
//             <th className="px-4 py-3">Tanggal</th>
//             <th className="px-4 py-3">Customer</th>
//             {showSalesman && <th className="px-4 py-3">Salesman</th>}
//             <th className="px-4 py-3">Total</th>
//             <th className="px-4 py-3">Status Order</th>
//             {showClaimStatus && <th className="px-4 py-3">Status Claim</th>}
//             {onStatusChange && <th className="px-4 py-3">Update Order</th>}
//             {onClaimStatusChange && <th className="px-4 py-3">Update Claim</th>}
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-gray-100">
//           {orders.length === 0 ? (
//             <tr>
//               <td
//                 colSpan={colSpan}
//                 className="px-4 py-8 text-center text-gray-400"
//               >
//                 Belum ada order
//               </td>
//             </tr>
//           ) : (
//             orders.map((order) => {
//               const isOpen = openOrderId === order.id;
//               const items = order.transaction_items || [];
//               const salesmanName =
//                 order.salesman?.full_name ||
//                 order.users?.full_name ||
//                 order.salesman_id ||
//                 "-";

//               return (
//                 <Fragment key={order.id}>
//                   <tr className="hover:bg-gray-50">
//                     <td className="px-4 py-3 font-medium">
//                       {showItems ? (
//                         <button
//                           type="button"
//                           onClick={() => toggleOrder(order.id)}
//                           className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
//                         >
//                           <span className="text-sm font-bold">
//                             {isOpen ? "v" : ">"}
//                           </span>
//                           <span>
//                             {order.invoice_number || `INV-${order.id}`}
//                           </span>
//                         </button>
//                       ) : (
//                         <span className="font-semibold text-blue-600">
//                           {order.invoice_number || `INV-${order.id}`}
//                         </span>
//                       )}
//                     </td>

//                     <td className="px-4 py-3">{order.date || "-"}</td>

//                     <td className="px-4 py-3 font-medium text-gray-800">
//                       {order.customers?.customer_name || "-"}
//                     </td>

//                     {showSalesman && (
//                       <td className="px-4 py-3">{salesmanName}</td>
//                     )}

//                     <td className="px-4 py-3">
//                       Rp{" "}
//                       {Number(order.total_amount || 0).toLocaleString("id-ID")}
//                     </td>

//                     <td className="px-4 py-3">
//                       <StatusBadge status={order.status} />
//                     </td>

//                     {showClaimStatus && (
//                       <td className="px-4 py-3">
//                         <StatusBadge status={order.claim_status || "pending"} />
//                       </td>
//                     )}

//                     {onStatusChange && (
//                       <td className="px-4 py-3">
//                         <select
//                           value={order.status || "pending"}
//                           onChange={(e) =>
//                             onStatusChange(order.id, e.target.value)
//                           }
//                           className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         >
//                           <option value="pending">Pending</option>
//                           <option value="proses">Proses</option>
//                           <option value="done">Done</option>
//                         </select>
//                       </td>
//                     )}

//                     {onClaimStatusChange && (
//                       <td className="px-4 py-3">
//                         <select
//                           value={order.claim_status || "pending"}
//                           onChange={(e) =>
//                             onClaimStatusChange(order.id, e.target.value)
//                           }
//                           className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         >
//                           <option value="pending">Pending</option>
//                           <option value="proses">Proses</option>
//                           <option value="done">Done</option>
//                         </select>
//                       </td>
//                     )}
//                   </tr>

//                   {showItems && isOpen && (
//                     <tr>
//                       <td colSpan={colSpan} className="bg-gray-50 px-4 py-4">
//                         <div className="rounded-xl border border-gray-200 bg-white">
//                           <div className="border-b border-gray-100 px-4 py-3">
//                             <p className="text-sm font-semibold text-gray-800">
//                               Order Details
//                             </p>
//                           </div>

//                           <div className="overflow-x-auto">
//                             <table className="w-full min-w-[760px] text-sm">
//                               <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
//                                 <tr>
//                                   <th className="px-4 py-3 text-left">
//                                     Product Details
//                                   </th>
//                                   <th className="px-4 py-3 text-left">Qty</th>
//                                   <th className="px-4 py-3 text-left">Harga</th>
//                                   <th className="px-4 py-3 text-left">Disc</th>
//                                   <th className="px-4 py-3 text-right">
//                                     Subtotal
//                                   </th>
//                                 </tr>
//                               </thead>

//                               <tbody className="divide-y divide-gray-100">
//                                 {items.length === 0 ? (
//                                   <tr>
//                                     <td
//                                       colSpan={5}
//                                       className="px-4 py-6 text-center text-gray-400"
//                                     >
//                                       Item order tidak ditemukan
//                                     </td>
//                                   </tr>
//                                 ) : (
//                                   items.map((item) => (
//                                     <tr key={item.id}>
//                                       <td className="px-4 py-3">
//                                         <p className="font-semibold text-gray-800">
//                                           {item.products?.product_name || "-"}
//                                         </p>
//                                         <p className="text-xs text-gray-400">
//                                           {item.product_id}
//                                         </p>
//                                       </td>
//                                       <td className="px-4 py-3">
//                                         {item.qty || 0}
//                                       </td>
//                                       <td className="px-4 py-3">
//                                         Rp{" "}
//                                         {Number(
//                                           item.price_at_time || 0,
//                                         ).toLocaleString("id-ID")}
//                                       </td>
//                                       <td className="px-4 py-3 text-red-500">
//                                         {Number(
//                                           item.discount || 0,
//                                         ).toLocaleString("id-ID")}
//                                         %
//                                       </td>
//                                       <td className="px-4 py-3 text-right font-semibold">
//                                         Rp{" "}
//                                         {Number(
//                                           item.subtotal || 0,
//                                         ).toLocaleString("id-ID")}
//                                       </td>
//                                     </tr>
//                                   ))
//                                 )}
//                               </tbody>
//                             </table>
//                           </div>
//                         </div>
//                       </td>
//                     </tr>
//                   )}
//                 </Fragment>
//               );
//             })
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import { Fragment, useState } from "react";
import StatusBadge from "./StatusBadge";

export default function OrderTable({
  orders = [],
  showSalesman = false,
  showItems = false,
  showClaimStatus = false,
  onStatusChange,
  onClaimStatusChange,
}) {
  const [openOrderId, setOpenOrderId] = useState(null);
  const [rejectDraft, setRejectDraft] = useState({});

  const canUpdateClaim = Boolean(onClaimStatusChange);

  const colSpan =
    5 +
    (showSalesman ? 1 : 0) +
    (showClaimStatus ? 1 : 0) +
    (onStatusChange ? 1 : 0) +
    (canUpdateClaim ? 1 : 0);

  const toggleOrder = (orderId) => {
    setOpenOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleClaimChange = (order, value) => {
    if (!canUpdateClaim) return;

    if (value === "reject") {
      setOpenOrderId(order.id);
      setRejectDraft((prev) => ({
        ...prev,
        [order.id]: order.claim_reject_reason || "",
      }));
      return;
    }

    onClaimStatusChange(order.id, value, "");
  };

  const submitReject = (orderId) => {
    const reason = rejectDraft[orderId] || "";
    if (!canUpdateClaim) return;

    onClaimStatusChange(orderId, "reject", reason);
  };

  const cancelReject = (orderId) => {
    setRejectDraft((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Customer</th>
            {showSalesman && <th className="px-4 py-3">Salesman</th>}
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status Order</th>
            {showClaimStatus && <th className="px-4 py-3">Status Claim</th>}
            {onStatusChange && <th className="px-4 py-3">Update Order</th>}
            {canUpdateClaim && <th className="px-4 py-3">Update Claim</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-gray-400"
              >
                Belum ada order
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const isOpen = openOrderId === order.id;
              const items = order.transaction_items || [];
              const salesmanName =
                order.salesman?.full_name ||
                order.users?.full_name ||
                order.salesman_id ||
                "-";

              const rejectReason = order.claim_reject_reason;
              const isRejectDraftOpen = rejectDraft[order.id] !== undefined;

              return (
                <Fragment key={order.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {showItems ? (
                        <button
                          type="button"
                          onClick={() => toggleOrder(order.id)}
                          className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
                        >
                          <span className="text-sm font-bold">
                            {isOpen ? "v" : ">"}
                          </span>
                          <span>
                            {order.invoice_number || `INV-${order.id}`}
                          </span>
                        </button>
                      ) : (
                        <span className="font-semibold text-blue-600">
                          {order.invoice_number || `INV-${order.id}`}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">{order.date || "-"}</td>

                    <td className="px-4 py-3 font-medium text-gray-800">
                      {order.customers?.customer_name || "-"}
                    </td>

                    {showSalesman && (
                      <td className="px-4 py-3">{salesmanName}</td>
                    )}

                    <td className="px-4 py-3">
                      Rp{" "}
                      {Number(order.total_amount || 0).toLocaleString("id-ID")}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>

                    {showClaimStatus && (
                      <td className="px-4 py-3">
                        <StatusBadge status={order.claim_status || "pending"} />
                      </td>
                    )}

                    {onStatusChange && (
                      <td className="px-4 py-3">
                        <select
                          value={order.status || "pending"}
                          onChange={(e) =>
                            onStatusChange(order.id, e.target.value)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="proses">Proses</option>
                          <option value="done">Done</option>
                          <option value="reject">Reject</option>
                        </select>
                      </td>
                    )}

                    {canUpdateClaim && (
                      <td className="px-4 py-3">
                        <select
                          value={order.claim_status || "pending"}
                          onChange={(e) =>
                            handleClaimChange(order, e.target.value)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="proses">Proses</option>
                          <option value="done">Done</option>
                          <option value="reject">Reject</option>
                        </select>
                      </td>
                    )}
                  </tr>

                  {showItems && isOpen && (
                    <tr>
                      <td colSpan={colSpan} className="bg-gray-50 px-4 py-4">
                        {isRejectDraftOpen && canUpdateClaim && (
                          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <label className="mb-2 block text-sm font-semibold text-red-700">
                              Alasan reject
                            </label>

                            <textarea
                              value={rejectDraft[order.id] || ""}
                              onChange={(e) =>
                                setRejectDraft((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              rows={3}
                              className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                              placeholder="Tulis alasan reject di sini..."
                            />

                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => cancelReject(order.id)}
                                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-white"
                              >
                                Batal
                              </button>

                              <button
                                type="button"
                                onClick={() => submitReject(order.id)}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Simpan Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {order.claim_status === "reject" && rejectReason && (
                          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <span className="font-semibold">
                              Alasan reject:{" "}
                            </span>
                            {rejectReason}
                          </div>
                        )}

                        <div className="rounded-xl border border-gray-200 bg-white">
                          <div className="border-b border-gray-100 px-4 py-3">
                            <p className="text-sm font-semibold text-gray-800">
                              Order Details
                            </p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-sm">
                              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                                <tr>
                                  <th className="px-4 py-3 text-left">
                                    Product Details
                                  </th>
                                  <th className="px-4 py-3 text-left">Qty</th>
                                  <th className="px-4 py-3 text-left">Bonus</th>
                                  <th className="px-4 py-3 text-left">Harga</th>
                                  <th className="px-4 py-3 text-left">Disc</th>
                                  <th className="px-4 py-3 text-right">
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-4 py-6 text-center text-gray-400"
                                    >
                                      Item order tidak ditemukan
                                    </td>
                                  </tr>
                                ) : (
                                  items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-800">
                                          {item.products?.product_name || "-"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {item.product_id}
                                        </p>
                                      </td>

                                      <td className="px-4 py-3">
                                        {item.qty || 0}
                                      </td>

                                      <td className="px-4 py-3">
                                        {item.bonus_qty || 0}
                                      </td>

                                      <td className="px-4 py-3">
                                        Rp{" "}
                                        {Number(
                                          item.price_at_time || 0,
                                        ).toLocaleString("id-ID")}
                                      </td>

                                      <td className="px-4 py-3 text-red-500">
                                        {Number(
                                          item.discount || 0,
                                        ).toLocaleString("id-ID")}
                                        %
                                      </td>

                                      <td className="px-4 py-3 text-right font-semibold">
                                        Rp{" "}
                                        {Number(
                                          item.subtotal || 0,
                                        ).toLocaleString("id-ID")}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
