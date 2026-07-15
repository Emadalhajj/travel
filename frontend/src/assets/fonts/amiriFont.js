import AmiriRegular from './Amiri-Regular-normal';

export const loadAmiriFont = (doc) => {
  doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri", "normal");
};