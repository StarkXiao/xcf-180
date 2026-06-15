import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { UserPlus, LogIn, Bike, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated, authLoading } = useStore()

  const from = (location.state as any)?.from || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('请输入用户名')
      return false
    }
    if (mode === 'register' && !formData.email.trim()) {
      setError('请输入邮箱')
      return false
    }
    if (!formData.password) {
      setError('请输入密码')
      return false
    }
    if (formData.password.length < 6) {
      setError('密码至少需要6个字符')
      return false
    }
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setError('')
      if (mode === 'login') {
        const result = await login({
          username: formData.username,
          password: formData.password,
        })
        if (result) {
          navigate(from, { replace: true })
        } else {
          setError('用户名或密码错误')
        }
      } else {
        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname || undefined,
          phone: formData.phone || undefined,
        })
        if (result) {
          navigate(from, { replace: true })
        } else {
          setError('注册失败，请稍后重试')
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-moto-orange/20 rounded-xl">
              <Bike className="w-10 h-10 text-moto-orange" />
            </div>
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-wider">XCF-180</h1>
          <p className="text-moto-steel mt-2">MOTO CUSTOM 改装定制平台</p>
        </div>

        <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 overflow-hidden shadow-2xl">
          <div className="flex">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-moto-orange/10 text-moto-orange border-b-2 border-moto-orange'
                  : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
              }`}
            >
              <LogIn size={18} />
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-moto-orange/10 text-moto-orange border-b-2 border-moto-orange'
                  : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
              }`}
            >
              <UserPlus size={18} />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-moto-steel mb-2">用户名</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm text-moto-steel mb-2">邮箱</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
                    className="w-full px-4 py-3 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-moto-steel mb-2">昵称 (可选)</label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="请输入昵称"
                    className="w-full px-4 py-3 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-moto-steel mb-2">手机号 (可选)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-moto-steel mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 pr-12 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel hover:text-moto-silver transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-moto-steel mb-2">确认密码</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  className="w-full px-4 py-3 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white placeholder:text-moto-steel/50 focus:outline-none focus:border-moto-orange/50 focus:ring-1 focus:ring-moto-orange/30 transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-moto-orange hover:bg-moto-orange/90 disabled:bg-moto-orange/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  登录
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  注册账号
                </>
              )}
            </button>

            <p className="text-center text-xs text-moto-steel">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                className="text-moto-orange hover:text-moto-orange/80 ml-1"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-moto-steel/70">
          <p>演示账号：admin / admin123 或 rider001 / rider123</p>
        </div>
      </div>
    </div>
  )
}
