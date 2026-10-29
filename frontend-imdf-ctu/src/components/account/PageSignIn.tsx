import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MapPin } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useUser } from '../../context/UserContext'

type FormValues = {
  email: string
  password: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  email: '',
  password: '',
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Vui lòng nhập email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Email không đúng định dạng.'
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password)) {
    errors.password = 'Password phải chứa chữ hoa, chữ thường và số, toi thiểu 6 ký tự.'
  }

  return errors
}

export default function PageSignIn() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { setAuthData } = useUser()

  const navigate = useNavigate()

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage('')
      return
    }

    const { email, password } = values

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!response.ok) {
        let message = 'Dữ liệu nhập vào không hợp lệ hoặc email / mật khẩu không chính xác.'
        try {
          const error = await response.json()
          if (typeof error?.message === 'string' && error.message.trim()) {
            message = error.message
          }
        } catch {
          // Keep the generic message for non-JSON responses.
        }
        setSubmitMessage(message)
        return
      }

      const data = await response.json()
      if (!data?.token || !data?.email || !data?.role) {
        setSubmitMessage('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.')
        return
      }

      setAuthData({ user: data })
      setSubmitMessage('Đăng nhập thành công.')
      navigate('/map')
    } catch (error) {
      console.error('Không thể kết nối đến máy chủ đăng nhập:', error)
      setSubmitMessage('Không thể kết nối đến hệ thống. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-100 px-4 py-8 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-900/10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-linear-to-br from-[#063b82] via-primary to-secondary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-sky-300/20" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border-32 border-white/10" />

          <div className="relative">
            <div
              className="mb-12 flex items-center gap-3 hover:cursor-pointer"
              onClick={() => navigate('/map')}
            >
              <img
                src="/ctu-logo.png"
                alt="Logo Đại học Cần Thơ"
                className="h-14 w-14 object-contain"
              />
              <div>
                <p className="text-xl font-bold tracking-wide">CTUMapping</p>
                <p className="text-sm text-blue-100">Đại học Cần Thơ</p>
              </div>
            </div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-100">
              <MapPin className="h-4 w-4" />
              Bản đồ không gian trong nhà
            </p>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Khám phá khuôn viên Đại học Cần Thơ dễ dàng hơn.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100">
              Đăng nhập để lưu địa điểm, tìm phòng học và sử dụng các tiện ích bản đồ dành cho sinh
              viên, giảng viên và khách tham quan.
            </p>
          </div>

          <p className="relative text-sm text-blue-100">
            © {new Date().getFullYear()} CTUMapping · Trường Đại học Cần Thơ
          </p>
        </section>

        {/* UI MOBILE */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3" onClick={() => navigate('/map')}>
                <img
                  src="/ctu-logo.png"
                  alt="Logo Đại học Cần Thơ"
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <p className="text-xl font-bold text-primary">CTUMapping</p>
                  <p className="text-sm text-slate-500">Đại học Cần Thơ</p>
                </div>
              </div>
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-secondary">
              Chào mừng trở lại
            </p>
            <h2 className="text-3xl font-bold text-slate-900">Đăng nhập tài khoản</h2>
            <p className="mt-2 text-slate-500">
              Sử dụng email và mật khẩu để tiếp tục với CTUMapping.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <div
                  className={`flex items-center rounded-xl border bg-slate-50 px-3 transition focus-within:ring-4 ${
                    errors.email
                      ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
                      : 'border-slate-200 focus-within:border-secondary focus-within:ring-blue-100'
                  }`}
                >
                  <Mail className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="your.email@ctu.edu.vn"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="h-12 min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mật khẩu
                </label>
                <div
                  className={`flex items-center rounded-xl border bg-slate-50 px-3 transition focus-within:ring-4 ${
                    errors.password
                      ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
                      : 'border-slate-200 focus-within:border-secondary focus-within:ring-blue-100'
                  }`}
                >
                  <LockKeyhole className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Nhập mật khẩu"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className="h-12 min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="rounded-lg p-1 text-slate-400 hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </button>

              {submitMessage && (
                <p
                  role="status"
                  className={`rounded-lg px-3 py-2 text-center text-sm ${submitMessage === 'Đăng nhập thành công.' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                >
                  {submitMessage}
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
