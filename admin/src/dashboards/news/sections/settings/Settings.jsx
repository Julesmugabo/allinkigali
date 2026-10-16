/**
 * Settings.jsx — newsroom settings: breaking-flag lifetime, scheduled
 * publishing interval, default status, ad frequency, and whether readers
 * see read counts (the same switch as on Articles). Plus "run now" buttons for the automatic jobs.
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, CheckboxField } from '../../../../components/form/Fields';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import ReadCountsSwitch from '../../components/ReadCountsSwitch';

export default function Settings() {
  const { changed, notify } = useNews();
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    newsApi.workflowSettings()
      .then(setForm)
      .catch((e) => setError(e.message));
  }, []);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const save = async () => {
    try {
      setForm(await newsApi.saveWorkflowSettings({
        breakingExpiryHours: parseInt(form.breaking_expiry_hours, 10) || 6,
        scheduledCheckInterval: parseInt(form.scheduled_check_interval, 10) || 5,
        requireEditorApproval: !!form.require_editor_approval,
        defaultPublishStatus: form.default_publish_status,
        adFrequencyEveryN: parseInt(form.ad_frequency_every_n, 10) || 5,
      }));
      setDirty(false); notify('Settings saved');
    } catch (e) { setError(e.message); }
  };

  const runJob = async (job) => {
    try {
      const r = job === 'publish' ? await newsApi.publishScheduled() : await newsApi.expireBreaking();
      const n = (job === 'publish' ? r.published : r.expired)?.length || 0;
      notify(job === 'publish' ? `${n} scheduled article(s) published` : `${n} breaking flag(s) expired`);
      changed();
    } catch (e) { setError(e.message); }
  };

  if (!form) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <>
      <ErrorText>{error}</ErrorText>
      <Panel title="Workflow" actions={<Button onClick={save} disabled={!dirty}>Save settings</Button>}>
        <FormGrid>
          <Field label="Breaking flag lasts (hours)" type="number" min="1" value={form.breaking_expiry_hours} onChange={set('breaking_expiry_hours')}
            hint="A new Breaking article gets this lifetime; the flag drops off automatically." />
          <Field label="Check for scheduled articles every (minutes)" type="number" min="1" value={form.scheduled_check_interval} onChange={set('scheduled_check_interval')}
            hint="How quickly a scheduled article goes live after its time." />
          <SelectField label="Default status for new articles" value={form.default_publish_status} onChange={set('default_publish_status')}
            options={[{ value: 'draft', label: 'Draft' }, { value: 'pending', label: 'Pending approval' }, { value: 'published', label: 'Published' }]} />
          <Field label="Show an ad every N articles" type="number" min="1" value={form.ad_frequency_every_n} onChange={set('ad_frequency_every_n')} />
          <CheckboxField label="Reporters' articles need an editor's approval" checked={!!form.require_editor_approval} onChange={set('require_editor_approval')} full />
        </FormGrid>
      </Panel>

      <Panel title="What readers see">
        <ReadCountsSwitch />
      </Panel>

      <Panel title="Run the automatic jobs now">
        <p style={{ color: t.textSecondary, fontSize: 13, margin: '0 0 12px' }}>
          These run on their own in the background; use these buttons if you don't want to wait.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="info" onClick={() => runJob('publish')}>Publish due scheduled articles</Button>
          <Button variant="info" onClick={() => runJob('expire')}>Expire old breaking flags</Button>
        </div>
      </Panel>
    </>
  );
}
