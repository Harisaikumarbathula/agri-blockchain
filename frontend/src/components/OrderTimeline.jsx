import { formatStatusLabel, statusSteps } from "../utils/formatters";

export default function OrderTimeline({ status, paymentStatus, paymentMethod }) {
  const activeIndex = status === "cancelled" ? -1 : statusSteps.indexOf(status);

  return (
    <div className="timeline">
      {statusSteps.map((step, index) => {
        const isComplete = activeIndex >= index;
        const isCurrent = step === status;

        return (
          <div
            key={step}
            className={`timeline__step ${isComplete ? "timeline__step--done" : ""} ${
              isCurrent ? "timeline__step--current" : ""
            }`}
          >
            <span className="timeline__dot" />
            <span className="timeline__label">{formatStatusLabel(step)}</span>
          </div>
        );
      })}

      {status === "cancelled" && <div className="status-badge status-badge--cancelled">Cancelled</div>}
      {status === "delivered" && (
        <div className="status-badge status-badge--delivered">
          {paymentMethod === "cod"
            ? paymentStatus === "collected"
              ? "COD collected"
              : "Awaiting COD collection"
            : paymentStatus === "paid"
              ? "UPI paid"
              : "Awaiting UPI settlement"}
        </div>
      )}
    </div>
  );
}
