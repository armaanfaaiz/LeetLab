import React from 'react'
import { User, Mail } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const ProfilePage = () => {
  const { authUser } = useAuthStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-base-100/50 backdrop-blur-lg border border-gray-200/10 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-base-content/60">Name</p>
              <p className="text-lg font-semibold">{authUser?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-base-content/60">Email</p>
              <p className="text-lg font-semibold">{authUser?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200/10">
            <p className="text-sm text-base-content/60">Role</p>
            <p className="text-lg font-semibold">{authUser?.role || 'USER'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
