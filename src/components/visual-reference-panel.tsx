"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Language } from '@/src/solver/types';
import { VisualStyleProfileSchema, type VisualReferenceAnalysis, type VisualStyleProfile } from '@/src/visual-analysis/schema';

interface VisualReferencePanelProps {
  language: Language;
  brief: string;
  value?: VisualStyleProfile;
  onChange: (profile: VisualStyleProfile | undefined) => void;
}

const text = {
  en: {
    title: 'Visual references (optional)',
    hint: 'Add a moodboard or up to four images. QUANDA will extract design principles for you to review before they affect the result.',
    choose: 'Choose images',
    analyze: 'Analyze visual style',
    analyzing: 'Analyzing references…',
    privacy: 'JPEG, PNG, or WebP · 4 images maximum · sent to Gemini for this analysis · not saved by QUANDA',
    review: 'Review what QUANDA sees',
    summary: 'Style summary',
    mood: 'Mood keywords (comma-separated)',
    principles: 'Design principles',
    principle: 'Principle',
    evidence: 'Visible evidence',
    application: 'How to apply it',
    details: 'Color, type, composition, imagery, and motion details',
    palette: 'Palette',
    contrast: 'Contrast',
    colorUse: 'Color usage',
    typeTraits: 'Typography characteristics',
    typeHierarchy: 'Typography hierarchy',
    layout: 'Layout',
    hierarchy: 'Visual hierarchy',
    rhythm: 'Spacing and rhythm',
    forms: 'Shapes and forms',
    material: 'Texture and material',
    depth: 'Lighting and depth',
    motionCues: 'Observed motion cues',
    motionIdeas: 'Suggested interaction or motion',
    cautions: 'Cautions',
    approve: 'Use this visual profile',
    approved: 'Visual profile approved and included',
    remove: 'Remove profile',
    editNotice: 'Editing the profile requires approval again.',
    invalid: 'Choose 1–4 JPEG, PNG, or WebP images, each no larger than 8 MB.',
    failed: 'The references could not be analyzed. Try again or continue without them.',
  },
  vi: {
    title: 'Hình tham khảo (không bắt buộc)',
    hint: 'Thêm moodboard hoặc tối đa bốn hình. QUANDA sẽ trích xuất nguyên tắc thiết kế để bạn duyệt trước khi chúng ảnh hưởng kết quả.',
    choose: 'Chọn hình',
    analyze: 'Phân tích phong cách hình ảnh',
    analyzing: 'Đang phân tích hình…',
    privacy: 'JPEG, PNG hoặc WebP · tối đa 4 hình · gửi đến Gemini cho lần phân tích này · QUANDA không lưu hình',
    review: 'Duyệt cách QUANDA hiểu hình',
    summary: 'Tóm tắt phong cách',
    mood: 'Từ khóa cảm xúc (ngăn cách bằng dấu phẩy)',
    principles: 'Nguyên tắc thiết kế',
    principle: 'Nguyên tắc',
    evidence: 'Bằng chứng nhìn thấy',
    application: 'Cách áp dụng',
    details: 'Chi tiết màu, chữ, bố cục, hình ảnh và chuyển động',
    palette: 'Bảng màu',
    contrast: 'Tương phản',
    colorUse: 'Cách dùng màu',
    typeTraits: 'Đặc điểm chữ',
    typeHierarchy: 'Phân cấp chữ',
    layout: 'Bố cục',
    hierarchy: 'Phân cấp thị giác',
    rhythm: 'Khoảng cách và nhịp điệu',
    forms: 'Hình dạng và khối',
    material: 'Chất liệu và bề mặt',
    depth: 'Ánh sáng và chiều sâu',
    motionCues: 'Dấu hiệu chuyển động quan sát được',
    motionIdeas: 'Gợi ý tương tác hoặc chuyển động',
    cautions: 'Điểm cần thận trọng',
    approve: 'Dùng hồ sơ hình ảnh này',
    approved: 'Hồ sơ hình ảnh đã được duyệt và đưa vào brief',
    remove: 'Xóa hồ sơ',
    editNotice: 'Sau khi chỉnh sửa, bạn cần duyệt lại hồ sơ.',
    invalid: 'Chọn 1–4 hình JPEG, PNG hoặc WebP, mỗi hình không quá 8 MB.',
    failed: 'Không thể phân tích hình tham khảo. Hãy thử lại hoặc tiếp tục không dùng hình.',
  },
};

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 16);
const join = (values: string[]) => values.join(', ');

export default function VisualReferencePanel({ language, brief, value, onChange }: VisualReferencePanelProps) {
  const copy = text[language];
  const [files, setFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<VisualStyleProfile | undefined>(value);
  const [sourceNames, setSourceNames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);
  const profile = draft ?? value;

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  const markEdited = (next: VisualStyleProfile) => {
    setDraft(next);
    if (value) onChange(undefined);
  };
  const setField = <K extends keyof VisualStyleProfile>(key: K, next: VisualStyleProfile[K]) => {
    if (profile) markEdited({ ...profile, [key]: next });
  };
  const selectFiles = (selected: File[]) => {
    const valid = selected.length >= 1 && selected.length <= 4
      && selected.every((file) => supportedTypes.has(file.type) && file.size > 0 && file.size <= 8 * 1024 * 1024)
      && selected.reduce((sum, file) => sum + file.size, 0) <= 16 * 1024 * 1024;
    if (!valid) {
      setError(copy.invalid);
      setFiles([]);
      return;
    }
    setError('');
    setFiles(selected);
    setDraft(undefined);
    setSourceNames([]);
    onChange(undefined);
  };
  const analyze = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      files.forEach((file) => body.append('references', file));
      body.set('brief', brief);
      body.set('language', language);
      const response = await fetch('/api/analyze-visual-references', { method: 'POST', body });
      const payload = await response.json() as VisualReferenceAnalysis | { error?: string };
      if (!response.ok || !('analysisVersion' in payload)) throw new Error('error' in payload ? payload.error : copy.failed);
      const { sourceFileNames, analysisVersion: _analysisVersion, ...profile } = payload;
      void _analysisVersion;
      setDraft(profile);
      setSourceNames(sourceFileNames);
      onChange(undefined);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : copy.failed);
    } finally {
      setBusy(false);
    }
  };
  const remove = () => {
    setFiles([]);
    setDraft(undefined);
    setSourceNames([]);
    setError('');
    onChange(undefined);
  };

  return <section className="visual-references">
    <div className="visual-intro">
      <div><b>{copy.title}</b><p>{copy.hint}</p></div>
      <label className="file-button">{copy.choose}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}/></label>
    </div>
    {previews.length > 0 && <div className="reference-previews">{previews.map((preview) => <figure key={preview.url}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URLs are not compatible with the image optimizer */}
      <img src={preview.url} alt=""/><figcaption>{preview.name}</figcaption>
    </figure>)}</div>}
    <small className="privacy-note">{copy.privacy}</small>
    {files.length > 0 && !profile && <button type="button" className="analyze-references" disabled={busy} onClick={() => void analyze()}>{busy ? copy.analyzing : copy.analyze}</button>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    {profile && <div className="visual-profile">
      <header><div><b>{copy.review}</b>{sourceNames.length > 0 && <small>{sourceNames.join(' · ')}</small>}</div>{value && <span>✓ {copy.approved}</span>}</header>
      <label>{copy.summary}<textarea value={profile.summary} onChange={(event) => setField('summary', event.target.value)}/></label>
      <label>{copy.mood}<input value={join(profile.moodKeywords)} onChange={(event) => setField('moodKeywords', split(event.target.value))}/></label>
      <div className="principles"><b>{copy.principles}</b>{profile.designPrinciples.map((item, index) => <article key={`${item.principle}-${index}`}>
        <label>{copy.principle}<input value={item.principle} onChange={(event) => setField('designPrinciples', profile.designPrinciples.map((current, itemIndex) => itemIndex === index ? { ...current, principle: event.target.value } : current))}/></label>
        <label>{copy.evidence}<textarea value={item.evidence} onChange={(event) => setField('designPrinciples', profile.designPrinciples.map((current, itemIndex) => itemIndex === index ? { ...current, evidence: event.target.value } : current))}/></label>
        <label>{copy.application}<textarea value={item.application} onChange={(event) => setField('designPrinciples', profile.designPrinciples.map((current, itemIndex) => itemIndex === index ? { ...current, application: event.target.value } : current))}/></label>
      </article>)}</div>
      <details className="visual-details"><summary>{copy.details}</summary><div className="visual-detail-grid">
        <label>{copy.palette}<input value={join(profile.color.palette)} onChange={(event) => setField('color', { ...profile.color, palette: split(event.target.value) })}/></label>
        <label>{copy.contrast}<textarea value={profile.color.contrast} onChange={(event) => setField('color', { ...profile.color, contrast: event.target.value })}/></label>
        <label>{copy.colorUse}<textarea value={profile.color.usage} onChange={(event) => setField('color', { ...profile.color, usage: event.target.value })}/></label>
        <label>{copy.typeTraits}<input value={join(profile.typography.characteristics)} onChange={(event) => setField('typography', { ...profile.typography, characteristics: split(event.target.value) })}/></label>
        <label>{copy.typeHierarchy}<textarea value={profile.typography.hierarchy} onChange={(event) => setField('typography', { ...profile.typography, hierarchy: event.target.value })}/></label>
        <label>{copy.layout}<textarea value={profile.composition.layout} onChange={(event) => setField('composition', { ...profile.composition, layout: event.target.value })}/></label>
        <label>{copy.hierarchy}<textarea value={profile.composition.hierarchy} onChange={(event) => setField('composition', { ...profile.composition, hierarchy: event.target.value })}/></label>
        <label>{copy.rhythm}<textarea value={profile.composition.spacingAndRhythm} onChange={(event) => setField('composition', { ...profile.composition, spacingAndRhythm: event.target.value })}/></label>
        <label>{copy.forms}<textarea value={profile.imagery.shapesAndForms} onChange={(event) => setField('imagery', { ...profile.imagery, shapesAndForms: event.target.value })}/></label>
        <label>{copy.material}<textarea value={profile.imagery.textureAndMaterial} onChange={(event) => setField('imagery', { ...profile.imagery, textureAndMaterial: event.target.value })}/></label>
        <label>{copy.depth}<textarea value={profile.imagery.lightingAndDepth} onChange={(event) => setField('imagery', { ...profile.imagery, lightingAndDepth: event.target.value })}/></label>
        <label>{copy.motionCues}<input value={join(profile.motion.observedCues)} onChange={(event) => setField('motion', { ...profile.motion, observedCues: split(event.target.value) })}/></label>
        <label>{copy.motionIdeas}<input value={join(profile.motion.suggestedBehaviors)} onChange={(event) => setField('motion', { ...profile.motion, suggestedBehaviors: split(event.target.value) })}/></label>
        <label>{copy.cautions}<input value={join(profile.cautions)} onChange={(event) => setField('cautions', split(event.target.value))}/></label>
      </div></details>
      {!value && <small className="approval-note">{copy.editNotice}</small>}
      <div className="profile-actions"><button type="button" className="approve-profile" disabled={!VisualStyleProfileSchema.safeParse(profile).success} onClick={() => onChange(profile)}>✓ {copy.approve}</button><button type="button" className="remove-profile" onClick={remove}>{copy.remove}</button></div>
    </div>}
  </section>;
}
