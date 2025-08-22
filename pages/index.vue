<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <h2 class="text-lg font-semibold text-gray-900 mb-6">Game Management</h2>

    <!-- Search and Filter Section -->
    <div class="inline-block mb-6">
      <Card class="bg-white" style="border: 2px solid #000000">
        <template #content>
          <div class="flex items-end gap-3">
            <!-- Category Filter -->
            <div class="flex-shrink-0">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Category</label
              >
              <Dropdown
                v-model="selectedCategory"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                class="w-42 box-border h-10"
              />
            </div>

            <!-- Keyword Search -->
            <div class="flex-shrink-0 mr-20">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Keyword</label
              >
              <InputText
                v-model="searchTerm"
                placeholder="Search games..."
                class="w-72 box-border h-10"
              />
            </div>

            <!-- Search Button -->
            <div class="flex-shrink-0">
              <Button
                @click="performSearch"
                label="🔍 Search"
                class="search-button box-border h-10"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- List Header with Actions -->
    <div
      class="px-4 py-3 border-b border-gray-200 flex justify-between items-center"
    >
      <h2 class="text-lg font-semibold text-gray-900">Game List</h2>
      <div class="flex space-x-2">
        <Button
          @click="deleteSelected"
          :disabled="selectedGamesObjects.length === 0"
          :label="`🗑️ Delete Selected (${selectedGamesObjects.length})`"
          :severity="selectedGamesObjects.length > 0 ? 'danger' : 'secondary'"
          size="small"
        />
        <Button
          @click="$router.push('/register')"
          label="📝 Register New Game"
          severity="info"
          size="small"
        />
      </div>
    </div>
    <!-- Game List Section -->
    <DataTable
      :value="filteredGames"
      :loading="loading"
      :paginator="true"
      :rows="itemsPerPage"
      :lazy="false"
      selectionMode="multiple"
      v-model:selection="selectedGamesObjects"
      @select-all="onSelectAllToggle"
      @unselect-all="onSelectAllToggle"
      tableStyle="min-width: 50rem"
      class="border-2 border-black"
    >
      <template #empty>
        <div
          class="flex flex-col items-center justify-center py-8 text-gray-500"
        >
          <div class="text-6xl mb-4">🎮</div>
          <div class="text-lg font-medium mb-2">No games found</div>
          <div class="text-sm text-center">
            Try adjusting your search criteria or
            <a href="/register" class="text-blue-500 hover:underline"
              >register a new game</a
            >!
          </div>
        </div>
      </template>
      <Column
        selectionMode="multiple"
        headerStyle="width: 3rem; text-align: center"
        style="width: 3rem"
      ></Column>

      <Column
        field="gameId"
        header="ID"
        headerStyle="width: 200px; text-align: center"
        style="width: 200px; text-align: center"
      >
        <template #body="slotProps">
          <div class="center-id-container">
            {{ slotProps.data.gameId }}
            <Button
              @click="editGame(slotProps.data)"
              icon="pi pi-pencil"
              size="small"
              text
              severity="info"
              class="inline-edit-btn"
            />
          </div>
        </template>
      </Column>

      <Column
        field="name"
        header="Name"
        headerStyle="width: 400px; text-align: center"
        style="width: 400px; text-align: center"
      ></Column>
      <Column
        field="category"
        header="Category"
        headerStyle="width: 150px; text-align: center"
        style="width: 150px; text-align: center"
      ></Column>
    </DataTable>
  </div>
</template>

<script setup>
// Get current route for navigation watching
const route = useRoute();

// Real data from API
const games = ref([]);
const loading = ref(true);

// Load games from API on mount
const loadGames = async () => {
  try {
    loading.value = true;
    const response = await $fetch("/api/games");

    // Transform API data to match component format
    games.value = response.games.map((game) => ({
      id: game.id,
      gameId: game.id,
      name:
        game.names[game.defaultLanguage] ||
        Object.values(game.names)[0] ||
        "Unknown",
      category: game.category,
      status: "active",
      createdAt: game.createdAt,
      apiData: game, // Keep original API data for edit
    }));

    console.log("Loaded games from API:", games.value);
  } catch (error) {
    console.error("Error loading games:", error);
    // Fallback to empty array if API fails
    games.value = [];
  } finally {
    loading.value = false;
  }
};

// Load games on component mount
onMounted(async () => {
  await Promise.all([loadGames(), loadCategories()]);
});

// Search and filter state
const searchTerm = ref("");
const selectedCategory = ref("All Categories"); // Set giá trị mặc định là "All Categories"
const selectedGames = ref([]);
const selectedGamesObjects = ref([]); // For PrimeVue DataTable

// Category options for PrimeVue Dropdown - will be populated from API
const categoryOptions = ref([
  { label: "All Categories", value: "All Categories" },
]);

// Load categories from API
const loadCategories = async () => {
  try {
    const response = await $fetch("/api/categories");
    
    // Check if response has the expected structure
    if (response && response.categories && Array.isArray(response.categories)) {
      const apiCategories = response.categories.map((cat) => ({
        label: cat,
        value: cat,
      }));

      categoryOptions.value = [
        { label: "All Categories", value: "All Categories" },
        ...apiCategories,
      ];
    } else {
      throw new Error("Invalid categories response format");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    // Fallback categories if API fails
    categoryOptions.value = [
      { label: "All Categories", value: "All Categories" },
      { label: "RPG", value: "RPG" },
      { label: "Racing", value: "Racing" },
      { label: "Strategy", value: "Strategy" },
      { label: "Action", value: "Action" },
      { label: "MMORPG", value: "MMORPG" },
    ];
  }
};

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(3); // Match the image showing 3 items

// Watch selectedGamesObjects to sync with selectedGames
watch(
  selectedGamesObjects,
  (newVal) => {
    selectedGames.value = newVal.map((game) => game.id);
  },
  { deep: true }
);

// Computed filtered games
const filteredGames = computed(() => {
  let filtered = games.value;

  if (searchTerm.value) {
    filtered = filtered.filter(
      (game) =>
        game.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        game.gameId.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  }

  if (selectedCategory.value && selectedCategory.value !== "All Categories") {
    filtered = filtered.filter(
      (game) => game.category === selectedCategory.value
    );
  }

  return filtered;
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredGames.value.length / itemsPerPage.value);
});

const paginatedGames = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredGames.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i);
  }
  return pages;
});

// Selection computed properties
const isAllSelected = computed(() => {
  return (
    paginatedGames.value.length > 0 &&
    paginatedGames.value.every((game) => selectedGames.value.includes(game.id))
  );
});

// Methods
const performSearch = () => {
  // Reset to first page when searching
  currentPage.value = 1;
  console.log("Searching:", {
    searchTerm: searchTerm.value,
    category: selectedCategory.value,
    categoryType: typeof selectedCategory.value,
  });
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Unselect all current page items
    paginatedGames.value.forEach((game) => {
      const index = selectedGames.value.indexOf(game.id);
      if (index > -1) {
        selectedGames.value.splice(index, 1);
      }
    });
  } else {
    // Select all current page items
    paginatedGames.value.forEach((game) => {
      if (!selectedGames.value.includes(game.id)) {
        selectedGames.value.push(game.id);
      }
    });
  }
};

const onSelectAllToggle = () => {
  // This method is called by PrimeVue DataTable
  // selectedGamesObjects is automatically managed by DataTable
};

const toggleGameSelection = (gameId) => {
  const index = selectedGames.value.indexOf(gameId);
  if (index > -1) {
    selectedGames.value.splice(index, 1);
  } else {
    selectedGames.value.push(gameId);
  }
};

const deleteSelected = async () => {
  if (selectedGamesObjects.value.length === 0) return;

  const gamesToDelete = selectedGamesObjects.value;
  const gameNames = gamesToDelete.map((game) => game.name).join(", ");

  if (confirm(`Are you sure you want to delete these games?\n${gameNames}`)) {
    try {
      // Get IDs to delete
      const idsToDelete = selectedGamesObjects.value.map((game) => game.id);

      // Call API to delete
      await $fetch("/api/games", {
        method: "DELETE",
        body: { ids: idsToDelete },
      });

      // Clear both selection arrays
      selectedGames.value = [];
      selectedGamesObjects.value = [];

      // Reload games from API
      await loadGames();

      // Reset to first page if current page is empty
      if (filteredGames.value.length === 0 && currentPage.value > 1) {
        currentPage.value = 1;
      }

      console.log("Deleted games:", gameNames);
      alert("Games deleted successfully!");
    } catch (error) {
      console.error("Error deleting games:", error);
      alert("Error deleting games. Please try again.");
    }
  }
};

const editGame = (game) => {
  console.log("Editing game:", game);
  navigateTo(`/register?id=${game.id}`);
};

// Pagination methods
const goToPage = (page) => {
  currentPage.value = page;
  selectedGames.value = []; // Clear selection when changing pages
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    selectedGames.value = []; // Clear selection when changing pages
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    selectedGames.value = []; // Clear selection when changing pages
  }
};

// Watch for filter changes to reset page
watch([searchTerm, selectedCategory], () => {
  currentPage.value = 1;
  selectedGames.value = []; // Clear selection when filtering
});

// Debug watcher
watch(selectedCategory, (newVal) => {
  console.log("selectedCategory changed:", newVal, "type:", typeof newVal);
});

// Force center alignment on mount and after data changes
onMounted(() => {
  nextTick(() => {
    forceCenterAlignment();
  });
});

watch(filteredGames, () => {
  nextTick(() => {
    forceCenterAlignment();
  });
});

// Refresh data when coming back from register page
onActivated(() => {
  loadGames();
});

// Also refresh when route changes (in case user navigates back)
watch(
  () => route.path,
  (newPath) => {
    if (newPath === "/") {
      loadGames();
    }
  }
);

const forceCenterAlignment = () => {
  // Force center alignment using JavaScript
  const headers = document.querySelectorAll(
    ".p-datatable th, .p-datatable-header-cell"
  );
  const cells = document.querySelectorAll(
    ".p-datatable td, .p-datatable-body-cell"
  );

  headers.forEach((header) => {
    header.style.textAlign = "center";
    header.style.justifyContent = "center";
  });

  cells.forEach((cell) => {
    cell.style.textAlign = "center";
    cell.style.justifyContent = "center";
  });
};
</script>

<style scoped>
/* Ultimate force for DataTable headers - use global approach */
</style>

<style>
/* Global CSS without scoped to override PrimeVue completely */
.p-datatable .p-datatable-thead th,
.p-datatable .p-datatable-thead .p-datatable-header-cell {
  text-align: center !important;
  justify-content: center !important;
  display: table-cell !important;
}

.p-datatable .p-datatable-tbody td,
.p-datatable .p-datatable-tbody .p-datatable-body-cell {
  text-align: center !important;
  justify-content: center !important;
}

/* Override any flexbox alignment */
.p-datatable th > *,
.p-datatable td > * {
  justify-content: center !important;
  text-align: center !important;
}

/* Specific targeting for table structure */
.p-datatable table th {
  text-align: center !important;
}

.p-datatable table td {
  text-align: center !important;
}

/* Table styling - white background, black borders, gray hover */
.p-datatable {
  background-color: #ffffff !important;
  border: 2px solid #000000 !important;
}

.p-datatable table {
  background-color: #ffffff !important;
  border-collapse: collapse !important;
  width: 100% !important;
  table-layout: fixed !important;
}

/* Header styling with black borders */
.p-datatable .p-datatable-thead th,
.p-datatable-header-cell {
  background-color: #969ca6 !important;
  border: 1px solid #000000 !important;
  color: #000000 !important;
  font-weight: 600 !important;
}

/* Body cells with black borders */
.p-datatable .p-datatable-tbody td,
.p-datatable-body-cell {
  background-color: #ffffff !important;
  border: 1px solid #000000 !important;
  color: #000000 !important;
}

/* Striped rows - odd rows (1, 3, 5...) white background */
.p-datatable .p-datatable-tbody tr:nth-child(odd) td {
  background-color: #ffffff !important;
}

/* Striped rows - even rows (2, 4, 6...) light gray background */
.p-datatable .p-datatable-tbody tr:nth-child(even) td {
  background-color: #e0e0e0 !important;
}

/* Row hover effect - soft blue-gray (overrides striping) */
.p-datatable .p-datatable-tbody tr:hover td {
  background-color: #dcebfa !important;
}

/* First column header and cells - left border */
.p-datatable .p-datatable-thead th:first-child,
.p-datatable .p-datatable-tbody td:first-child {
  border-left: 1px solid #000000 !important;
}

/* Last column header and cells - right border */
.p-datatable .p-datatable-thead th:last-child,
.p-datatable .p-datatable-tbody td:last-child {
  border-right: 1px solid #000000 !important;
}

/* Remove default PrimeVue hover colors */
.p-datatable .p-datatable-tbody > tr:hover {
  background-color: transparent !important;
}

/* Center ID Container - 3-column flex to keep text centered */
.center-id-container {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
}

.center-id-container::before {
  content: "" !important;
  width: 22px !important; /* Same width as button area */
  flex-shrink: 0 !important;
}

.center-id-container .id-text {
  flex: 1 !important;
  text-align: center !important;
}

.inline-edit-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
  min-width: 18px !important;
  height: 18px !important;
  padding: 0 !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
}

.center-id-container:hover .inline-edit-btn {
  opacity: 1;
}

/* Remove old inline button styling */
</style>
