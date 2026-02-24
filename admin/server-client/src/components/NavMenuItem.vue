<template>
  <!-- 有子菜单：渲染 el-sub-menu，递归渲染子项 -->
  <el-sub-menu v-if="hasChildren" :index="String(item.id)">
    <template #title>
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.permission_name }}</span>
    </template>
    <NavMenuItem
      v-for="child in item.children"
      :key="child.id"
      :item="child"
    />
  </el-sub-menu>

  <!-- 无子菜单：渲染叶子节点 -->
  <el-menu-item v-else :index="item.path || String(item.id)">
    <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
    <template #title>{{ item.permission_name }}</template>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue';
import NavMenuItem from './NavMenuItem.vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const hasChildren = computed(() =>
  props.item.children && props.item.children.length > 0
);
</script>
