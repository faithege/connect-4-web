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
          <b-input-group prepend="Share with your opponent" class="mt-3">
          <b-form-input id="nextPlayerUrl" v-model="shareableUrl"></b-form-input>
          <b-input-group-append>
            <button type="button" @click="handleCopy">
              <span class="far fa-copy" />
            </button>
          </b-input-group-append>
        </b-input-group>
          <p v-if="copySucceeded">Copied!</p>
          <p v-else>Press CTRL+C to copy.</p>
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
      shareableUrl: null,
      copySucceeded: null
    }
  },
  methods: {
    async handleClick() {
      try {
            const response = await api.createNewGame();
            this.copySucceeded = false
            this.gameId = response.data.gameId;
            this.playerId = response.data.currentPlayer;
            this.nextPlayerId = this.generateNextPlayer(this.playerId);
            this.shareableUrl = `${window.location.origin}/${this.gameId}/${this.nextPlayerId}`;
            console.log(response);
          } catch (error) {
            console.error(error);
          }
    },
    handleCopy: function () {
        this.$copyText(this.shareableUrl)
        this.copySucceeded = true
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
