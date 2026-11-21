import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Locate, MapPin, X } from 'lucide-react'
import type { AddressResponse } from '../../../model/imdf models/Address.model'

interface Props {
  open: boolean
  address: AddressResponse | null
  onClose: () => void
  /** Gọi sau khi đóng modal (dùng để xóa address đang chọn ở component cha) */
  afterClose?: () => void
}

const text = (v?: string | number | null) =>
  v === null || v === undefined || v === '' ? '—' : String(v)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white">
      <h3 className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <dl className="divide-y divide-slate-100 px-4 pb-1">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-semibold text-slate-800">
        {children}
      </dd>
    </div>
  )
}

function CodeTile({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-sky-50 px-3 py-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600/70">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-sky-800" title={value ?? ''}>
        {text(value)}
      </p>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // trình duyệt chặn clipboard: bỏ qua
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Đã sao chép' : 'Sao chép'}
      className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  )
}

export default function DashboardAddressDetail({ open, address, onClose, afterClose }: Props) {
  const handleClose = () => {
    onClose()
    afterClose?.()
  }

  // Nhấn Escape để đóng
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        afterClose?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, afterClose])

  if (!open || !address) return null

  // Địa chỉ đầy đủ trên một dòng, bỏ qua phần trống
  const fullAddress = [
    address.unit,
    address.address,
    address.locality,
    address.province,
    address.country,
  ]
    .filter((part) => part && part.trim())
    .join(', ')

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        // Chỉ đóng khi bấm đúng vào nền, không phải bên trong modal
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-detail-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Locate size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="address-detail-title" className="text-base font-bold text-slate-800">
              Chi tiết địa chỉ
            </h2>
            <p className="text-xs text-slate-500">Mã #{address.id}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* NỘI DUNG */}
        <div className="space-y-3 overflow-y-auto bg-slate-50/60 px-5 py-4">
          {/* Địa chỉ đầy đủ */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <MapPin size={20} className="mt-0.5 shrink-0 opacity-90" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Địa chỉ đầy đủ
              </p>
              <p
                className="mt-0.5 break-words text-sm font-semibold leading-snug text-blue-700"
                title={fullAddress || ''}
              >
                {fullAddress || '—'}
              </p>
            </div>
          </div>

          <Section title="Vị trí hành chính">
            <Row label="Địa chỉ">{text(address.address)}</Row>
            <Row label="Đơn vị (unit)">{text(address.unit)}</Row>
            <Row label="Xã / Phường">{text(address.locality)}</Row>
            <Row label="Tỉnh / Thành phố">{text(address.province)}</Row>
            <Row label="Quốc gia">{text(address.country)}</Row>
          </Section>

          <div>
            <h3 className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Mã bưu chính
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <CodeTile label="Mã" value={address.postalCode} />
              <CodeTile label="Mở rộng" value={address.postalCodeExtension} />
              <CodeTile label="Tùy chỉnh" value={address.postalCodeVanity} />
            </div>
          </div>

          <Section title="Định danh">
            <Row label="ID">{address.id}</Row>
            <Row label="UUID địa chỉ">
              <span className="inline-flex max-w-full items-center justify-end gap-1">
                <span className="truncate font-mono text-xs">{text(address.addressId)}</span>
                {address.addressId && <CopyButton value={address.addressId} />}
              </span>
            </Row>
            <Row label="Feature ID">{text(address.featureId)}</Row>
          </Section>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
