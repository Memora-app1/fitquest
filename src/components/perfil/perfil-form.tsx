'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Check, X, Eye, EyeOff, Loader2, Lock, User, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerfilFormProps {
  userId: string
  initialName: string
  initialAvatarUrl: string | null
  initialBio: string | null
  email: string
}

export function PerfilForm({ userId, initialName, initialAvatarUrl, initialBio, email }: PerfilFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  // Name
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(initialName)
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Bio
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState(initialBio ?? '')
  const [savingBio, setSavingBio] = useState(false)
  const [bioSuccess, setBioSuccess] = useState(false)

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Imagem muito grande. Máximo 5MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setAvatarError('Apenas imagens são permitidas.')
      return
    }

    setUploadingAvatar(true)
    setAvatarError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      if (!res.ok) throw new Error('Falha ao salvar URL do avatar')

      setAvatarUrl(publicUrl)
      startTransition(() => router.refresh())
    } catch {
      setAvatarError('Falha ao fazer upload. Tente novamente.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveName() {
    if (!name.trim() || name.trim() === initialName) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSavingName(false)
    if (res.ok) {
      setNameSuccess(true)
      setEditingName(false)
      setTimeout(() => setNameSuccess(false), 2000)
      startTransition(() => router.refresh())
    }
  }

  async function saveBio() {
    setSavingBio(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bio.trim() }),
    })
    setSavingBio(false)
    if (res.ok) {
      setBioSuccess(true)
      setEditingBio(false)
      setTimeout(() => setBioSuccess(false), 2000)
      startTransition(() => router.refresh())
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSavingPassword(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('Senha atual incorreta.')
      setSavingPassword(false)
      return
    }

    const res = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', password: newPassword }),
    })

    setSavingPassword(false)

    if (!res.ok) {
      setPasswordError('Falha ao trocar senha. Tente novamente.')
      return
    }

    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordForm(false)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-orange" />
          Foto de perfil
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-brand flex items-center justify-center shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-3xl">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center hover:bg-brand-orange/80 transition-colors"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="text-white animate-spin" />
              ) : (
                <Camera size={14} className="text-white" />
              )}
            </button>
          </div>

          <div>
            <p className="font-bold text-lg">{name}</p>
            <p className="text-sm text-text-secondary">{email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-xs text-brand-orange hover:underline mt-1"
            >
              {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
            </button>
            {avatarError && (
              <p className="text-xs text-brand-red mt-1">{avatarError}</p>
            )}
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

      {/* Name Edit */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
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
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') { setName(initialName); setEditingName(false) }
              }}
              className="input flex-1"
              autoFocus
              maxLength={100}
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="w-10 h-10 bg-brand-green/20 text-brand-green rounded-xl flex items-center justify-center hover:bg-brand-green/30 transition-colors"
            >
              {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button
              onClick={() => { setName(initialName); setEditingName(false) }}
              className="w-10 h-10 bg-bg-elevated text-text-muted rounded-xl flex items-center justify-center hover:bg-border transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl">{name}</div>
              {nameSuccess && (
                <div className="text-xs text-brand-green mt-1 flex items-center gap-1">
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
      </div>

      {/* Bio Edit */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-gold" />
          Bio <span className="text-xs text-text-muted font-normal">(opcional)</span>
        </h2>
        {editingBio ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input w-full resize-none h-20 text-sm"
              placeholder="Conte um pouco sobre você e seus objetivos..."
              maxLength={300}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{bio.length}/300</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setBio(initialBio ?? ''); setEditingBio(false) }}
                  className="btn-ghost text-sm px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBio}
                  disabled={savingBio}
                  className="btn-primary text-sm px-4 py-2"
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
                <p className="text-text-secondary text-sm">{bio}</p>
              ) : (
                <p className="text-text-muted text-sm italic">Nenhuma bio ainda.</p>
              )}
              {bioSuccess && (
                <div className="text-xs text-brand-green mt-1 flex items-center gap-1">
                  <Check size={12} /> Bio atualizada!
                </div>
              )}
            </div>
            <button
              onClick={() => setEditingBio(true)}
              className="text-sm text-brand-orange hover:underline shrink-0"
            >
              {bio ? 'Editar' : 'Adicionar'}
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
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
          <div className="mt-3 p-3 bg-brand-green/10 border border-brand-green/30 rounded-xl text-sm text-brand-green flex items-center gap-2">
            <Check size={16} /> Senha atualizada com sucesso!
          </div>
        )}

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Senha atual</label>
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
              <label className="text-xs text-text-muted block mb-1">Nova senha</label>
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
              <label className="text-xs text-text-muted block mb-1">Confirmar nova senha</label>
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
              <p className="text-sm text-brand-red bg-brand-red/10 border border-brand-red/20 rounded-xl p-3">
                {passwordError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError(null)
                }}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary flex-1"
              >
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
  )
}
