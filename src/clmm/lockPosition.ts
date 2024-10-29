import {
  ApiV3PoolInfoConcentratedItem,
  CLMM_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  PositionInfoLayout,
  getPdaPersonalPositionAddress,
} from '@raydium-io/raydium-sdk-v2'
import { PublicKey } from '@solana/web3.js'
import { initSdk, txVersion } from '../config'

export const lockPosition = async () => {
  const raydium = await initSdk()

  const positionNftMint = new PublicKey('your position nft mint')
  const positionPubKey = getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, positionNftMint).publicKey // devnet:  DEVNET_PROGRAM_ID.CLMM
  const pos = await raydium.connection.getAccountInfo(positionPubKey)
  const position = PositionInfoLayout.decode(pos!.data)

  /** if you want to fetch all existed position to find which position you want */
  //  const allPosition = await raydium.clmm.getOwnerPositionInfo({ programId: CLMM_PROGRAM_ID }) // devnet: DEVNET_PROGRAM_ID.CLMM

  // RAY-USDC pool
  // note: api doesn't support get devnet pool info
  const positionPoolInfoList = (await raydium.api.fetchPoolById({
    ids: position.poolId.toBase58(),
  })) as ApiV3PoolInfoConcentratedItem[]

  const poolInfo = positionPoolInfoList[0]
  if (!poolInfo) throw new Error(`clmm pool ${position.poolId.toBase58()} not found`)

  const { execute, transaction } = await raydium.clmm.lockPosition({
    // programId:DEVNET_PROGRAM_ID.CLMM_LOCK_PROGRAM_ID, // devnet
    // authProgramId:DEVNET_PROGRAM_ID.CLMM_LOCK_AUTH_ID, // devnet
    // poolProgramId:  new PublicKey(poolInfo.programId),
    ownerPosition: position,
    txVersion,
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 100000000,
    // },
  })

  const { txId } = await execute({})
  console.log('position locked:', { txId: `https://explorer.solana.com/tx/${txId}` })
  process.exit() // if you don't want to end up node execution, comment this line
}

/** uncomment code below to execute */
// lockPosition()
