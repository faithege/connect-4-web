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
      <b-row 
        v-if="shareableUrl">
        <b-col cols="6" offset="3">
          <label for="nextPlayerUrl">To get started, share this link with the other player:</label>
          <b-form-input id="nextPlayerUrl" v-model="shareableUrl"></b-form-input>
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
      shareableUrl: null
    }
  },
  methods: {
    async handleClick() {
      try {
            const response = await api.createNewGame();
            this.gameId = response.data.gameId;
            this.playerId = response.data.currentPlayer;
            this.nextPlayerId = this.generateNextPlayer(this.playerId);
            this.shareableUrl = `${window.location.origin}/${this.gameId}/${this.nextPlayerId}`;
            console.log(response);
          } catch (error) {
            console.error(error);
          }
    },
    generateNextPlayer(playerId){
      if (playerId == 'r') {
        return 'y'
      }
      else if (playerId === 'y') {
        return 'r'
      }
    }
  },
  
}
</script>

<style>
</style>
