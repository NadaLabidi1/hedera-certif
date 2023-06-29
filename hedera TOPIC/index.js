const {
    Client,
    PrivateKey,
    Hbar,
    TopicCreateTransaction,
    TopicInfoQuery,
    AccountId,
    TopicUpdateTransaction,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
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
  
  async function createFirstMessage() {
    const nodeId = [];
    nodeId.push(new AccountId(3));
    // Create a new topic
    let transaction = await new TopicCreateTransaction()
      .setAdminKey(adminKey)
      .setSubmitKey(submitKey)
      .setTopicMemo("Hi there")
      .setNodeAccountIds(nodeId)
      .freezeWith(client);
  
    const signTx1 = adminKey.signTransaction(transaction);
    const signTx2 = submitKey.signTransaction(transaction);
  
    const signedTransaction = transaction
      .addSignature(adminKey.publicKey, signTx1)
      .addSignature(submitKey.publicKey, signTx2);
  
    const txId = await signedTransaction.execute(client);
  
    // Grab the newly generated topic ID
    let receipt = await txId.getReceipt(client);
    let topicId = receipt.topicId;
    console.log(`Your topic ID is: ${topicId}`);
  
    // Wait 5 seconds between consensus topic creation and subscription creation
    await new Promise((resolve) => setTimeout(resolve, 5000));
    //Create the account info query
    const query = new TopicInfoQuery().setTopicId(topicId);
  
    //Submit the query to a Hedera network
    const info = await query.execute(client);
  
    //Print the topic memo and topic id
    console.log(info.topicMemo, info.topicId);
    const transactionId = await new TopicUpdateTransaction()
      .setTopicId(topicId)
      .setTopicMemo("new Memo")
      .setNodeAccountIds(nodeId)
      .freezeWith(client);
  
    const signTx3 = adminKey.signTransaction(transactionId);
  
    const signedTransaction2 = transactionId.addSignature(
      adminKey.publicKey,
      signTx3
    );
    const txId2 = await signedTransaction2.execute(client);
  
    const receipt2 = await txId2.getReceipt(client);
  
    console.log("Topic memo updated successfully", receipt2);
  
    // Subscribe to the topic
    new TopicMessageQuery()
      .setTopicId(topicId)
      .subscribe(client, null, (message) => {
        let messageAsString = Buffer.from(message.contents, "utf8").toString();
        console.log(
          `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
        );
      });
    // Send message to the topic
    let submitMsgTx = await new TopicMessageSubmitTransaction({
      topicId: topicId,
      message: "Submitkey set!",
    })
    .setNodeAccountIds(nodeId)
    .freezeWith(client)
    .sign(submitKey);
    
    let submitMsgTxSubmit = await submitMsgTx.execute(client);
    
    // Get the receipt of the transaction
    let getReceipt = await submitMsgTxSubmit.getReceipt(client);
    
    // Get the status of the transaction
    const transactionStatus = getReceipt.status;
    console.log("The message transaction status " + transactionStatus.toString());
    
    //Get the transaction message
  const getMessage = submitMsgTx.getMessage();
  console.log(getMessage);
  }

  createFirstMessage();