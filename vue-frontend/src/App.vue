<template>
  <Main id='app'>
    <b-container>
      <b-row>
        <b-col cols="12">
          <h1>Connect Four</h1>
        </b-col>
      </b-row>
      <router-view/>
    </b-container>
  </Main>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  data: function() {
    return {
    }
  },
  methods: {}
  
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
