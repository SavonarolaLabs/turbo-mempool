    // Constants
    // _bondContractHash: Hash of bond contract
    // _devPK: PK of dev :^)

    // Output box if open order is closed.
    val bondBox         = OUTPUTS(0)
    val orderIsClosed   = _bondContractHash == blake2b256( bondBox.propositionBytes )


    //
        optTokenId match {
      case Some(id) =>
        val script = mkScript(ORD_PREFIX + orderType + TOKEN)
        val constants = ConstantsBuilder
          .create()
          .item("_tokenId", idFromStr(id))
          .item("_devPK", devPK)
          .item("_bondContractHash", Colls.fromArray(bondContractHash))
          .build()

        ctx.compileContract(constants, script)

    //
    val bondContractHash = {
      val bondContract = mkBondContract(ctx, optTokenId)
      Blake2b256.hash(
        bondContract.getErgoTree.bytes
      )
    }
