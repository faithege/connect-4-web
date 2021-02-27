<template>
  <Section>
      <b-row>
        <b-col cols="12">
          <h1>Let's Play!</h1>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="2" offset="5">
          <b-button size="lg" @click="handleClick()">Start Game</b-button>
        </b-col>
      </b-row>
  </Section>
</template>

<script>
import api from '@/domain/api.ts'

export default {
  name: 'NewGamePage',
  data: function() {
    return {}
  },
  methods: {
    handleClick() {
      console.log("Button clicked")
      api.createNewGame()
    }
  },
  
}
</script>

<style>
</style>
