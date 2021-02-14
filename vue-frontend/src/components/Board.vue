<template>
  <div>
    <Section v-for="(row, index) in boardState" :key="index">
      <BoardRow :row="row"/>
    </Section>
  </div>
</template>

<script>
import BoardRow from './BoardRow.vue'

export default {
  name: 'Board',
  components: {
    BoardRow
  },
  props: {
    boardState: Array
  },
  methods:{
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
