/*التحقق من الدفع
وظيفة: التحقق مما إذا كانت حالة الدفع تشير إلى نجاح الدفع.
المدخلات: حالة الدفع (paymentStatus) كنص.
المخرجات: قيمة منطقية (true إذا كانت حالة الدفع "paid"، false خلاف ذلك).


*/
export const isPaymentSuccess = (
  paymentStatus,
) => {
  return (
    paymentStatus === "paid"
  );
};