<template>
  <div class="w-full h-full pt-[120px] mobile:pt-[100px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="w-full mb-6">
        <div class="relative w-full">
          <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search users..." 
            class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-full">
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/30">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Username</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Quota</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Used</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Files</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="user in filteredUsers" :key="user.user_id">
                <tr class="border-b border-[#444] hover:bg-black/20 transition-colors">
                  <td class="px-4 py-3 text-sm font-medium">{{ user.username }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span 
                      :class="[
                        'px-2 py-1 rounded-full text-xs font-medium',
                        user.is_admin 
                          ? 'bg-primary-button/20 text-primary-button' 
                          : 'bg-gray-600/20 text-gray-400'
                      ]">
                      {{ user.is_admin ? 'Admin' : 'User' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ user.quotaFormatted }}</td>
                  <td class="px-4 py-3 text-sm">{{ user.usedFormatted }}</td>
                  <td class="px-4 py-3 text-sm">
                    {{ new Date(user.creation_date).toLocaleDateString() }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">{{ user.files.length }}</span>
                      <button 
                        @click="toggleUserFiles(user.user_id)"
                        class="text-primary-button hover:text-primary-button/80 transition-colors">
                        <span class="material-icons-outlined text-sm">insert_drive_file</span>
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button @click="toggleAdminStatus(user.user_id, user.username, user.is_admin)" 
                            class="bg-purple-500 text-white w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Toggle Admin Status">
                        <span class="material-icons text-xs">{{ user.is_admin ? 'admin_panel_settings' : 'person_add' }}</span>
                    </button>
                    <button @click="handlePasswordChange(user.user_id, user.username)" 
                            class="bg-primary-button text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Password">
                        <span class="material-icons text-xs">lock</span>
                    </button>
                    <button @click="handleUsernameChange(user.user_id, user.username)" 
                            class="bg-secondary-button text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Username">
                        <span class="material-icons text-xs">edit</span>
                    </button>
                    <button @click="handleQuotaChange(user.user_id, user.username, user.quota)" 
                            class="bg-yellow-500 text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Quota">
                        <span class="material-icons text-xs">storage</span>
                    </button>
                    <button @click="handleDeleteUserClick(user.user_id, user.username)" 
                            class="bg-error text-white w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Delete User">
                        <span class="material-icons text-xs">delete</span>
                    </button>
                </div>
              </td>
                </tr>
                <!-- User files expansion -->
                <tr v-if="expandedUsers.includes(user.user_id)">
                  <td colspan="7" class="px-4 py-0">
                    <div class="bg-black/10 rounded-lg p-4 mb-2">
                      <h4 class="text-sm font-medium text-gray-300 mb-3">Files for {{ user.username }}</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="file in user.files" 
                          :key="file.id"
                          class="flex items-center justify-between p-2 bg-black/20 rounded">
                          <div class="flex items-center gap-3">
                            <span class="text-xs text-gray-400">{{ file.code }}</span>
                            <span class="text-sm">{{ file.originalname }}</span>
                            <span class="text-xs text-gray-400">{{ file.sizeFormatted }}</span>
                            <span class="text-xs text-gray-400">{{ file.dateFormatted }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button 
                              @click="downloadFile(file.code)"
                              class="text-secondary-button hover:text-secondary-button/80 transition-colors">
                              <span class="material-icons-outlined text-sm">download</span>
                            </button>
                            <button 
                              @click="handleDeleteFile(file)"
                              class="text-error hover:text-error/80 transition-colors">
                              <span class="material-icons-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                        <div v-if="user.files.length === 0" class="text-center text-gray-500 py-2">
                          No files found
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400">
            No users found
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Dialog -->
    <div v-if="editDialog.isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-black/90 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">Edit User: {{ editDialog.user?.username }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input 
              v-model="editDialog.newUsername"
              type="text" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new username">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input 
              v-model="editDialog.newPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new password (leave empty to keep current)">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Quota (bytes)</label>
            <input 
              v-model.number="editDialog.newQuota"
              type="number" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter quota in bytes">
          </div>

          <div>
            <label class="flex items-center gap-2 text-gray-300">
              <input 
                v-model="editDialog.isAdmin"
                type="checkbox" 
                class="w-4 h-4 text-primary-button bg-black/30 border-[#444] rounded focus:ring-primary-button">
              <span class="text-sm font-medium">Admin User</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeEditDialog"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleSaveUser"
            class="px-4 py-2 bg-primary-button text-white rounded-lg hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Change Role Dialog -->
    <div v-if="changeRoleDialog.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">
            {{ changeRoleDialog.user?.is_admin ? 'Demote to User' : 'Promote to Admin' }}
          </h3>
          <div :class="[
            'w-12 h-12 rounded-full flex items-center justify-center',
            changeRoleDialog.user?.is_admin ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
          ]">
            <span class="material-icons text-xl">{{ changeRoleDialog.user?.is_admin ? 'person_remove' : 'admin_panel_settings' }}</span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 mb-3 text-lg">
            Are you sure you want to {{ changeRoleDialog.user?.is_admin ? 'demote' : 'promote' }} <span class="text-primary-button font-semibold">{{ changeRoleDialog.user?.username }}</span> {{ changeRoleDialog.user?.is_admin ? 'from admin to user' : 'to admin' }}?
          </p>
          <p class="text-gray-400 text-sm leading-relaxed">
            {{ changeRoleDialog.user?.is_admin ? 'This will remove the user\'s administrative privileges and they will no longer be able to manage users, files, or system settings.' : 'This will grant the user full administrative privileges to manage all users, files, and system settings.' }}
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">lock</span>
              <input 
                v-model="changeRoleDialog.adminPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter admin password">
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button 
            @click="closeChangeRoleDialog"
            class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium">
            Cancel
          </button>
          <button 
            @click="handleChangeRole"
            :class="[
              'px-6 py-3 rounded-xl transition-all font-medium shadow-lg',
              changeRoleDialog.user?.is_admin 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
            ]">
            {{ changeRoleDialog.user?.is_admin ? 'Demote to User' : 'Promote to Admin' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <div v-if="changePasswordDialog.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">Change Password</h3>
          <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span class="material-icons text-xl text-blue-400">lock</span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 text-lg">
            Change password for <span class="text-primary-button font-semibold">{{ changePasswordDialog.user?.username }}</span>
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">lock</span>
              <input 
                v-model="changePasswordDialog.adminPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter admin password">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">password</span>
              <input 
                v-model="changePasswordDialog.newPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter new password">
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button 
            @click="closeChangePasswordDialog"
            class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium">
            Cancel
          </button>
          <button 
            @click="handleChangePassword"
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg">
            Change Password
          </button>
        </div>
      </div>
    </div>

    <!-- Change Username Dialog -->
    <div v-if="changeUsernameDialog.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">Change Username</h3>
          <div class="w-12 h-12 rounded-full bg-secondary-button/20 flex items-center justify-center">
            <span class="material-icons text-xl text-secondary-button">edit</span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 text-lg">
            Change username for <span class="text-primary-button font-semibold">{{ changeUsernameDialog.user?.username }}</span>
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">lock</span>
              <input 
                v-model="changeUsernameDialog.adminPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter admin password">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">New Username</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">person</span>
              <input 
                v-model="changeUsernameDialog.newUsername"
                type="text" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter new username">
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button 
            @click="closeChangeUsernameDialog"
            class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium">
            Cancel
          </button>
          <button 
            @click="handleChangeUsername"
            class="px-6 py-3 bg-gradient-to-r from-secondary-button to-secondary-button/80 text-black rounded-xl hover:from-secondary-button/90 hover:to-secondary-button transition-all font-medium shadow-lg">
            Change Username
          </button>
        </div>
      </div>
    </div>

    <!-- Change Quota Dialog -->
    <div v-if="changeQuotaDialog.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">Change Quota</h3>
          <div class="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span class="material-icons text-xl text-yellow-400">storage</span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 mb-2 text-lg">
            Change quota for <span class="text-primary-button font-semibold">{{ changeQuotaDialog.user?.username }}</span>
          </p>
          <div class="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <p class="text-gray-400 text-sm">Current quota:</p>
            <p class="text-white font-semibold">{{ changeQuotaDialog.user?.quotaFormatted }}</p>
          </div>
          <p class="text-gray-400 text-sm mt-3 leading-relaxed">
            This will affect the user's upload limits. If quota is exceeded, the user cannot upload new files. Please verify the new quota carefully!
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">lock</span>
              <input 
                v-model="changeQuotaDialog.adminPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter admin password">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">New Quota</label>
            <div class="flex gap-3">
              <div class="flex-1 relative">
                <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">sd_storage</span>
                <input 
                  v-model="changeQuotaDialog.newQuotaValue"
                  type="number" 
                  class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                  placeholder="Enter quota value"
                  :disabled="changeQuotaDialog.newQuotaUnit === 'Unlimited'">
              </div>
              <select 
                v-model="changeQuotaDialog.newQuotaUnit"
                class="px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all">
                <option value="Unlimited">Unlimited</option>
                <option value="B">B</option>
                <option value="kB">kB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button 
            @click="closeChangeQuotaDialog"
            class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium">
            Cancel
          </button>
          <button 
            @click="handleChangeQuota"
            class="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-medium shadow-lg">
            Change Quota
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Dialog -->
    <div v-if="deleteUserDialog.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">Delete User</h3>
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span class="material-icons text-xl text-red-400">delete</span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 mb-3 text-lg">
            Are you sure you want to delete user <span class="text-red-400 font-semibold">{{ deleteUserDialog.user?.username }}</span>?
          </p>
          <div class="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <p class="text-red-400 text-sm font-medium mb-1">⚠️ Warning</p>
            <p class="text-gray-300 text-sm leading-relaxed">
              This action cannot be undone. The user will be permanently deleted and all their files will be removed.
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div class="relative">
              <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">lock</span>
              <input 
                v-model="deleteUserDialog.adminPassword"
                type="password" 
                class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                placeholder="Enter admin password to confirm">
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button 
            @click="closeDeleteUserDialog"
            class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium">
            Cancel
          </button>
          <button 
            @click="handleConfirmDeleteUser"
            class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg">
            Delete User
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'
import { useNotification } from '../composables/useNotification.js'

export default {
  name: 'UsersView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      users, 
      loading, 
      error, 
      loadUsers, 
      deleteUser, 
      deleteFile,
      changeUserPassword,
      changeUsername,
      changeUserQuota,
      changeUserAdminStatus
    } = useAdmin()
    
    const { showNotification } = useNotification()

    const searchQuery = ref('')
    const expandedUsers = ref([])
    const editDialog = ref({
      isOpen: false,
      user: null,
      newUsername: '',
      newPassword: '',
      newQuota: '',
      isAdmin: false
    })
    const changeRoleDialog = ref({
      isOpen: false,
      user: null,
      isAdmin: false,
      adminPassword: ''
    })
    const changePasswordDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: '',
      newPassword: ''
    })
    const changeUsernameDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: '',
      newUsername: ''
    })

    const changeQuotaDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: '',
      newQuotaValue: null,
      newQuotaUnit: 'Unlimited'
    })
    const deleteUserDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: ''
    })

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.user_id.toString().includes(query)
      )
    })

    const toggleUserFiles = (userId) => {
      const index = expandedUsers.value.indexOf(userId)
      if (index > -1) {
        expandedUsers.value.splice(index, 1)
      } else {
        expandedUsers.value.push(userId)
      }
    }

    const handleDeleteUser = async (user) => {
      if (confirm(`Are you sure you want to delete user "${user.username}"? This will also delete all their files.`)) {
        const result = await deleteUser(props.token, user.user_id)
        if (result.success) {
          showNotification('User deleted successfully!', 'ok')
          await loadUsers(props.token)
        } else {
          showNotification('Failed to delete user: ' + result.error, 'error')
        }
      }
    }

    const handleDeleteFile = async (file) => {
      if (confirm(`Are you sure you want to delete file "${file.originalname}"?`)) {
        const result = await deleteFile(props.token, file.code)
        if (result.success) {
          showNotification('File deleted successfully!', 'ok')
          await loadUsers(props.token)
        } else {
          showNotification('Failed to delete file: ' + result.error, 'error')
        }
      }
    }

    const downloadFile = (code) => {
      const link = document.createElement("a")
      link.href = "/files/" + code
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showNotification('Download started!', 'info')
    }

    const openEditDialog = (user) => {
      editDialog.value = {
        isOpen: true,
        user: user,
        newUsername: user.username,
        newPassword: '',
        newQuota: user.quota,
        isAdmin: user.is_admin
      }
    }

    const closeEditDialog = () => {
      editDialog.value.isOpen = false
    }

    const handleSaveUser = async () => {
      const { user, newUsername, newPassword, newQuota, isAdmin } = editDialog.value
      
      let hasChanges = false
      const promises = []
      
      // Check for username change
      if (newUsername !== user.username) {
        hasChanges = true
        promises.push(changeUsername(props.token, user.user_id, newUsername))
      }
      
      // Check for password change
      if (newPassword) {
        hasChanges = true
        promises.push(changeUserPassword(props.token, user.user_id, newPassword))
      }
      
      // Check for quota change
      if (newQuota !== user.quota) {
        hasChanges = true
        promises.push(changeUserQuota(props.token, user.user_id, newQuota))
      }
      
      // Check for admin status change
      if (isAdmin !== user.is_admin) {
        hasChanges = true
        promises.push(changeUserAdminStatus(props.token, user.user_id, isAdmin))
      }
      
      if (!hasChanges) {
        showNotification('No changes to save', 'info')
        closeEditDialog()
        return
      }
      
      try {
        const results = await Promise.all(promises)
        const failed = results.filter(result => !result.success)
        
        if (failed.length === 0) {
          showNotification('User updated successfully!', 'ok')
          closeEditDialog()
          await loadUsers(props.token)
        } else {
          showNotification('Some changes failed: ' + failed.map(f => f.error).join(', '), 'error')
        }
      } catch (error) {
        showNotification('Failed to update user: ' + error.message, 'error')
      }
    }

    const toggleAdminStatus = (userId, username, currentIsAdmin) => {
      openChangeRoleDialog({ user_id: userId, username, is_admin: currentIsAdmin })
    }

    const handlePasswordChange = (userId, username) => {
      openChangePasswordDialog({ user_id: userId, username })
    }

    const handleUsernameChange = (userId, currentUsername) => {
      openChangeUsernameDialog({ user_id: userId, username: currentUsername })
    }

    const handleQuotaChange = (userId, username, currentQuota) => {
      // Find the full user object from the users array which includes formatted properties
      const fullUser = users.value.find(u => u.user_id === userId)
      openChangeQuotaDialog(fullUser || { user_id: userId, username, quota: currentQuota })
    }

    const handleDeleteUserClick = (userId, username) => {
      openDeleteUserDialog({ user_id: userId, username })
    }

    const openChangeRoleDialog = (user) => {
      changeRoleDialog.value = {
        isOpen: true,
        user: user,
        isAdmin: user.is_admin,
        adminPassword: ''
      }
    }

    const closeChangeRoleDialog = () => {
      changeRoleDialog.value.isOpen = false
    }

    const handleChangeRole = async () => {
      const { user, adminPassword } = changeRoleDialog.value
      
      if (!adminPassword) {
        showNotification('Admin password is required', 'error')
        return
      }
      
      // Automatically toggle to the opposite of current status
      const newAdminStatus = !user.is_admin
      
      const result = await changeUserAdminStatus(props.token, user.user_id, newAdminStatus)
      if (result.success) {
        showNotification(`User ${newAdminStatus ? 'promoted to' : 'demoted from'} admin successfully!`, 'ok')
        closeChangeRoleDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to change role: ' + result.error, 'error')
      }
    }

    const openChangePasswordDialog = (user) => {
      changePasswordDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: '',
        newPassword: ''
      }
    }

    const closeChangePasswordDialog = () => {
      changePasswordDialog.value.isOpen = false
    }

    const handleChangePassword = async () => {
      const { user, adminPassword, newPassword } = changePasswordDialog.value
      
      if (!adminPassword || !newPassword) {
        showNotification('Both passwords are required', 'error')
        return
      }
      
      const result = await changeUserPassword(props.token, user.user_id, newPassword)
      if (result.success) {
        showNotification('Password changed successfully!', 'ok')
        closeChangePasswordDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to change password: ' + result.error, 'error')
      }
    }

    const openChangeUsernameDialog = (user) => {
      changeUsernameDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: '',
        newUsername: ''
      }
    }

    const closeChangeUsernameDialog = () => {
      changeUsernameDialog.value.isOpen = false
    }

    const handleChangeUsername = async () => {
      const { user, adminPassword, newUsername } = changeUsernameDialog.value
      
      if (!adminPassword || !newUsername) {
        showNotification('Admin password and new username are required', 'error')
        return
      }
      
      if (newUsername === user.username) {
        showNotification('New username must be different from current username', 'error')
        return
      }
      
      const result = await changeUsername(props.token, user.user_id, newUsername)
      if (result.success) {
        showNotification('Username changed successfully!', 'ok')
        closeChangeUsernameDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to change username: ' + result.error, 'error')
      }
    }

    const openChangeQuotaDialog = (user) => {
      changeQuotaDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: '',
        newQuotaValue: null,
        newQuotaUnit: 'Unlimited'
      }
    }

    const closeChangeQuotaDialog = () => {
      changeQuotaDialog.value.isOpen = false
    }

    const handleChangeQuota = async () => {
      const { user, adminPassword, newQuotaValue, newQuotaUnit } = changeQuotaDialog.value
      
      if (!adminPassword) {
        showNotification('Admin password is required', 'error')
        return
      }
      
      let newQuotaInBytes
      if (newQuotaUnit === 'Unlimited') {
        newQuotaInBytes = 0 // 0 means unlimited in the system
      } else {
        if (!newQuotaValue || newQuotaValue <= 0) {
          showNotification('Please enter a valid quota value', 'error')
          return
        }
        
        // Convert to bytes
        const multipliers = {
          'B': 1,
          'kB': 1024,
          'MB': 1024 * 1024,
          'GB': 1024 * 1024 * 1024,
          'TB': 1024 * 1024 * 1024 * 1024
        }
        newQuotaInBytes = newQuotaValue * multipliers[newQuotaUnit]
      }
      
      const result = await changeUserQuota(props.token, user.user_id, newQuotaInBytes)
      if (result.success) {
        showNotification('Quota changed successfully!', 'ok')
        closeChangeQuotaDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to change quota: ' + result.error, 'error')
      }
    }

    const openDeleteUserDialog = (user) => {
      deleteUserDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: ''
      }
    }

    const closeDeleteUserDialog = () => {
      deleteUserDialog.value.isOpen = false
    }

    const handleConfirmDeleteUser = async () => {
      const { user, adminPassword } = deleteUserDialog.value
      
      if (!adminPassword) {
        showNotification('Admin password is required', 'error')
        return
      }
      
      const result = await deleteUser(props.token, user.user_id)
      if (result.success) {
        showNotification('User deleted successfully!', 'ok')
        closeDeleteUserDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to delete user: ' + result.error, 'error')
      }
    }

    onMounted(() => {
      loadUsers(props.token)
    })

    return {
      users,
      loading,
      error,
      searchQuery,
      expandedUsers,
      editDialog,
      changeRoleDialog,
      changePasswordDialog,
      changeUsernameDialog,
      changeQuotaDialog,
      deleteUserDialog,
      filteredUsers,
      toggleUserFiles,
      handleDeleteUser,
      handleDeleteFile,
      downloadFile,
      openEditDialog,
      closeEditDialog,
      handleSaveUser,
      toggleAdminStatus,
      handlePasswordChange,
      handleUsernameChange,
      handleQuotaChange,
      handleDeleteUserClick,
      openChangeRoleDialog,
      closeChangeRoleDialog,
      handleChangeRole,
      openChangePasswordDialog,
      closeChangePasswordDialog,
      handleChangePassword,
      openChangeUsernameDialog,
      closeChangeUsernameDialog,
      handleChangeUsername,
      openChangeQuotaDialog,
      closeChangeQuotaDialog,
      handleChangeQuota,
      openDeleteUserDialog,
      closeDeleteUserDialog,
      handleConfirmDeleteUser
    }
  }
}
</script>
