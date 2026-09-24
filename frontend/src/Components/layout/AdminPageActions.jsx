export default function AdminPageActions({
  children,
  className = "",
}) {
  return (
    <div
      className={[
        "flex w-full flex-wrap items-center gap-2",

        "sm:w-auto",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// export default function AdminPageActions({
//   children,
//   className = "",
// }) {
//   return (
//     <div
//       className={`
//         d-inline-flex flex-nowrap align-items-center gap-2
//         ${className}
//       `}
//     >
//       {children}
//     </div>
//   );
// }
