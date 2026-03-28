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
            placeholder="Search links..."
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
            @click="deleteSelected"
            class="bg-error text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <span class="material-icons-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>

      <div
        v-if="loading"
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
                  URL
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  User
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300"
                >
                  Created
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-medium text-gray-300 w-[120px]"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#444]">
              <tr
                v-for="link in filteredLinks"
                :key="link.id"
                class="hover:bg-black/10 transition-colors"
                :class="{ 'bg-primary-button/10': isItemSelected(link.id) }"
              >
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="isItemSelected(link.id)"
                    @change="toggleItemSelection(link.id)"
                    class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                  />
                </td>
                <td class="px-4 py-3">
                  <span
                    class="font-medium text-primary-button cursor-pointer hover:text-secondary-button transition-colors"
                    @click="copyCode(link.id)"
                  >
                    {{ link.id }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <a
                    :href="link.url"
                    target="_blank"
                    class="text-sm text-gray-300 hover:text-primary-button transition-colors truncate max-w-[300px] block"
                    :title="link.url"
                  >
                    {{ link.url }}
                  </a>
                </td>
                <td class="px-4 py-3 text-sm text-gray-300">
                  {{ link.username }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-300">
                  {{ link.dateFormatted }}
                </td>
                <td class="px-4 py-3 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="copyLinkUrl(link.id)"
                      class="bg-secondary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                      title="Copy short URL"
                    >
                      <span class="material-icons-outlined text-sm"
                        >content_copy</span
                      >
                    </button>
                    <button
                      @click="openLink(link.url)"
                      class="bg-primary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                      title="Open link"
                    >
                      <span class="material-icons-outlined text-sm"
                        >open_in_new</span
                      >
                    </button>
                    <button
                      @click="handleDelete(link.id)"
                      class="bg-error text-white w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform"
                      title="Delete link"
                    >
                      <span class="material-icons-outlined text-sm"
                        >delete</span
                      >
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="filteredLinks.length === 0"
          class="text-center py-12 text-gray-400"
        >
          No links found
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAdmin } from "../composables/useAdmin.js";
import { useNotification } from "../composables/useNotification.js";
import { useConfirm } from "../composables/useConfirm.js";

export default {
  name: "LinksView",
  props: {
    token: String,
  },
  setup(props) {
    const {
      allLinks,
      loading,
      error,
      loadAllLinks,
      deleteLink,
    } = useAdmin();

    const { showNotification } = useNotification();
    const { confirmDelete } = useConfirm();

    const searchQuery = ref("");
    const selectedItems = ref(new Set());

    const filteredLinks = computed(() => {
      if (!searchQuery.value) return allLinks.value;
      const query = searchQuery.value.toLowerCase();
      return allLinks.value.filter(
        (link) =>
          link.id.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          link.username.toLowerCase().includes(query)
      );
    });

    const isAllSelected = computed(() => {
      return filteredLinks.value.length > 0 && filteredLinks.value.every(link => selectedItems.value.has(link.id));
    });

    const isItemSelected = (id) => selectedItems.value.has(id);

    const toggleItemSelection = (id) => {
      if (selectedItems.value.has(id)) {
        selectedItems.value.delete(id);
      } else {
        selectedItems.value.add(id);
      }
      selectedItems.value = new Set(selectedItems.value);
    };

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedItems.value.clear();
      } else {
        filteredLinks.value.forEach(link => {
          selectedItems.value.add(link.id);
        });
      }
      selectedItems.value = new Set(selectedItems.value);
    };

    const clearSelection = () => {
      selectedItems.value.clear();
      selectedItems.value = new Set(selectedItems.value);
    };

    const handleDelete = async (id) => {
      try {
        await confirmDelete("this link");
        const result = await deleteLink(props.token, id);
        if (result.success) {
          await loadAllLinks(props.token);
          showNotification("Link deleted successfully!", "ok");
        } else {
          showNotification("Failed to delete link!", "error");
        }
      } catch {
        // User cancelled
      }
    };

    const deleteSelected = async () => {
      try {
        const count = selectedItems.value.size;
        await confirmDelete(`${count} selected link${count !== 1 ? 's' : ''}`);
        
        const ids = Array.from(selectedItems.value);
        for (const id of ids) {
          await deleteLink(props.token, id);
        }
        
        await loadAllLinks(props.token);
        clearSelection();
        showNotification(`${count} link${count !== 1 ? 's' : ''} deleted successfully!`, "ok");
      } catch {
        // User cancelled
      }
    };

    const copyCode = async (code) => {
      try {
        await navigator.clipboard.writeText(code);
        showNotification("Code copied!", "ok");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const copyLinkUrl = async (code) => {
      const url = window.location.origin + "/" + code;
      try {
        await navigator.clipboard.writeText(url);
        showNotification("Link copied!", "ok");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const openLink = (url) => {
      window.open(url, "_blank");
    };

    onMounted(() => {
      loadAllLinks(props.token);
    });

    return {
      allLinks,
      loading,
      error,
      searchQuery,
      filteredLinks,
      selectedItems,
      isAllSelected,
      isItemSelected,
      toggleItemSelection,
      toggleSelectAll,
      clearSelection,
      handleDelete,
      deleteSelected,
      copyCode,
      copyLinkUrl,
      openLink,
    };
  },
};
</script>
