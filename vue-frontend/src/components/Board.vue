<template>
  <div class="hello">
    <h1>Connect Four</h1>
    <div v-for="(row, index) in board" :key="index">
      <Row :row="row"/>
    </div>
  </div>
</template>

<script>
import Row from './Row.vue'

export default {
  name: 'Board',
  components: {
    Row
  },
  props: {},
  data: function () {
    return {
      board: [ 
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."]
        ]
    }
  },
  methods:{
    generateRows: function() {
      // const rowStrings = this.board.map(row => row.join(' '))
      const rowStrings = this.board.map(row => 
                                          row.map(place => this.getPlaceImageUrl(place)))
      return rowStrings 
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
