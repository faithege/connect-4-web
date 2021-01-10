<template>
  <div>
    <span v-for="(place, index) in row" :key="index">
      <!-- <img :src="getPlaceImageUrl(place)"> -->
      {{ getPlaceImageUrl(place) }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'Board',
  props: {
    row: Array
  },
  data: function () {
    return {}
  },
  methods: {
    getPlaceImageUrl: function(place){
      let url

      switch (place) {
        case 'r':
          url = './src/assets/red.png';
          break;
        case 'y':
          url = './src/assets/yellow.jpeg';
          break;
        default:
          url = '../src/assets/logo.png';
        }
      return url
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
