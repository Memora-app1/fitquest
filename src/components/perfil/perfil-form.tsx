'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Camera, Check, X, Eye, EyeOff, Loader2, Lock, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerfilFormProps {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  email: string;
}

export function PerfilForm({
  userId,
  initialName,
  initialAvatarUrl,
  initialBio,
  email,
}: PerfilFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Name
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Bio
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(initialBio ?? '');
  const [savingBio, setSavingBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Imagem muito grande. Máximo 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setAvatarError('Apenas imagens são permitidas.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${userId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!res.ok) throw new Error('Falha ao salvar URL do avatar');

      setAvatarUrl(publicUrl);
      startTransition(() => router.refresh());
    } catch {
      setAvatarError('Falha ao fazer upload. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveName() {
    if (!name.trim() || name.trim() === initialName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setNameSuccess(true);
        setEditingName(false);
        setTimeout(() => setNameSuccess(false), 2000);
        startTransition(() => router.refresh());
      } else {
        setNameError('Não foi possível salvar o nome. Tente novamente.');
      }
    } catch {
      setNameError('Erro de conexão. Verifique sua internet.');
    } finally {
      setSavingName(false);
    }
  }

  async function saveBio() {
    setSavingBio(true);
    setBioError(null);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.trim() }),
      });
      if (res.ok) {
        setBioSuccess(true);
        setEditingBio(false);
        setTimeout(() => setBioSuccess(false), 2000);
        startTransition(() => router.refresh());
      } else {
        setBioError('Não foi possível salvar a bio. Tente novamente.');
      }
    } catch {
      setBioError('Erro de conexão. Verifique sua internet.');
    } finally {
      setSavingBio(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSavingPassword(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError('Senha atual incorreta.');
      setSavingPassword(false);
      return;
    }

    const res = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', password: newPassword }),
    });

    setSavingPassword(false);

    if (!res.ok) {
      setPasswordError('Falha ao trocar senha. Tente novamente.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    setTimeout(() => setPasswordSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(255,77,0,0.2)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: 'rgba(255,77,0,0.2)' }}
        />
        <div className="relative z-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <User size={18} className="text-brand-orange" />
            Foto de perfil
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-brand">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange transition-colors hover:bg-brand-orange/80"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </button>
            </div>

            <div>
              <p className="text-lg font-bold">{name}</p>
              <p className="text-sm text-text-secondary">{email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-1 text-xs text-brand-orange hover:underline"
              >
                {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
              </button>
              {avatarError && <p className="mt-1 text-xs text-brand-red">{avatarError}</p>}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Name Edit */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: 'rgba(124,58,237,0.2)' }}
        />
        <div className="relative z-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <User size={18} className="text-brand-purple" />
            Nome de exibição
          </h2>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') {
                    setName(initialName);
                    setEditingName(false);
                  }
                }}
                className="input flex-1"
                autoFocus
                maxLength={100}
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: 'rgba(0,255,136,0.15)',
                  color: '#00FF88',
                  border: '1px solid rgba(0,255,136,0.3)',
                }}
              >
                {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button
                onClick={() => {
                  setName(initialName);
                  setEditingName(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#8899BB',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">{name}</div>
                {nameSuccess && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-brand-green">
                    <Check size={12} /> Nome atualizado!
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="text-sm text-brand-orange hover:underline"
              >
                Editar
              </button>
            </div>
          )}
          {nameError && (
            <p className="mt-2 text-xs" style={{ color: '#FF4D00' }}>
              {nameError}
            </p>
          )}
        </div>
      </div>

      {/* Bio Edit */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.2)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: 'rgba(245,200,66,0.2)' }}
        />
        <div className="relative z-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <FileText size={18} className="text-brand-gold" />
            Bio <span className="text-xs font-normal text-text-muted">(opcional)</span>
          </h2>
          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input h-20 w-full resize-none text-sm"
                placeholder="Conte um pouco sobre você e seus objetivos..."
                maxLength={300}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{bio.length}/300</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBio(initialBio ?? '');
                      setEditingBio(false);
                    }}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveBio}
                    disabled={savingBio}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {savingBio ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {bio ? (
                  <p className="text-sm text-text-secondary">{bio}</p>
                ) : (
                  <p className="text-sm italic text-text-muted">Nenhuma bio ainda.</p>
                )}
                {bioSuccess && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-brand-green">
                    <Check size={12} /> Bio atualizada!
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditingBio(true)}
                className="shrink-0 text-sm text-brand-orange hover:underline"
              >
                {bio ? 'Editar' : 'Adicionar'}
              </button>
            </div>
          )}
          {bioError && (
            <p className="mt-2 text-xs" style={{ color: '#FF4D00' }}>
              {bioError}
            </p>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: 'rgba(59,130,246,0.2)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Lock size={18} className="text-brand-blue" />
              Senha
            </h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-brand-orange hover:underline"
              >
                Trocar senha
              </button>
            )}
          </div>

          {passwordSuccess && (
            <div
              className="mt-3 flex items-center gap-2 rounded-xl p-3 text-sm"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.3)',
                color: '#00FF88',
              }}
            >
              <Check size={16} /> Senha atualizada com sucesso!
            </div>
          )}

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    'input w-full',
                    confirmPassword && confirmPassword !== newPassword && 'border-brand-red/50'
                  )}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              {passwordError && (
                <p
                  className="rounded-xl p-3 text-sm"
                  style={{
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {passwordError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={savingPassword} className="btn-primary flex-1">
                  {savingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Salvando...
                    </span>
                  ) : (
                    'Atualizar senha'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
