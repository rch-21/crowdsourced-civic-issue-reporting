import { useEffect, useState } from 'react';
import { addComment, changeStatus, report, submitFeedback, type ReportDetail } from './api';
import { AsyncState } from '../ui/AsyncState';
import { StarRating } from '../ui/StarRating';

export function ReportDetail({ id }: { id: string }) {
  const [item, setItem] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [notice, setNotice] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    report(id).then(setItem).catch(setError).finally(() => setLoading(false));
  }

  useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, [id]);

  async function reopen() {
    try {
      await changeStatus(id, 'REOPENED');
      setNotice('The report was reopened for municipal review.');
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'This report cannot be reopened from its current status.');
    }
  }

  async function confirm() {
    try {
      await changeStatus(id, 'CONFIRMED');
      setNotice('You confirmed the resolution.');
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Confirmation is not available for this status.');
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    await addComment(id, comment);
    setComment('');
    setNotice('Comment saved.');
    load();
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    await submitFeedback(id, rating, feedback);
    setFeedback('');
    setNotice('Feedback recorded.');
    load();
  }

  return (
    <section>
      <p className="eyebrow">CITIZEN REPORT</p>
      <AsyncState loading={loading} error={error} onRetry={load}>
        {item && (
          <>
            <div className="section-heading">
              <h2>{item.address || 'Reported location'}</h2>
              <span className="status-pill">{item.workStatus}</span>
            </div>
            <p>{item.description}</p>
            {item.media?.map((media) => media.metadata?.dataUrl && <img key={media.storageKey} src={media.metadata.dataUrl} alt="Photo of the reported civic problem" style={{ maxWidth: '100%', borderRadius: 10 }} />)}
            <dl className="review-list">
              <div><span>Report</span><strong>{item.id}</strong></div>
              <div><span>Incident</span><strong>{item.incidentId ?? 'Not clustered yet'}</strong></div>
              <div><span>Submitted</span><strong>{new Date(item.reportedAt).toLocaleString()}</strong></div>
              <div><span>Coordinates</span><strong>{item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}</strong></div>
            </dl>
            <div className="form-actions">
              {(item.workStatus === 'RESOLVED' || item.workStatus === 'CONFIRMED') && <button type="button" onClick={reopen}>Reopen report</button>}
              {item.workStatus === 'RESOLVED' && <button type="button" className="primary" onClick={confirm}>Confirm resolution</button>}
            </div>
            {item.resolution && (
              <article className="report-card resolution-card">
                <p className="eyebrow">MUNICIPAL RESOLUTION RESPONSE</p>
                <h3>{item.workStatus === 'CONFIRMED' ? 'Resolution confirmed' : 'Resolution awaiting your approval'}</h3>
                <p>{item.resolution.note || 'The municipality has submitted evidence that this issue was repaired.'}</p>
                {item.resolution.media?.map((media, index) => media.metadata?.dataUrl && <img key={media.storageKey || index} src={media.metadata.dataUrl} alt="Photo showing the resolved civic issue" style={{ maxWidth: '100%', borderRadius: 10 }} />)}
                {item.workStatus === 'RESOLVED' && <p className="muted">Please review the photo and repair details. Confirm only if the problem has actually been resolved.</p>}
              </article>
            )}
            <h3>Comments</h3>
            {(item.comments ?? []).length === 0 && <p className="muted">No comments yet.</p>}
            {(item.comments ?? []).map((c) => (
              <article className="report-card" key={c.id}>
                <p>{c.body}</p>
                <small>{new Date(c.createdAt).toLocaleString()}</small>
              </article>
            ))}
            <form onSubmit={sendComment} className="inline-form">
              <label>
                Add a comment
                <textarea required minLength={1} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
              <button className="primary">Save comment</button>
            </form>
            <h3>Resolution feedback</h3>
            {(item.feedback ?? []).map((f, i) => (
              <article className="report-card" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StarRating value={f.rating} readOnly />
                  <strong>Rating {f.rating}/5</strong>
                </div>
                <p>{f.body || 'No written comment'}</p>
              </article>
            ))}
            <form onSubmit={sendFeedback} className="inline-form">
              <label>
                Your satisfaction rating
                <StarRating value={rating} onChange={setRating} />
              </label>
              <label>
                Feedback notes
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={2000} placeholder="Share any thoughts on the resolution..." />
              </label>
              <button className="primary">Submit feedback</button>
            </form>
            {notice && <div className="notice" role="status">{notice}</div>}
          </>
        )}
      </AsyncState>
    </section>
  );
}
