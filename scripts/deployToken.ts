import { toNano , Address } from '@ton/core';
import { Token } from '../wrappers/Token';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {

    const tokenContent = {
        $$type: 'Content' as const, 
        name: "XETA",
        symbol: 'MYTOKEN',
        decimals: 9n,
    };
    const owner = Address.parse("0QBo4qBpXOY3zV5V0CKRJQ6Ku-LCuTnTIDErp_VyhbkSzVED");

    const token = provider.open(await Token.fromInit(owner , tokenContent));


    await token.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: "Mint",
            amount:  0n,
            to: owner,
        }
    );

    await provider.waitForDeploy(token.address);

    // run methods on `token`
}
