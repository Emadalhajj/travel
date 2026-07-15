import CairoRegular from "./Cairo-Regular-normal";

export const loadCairoFont = (doc) => {
  doc.addFileToVFS("Cairo-Regular.ttf", CairoRegular);
  doc.addFont("Cairo-Regular.ttf", "Cairo", "normal");
};
