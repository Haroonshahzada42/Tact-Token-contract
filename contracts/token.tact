import "@stdlib/deploy";
import "./jetton";
import "./message";

message Mint {
    amount: Int;
    to: Address;
}




contract Token with Jetton {

    total_supply: Int as coins;
    owner: Address;
    content: Content;
    mintable: Bool;

  

    init(owner: Address, content: Content) {
        self.total_supply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = content;
    }

    receive(msg: Mint) { 
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not owner");
        require(self.mintable, "Not mintable");
        self.mint(msg.to, msg.amount, self.owner);
    }

    get fun getTotalSupply(): Int {
        return self.totalSupply;
    }

    get fun tokenName(): String {
        return self.content.name;
    }

    get fun tokenSymbol(): String {
        return self.content.symbol;
    }

    get fun tokenDecimals(): Int {
        return self.content.decimals;
    }

}
