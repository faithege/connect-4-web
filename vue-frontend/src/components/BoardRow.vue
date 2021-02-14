<template>
  <div>
    <span v-for="(place, index) in row" :key="index">
      <img class="placeImage" src="../assets/red.png" v-if="place == 'r'">
      <img class="placeImage" src="../assets/yellow.jpeg" v-else-if="place == 'y'">
      <img class="placeImage" src="../assets/square-tile.png" v-else>
      <!-- <img :src="require(getPlaceImageUrl(place))" :key="index" > -->
    </span>
  </div>
</template>

<script>
export default {
  name: 'BoardRow',
  props: {
    row: Array
  },
  data: function () {
    return {}
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .placeImage {
    max-width:100px
  }
</style>
