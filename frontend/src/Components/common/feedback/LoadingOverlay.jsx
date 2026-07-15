import { Spinner } from "react-bootstrap";

export default function LoadingOverlay({ show = false, text }) {
  if (!show) return null;

  return (
    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3">
      <div className="text-center">
        <Spinner animation="border" />
        {text && <div className="mt-2 fw-semibold">{text}</div>}
      </div>
    </div>
  );
}
