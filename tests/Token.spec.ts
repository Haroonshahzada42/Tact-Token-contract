
import {Blockchain,SandboxContract,TreasuryContract,} from "@ton/sandbox";
import "@ton/test-utils";
import { Address, beginCell, fromNano, StateInit, toNano } from "@ton/core";

import {Token , Mint , TokenTransfer} from "../build/Token/tact_Token"
import { JettonDefaultWallet } from "../build/Token/tact_JettonDefaultWallet";



const tokenContent = {
    $$type: 'Content' as const, 
    name: "XETA",
    symbol: 'MYTOKEN',
    decimals: 9n,
};



describe("contract", () => {
    let blockchain: Blockchain;
    let token: SandboxContract<Token>;
    let jettonWallet: SandboxContract<JettonDefaultWallet>;
    let deployer: SandboxContract<TreasuryContract>;


    beforeAll(async () => {
        // Create content Cell

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        // player = await blockchain.treasury("player");

        token = blockchain.openContract(await Token.fromInit(deployer.address, tokenContent));
        const mintAmount = 100n

        const Mint: Mint = {
            $$type: "Mint",
            amount: mintAmount,
            to: deployer.address,
        };

        // Send Transaction
        const deployResult = await token.send(deployer.getSender(), { value: toNano("10")} , Mint);
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });

        const playerWallet = await token.getGetWalletAddress(deployer.address);
        jettonWallet = blockchain.openContract(await JettonDefaultWallet.fromAddress(playerWallet));
    });

    it("Test: whether contract deployed successfully", async () => {
        // the check is done inside beforeEach, blockchain and token are ready to use
        // console.log((await token.getGetJettonData()).owner);
        // console.log((await token.getGetJettonData()).totalSupply);
        // console.log((await token.getGetJettonData()).max_supply);
        // console.log((await token.getGetJettonData()).content);
    });

    it("Test: Minting is successfully", async () => {
        const deployerWalletDataBefore = await jettonWallet.getGetWalletData();
        const deployerBalanceBefore = deployerWalletDataBefore.balance;
        console.log(deployerBalanceBefore , "The balance of user before minting ")
       

        // const totalSupplyBefore = (await token.getGetJettonData()).total_supply;
        const mintAmount = toNano(100);
        const Mint: Mint = {
            $$type: "Mint",
            amount: mintAmount,
            to: deployer.address,
        };
        const mintResult = await token.send(deployer.getSender(), { value: toNano("10") }, Mint);
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            success: true,
        });
        // printTransactionFees(mintResult.transactions);

        // const totalSupplyAfter = (await token.getGetJettonData()).total_supply;
        // expect(totalSupplyBefore + mintAmount).toEqual(totalSupplyAfter);

        const walletData = await jettonWallet.getGetWalletData();
        expect(walletData.owner).toEqualAddress(deployer.address);
        expect(walletData.balance).toBeGreaterThanOrEqual(mintAmount);
        console.log(walletData.balance , "the Balance of user after minting");
    });

    it("should transfer successfully", async () => {
        const sender = await blockchain.treasury("sender");
        const receiver = await blockchain.treasury("receiver");
        const initMintAmount = toNano(1000);
        const transferAmount = toNano(80);

        const mintMessage: Mint = {
            $$type: "Mint",
            amount: initMintAmount,
            to: sender.address,
        };
        await token.send(deployer.getSender(), { value: toNano("0.25") }, mintMessage);

        
        const senderWalletAddress = await token.getGetWalletAddress(sender.address);
        const senderWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(senderWalletAddress));
        const senderWalletDatabeforeTransfer = await senderWallet.getGetWalletData();
        console.log(senderWalletDatabeforeTransfer.balance , "balance before transfer")
        
        
        // const receiverwallet = await token.getGetWalletAddress(receiver.address);
        // const receoverWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(receiverwallet));
        // const receiverWalletDatabeforeTransfer = await receoverWallet.getGetWalletData();
        // console.log(receiverWalletDatabeforeTransfer.balance , "balance before transfer")

        const transferMessage: TokenTransfer = {
            $$type: "TokenTransfer",
            query_id: 0n,
            amount: transferAmount,
            sender: receiver.address,
            response_destination: sender.address,
            custom_payload: null,
            forward_ton_amount: toNano("0.1"),
            forward_payload: beginCell().endCell(),
        };
        const transferResult = await senderWallet.send(sender.getSender(), { value: toNano("0.5") }, transferMessage);
        expect(transferResult.transactions).toHaveTransaction({
            from: sender.address,
            to: senderWallet.address,
            success: true,
        });
       
        const receiverWalletAddress = await token.getGetWalletAddress(receiver.address);
        const receiverWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(receiverWalletAddress));

        const senderWalletDataAfterTransfer = await senderWallet.getGetWalletData();
        const receiverWalletDataAfterTransfer = await receiverWallet.getGetWalletData();
        console.log(senderWalletDataAfterTransfer.balance, "sender balance afer transaction")
        console.log(receiverWalletDataAfterTransfer.balance, "receiver balance after transaction")

        expect(senderWalletDataAfterTransfer.balance).toEqual(initMintAmount - transferAmount); 
        expect(receiverWalletDataAfterTransfer.balance).toEqual(transferAmount); 
        // const balance1 = (await receiverWallet.getGetWalletData()).balance;
        // console.log(fromNano(balance1));
    });

})