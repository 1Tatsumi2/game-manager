<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <Toast />
    <ConfirmDialog />

    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">Game Manager</h1>
          </div>
          <nav class="flex space-x-4">
            <NuxtLink
              to="/"
              class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium no-underline"
              active-class="text-blue-600 bg-blue-50"
            >
              Game List
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium no-underline"
              active-class="text-blue-600 bg-blue-50"
            >
              Register Game
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <slot />
      </div>
    </main>
  </div>
</template>

<style>
/* Reset global styles */
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
}

#__nuxt {
  margin: 0;
  padding: 0;
  border: none;
}

/* PrimeVue custom styles */
.p-button {
  font-weight: 500 !important;
}

/* Custom padding for action buttons */
.p-button.p-button-sm {
  padding: 0.75rem 1rem !important;
}

.p-card {
  background: #ffffff !important;
  background-color: #ffffff !important;
  border-radius: 0 !important;
}

.p-datatable {
  border-radius: 0.5rem !important;
  overflow: hidden !important;
  background-color: #ffffff !important;
}

.p-datatable .p-datatable-header {
  background-color: #e5e7eb !important;
  border-bottom: 1px solid #e5e7eb !important;
}

.p-datatable .p-datatable-tbody > tr {
  border-bottom: 1px solid #000000 !important;
  background-color: #ffffff !important;
}

.p-datatable .p-datatable-tbody > tr:hover {
  background-color: #f5f5f5 !important;
}

/* DataTable cell padding override - increase vertical padding */
.p-datatable .p-datatable-tbody > tr > td {
  padding: 1.25rem 1rem !important; /* Increased from default 0.75rem to 1.25rem for vertical padding */
}

.p-datatable .p-datatable-thead > tr > th {
  padding: 1rem 1rem !important; /* Also increase header padding for consistency */
}

/* Remove conflicting border rules - now handled in pages/index.vue */

.p-inputtext {
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
  color: #000000 !important;
}

.p-inputtext:focus {
  border: 2px solid #000000 !important;
  box-shadow: none !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
  color: #000000 !important;
}

.p-dropdown {
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
}

.p-dropdown:not(.p-disabled).p-focus {
  border: 2px solid #000000 !important;
  box-shadow: none !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
}

/* PrimeVue Select styling - new version */
.p-select {
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
  --p-select-background: #ffffff !important;
  --p-select-border-color: #000000 !important;
  --p-select-border-radius: 0 !important;
  --p-select-shadow: none !important;
}

.p-select:not(.p-disabled).p-focus {
  border: 2px solid #000000 !important;
  box-shadow: none !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
  --p-select-background: #ffffff !important;
  --p-select-border-color: #000000 !important;
}

/* Dropdown trigger background and text color */
.p-dropdown .p-dropdown-trigger,
.p-dropdown .p-dropdown-label,
.p-select .p-select-trigger,
.p-select .p-select-label {
  background-color: #ffffff !important;
  background: #ffffff !important;
  color: #000000 !important;
}

.p-dropdown .p-dropdown-label,
.p-select .p-select-label {
  color: #000000 !important;
}

/* Dropdown panel styling */
.p-dropdown-panel,
.p-select-panel {
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
}

.p-dropdown-items .p-dropdown-item,
.p-select-list .p-select-option {
  color: #000000 !important;
  background-color: #ffffff !important;
}

.p-dropdown-items .p-dropdown-item:hover,
.p-select-list .p-select-option:hover {
  background-color: #f3f4f6 !important;
  color: #000000 !important;
}

/* Search button styling */
.search-button {
  height: 40px !important;
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
  background-color: #ffffff !important;
  color: #000000 !important;
  min-height: 40px !important;
  padding: 0 16px !important;
}

.search-button:hover {
  background-color: #f3f4f6 !important;
  border: 2px solid #000000 !important;
  color: #000000 !important;
}

/* Input and dropdown height consistency */
.p-inputtext,
.p-dropdown,
.p-select {
  height: 40px !important;
  min-height: 40px !important;
}

/* Ultimate DataTable header center alignment - Global Level */
.p-datatable-header-cell {
  text-align: center !important;
}

/* Maximum specificity override */
body .p-datatable .p-datatable-header-cell,
html body .p-datatable .p-datatable-header-cell {
  text-align: center !important;
}

/* Override with attribute selector */
.p-datatable-header-cell[class] {
  text-align: center !important;
}

.p-paginator {
  border-radius: 0 !important;
}

.p-dialog-footer {
  justify-content: center !important;
}
</style>
