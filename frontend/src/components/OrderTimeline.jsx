import { formatStatusLabel, statusSteps } from "../utils/formatters";

export default function OrderTimeline({ order }) {
  const { status, paymentStatus, paymentMethod } = order;
  const activeIndex = status === "cancelled" ? -1 : statusSteps.indexOf(status);
  
  // Calculate progress percentage
  const progressWidth = activeIndex >= 0 
    ? `${(activeIndex / (statusSteps.length - 1)) * 100}%` 
    : '0%';

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <div className="timeline">
        <div className="timeline__progress" style={{ width: progressWidth }}></div>
        {statusSteps.map((step, index) => {
          const isComplete = activeIndex > index;
          const isCurrent = step === status;
          const isDone = activeIndex >= index;

          return (
            <div
              key={step}
              className={`timeline__step ${isDone ? "timeline__step--done" : ""} ${
                isCurrent ? "timeline__step--current" : ""
              }`}
            >
              <div className="timeline__dot">
                {isComplete && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', zIndex: 3 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <span className="timeline__label">{formatStatusLabel(step)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {status === "cancelled" && <span className="badge badge--danger" style={{ padding: '0.5rem 1.5rem' }}>Order Cancelled</span>}
        {status === "delivered" && (
          <span className="badge badge--success" style={{ padding: '0.5rem 1.5rem', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {paymentMethod === "cod"
              ? paymentStatus === "collected"
                ? "Payment Collected"
                : "Awaiting COD collection"
              : paymentStatus === "paid"
                ? "Blockchain Payment Verified"
                : "Awaiting Razorpay confirmation"}
          </span>
        )}
      </div>
    </div>
  );
}
