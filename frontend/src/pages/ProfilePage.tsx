import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  User,
  Heart,
  History,
  FolderKanban,
  Users,
  Settings,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Plus,
  Share2,
  TrendingUp,
  Sparkles,
  Clock,
  Tag,
  MapPin,
  Bike,
  Award,
  Mail,
  Phone,
  ChevronRight,
  Search,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { ModificationArchive } from '@/types'

type TabType = 'profile' | 'favorites' | 'history' | 'archives' | 'collaborations' | 'settings'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    phone: '',
    bio: '',
    gender: '',
    location: '',
    bikeModel: '',
    ridingStyle: '',
    ridingExperience: '',
  })
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [favFilter, setFavFilter] = useState<'all' | 'part' | 'template' | 'selection'>('all')

  const {
    isAuthenticated,
    currentUser,
    userProfile,
    userFavorites,
    userBrowsingHistory,
    userArchives,
    userSharedResources,
    userStats,
    userDataLoading,
    fetchCurrentUser,
    fetchUserFavorites,
    fetchUserBrowsingHistory,
    fetchUserArchives,
    fetchSharedResources,
    fetchUserStats,
    updateUserProfile,
    changePassword,
    toggleUserFavorite,
    removeBrowsingHistoryItem,
    clearBrowsingHistory,
    deleteArchive,
    createArchive,
    createSharedResource,
    inviteCollaborator,
    removeCollaborator,
  } = useStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser()
      fetchUserStats()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'favorites' && isAuthenticated) {
      fetchUserFavorites()
    } else if (activeTab === 'history' && isAuthenticated) {
      fetchUserBrowsingHistory()
    } else if (activeTab === 'archives' && isAuthenticated) {
      fetchUserArchives()
    } else if (activeTab === 'collaborations' && isAuthenticated) {
      fetchSharedResources()
    }
  }, [activeTab, isAuthenticated])

  useEffect(() => {
    if (currentUser && userProfile) {
      setProfileForm({
        nickname: currentUser.nickname || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        gender: userProfile.gender || '',
        location: userProfile.location || '',
        bikeModel: userProfile.bikeModel || '',
        ridingStyle: userProfile.ridingStyle || '',
        ridingExperience: userProfile.ridingExperience || '',
      })
    }
  }, [currentUser, userProfile])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  const handleSaveProfile = async () => {
    const result = await updateUserProfile(profileForm)
    if (result) {
      setEditingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!oldPassword || !newPassword) {
      setPasswordError('请填写原密码和新密码')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('新密码至少需要6个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    const success = await changePassword({ oldPassword, newPassword })
    if (success) {
      setPasswordSuccess('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPasswordError('原密码错误')
    }
  }

  const tabs = [
    { id: 'profile' as TabType, label: '个人信息', icon: User },
    { id: 'favorites' as TabType, label: '我的收藏', icon: Heart, badge: userStats?.favoriteParts + userStats?.favoriteTemplates || 0 },
    { id: 'history' as TabType, label: '浏览记录', icon: History, badge: userStats?.browsingHistoryCount || 0 },
    { id: 'archives' as TabType, label: '改装档案', icon: FolderKanban, badge: userStats?.archivesCount || 0 },
    { id: 'collaborations' as TabType, label: '协作分享', icon: Users, badge: userStats?.collaborationsCount || 0 },
    { id: 'settings' as TabType, label: '账号设置', icon: Settings },
  ]

  const displayName = currentUser?.nickname || currentUser?.username || '用户'

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-carbon-800 to-carbon-700 rounded-2xl p-6 mb-6 border border-carbon-500/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-moto-orange/20 flex items-center justify-center text-moto-orange">
              <User size={40} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white font-orbitron tracking-wide">{displayName}</h1>
              <p className="text-moto-steel mt-1">@{currentUser?.username}</p>
              {currentUser?.bio && <p className="text-moto-silver text-sm mt-2">{currentUser.bio}</p>}
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-moto-orange font-orbitron">{userStats?.archivesCount || 0}</div>
                <div className="text-xs text-moto-steel mt-1">改装档案</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-moto-orange font-orbitron">
                  {(userStats?.favoriteParts || 0) + (userStats?.favoriteTemplates || 0)}
                </div>
                <div className="text-xs text-moto-steel mt-1">收藏</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-moto-orange font-orbitron">
                  ¥{(userStats?.totalSpent || 0).toLocaleString()}
                </div>
                <div className="text-xs text-moto-steel mt-1">改装投入</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-moto-orange/10 text-moto-orange'
                      : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-moto-orange/20 text-moto-orange rounded-full font-orbitron">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                <div className="flex items-center justify-between p-6 border-b border-carbon-500/30">
                  <h2 className="text-lg font-semibold text-white">个人信息</h2>
                  {!editingProfile ? (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-moto-orange/10 text-moto-orange rounded-lg hover:bg-moto-orange/20 transition-colors"
                    >
                      <Edit3 size={16} />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-carbon-700 text-moto-steel rounded-lg hover:bg-carbon-600 transition-colors"
                      >
                        <X size={16} />
                        取消
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-moto-orange text-white rounded-lg hover:bg-moto-orange/90 transition-colors"
                      >
                        <Save size={16} />
                        保存
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-moto-steel mb-2">昵称</label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.nickname}
                          onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                        />
                      ) : (
                        <p className="text-white">{currentUser?.nickname || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2 flex items-center gap-2">
                        <Mail size={14} /> 邮箱
                      </label>
                      <p className="text-white">{currentUser?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2 flex items-center gap-2">
                        <Phone size={14} /> 手机号
                      </label>
                      {editingProfile ? (
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                        />
                      ) : (
                        <p className="text-white">{currentUser?.phone || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2">性别</label>
                      {editingProfile ? (
                        <select
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                        >
                          <option value="">未设置</option>
                          <option value="male">男</option>
                          <option value="female">女</option>
                        </select>
                      ) : (
                        <p className="text-white">{userProfile?.gender === 'male' ? '男' : userProfile?.gender === 'female' ? '女' : '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2 flex items-center gap-2">
                        <MapPin size={14} /> 所在地
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                          placeholder="例如：北京市"
                        />
                      ) : (
                        <p className="text-white">{userProfile?.location || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2 flex items-center gap-2">
                        <Bike size={14} /> 车型
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.bikeModel}
                          onChange={(e) => setProfileForm({ ...profileForm, bikeModel: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                          placeholder="例如：XCF-180"
                        />
                      ) : (
                        <p className="text-white">{userProfile?.bikeModel || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2">骑行风格</label>
                      {editingProfile ? (
                        <select
                          value={profileForm.ridingStyle}
                          onChange={(e) => setProfileForm({ ...profileForm, ridingStyle: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                        >
                          <option value="">未设置</option>
                          <option value="street">街跑</option>
                          <option value="sport">运动</option>
                          <option value="touring">旅行</option>
                          <option value="offroad">越野</option>
                          <option value="basic">基础通勤</option>
                        </select>
                      ) : (
                        <p className="text-white">
                          {userProfile?.ridingStyle === 'street' ? '街跑' : userProfile?.ridingStyle === 'sport' ? '运动' : userProfile?.ridingStyle === 'touring' ? '旅行' : userProfile?.ridingStyle === 'offroad' ? '越野' : userProfile?.ridingStyle === 'basic' ? '基础通勤' : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-2 flex items-center gap-2">
                        <Award size={14} /> 骑行经验
                      </label>
                      {editingProfile ? (
                        <select
                          value={profileForm.ridingExperience}
                          onChange={(e) => setProfileForm({ ...profileForm, ridingExperience: e.target.value })}
                          className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                        >
                          <option value="">未设置</option>
                          <option value="1年以下">1年以下</option>
                          <option value="1-3年">1-3年</option>
                          <option value="3-5年">3-5年</option>
                          <option value="5年以上">5年以上</option>
                        </select>
                      ) : (
                        <p className="text-white">{userProfile?.ridingExperience || '-'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-2">个人简介</label>
                    {editingProfile ? (
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50 resize-none"
                        placeholder="介绍一下自己..."
                      />
                    ) : (
                      <p className="text-white">{currentUser?.bio || '暂无介绍'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                <div className="flex items-center justify-between p-6 border-b border-carbon-500/30">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Heart className="text-moto-orange" size={20} />
                    我的收藏
                  </h2>
                  <div className="flex gap-2">
                    {(['all', 'part', 'template', 'selection'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFavFilter(type)
                          fetchUserFavorites(type === 'all' ? undefined : type)
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          favFilter === type
                            ? 'bg-moto-orange text-white'
                            : 'bg-carbon-700 text-moto-steel hover:text-moto-silver'
                        }`}
                      >
                        {type === 'all' ? '全部' : type === 'part' ? '配件' : type === 'template' ? '模板' : '方案'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  {userDataLoading ? (
                    <div className="text-center py-12 text-moto-steel">加载中...</div>
                  ) : userFavorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-moto-steel/30 mx-auto mb-4" />
                      <p className="text-moto-steel">暂无收藏</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userFavorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="bg-carbon-900 rounded-lg border border-carbon-500/30 overflow-hidden hover:border-moto-orange/30 transition-all group"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-xs px-2 py-1 bg-moto-orange/10 text-moto-orange rounded">
                                {fav.targetType === 'part' ? '配件' : fav.targetType === 'template' ? '模板' : '方案'}
                              </span>
                              <button
                                onClick={() => toggleUserFavorite(fav.targetType, fav.targetId, fav.targetName)}
                                className="p-1.5 rounded-lg text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <h3 className="text-white font-medium mb-1">
                              {fav.detail?.name || fav.targetName || fav.targetId}
                            </h3>
                            {fav.detail?.brand && (
                              <p className="text-sm text-moto-steel">{fav.detail.brand}</p>
                            )}
                            {fav.detail?.price !== undefined && (
                              <p className="text-moto-orange font-orbitron mt-2">¥{fav.detail.price.toLocaleString()}</p>
                            )}
                            <p className="text-xs text-moto-steel/70 mt-2 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(fav.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                <div className="flex items-center justify-between p-6 border-b border-carbon-500/30">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <History className="text-moto-orange" size={20} />
                    浏览记录
                  </h2>
                  {userBrowsingHistory.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('确定清空所有浏览记录？')) {
                          clearBrowsingHistory()
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={16} />
                      清空记录
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {userDataLoading ? (
                    <div className="text-center py-12 text-moto-steel">加载中...</div>
                  ) : userBrowsingHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-moto-steel/30 mx-auto mb-4" />
                      <p className="text-moto-steel">暂无浏览记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userBrowsingHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 bg-carbon-900 rounded-lg border border-carbon-500/30 hover:border-moto-orange/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-carbon-700 flex items-center justify-center text-moto-orange shrink-0">
                            {item.targetType === 'part' ? <Sparkles size={20} /> : item.targetType === 'template' ? <FolderKanban size={20} /> : <TrendingUp size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded">
                                {item.targetType === 'part' ? '配件' : item.targetType === 'template' ? '模板' : '方案'}
                              </span>
                              <h3 className="text-white font-medium truncate">
                                {item.detail?.name || item.targetName || item.targetId}
                              </h3>
                            </div>
                            <p className="text-xs text-moto-steel mt-1 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(item.viewedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => removeBrowsingHistoryItem(item.id)}
                            className="p-2 rounded-lg text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'archives' && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                <div className="flex items-center justify-between p-6 border-b border-carbon-500/30">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FolderKanban className="text-moto-orange" size={20} />
                    改装档案
                  </h2>
                  <button
                    onClick={async () => {
                      const title = prompt('请输入档案名称：')
                      if (title) {
                        await createArchive({
                          title,
                          bikeModel: userProfile?.bikeModel || 'xcf-180',
                          items: [],
                          totalCost: 0,
                        })
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-moto-orange text-white rounded-lg hover:bg-moto-orange/90 transition-colors"
                  >
                    <Plus size={16} />
                    新建档案
                  </button>
                </div>
                <div className="p-6">
                  {userDataLoading ? (
                    <div className="text-center py-12 text-moto-steel">加载中...</div>
                  ) : userArchives.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderKanban className="w-12 h-12 text-moto-steel/30 mx-auto mb-4" />
                      <p className="text-moto-steel mb-4">暂无改装档案</p>
                      <button
                        onClick={async () => {
                          const title = prompt('请输入档案名称：')
                          if (title) {
                            await createArchive({
                              title,
                              bikeModel: userProfile?.bikeModel || 'xcf-180',
                              items: [],
                              totalCost: 0,
                            })
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-moto-orange text-white rounded-lg hover:bg-moto-orange/90 transition-colors"
                      >
                        <Plus size={16} />
                        创建第一个档案
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userArchives.map((archive: ModificationArchive) => (
                        <div
                          key={archive.id}
                          className="bg-carbon-900 rounded-lg border border-carbon-500/30 overflow-hidden hover:border-moto-orange/30 transition-all"
                        >
                          <div className="h-32 bg-gradient-to-br from-moto-orange/20 to-carbon-700 flex items-center justify-center">
                            <Bike className="w-16 h-16 text-moto-orange/40" />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-white font-medium">{archive.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                archive.status === 'published'
                                  ? 'bg-green-500/20 text-green-400'
                                  : archive.status === 'archived'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {archive.status === 'published' ? '已发布' : archive.status === 'archived' ? '已归档' : '草稿'}
                              </span>
                            </div>
                            {archive.description && (
                              <p className="text-sm text-moto-steel line-clamp-2 mb-3">{archive.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-moto-steel mb-3">
                              <span className="flex items-center gap-1">
                                <Tag size={12} />
                                ¥{archive.totalCost.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {archive.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart size={12} />
                                {archive.likes}
                              </span>
                            </div>
                            {archive.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {archive.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 pt-3 border-t border-carbon-500/30">
                              <button
                                onClick={async () => {
                                  const resource = await createSharedResource({
                                    resourceType: 'archive',
                                    resourceId: archive.id,
                                    resourceName: archive.title,
                                  })
                                  if (resource) {
                                    const username = prompt('请输入协作用户名：')
                                    if (username) {
                                      await inviteCollaborator(resource.id, { username, permission: 'view' })
                                    }
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-moto-steel hover:text-moto-orange hover:bg-moto-orange/10 rounded transition-colors"
                              >
                                <Share2 size={14} />
                                协作
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('确定删除该档案？')) {
                                    deleteArchive(archive.id)
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'collaborations' && (
              <div className="space-y-6">
                <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                  <div className="p-6 border-b border-carbon-500/30">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="text-moto-orange" size={20} />
                      我创建的协作
                    </h2>
                  </div>
                  <div className="p-6">
                    {userDataLoading ? (
                      <div className="text-center py-8 text-moto-steel">加载中...</div>
                    ) : userSharedResources.owned.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 text-moto-steel/30 mx-auto mb-3" />
                        <p className="text-moto-steel text-sm">暂无创建的协作项目</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSharedResources.owned.map((resource) => (
                          <div key={resource.id} className="bg-carbon-900 rounded-lg p-4 border border-carbon-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-moto-orange/10 flex items-center justify-center text-moto-orange">
                                  <Share2 size={18} />
                                </div>
                                <div>
                                  <h3 className="text-white font-medium">{resource.resourceName}</h3>
                                  <p className="text-xs text-moto-steel">
                                    {resource.resourceType === 'archive' ? '改装档案' : '改装方案'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  const username = prompt('请输入协作用户名：')
                                  if (username) {
                                    await inviteCollaborator(resource.id, { username, permission: 'view' })
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-moto-orange/10 text-moto-orange rounded-lg hover:bg-moto-orange/20 transition-colors"
                              >
                                <Plus size={14} />
                                邀请
                              </button>
                            </div>
                            {resource.collaborators.length > 0 ? (
                              <div className="space-y-2">
                                {resource.collaborators.map((collab) => (
                                  <div key={collab.userId} className="flex items-center justify-between py-2 px-3 bg-carbon-800 rounded">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-carbon-700 flex items-center justify-center text-moto-steel text-sm">
                                        {(collab.nickname || collab.username).charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-white text-sm">{collab.nickname || collab.username}</p>
                                        <p className="text-xs text-moto-steel">@{collab.username}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-1 bg-carbon-700 text-moto-steel rounded">
                                        {collab.permission === 'admin' ? '管理员' : collab.permission === 'edit' ? '可编辑' : '仅查看'}
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (confirm('移除该协作者？')) {
                                            removeCollaborator(resource.id, collab.userId)
                                          }
                                        }}
                                        className="p-1.5 text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-moto-steel text-center py-2">暂无协作者</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                  <div className="p-6 border-b border-carbon-500/30">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <ChevronRight className="text-moto-orange" size={20} />
                      我参与的协作
                    </h2>
                  </div>
                  <div className="p-6">
                    {userDataLoading ? (
                      <div className="text-center py-8 text-moto-steel">加载中...</div>
                    ) : userSharedResources.collaborated.length === 0 ? (
                      <div className="text-center py-8">
                        <ChevronRight className="w-10 h-10 text-moto-steel/30 mx-auto mb-3" />
                        <p className="text-moto-steel text-sm">暂无参与的协作项目</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userSharedResources.collaborated.map((resource) => (
                          <div key={resource.id} className="flex items-center gap-4 p-4 bg-carbon-900 rounded-lg border border-carbon-500/30">
                            <div className="w-10 h-10 rounded-lg bg-moto-orange/10 flex items-center justify-center text-moto-orange">
                              <Share2 size={18} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">{resource.resourceName}</h3>
                              <p className="text-xs text-moto-steel">
                                {resource.resourceType === 'archive' ? '改装档案' : '改装方案'}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-moto-orange/10 text-moto-orange rounded">
                              参与中
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
                <div className="p-6 border-b border-carbon-500/30">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Settings className="text-moto-orange" size={20} />
                    修改密码
                  </h2>
                </div>
                <div className="p-6 max-w-md space-y-5">
                  <div>
                    <label className="block text-sm text-moto-steel mb-2">原密码</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => { setOldPassword(e.target.value); setPasswordError(''); setPasswordSuccess('') }}
                        className="w-full px-4 py-2.5 pr-12 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel hover:text-moto-silver"
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-2">新密码</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess('') }}
                        className="w-full px-4 py-2.5 pr-12 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel hover:text-moto-silver"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-2">确认新密码</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess('') }}
                      className="w-full px-4 py-2.5 bg-carbon-900 border border-carbon-500/30 rounded-lg text-white focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  {passwordError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                      {passwordSuccess}
                    </div>
                  )}
                  <button
                    onClick={handleChangePassword}
                    className="w-full py-3 bg-moto-orange hover:bg-moto-orange/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    修改密码
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
