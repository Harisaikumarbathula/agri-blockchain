const Product = require("../models/Product");
const { getContract } = require("../config/web3");
const { recordProduct } = require("./blockchainService");

async function syncProductsToBlockchain() {
  try {
    const contract = getContract();
    const productCountOnChain = await contract.methods.productCount().call();

    if (Number(productCountOnChain) === 0) {
      console.log("Blockchain has 0 products. Checking MongoDB for products to re-sync...");
      
      const localProducts = await Product.find({}).sort({ createdAt: 1 });
      
      if (localProducts.length > 0) {
        console.log(`Found ${localProducts.length} local products. Starting re-sync...`);
        let syncedCount = 0;

        for (const product of localProducts) {
          try {
            if (product.quantity <= 0) {
              console.log(`Skipping product ${product.name} during sync: Quantity is 0 or less.`);
              continue;
            }

            const harvestDateUnix = Math.floor(product.harvestDate.getTime() / 1000);
            
            const blockchainResult = await recordProduct({
              name: product.name,
              category: product.category,
              unit: product.unit,
              quantity: product.quantity,
              batchCode: product.batchCode,
              originLocation: product.originLocation,
              harvestDateUnix,
            });

            product.blockchainProductId = blockchainResult.blockchainId;
            product.blockchainTxHash = blockchainResult.receipt.transactionHash;
            product.lastBlockchainTxHash = blockchainResult.receipt.transactionHash;
            
            await product.save();
            syncedCount++;
          } catch (err) {
            console.error(`Failed to sync product ${product.name}:`, err.message);
          }
        }
        console.log(`Successfully synced ${syncedCount} out of ${localProducts.length} products to the blockchain.`);
      } else {
         console.log("MongoDB has no products either. System is clean.");
      }
    } else {
      console.log(`Blockchain is in sync. Found ${productCountOnChain} products on chain.`);
    }
  } catch (error) {
    console.error("Error during blockchain product sync:", error.message);
  }
}

module.exports = { syncProductsToBlockchain };
