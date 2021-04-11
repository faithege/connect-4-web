<template>
  <Section>
      <b-row>
        <b-col cols="12">
          <h1>Let's Play!</h1>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="2" offset="5">
          <b-button size="lg" @click="handleClick()">Start New Game</b-button>
        </b-col>
      </b-row>
  </Section>
</template>

<script>
import api from '@/domain/api.ts'

export default {
  name: 'NewGamePage',
  data: function() {
    return {
    }
  },
  methods: {
    async handleClick() {
      try {
            const response = await api.createNewGame();
            this.copySucceeded = false
            this.gameId = response.data.gameId;
            this.playerId = response.data.currentPlayer;
            console.log(response);
            this.$router.push(`${this.gameId}/${this.playerId}`)
          } catch (error) {
            console.error(error);
          }
    }
  },
  
}
</script>

<style>
</style>
