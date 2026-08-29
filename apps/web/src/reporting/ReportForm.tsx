import { useEffect, useState } from 'react';
import { categories } from '../auth/api';
import { createReport } from './api';

export function ReportForm({ onSubmitted }: { onSubmitted?: (id: string) => void }) {
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; incidentId: string; clustered?: boolean } | null>(null);

  useEffect(() => {
    categories()
      .then((rows) => {
        setCats(rows);
        setCategoryId(rows[0]?.id ?? '');
      })
      .catch(() => setMessage('Issue categories are temporarily unavailable.'));
  }, []);

  function changeStep(nextStep: number) {
    setDirection(nextStep > step ? 'right' : 'left');
    setStep(nextStep);
  }

  function locate() {
    setMessage('');
    if (!navigator.geolocation) {
      setMessage('Location services are unavailable on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        changeStep(Math.max(step, 4));
      },
      () => setMessage('We could not access your location. You can try again.')
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await createReport({ categoryId, description, address, ...location });
      setSubmitted(result);
      onSubmitted?.(result.id);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'We could not submit your report. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <section className="success-panel wizard-slide-right">
        <p className="eyebrow">REPORT SUBMITTED</p>
        <h2>Your observation is now part of the civic workflow.</h2>
        <dl className="review-list">
          <div><span>Report</span><strong>{submitted.id}</strong></div>
          <div><span>Incident</span><strong>{submitted.incidentId}</strong></div>
          <div><span>Status</span><strong>REPORTED</strong></div>
          <div><span>Clustering</span><strong>{submitted.clustered ? 'Linked to an existing incident' : 'Opened as a new incident'}</strong></div>
        </dl>
        <p className="muted">Next step: municipal officers review the incident. You can track this from My Reports.</p>
        <button
          className="primary"
          onClick={() => {
            setSubmitted(null);
            setDescription('');
            setAddress('');
            setLocation(null);
            setPhoto(null);
            setDirection('right');
            setStep(1);
          }}
        >
          Report another issue
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="report-form">
      <div className="stepper">
        {['Issue', 'Evidence', 'Location', 'Details', 'Review'].map((label, i) => (
          <button
            type="button"
            key={label}
            className={step === i + 1 ? 'step active' : step > i + 1 ? 'step done' : 'step'}
            onClick={() => changeStep(i + 1)}
          >
            {i + 1}<span>{label}</span>
          </button>
        ))}
      </div>
      <div key={step} className={`form-stage wizard-slide-${direction}`}>
        {step === 1 && (
          <>
            <p className="eyebrow">STEP 1</p>
            <h2>What needs attention?</h2>
            <label>
              Issue category
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <p className="eyebrow">STEP 2</p>
            <h2>Add evidence</h2>
            <label>
              Photo
              <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            {photo ? <div className="file-preview">{photo.name} · {(photo.size / 1024 / 1024).toFixed(1)} MB selected locally</div> : (
              <p className="muted">A photo can be selected on this device. The current API does not expose a media upload endpoint, so the file is not stored.</p>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <p className="eyebrow">STEP 3</p>
            <h2>Where is the issue?</h2>
            <button type="button" onClick={locate}>{location ? 'Location captured' : 'Use my current location'}</button>
            {location && <div className="location-readout">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>}
            <label>
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Confirm a nearby address or landmark" />
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <p className="eyebrow">STEP 4</p>
            <h2>Describe what you see</h2>
            <label>
              Description
              <textarea required minLength={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain what is happening and how it affects people." />
              <small>{description.length}/5000</small>
            </label>
          </>
        )}
        {step === 5 && (
          <>
            <p className="eyebrow">STEP 5</p>
            <h2>Review before sending</h2>
            <div className="review-list">
              <div><span>Issue</span><strong>{cats.find((c) => c.id === categoryId)?.name ?? 'Not selected'}</strong></div>
              <div><span>Location</span><strong>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Not captured'}</strong></div>
              <div><span>Address</span><strong>{address || 'Not provided'}</strong></div>
              <div><span>Evidence</span><strong>{photo?.name ?? 'None (not uploaded)'}</strong></div>
              <div><span>Description</span><strong>{description}</strong></div>
            </div>
            <p className="muted">Submitting creates a real report. Nearby similar reports may be clustered into one civic incident.</p>
          </>
        )}
      </div>
      <div className="form-actions">
        {step > 1 && <button type="button" onClick={() => changeStep(step - 1)}>Back</button>}
        {step < 5 && (
          <button
            type="button"
            className="primary"
            disabled={step === 1 && !categoryId}
            onClick={() => changeStep(step + 1)}
          >
            {step === 3 && !location ? 'Continue without GPS' : 'Continue'}
          </button>
        )}
        {step === 5 && <button className="primary" disabled={busy || !location || !description || !categoryId}>{busy ? 'Submitting…' : 'Submit report'}</button>}
      </div>
      {message && <div className="notice" role="alert">{message}</div>}
    </form>
  );
}
