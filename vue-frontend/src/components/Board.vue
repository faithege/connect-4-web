<template>
  <Main class="hello">
    <h1>Connect Four</h1>
    <Section v-for="(row, index) in boardState" :key="index">
      <Row :row="row"/>
    </Section>
    <Section>
      <!-- Extract this to a separate component, heading too -->
      <b-form-select v-model="selectedColumn" :options="columnChoices" @change="emitColumnChange">
        <template slot="first">
        <option disabled>  -- Please select column choice -- </option>
        </template>
      </b-form-select>
    </Section>
  </Main>
</template>

<script>
import Row from './Row.vue'

export default {
  name: 'Board',
  components: {
    Row
  },
  props: {
    boardState: Array
  },
  watch: { 
    boardState: function(newVal, oldVal) { 
      console.log('Prop changed: ', newVal, ' | was: ', oldVal)
    }
  },
  data: function () {
    return {
      columnChoices: [1,2,3,4,5,6,7],
      selectedColumn: null
    }
  },
  methods:{
    emitColumnChange(){
      this.$emit('column-change', this.selectedColumn)
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
