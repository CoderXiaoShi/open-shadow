<template>
  <div class="persona-page">
    <PersonaForm />
  </div>
</template>

<script setup>
import PersonaForm from '../components/PersonaForm.vue';

</script>

<style scoped>
.persona-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 24px;
}
</style>
