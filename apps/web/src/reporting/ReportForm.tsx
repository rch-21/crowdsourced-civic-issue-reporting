import { useEffect, useState } from 'react';
import { categories } from '../auth/api';
import { createReport, nearbyIncidents, upvoteIncident } from './api';
import { LocationPicker } from './LocationPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { queueReport } from '../lib/offlineQueue';
import { useOfflineQueue } from '../lib/useOfflineQueue';

type NearbyIncident = { incidentId: string; categoryName: string; status: string; distanceMeters: number; supportingReports: number; supportingVotes: number; priority: string };

async function photoGps(file: File): Promise<{ latitude: number; longitude: number } | null> {
  if (!/jpe?g/i.test(file.type)) return null;
  const data = new DataView(await file.arrayBuffer());
  if (data.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 < data.byteLength) {
    const marker = data.getUint16(offset); offset += 2; const length = data.getUint16(offset);
    if (marker === 0xffe1 && new TextDecoder().decode(new Uint8Array(data.buffer, offset + 2, 6)) === 'Exif\0\0') {
      const tiff = offset + 8; const little = data.getUint16(tiff) === 0x4949; const u16 = (p: number) => data.getUint16(p, little); const u32 = (p: number) => data.getUint32(p, little);
      const find = (ifd: number, tag: number) => { const count = u16(ifd); for (let i = 0; i < count; i++) { const p = ifd + 2 + i * 12; if (u16(p) === tag) return p; } return 0; };
      const gpsTag = find(tiff + u32(tiff + 4), 0x8825); if (!gpsTag) return null; const gps = tiff + u32(gpsTag + 8); const latTag = find(gps, 2); const lonTag = find(gps, 4); if (!latTag || !lonTag) return null;
      const ref = (tag: number) => String.fromCharCode(data.getUint8(tag + 8)); const values = (tag: number) => { const base = tiff + u32(tag + 8); return [0, 1, 2].map((i) => u32(base + i * 8) / u32(base + i * 8 + 4)); };
      const decimal = (v: number[], sign: string) => (v[0] + v[1] / 60 + v[2] / 3600) * (sign === 'S' || sign === 'W' ? -1 : 1); const latitude = decimal(values(latTag), ref(find(gps, 1))), longitude = decimal(values(lonTag), ref(find(gps, 3)));
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
    }
    offset += length;
  }
  return null;
}

export function ReportForm({ onSubmitted }: { onSubmitted?: (id: string) => void }) {
  const [cats, setCats] = useState<{ id: string; name: string; code: string; description?: string | null }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; incidentId: string; clustered?: boolean; departmentCode?: string | null; offline?: boolean } | null>(null);
  const [nearby, setNearby] = useState<NearbyIncident[]>([]);
  const [checkingNearby, setCheckingNearby] = useState(false);
  const [votedIncident, setVotedIncident] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [locationSource, setLocationSource] = useState<'photo' | 'device' | 'manual' | null>(null);
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const isOther = cats.find((c) => c.id === categoryId)?.code === 'OTHER_PROBLEM';
  const { online, queued, syncing, syncNow } = useOfflineQueue();

  async function choosePhoto(file: File | null) {
    setPhoto(file); setMessage(''); if (!file || isOther) return;
    const gps = await photoGps(file);
    if (!gps) {
      setLocation(null); setLocationSource(null); setShowPicker(true);
      setMessage('This photo has no embedded GPS location. Drag the pin on the map below to set the location manually, or choose a photo with location tagging enabled.');
      return;
    }
    setLocation(gps); setLocationSource('photo');
  }

  function manualLocation(point: { latitude: number; longitude: number }) {
    setLocation(point); setLocationSource('manual'); setMessage('');
  }

  useEffect(() => {
    categories()
      .then((rows) => {
        setCats(rows);
        setCategoryId(rows[0]?.id ?? '');
      })
      .catch(() => setMessage('Issue categories are temporarily unavailable.'));
  }, []);

  useEffect(() => {
    if (step !== 5 || !location || !categoryId) { setNearby([]); return; }
    setCheckingNearby(true);
    nearbyIncidents({ categoryId, ...location, description })
      .then(setNearby)
      .catch(() => setNearby([]))
      .finally(() => setCheckingNearby(false));
  }, [step, categoryId, location, description]);

  function changeStep(nextStep: number) {
    setDirection(nextStep > step ? 'right' : 'left');
    setStep(nextStep);
  }

  function locate() {
    setMessage('');
    if (!navigator.geolocation) {
      setMessage('Location services are unavailable on this device. Drag the pin on the map below to set it manually.');
      setShowPicker(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setLocationSource('device');
        changeStep(Math.max(step, 4));
      },
      () => { setMessage('We could not access your location. Drag the pin on the map below to set it manually.'); setShowPicker(true); }
    );
  }

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('FILE_READ_FAILED')); reader.readAsDataURL(blob); });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location || (!isOther && !photo)) { setMessage(isOther ? 'Add a location before submitting.' : 'Upload a problem photo with embedded GPS data before submitting.'); return; }
    setBusy(true);
    setMessage('');
    try {
      const media: { storageKey: string; mediaType: string; fileSize: number; dataUrl: string }[] = [];
      if (photo) {
        const dataUrl = await blobToDataUrl(photo);
        media.push({ storageKey: `citizen-report/${Date.now()}-${photo.name}`, mediaType: photo.type, fileSize: photo.size, dataUrl });
      }
      if (voiceNote) {
        const dataUrl = await blobToDataUrl(voiceNote.blob);
        const ext = voiceNote.mimeType.includes('mp4') ? 'm4a' : voiceNote.mimeType.includes('ogg') ? 'ogg' : 'webm';
        media.push({ storageKey: `citizen-report/voice/${Date.now()}.${ext}`, mediaType: voiceNote.mimeType, fileSize: voiceNote.blob.size, dataUrl });
      }
      const reportPayload = { categoryId, description, address, ...location, media };
      if (!navigator.onLine) {
        const localId = await queueReport(reportPayload);
        setSubmitted({ id: localId, incidentId: 'pending-sync', offline: true });
        return;
      }
      try {
        const result = await createReport(reportPayload);
        setSubmitted(result);
        onSubmitted?.(result.id);
      } catch (err: unknown) {
        if (err instanceof TypeError) {
          // fetch throws a TypeError for network-level failures (offline, DNS, connection reset) —
          // distinct from ApiError, which means the server was reached but rejected the request.
          const localId = await queueReport(reportPayload);
          setSubmitted({ id: localId, incidentId: 'pending-sync', offline: true });
          return;
        }
        throw err;
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'We could not submit your report. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function supportExisting(incidentId: string) {
    try {
      const result = await upvoteIncident(incidentId);
      setVotedIncident(incidentId);
      setMessage(result.alreadyVoted ? 'You have already supported this existing problem.' : 'Your upvote was added. We will keep this as one shared civic problem.');
    } catch (err: unknown) { setMessage(err instanceof Error ? err.message : 'The upvote could not be recorded.'); }
  }

  if (submitted) {
    if (submitted.offline) {
      return (
        <section className="success-panel wizard-slide-right">
          <p className="eyebrow">SAVED ON THIS DEVICE</p>
          <h2>You're offline — this report will send automatically.</h2>
          <p className="muted">Your report, photo, and voice note (if any) are saved on this device. It will be submitted as soon as you're back online — you don't need to do anything else.</p>
          <dl className="review-list">
            <div><span>Saved locally as</span><strong>{submitted.id}</strong></div>
            <div><span>Status</span><strong>Pending sync</strong></div>
          </dl>
          <button
            className="primary"
            onClick={() => {
              setSubmitted(null);
              setDescription('');
              setAddress('');
              setLocation(null);
              setPhoto(null);
              setVoiceNote(null);
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
      <section className="success-panel wizard-slide-right">
        <p className="eyebrow">REPORT SUBMITTED</p>
        <h2>Your observation is now part of the civic workflow.</h2>
        <dl className="review-list">
          <div><span>Report</span><strong>{submitted.id}</strong></div>
          <div><span>Incident</span><strong>{submitted.incidentId}</strong></div>
          <div><span>Status</span><strong>REPORTED</strong></div>
          <div><span>Clustering</span><strong>{submitted.clustered ? 'Linked to an existing incident' : 'Opened as a new incident'}</strong></div>
          {submitted.departmentCode && <div><span>Routed department</span><strong>{submitted.departmentCode}</strong></div>}
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
            setVoiceNote(null);
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
      {(!online || queued.length > 0) && (
        <div className="notice offline-banner" role="status">
          {!online && <span>You're offline. Reports you submit now will be saved on this device and sent automatically once you're back online.</span>}
          {online && queued.length > 0 && (
            <span>
              {queued.length} report{queued.length === 1 ? '' : 's'} waiting to sync.{' '}
              <button type="button" className="link-button" disabled={syncing} onClick={syncNow}>{syncing ? 'Syncing…' : 'Sync now'}</button>
            </span>
          )}
        </div>
      )}
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
            {isOther ? <><h2>No photo needed</h2><p className="muted">For an Other problem, describe the issue and we will route it using transparent department rules.</p></> : <><h2>Evidence</h2><p className="muted">The problem photo is added after you describe the issue.</p></>}
          </>
        )}
        {step === 3 && (
          <>
            <p className="eyebrow">STEP 3</p>
            <h2>Where is the issue?</h2>
            {isOther ? <button type="button" onClick={locate}>{location ? 'Location captured' : 'Use my current location'}</button> : <p className="muted">Your report location is read from the problem photo in the next step. You can still set it manually here or correct it below.</p>}
            {location && <div className="location-readout">{locationSource === 'manual' ? `Manually set: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : isOther ? 'Location captured' : `Photo location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}</div>}
            <button type="button" onClick={() => setShowPicker((v) => !v)} className="link-button">{showPicker ? 'Hide map' : location ? 'Correct location on map' : 'Set location on map'}</button>
            {showPicker && <LocationPicker latitude={location?.latitude ?? null} longitude={location?.longitude ?? null} onChange={manualLocation} />}
            {!isOther && <label>Address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Confirm a nearby address or landmark" /></label>}
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
            <VoiceRecorder
              onRecordingChange={setVoiceNote}
              onTranscript={(text) => setDescription((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))}
            />
            {!isOther && <label>Problem photo<input type="file" accept="image/jpeg,image/jpg" capture="environment" required onChange={(e) => { void choosePhoto(e.target.files?.[0] ?? null); }} />{photo && <div className="file-preview">{photo.name} · {location ? `${locationSource === 'manual' ? 'Manually set' : 'Photo GPS'}: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'GPS not found'}</div>}<small>Use an original JPEG with location tagging enabled, or set the location manually below.</small></label>}
            {!isOther && photo && (
              <>
                <button type="button" onClick={() => setShowPicker((v) => !v)} className="link-button">{showPicker ? 'Hide map' : location ? 'Correct location on map' : 'Set location on map'}</button>
                {showPicker && <LocationPicker latitude={location?.latitude ?? null} longitude={location?.longitude ?? null} onChange={manualLocation} />}
              </>
            )}
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
              {!isOther && <div><span>Evidence</span><strong>{photo?.name ?? 'None (not uploaded)'}</strong></div>}
              <div><span>Voice note</span><strong>{voiceNote ? 'Attached' : 'None'}</strong></div>
              <div><span>Description</span><strong>{description}</strong></div>
            </div>
            <p className="muted">Submitting creates a real report. Nearby similar reports may be clustered into one civic incident.</p>
            {checkingNearby && <p className="muted">Checking whether this problem has already been reported nearby…</p>}
            {nearby.length > 0 && <section className="report-card" style={{ borderColor: 'var(--accent, #2b8a72)' }}><p className="eyebrow">POSSIBLE EXISTING PROBLEM</p><h3>This issue may already be reported nearby</h3><p className="muted">Support the existing civic problem instead of creating another complaint. You can still submit a separate report if this is a different issue.</p>{nearby.map((candidate) => <div key={candidate.incidentId} className="form-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border, #dbe6e1)', paddingTop: 10 }}><span>{candidate.distanceMeters}m away · {candidate.supportingReports} report(s) · {candidate.supportingVotes} upvote(s) · {candidate.priority}</span><button type="button" className="primary" disabled={votedIncident === candidate.incidentId} onClick={() => supportExisting(candidate.incidentId)}>{votedIncident === candidate.incidentId ? 'Supported' : 'Upvote this problem'}</button></div>)}</section>}
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
        {step === 5 && <button className="primary" disabled={busy || !location || (!isOther && !photo) || !description || !categoryId}>{busy ? 'Submitting…' : 'Submit report'}</button>}
      </div>
      {message && <div className="notice" role="alert">{message}</div>}
    </form>
  );
}
