
export default function  generateBreadcrumb  (currentPath, navItems, lang){
if (!currentPath || !navItems?.length) return null;

  const segments = currentPath.split('/').filter(Boolean);
  const items = [];

  let pathSoFar = '';

  segments.forEach((segment, index) => {
    pathSoFar += '/' + segment;

    const matched = navItems.find(item => 
      item.path === pathSoFar || item.path === '/' + segment
    );

    if (matched) {
      const label = lang === "ar" 
        ? (matched.labelAr || matched.label) 
        : matched.label;

      const isLast = index === segments.length - 1;

      items.push(
        <span key={pathSoFar}>
          {isLast ? (
            <span className="text-gray-800 font-medium">{label}</span>
          ) : (
            <span>{label}</span>
          )}
          {!isLast && <span className="mx-2 text-gray-400">/</span>}
        </span>
      );
    }
  });

  return items;
};