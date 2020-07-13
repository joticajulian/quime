
export default {
  
  methods: {

    cents2dollars(a, cu){
      let amount = a;
      let currency = cu;

      if(!currency)
        currency = this.$store.state.principalCurrency;

      if(typeof amount !== "string")
        amount = BigInt(amount).toString();

      const {precision} = this.$store.state.currencies.find((c) => (c.name === currency));
      if(!precision)
        throw new Error(`Precision of currency '${currency}' couldn't be determined`);
      
      if( amount.length < precision + 1 )
        amount = "0".repeat(precision + 1 - amount.length) + amount;
      
      const part1 = amount.substring( 0 , amount.length - precision );
      const part2 = amount.substring( amount.length - precision );
      return `${part1}.${part2}`;
    }

  }
}