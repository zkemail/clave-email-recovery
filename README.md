# Clave Email Recovery Contracts

<p align="center">
  <img src="clave-logo.png" alt="Clave" height="100"/>
  <img src="zk-email-logo.png" alt="ZkEmail" height="100"/>
</p>

## Project structure

- `/contracts`: smart contracts.
- `/deploy`: deployment and contract interaction scripts.
- `/test`: test files
- `hardhat.config.ts`: configuration file.

## Commands

- `npx hardhat compile` will compile the contracts, typescript bindings are generated automatically.
- `npx hardhat deploy {contract name} {constructor arguments}` will deploy and verify the contract. Requires [environment variable setup](#environment-variables).
- `npm run test`: run tests.

### Environment variables

In order to prevent users to leak private keys, this project includes the `dotenv` package which is used to load environment variables. It's used to load the wallet private key, required to run the deploy script.

To use it, rename `.env.example` to `.env` and enter your private key.

```
PRIVATE_KEY=123cde574ccff....
```

## Official Links

- [Website](https://getclave.io/)
- [GitHub](https://github.com/getclave)
- [Twitter](https://twitter.com/getclave)

## Usage of scripts

scripts/dkim_registry.ts

```
$ npx ts-node scripts/dkim_registry.ts --help
```

scripts/kill_switch.ts

```
$ npx ts-node scripts/kill_switch.ts --help
```
