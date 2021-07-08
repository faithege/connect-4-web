<template>
  <Section>
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
  </Section>
</template>

<script>
import { generateOtherPlayer } from '../utils'

export default {
  data() {
      return {
        shareableUrl: null,
        copySucceeded: null
      }
    },
    methods: {
        handleCopy: function () {
            this.$copyText(this.shareableUrl)
            this.copySucceeded = true
        },
    },
    mounted(){
        this.gameId = this.$route.params.gameId
        this.playerId = this.$route.params.playerId
        this.nextPlayerId = generateOtherPlayer(this.playerId);
        this.shareableUrl = `${window.location.origin}/${this.gameId}/${this.nextPlayerId}`;
    }
}
</script>

