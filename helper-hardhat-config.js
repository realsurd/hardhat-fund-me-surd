const networkConfig = {
    31337: {
        name: "localhost",
    },
    11155111:{
        name: "Sepolia",
        ethUsdPriceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    },
}

const developmentchains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
    networkConfig,
    developmentchains,
    DECIMALS,
    INITIAL_ANSWER,
}