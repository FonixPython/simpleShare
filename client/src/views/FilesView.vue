<template>
  <div class="w-full h-full pt-[120px] mobile:pt-[100px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="w-full mb-6">
        <div class="relative w-full">
          <span
            class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >search</span
          >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search files..."
            class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-full"
          />
        </div>
      </div>

      <!-- Batch Actions Bar -->
      <div
        v-if="selectedItems.size > 0"
        class="mb-6 p-3 bg-primary-button/20 border border-primary-button/30 rounded-lg flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium">
            {{ selectedItems.size }} item{{ selectedItems.size !== 1 ? 's' : '' }} selected
          </span>
          <button
            @click="clearSelection"
            class="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="downloadSelected"
            class="bg-secondary-button text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <span class="material-icons-outlined text-sm">download</span>
            Download
          </button>
          <button
            @click="deleteSelected"
            class="bg-error text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <span class="material-icons-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>

      <div
        v-if="loading || searchLoading"
        class="flex justify-center items-center py-12"
      >
        <span
          class="material-icons-outlined animate-spin-slow text-4xl text-primary-button"
          >hourglass_empty</span
        >
      </div>

      <div
        v-else-if="error"
        class="bg-error/20 border border-error rounded-lg p-4 text-error text-center"
      >
        {{ error }}
      </div>

      <div
        v-else
        class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/30">
              <tr>
                <th
                  class="px-4 py-3 text-center text-sm font-medium text-gray-300 w-[40px]"
                >
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                  />
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Code
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Filename
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Owner
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Size
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Date
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-medium text-gray-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="file in filteredFiles" :key="file.code">
                <tr
                  class="border-b border-[#444] hover:bg-black/20 transition-colors"
                  :class="{ 
                    'bg-blue-900/10': file.type === 'group',
                    'bg-primary-button/20': isItemSelected(file.code)
                  }"
                  @click="file.type === 'group' ? toggleGroup(file.code) : null"
                >
                  <td class="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      :checked="isItemSelected(file.code)"
                      @change="toggleItemSelection(file.code)"
                      @click.stop
                      class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                    />
                  </td>
                  <td class="px-4 py-3 text-sm font-mono">
                    <div class="flex items-center gap-2">
                      <span
                        v-if="file.type === 'group'"
                        class="material-icons-outlined text-blue-400 text-sm"
                      >
                        {{
                          isGroupExpanded(file.code)
                            ? "expand_more"
                            : "chevron_right"
                        }}
                      </span>
                      <span v-else></span>
                      {{ file.code }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex items-center gap-2">
                      <span
                        class="material-icons-outlined text-sm"
                        :class="
                          file.type === 'group'
                            ? 'text-blue-400'
                            : 'text-gray-400'
                        "
                      >
                        {{
                          file.type === "group" ? "folder" : getFileIcon(file)
                        }}
                      </span>
                      {{ file.name }}
                      <span
                        v-if="file.type === 'group'"
                        class="text-xs text-gray-400"
                        >({{ getFileCount(file) }} files)</span
                      >
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="
                        file.type === 'group'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      "
                    >
                      {{ file.type === "group" ? "Group" : "File" }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ file.username }}</td>
                  <td class="px-4 py-3 text-sm">{{ file.sizeFormatted }}</td>
                  <td class="px-4 py-3 text-sm">{{ file.dateFormatted }}</td>
                  <td class="px-4 py-3 text-sm text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        v-if="file.type === 'group'"
                        @click.stop="downloadFile(file.code)"
                        class="bg-secondary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Download Group"
                      >
                        <span class="material-icons-outlined text-sm"
                          >download</span
                        >
                      </button>
                      <button
                        v-else
                        @click="downloadFile(file.code)"
                        class="bg-secondary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Download File"
                      >
                        <span class="material-icons-outlined text-sm"
                          >download</span
                        >
                      </button>
                      <button
                        v-if="file.type === 'file'"
                        @click.stop="openEditModal(file)"
                        class="bg-primary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Edit File"
                      >
                        <span class="material-icons-outlined text-sm"
                          >edit</span
                        >
                      </button>
                      <button
                        @click.stop="handleDeleteFile(file)"
                        class="bg-error text-white w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Delete"
                      >
                        <span class="material-icons-outlined text-sm"
                          >delete</span
                        >
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Nested files for expanded groups -->
                <tr
                  v-for="groupFile in getGroupFiles(file.code)"
                  :key="groupFile.code"
                  v-show="file.type === 'group' && isGroupExpanded(file.code)"
                  class="border-b border-[#444] hover:bg-black/10 bg-gray-900/20"
                  :class="{ 'bg-primary-button/20': isItemSelected(groupFile.code) }"
                >
                  <td class="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      :checked="isItemSelected(groupFile.code)"
                      @change="toggleItemSelection(groupFile.code)"
                      @click.stop
                      class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                    />
                  </td>
                  <td class="px-4 py-3 text-sm font-mono pl-12">
                    {{ groupFile.code }}
                  </td>
                  <td class="px-4 py-3 text-sm pl-12">
                    <div class="flex items-center gap-2">
                      <span
                        class="material-icons-outlined text-gray-400 text-sm"
                        >{{ getFileIcon(groupFile) }}</span
                      >
                      {{ groupFile.name }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span
                      class="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400"
                      >File</span
                    >
                  </td>
                  <td class="px-4 py-3 text-sm">{{ groupFile.username }}</td>
                  <td class="px-4 py-3 text-sm">
                    {{ groupFile.sizeFormatted }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {{ groupFile.dateFormatted }}
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="downloadFile(groupFile.code)"
                        class="bg-secondary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Download File"
                      >
                        <span class="material-icons-outlined text-sm"
                          >download</span
                        >
                      </button>
                      <button
                        @click.stop="openEditModal(groupFile)"
                        class="bg-primary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Edit File"
                      >
                        <span class="material-icons-outlined text-sm"
                          >edit</span
                        >
                      </button>
                      <button
                        @click.stop="handleDeleteFile(groupFile)"
                        class="bg-error text-white w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                        title="Delete"
                      >
                        <span class="material-icons-outlined text-sm"
                          >delete</span
                        >
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div
            v-if="filteredFiles.length === 0"
            class="text-center py-8 text-gray-400"
          >
            No files found
          </div>
        </div>
      </div>
    </div>

    <!-- Edit File Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click="closeEditModal"
    >
      <div
        class="bg-gray-900 border border-[#444] rounded-xl p-6 w-full max-w-md mx-4"
        @click.stop
      >
        <h3 class="text-xl font-semibold text-white mb-4">Edit File</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              File ID
            </label>
            <input
              v-model="editForm.fileId"
              type="text"
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new file ID"
            />
            <p class="text-xs text-gray-400 mt-1">
              Warning: Changing file ID may affect file accessibility
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Filename
            </label>
            <input
              v-model="editForm.fileName"
              type="text"
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new filename"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="closeEditModal"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleEditFile"
            :disabled="!editForm.fileId || !editForm.fileName || editLoading"
            class="px-4 py-2 bg-primary-button text-black rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="editLoading" class="material-icons-outlined animate-spin text-sm">
              hourglass_empty
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAdmin } from "../composables/useAdmin.js";
import { useNotification } from "../composables/useNotification.js";
import { useConfirm } from "../composables/useConfirm.js";

export default {
  name: "FilesView",
  props: {
    token: String,
  },
  setup(props) {
    const {
      allFiles,
      loading,
      error,
      loadAllFiles,
      deleteFile,
      formatBytes,
      getGroupDetails,
      updateFileId,
      updateFileName,
    } = useAdmin();

    const { showNotification } = useNotification();
    const { confirmDelete } = useConfirm();

    const searchQuery = ref("");
    const expandedGroups = ref(new Set());
    const groupFilesCache = ref(new Map());
    const searchLoading = ref(false);
    const matchingGroupCodes = ref(new Set());
    const selectedItems = ref(new Set());

    // Edit modal state
    const showEditModal = ref(false);
    const editLoading = ref(false);
    const currentEditingFile = ref(null);
    const editForm = ref({
      fileId: "",
      fileName: ""
    });

    // Function to search within all groups
    const searchInGroups = async (query) => {
      const results = new Set();

      if (!query) {
        matchingGroupCodes.value = new Set();
        return;
      }

      searchLoading.value = true;

      try {
        // Search in all groups
        for (const item of allFiles.value) {
          if (item.type === "group") {
            // Check if the group itself matches
            if (
              item.name.toLowerCase().includes(query) ||
              item.code.toLowerCase().includes(query) ||
              item.username.toLowerCase().includes(query)
            ) {
              results.add(item.code);
              continue;
            }

            // Load group files if not cached and search within them
            if (!groupFilesCache.value.has(item.code)) {
              const groupDetails = await getGroupDetails(
                props.token,
                item.code,
              );
              if (groupDetails) {
                groupFilesCache.value.set(item.code, groupDetails.files);
              }
            }

            // Check files within the group
            const groupFiles = getGroupFiles(item.code);
            if (
              groupFiles.some(
                (file) =>
                  file.name.toLowerCase().includes(query) ||
                  file.code.toLowerCase().includes(query) ||
                  file.username.toLowerCase().includes(query),
              )
            ) {
              results.add(item.code);
            }
          }
        }
      } catch (error) {
        console.error("Error searching in groups:", error);
      } finally {
        searchLoading.value = false;
        matchingGroupCodes.value = results;
      }
    };

    // Watch for search query changes
    watch(searchQuery, (newQuery) => {
      searchInGroups(newQuery);
    });

    const filteredFiles = computed(() => {
      let filtered = allFiles.value;

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();

        // Filter the results
        filtered = filtered.filter((file) => {
          if (file.type === "group") {
            // Include group if it matches or contains matching files
            return matchingGroupCodes.value.has(file.code);
          } else {
            // For individual files, check if they match
            return (
              file.name.toLowerCase().includes(query) ||
              file.code.toLowerCase().includes(query) ||
              file.username.toLowerCase().includes(query)
            );
          }
        });
      }

      // Default sort by date (newest first)
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      return filtered;
    });

    // Computed property for select all functionality
    const isAllSelected = computed(() => {
      const allItems = getAllItems();
      return allItems.length > 0 && allItems.every(item => selectedItems.value.has(item.code));
    });

    const handleDeleteFile = async (file) => {
      try {
        await confirmDelete(`file "${file.name}"`);
        const result = await deleteFile(props.token, file.code);
        if (result.success) {
          showNotification("File deleted successfully!", "ok");
          await loadAllFiles(props.token);
        } else {
          showNotification("Failed to delete file: " + result.error, "error");
        }
      } catch {
        // User cancelled the deletion
      }
    };

    const downloadFile = (code) => {
      const link = document.createElement("a");
      link.href = "/files/" + code;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Download started!", "info");
    };

    const toggleGroup = async (groupCode) => {
      if (expandedGroups.value.has(groupCode)) {
        expandedGroups.value.delete(groupCode);
      } else {
        expandedGroups.value.add(groupCode);
        // Load group files if not cached
        if (!groupFilesCache.value.has(groupCode)) {
          const groupDetails = await getGroupDetails(props.token, groupCode);
          if (groupDetails) {
            groupFilesCache.value.set(groupCode, groupDetails.files);
          }
        }
      }
    };

    const isGroupExpanded = (groupCode) => {
      return expandedGroups.value.has(groupCode);
    };

    const getGroupFiles = (groupCode) => {
      return groupFilesCache.value.get(groupCode) || [];
    };

    const getFileCount = (file) => {
      if (file.type === "group") {
        return file.fileCount || 0;
      }
      return 0;
    };

    const getFileIcon = (fileData) => {
      // Use mimetype if available, otherwise fall back to filename extension
      let mimeType = "";
      if (fileData.mimetype) {
        mimeType = fileData.mimetype.split("/")[0]; // Get the part before '/'
      } else {
        // Fallback to extension if mimetype is not available
        const extension =
          fileData.name?.split(".").pop().toLowerCase() ||
          fileData.original_name?.split(".").pop().toLowerCase() ||
          "";
        const extensionToMime = {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          txt: "text/plain",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          mp4: "video/mp4",
          avi: "video/x-msvideo",
          zip: "application/zip",
          js: "application/javascript",
          css: "text/css",
          html: "text/html",
          json: "application/json",
        };
        mimeType = extensionToMime[extension]?.split("/")[0] || "application";
      }

      const iconMap = {
        application: "insert_drive_file",
        text: "text_snippet",
        image: "image",
        audio: "audio_file",
        video: "video_file",
        multipart: "folder_zip",
      };

      return iconMap[mimeType] || iconMap["application"];
    };

    // Edit modal functions
    const openEditModal = (file) => {
      currentEditingFile.value = file;
      editForm.value = {
        fileId: file.code,
        fileName: file.name
      };
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      currentEditingFile.value = null;
      editForm.value = {
        fileId: "",
        fileName: ""
      };
    };

    const handleEditFile = async () => {
      if (!editForm.value.fileId || !editForm.value.fileName) {
        showNotification("Please fill in all fields", "error");
        return;
      }

      editLoading.value = true;
      try {
        let success = true;
        let error = "";

        // Update file ID if changed
        if (editForm.value.fileId !== currentEditingFile.value.code) {
          const idResult = await updateFileId(props.token, currentEditingFile.value.code, editForm.value.fileId);
          if (!idResult.success) {
            success = false;
            error = idResult.error;
          }
        }

        // Update file name if changed
        if (success && editForm.value.fileName !== currentEditingFile.value.name) {
          const nameResult = await updateFileName(props.token, editForm.value.fileId, editForm.value.fileName);
          if (!nameResult.success) {
            success = false;
            error = nameResult.error;
          }
        }

        if (success) {
          showNotification("File updated successfully!", "ok");
          closeEditModal();
          await loadAllFiles(props.token);
        } else {
          showNotification("Failed to update file: " + error, "error");
        }
      } catch (error) {
        showNotification("Failed to edit file: " + error.message, "error");
      } finally {
        editLoading.value = false;
      }
    };

    // Batch operations methods
    const getAllItems = () => {
      const items = [];
      
      filteredFiles.value.forEach(item => {
        items.push(item);
        
        if (item.type === 'group' && isGroupExpanded(item.code)) {
          const groupFiles = getGroupFiles(item.code);
          items.push(...groupFiles);
        }
      });
      
      return items;
    };

    const isItemSelected = (code) => {
      return selectedItems.value.has(code);
    };

    const toggleItemSelection = (code) => {
      if (selectedItems.value.has(code)) {
        selectedItems.value.delete(code);
      } else {
        selectedItems.value.add(code);
      }
      selectedItems.value = new Set(selectedItems.value); // Force reactivity
    };

    const toggleSelectAll = () => {
      const allItems = getAllItems();
      
      if (isAllSelected.value) {
        selectedItems.value.clear();
      } else {
        allItems.forEach(item => {
          selectedItems.value.add(item.code);
        });
      }
      selectedItems.value = new Set(selectedItems.value); // Force reactivity
    };

    const clearSelection = () => {
      selectedItems.value.clear();
      selectedItems.value = new Set(selectedItems.value); // Force reactivity
    };

    const downloadSelected = async () => {
      const selectedCodes = Array.from(selectedItems.value);
      
      for (const code of selectedCodes) {
        const link = document.createElement("a");
        link.href = "/files/" + code;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Clear selection after download
      clearSelection();
      showNotification("Download started for selected files!", "info");
    };

    const deleteSelected = async () => {
      try {
        const selectedCodes = Array.from(selectedItems.value);
        const count = selectedCodes.length;
        
        await confirmDelete(`${count} selected item${count !== 1 ? 's' : ''}`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Delete each selected item
        for (const code of selectedCodes) {
          const result = await deleteFile(props.token, code);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
        
        // Show result notification
        if (errorCount === 0) {
          showNotification(`Successfully deleted ${successCount} item${successCount !== 1 ? 's' : ''}!`, "ok");
        } else {
          showNotification(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''}, ${errorCount} failed`, "error");
        }
        
        // Reload files and clear selection
        await loadAllFiles(props.token);
        clearSelection();
      } catch {
        // User cancelled deletion
      }
    };

    onMounted(() => {
      loadAllFiles(props.token);
    });

    return {
      allFiles,
      loading,
      error,
      searchQuery,
      searchLoading,
      filteredFiles,
      selectedItems,
      isAllSelected,
      handleDeleteFile,
      downloadFile,
      toggleGroup,
      isGroupExpanded,
      getGroupFiles,
      getFileCount,
      getFileIcon,
      showEditModal,
      editLoading,
      editForm,
      openEditModal,
      closeEditModal,
      handleEditFile,
      // Batch operations
      isItemSelected,
      toggleItemSelection,
      toggleSelectAll,
      clearSelection,
      downloadSelected,
      deleteSelected,
    };
  },
};
</script>
