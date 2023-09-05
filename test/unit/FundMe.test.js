const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")


!developmentChains.includes(network.name)
    ? describe.skip
:describe("FundMe", async function () {
   let fundMeS
   let deployer
   let mockV3Aggregator
   const sendValue = ethers.utils.parseEther("1") // 1 Eth

   beforeEach(async function () {
    // deploy our FundMe contract using Hardhat-deploy
    // const accounts = await ethers.getSigners()
    // const accountZero = accounts[0]
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract(
        "mockV3aggregator", 
        deployer
        )
   })
   
   // Test
    describe("constructor", async function(){
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.priceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    // Test for fund
    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })

        it("Updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.addressToAmountFunded(
                deployer.address
            )
            assert.equal(response.toString(), sendValue.toString())
        })

        it("Adds funder to array of funders", async function () {
            await fundMe.fund({value: sendValue})
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
    }) 

    // Withdrawal
    describe("Withdraw", async function () {
        //in order to withdraw, we must first make sure the contract has some money in it
        // Add a beforeEach in this describe to automatically fund the contract before running any test

        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })
        // For all our tests in this withdraw scope, we're first going to fund it with ETH

        it("Can withdraw ETH from a single funder", async function() {
            // Arrange
            const startingFundeMeBalance = await fundMe.provider.getBalance(
                fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
            // Act 
            const transactionResponse = await fundMe.withdraw()
            const trasactionReceipt = await transactionResponse.wait(1)
            // gasCost
            const { gasUsed, effectiveGasPrice } = trasactionReceipt
            const gasCost = gasUsed.mull(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
                )
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundeMeBalance.add(startingDeployerBalance), 
                endingDeployerBalance.add(gasCost).toString()
                )
        })
        it("allows us to withdraw with multiple funders", async function () {
         // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                    )
                    await fundMeConnectedContract.fund({value: sendValue})               
            }
            const startingFundeMeBalance = await fundMe.provider.getBalance(
                fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // Act
                const transactionResponse = await fundMe.withdraw()
                const trasactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = trasactionReceipt
                const gasCost = gasUsed.mull(effectiveGasPrice)

                // Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                startingFundeMeBalance.add(startingDeployerBalance), 
                endingDeployerBalance.add(gasCost).toString()
                )

                // Make sure that the funders are reset properly
                await expect(fundMe.funders(0)).to.be.reverted

                for (let i = 0; i < 6; i++) {
                   assert.equal(await fundMe.addressToAmountFunded(accounts[i].address),
                   0
                   )
                    
                }
        })

        // Make sure only the owner is able to withdraw
        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner")
        })
    })
})