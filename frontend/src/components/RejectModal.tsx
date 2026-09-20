import { useEffect, useState } from 'react';
import { Button, Modal } from './ui';

/** Asks the admin for a reason, which is stored with the decision and shown to the employer. */
export function RejectModal({
  open, title, onClose, onConfirm,
}: { open: boolean; title: string; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setReason(''); }, [open]);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={busy} disabled={!reason.trim()} onClick={confirm}>Reject</Button>
        </>
      }
    >
      <label className="label" htmlFor="reason">Reason (shown to the employer)</label>
      <textarea id="reason" className="input min-h-[100px]" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs to change so they can fix it and resubmit." />
    </Modal>
  );
}
