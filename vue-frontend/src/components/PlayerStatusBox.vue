<template>
  <div>
  <b-card 
    :title="isCurrentPlayer ? 'YOU': 'THEM'"
    :bg-variant="statusBoxBackground"
    text-variant="white">
    <b-card-text
      v-if="isConnected">
      Status: Connected
    </b-card-text>
    <b-card-text
      v-else>
      Status: Disconnected
    </b-card-text>
    <b-card-text>
      {{ playerTurnMessage }}
    </b-card-text>
  </b-card>
</div>
</template>

<script>
export default {
  props: {
    player: {
      type: String,
      default: 'Unknown'
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    isTurn: {
      type: Boolean,
      default: false
    },
    isCurrentPlayer: {
      type: Boolean,
      default: false
    }
  },
computed: {
    statusBoxBackground: function () {
      if(this.player === 'r' && this.isConnected){
        return 'danger'
      }
      else if (this.player === 'y' && this.isConnected){
        return 'warning'
      }
      else {
        return 'dark'
      }
    },
    playerTurnMessage: function(){
      if(this.isTurn && this.isCurrentPlayer){
        return 'YOUR turn! Choose a column'
      }
      else if (!this.isTurn && !this.isCurrentPlayer){
        return 'They\'re waiting for you to decide...'
      }
      else if (this.isTurn && !this.isCurrentPlayer){
        return 'THEIR turn, be patient'
      }
      else if (!this.isTurn && this.isCurrentPlayer){
        return 'You are patiently waiting for the other player to make their move...'
      }
      else {
        return ''
      }
    }
  }
}
</script>

