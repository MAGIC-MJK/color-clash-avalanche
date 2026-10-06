import { readFileSync } from 'node:fs';
import solc from 'solc';

export function compileResults() {
    const source = readFileSync(new URL('../contracts/GameResults.sol', import.meta.url), 'utf8');
    const output = JSON.parse(solc.compile(JSON.stringify({
        language: 'Solidity',
        sources: { 'GameResults.sol': { content: source } },
        settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun',
            outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
    })));
    const errors = output.errors?.filter(error => error.severity === 'error') || [];
    if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
    const contract = output.contracts['GameResults.sol'].GameResults;
    return { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` };
}
