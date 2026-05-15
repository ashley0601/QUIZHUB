import React from 'react';
import { X, Clock, Shuffle, Eye, Mail, Globe, BookOpen, CheckCircle } from 'lucide-react';
import './QuizSettingsModal.css';

export default function QuizSettingsModal({ settings, setSettings, onClose }) {
  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const Toggle = ({ label, icon: Icon, checked, onChange, desc }) => (
    <div className="sm-row">
      <div className="sm-info">
        <div className="sm-label">{Icon && <Icon size={18} />}<span>{label}</span></div>
        {desc && <p className="sm-desc">{desc}</p>}
      </div>
      <label className="sm-toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="sm-track"><span className="sm-thumb"></span></span>
      </label>
    </div>
  );

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        <div className="sm-head">
          <h2>Quiz Settings</h2>
          <button className="sm-x" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sm-body">
          <div className="sm-section">
            <h3 className="sm-sec-title"><Clock size={15} /> Behavior</h3>
            <div className="sm-row sm-input-row">
              <div className="sm-info">
                <div className="sm-label"><Clock size={18} /> Time per question</div>
                <p className="sm-desc">Seconds allowed (0 = no limit)</p>
              </div>
              <input type="number" min="0" max="600" value={settings.time_per_question}
                onChange={e => update('time_per_question', parseInt(e.target.value) || 0)} className="sm-num-input" />
            </div>
            <div className="sm-row sm-input-row">
              <div className="sm-info">
                <div className="sm-label"><Clock size={18} /> Deadline</div>
                <p className="sm-desc">After this date quiz is closed</p>
              </div>
              <input type="datetime-local" value={settings.deadline}
                onChange={e => update('deadline', e.target.value)} className="sm-dt-input" />
            </div>
            <Toggle label="Shuffle questions" icon={Shuffle} checked={settings.shuffle_questions}
              onChange={v => update('shuffle_questions', v)} desc="Randomize question order" />
            <Toggle label="Shuffle choices" icon={Shuffle} checked={settings.shuffle_choices}
              onChange={v => update('shuffle_choices', v)} desc="Randomize option order" />
          </div>
          <div className="sm-section">
            <h3 className="sm-sec-title"><Eye size={15} /> Results &amp; Feedback</h3>
            <Toggle label="Show results" icon={Eye} checked={settings.show_results}
              onChange={v => update('show_results', v)} desc="Students see score and correct answers" />
            <Toggle label="Allow review" icon={CheckCircle} checked={settings.allow_review}
              onChange={v => update('allow_review', v)} desc="Students can review answers" />
            <Toggle label="Show progress bar" icon={BookOpen} checked={settings.show_progress_bar}
              onChange={v => update('show_progress_bar', v)} desc="Display progress during quiz" />
          </div>
          <div className="sm-section">
            <h3 className="sm-sec-title"><Globe size={15} /> Access</h3>
            <Toggle label="Public quiz" icon={Globe} checked={settings.is_public}
              onChange={v => update('is_public', v)} desc="Visible in public quiz library" />
            <Toggle label="Collect email" icon={Mail} checked={settings.collect_email}
              onChange={v => update('collect_email', v)} desc="Ask for email before starting" />
          </div>
          <div className="sm-section">
            <h3 className="sm-sec-title"><BookOpen size={15} /> Instructions</h3>
            <textarea className="sm-textarea" value={settings.instructions}
              onChange={e => update('instructions', e.target.value)} rows={4}
              placeholder="Special instructions for students..." />
          </div>
        </div>
        <div className="sm-foot">
          <button className="sm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sm-btn-save" onClick={onClose}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
