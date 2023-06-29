const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    TopicCreateTransaction,
    TokenCreateTransaction,
    KeyList,
    TopicInfoQuery,
    AccountId,
    TopicUpdateTransaction,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
    TokenNftInfoQuery,
    TokenType,
    TokenSupplyType,
    CustomRoyaltyFee,
    CustomFixedFee,
  } = require("@hashgraph/sdk");
  require("dotenv").config();
  
  //Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = process.env.MY_ACCOUNT_ID;
  const myPrivateKey = process.env.MY_PRIVATE_KEY;
  
  // If we weren't able to grab it, we should throw a new error
  if (!myAccountId || !myPrivateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }
  //Create your Hedera Testnet client
  const client = Client.forTestnet();
  
  //Set your account as the client's operator
  client.setOperator(myAccountId, myPrivateKey);
  
  //Set the default maximum transaction fee (in Hbar)
  client.setDefaultMaxTransactionFee(new Hbar(100));
  
  //Set the maximum payment for queries (in Hbar)
  client.setMaxQueryPayment(new Hbar(50));
  
  const adminKey = PrivateKey.generateED25519();
  const submitKey = PrivateKey.generateED25519();
  
  
  var myTwoOtherAccounts = new KeyList();
  
  
  const supplyKey = PrivateKey.generateED25519();
  const feeScheduleKey = PrivateKey.generateED25519();
  const customRoyaltyFee = //Create a royalty fee
  new CustomRoyaltyFee()
       .setNumerator(5) // The numerator of the fraction
       .setDenominator(100) // The denominator of the fraction
       .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)) // The fallback fee
       .setFeeCollectorAccountId(myAccountId)) ;// The account that will receive the royalty fee
  const customFee = [customRoyaltyFee];
      
  async function createTwoAccounts() {
      const nodeId = [];
      nodeId.push(new AccountId(3));
    const accountOnePrivateKey = PrivateKey.generateED25519();
    const accountOnePublicKey = accountOnePrivateKey.publicKey;
    myTwoOtherAccounts.push(accountOnePrivateKey);
    const accountTwoPrivateKey = PrivateKey.generateED25519();
    const accountTwoPublicKey = accountTwoPrivateKey.publicKey;
    myTwoOtherAccounts.push(accountTwoPrivateKey);
  
    const accountOne = await new AccountCreateTransaction()
      .setKey(accountOnePublicKey)
      .setInitialBalance(Hbar.fromTinybars(1000))
      .execute(client);
  
    const accountTwo = await new AccountCreateTransaction()
      .setKey(accountTwoPublicKey)
      .setInitialBalance(Hbar.fromTinybars(1000))
      .execute(client);
  
    // Get the new account ID
    const getReceiptOne = await accountOne.getReceipt(client);
    const accountOneId = getReceiptOne.accountId;
  
    //Log the account ID
    console.log("The account One ID is: " + accountOneId);
    // Get the new account ID
    const getReceiptTwo = await accountTwo.getReceipt(client);
    const accountTwoId = getReceiptTwo.accountId;
  
    //Log the account ID
    console.log("The account Two ID is: " + accountTwoId);
    //Create the NFT
    const transaction = await new TokenCreateTransaction()
      .setTokenName("firstNFT")
      .setTokenType(TokenType.NonFungibleUnique)
      .setTokenSymbol("GRAD")
      .setDecimals(0)
      .setTokenMemo("Token Memo")
      .setAdminKey(adminKey)
      .setInitialSupply(0)
      .setTreasuryAccountId(myAccountId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(250)
      .setSupplyKey(supplyKey)
      .setCustomFees(customFee)
      .setFeeScheduleKey(feeScheduleKey)
      .setNodeAccountIds(nodeId)
      .freezeWith(client);


      //J'AI PAS PU FINIR L'EXERCICE à CAUSE D'UNE ERREUR QUI PERCISTAIT à CE NIVEAU Là
  
    //Sign the transaction with the treasury key
  
    const signTx1 = adminKey.signTransaction(transaction);
    const signTx2 = supplyKey.signTransaction(transaction);
    const signTx3 = PrivateKey.fromString(myPrivateKey).signTransaction(transaction);
  
    const signedTransaction = transaction
      .addSignature(adminKey.publicKey, signTx1)
      .addSignature(submitKey.publicKey, signTx2)
      .addSignature(PrivateKey.fromString(myPrivateKey).publicKey, signTx3);
  
    const txId = await signedTransaction.execute(client);
  
    
  
    //Get the transaction receipt
    const nftCreateRx = await txId.getReceipt(client);
  
    //Get the token ID
    const tokenId = nftCreateRx.tokenId;
  
    //Log the token ID
    console.log(`- Created NFT with Token ID: ${tokenId} \n`);
    const nftInfos = await new TokenNftInfoQuery()
       .setNftId(tokenId)
       .setNodeAccountIds(nodeId)
       .freezeWith(client);
  }
  
  createTwoAccounts();
  console.log(myTwoOtherAccounts);
  