import {
  WSOLMint,
  RAYMint,
  USDCMint,
  toFeeConfig,
  toApiV3Token,
  Router,
  TokenAmount,
  Token,
} from '@raydium-io/raydium-sdk-v2'
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { initSdk, txVersion } from '../config'
import { readCachePoolData, writeCachePoolData } from '../cache/utils'
import { PublicKey } from '@solana/web3.js'

async function routeSwap() {
  const raydium = await initSdk()
  await raydium.fetchChainTime()

  const inputAmount = '100'
  const SOL = NATIVE_MINT // or WSOLMint
  const [inputMint, outputMint] = [SOL, USDCMint]
  const [inputMintStr, outputMintStr] = [inputMint.toBase58(), outputMint.toBase58()]

  // strongly recommend cache all pool data, it will reduce lots of data fetching time
  // code below is a simple way to cache it, you can implement it with any other ways
  let poolData = readCachePoolData() // initial cache time is 10 mins(1000 * 60 * 10), if wants to cache longer, set bigger number in milliseconds
  // let poolData = readCachePoolData(1000 * 60 * 60 * 24) // example for cache 1 day
  if (poolData.ammPools.length === 0) {
    console.log('fetching all pool basic info, this might take a while (more than 30 seconds)..')
    poolData = await raydium.tradeV2.fetchRoutePoolBasicInfo()
    writeCachePoolData(poolData)
  }

  console.log('computing swap route..')
  const routes = raydium.tradeV2.getAllRoute({
    inputMint,
    outputMint,
    ...poolData,
  })

  const {
    routePathDict,
    mintInfos,
    ammPoolsRpcInfo,
    ammSimulateCache,
    clmmPoolsRpcInfo,
    computeClmmPoolInfo,
    computePoolTickData,
  } = await raydium.tradeV2.fetchSwapRoutesData({
    routes,
    inputMint,
    outputMint,
  })

  console.log('calculating available swap routes...')
  const swapRoutes = raydium.tradeV2.getAllRouteComputeAmountOut({
    inputTokenAmount: new TokenAmount(
      new Token({
        mint: inputMintStr,
        decimals: mintInfos[inputMintStr].decimals,
        isToken2022: mintInfos[inputMintStr].programId.equals(TOKEN_2022_PROGRAM_ID),
      }),
      inputAmount
    ),
    directPath: routes.directPath.map((p) => ammSimulateCache[p.id.toBase58()] || computeClmmPoolInfo[p.id.toBase58()]),
    routePathDict,
    simulateCache: ammSimulateCache,
    tickCache: computePoolTickData,
    mintInfos: mintInfos,
    outputToken: toApiV3Token({
      ...mintInfos[outputMintStr],
      programId: mintInfos[outputMintStr].programId.toBase58(),
      address: outputMintStr,
      extensions: {
        feeConfig: toFeeConfig(mintInfos[outputMintStr].feeConfig),
      },
    }),
    chainTime: Math.floor(raydium.chainTimeData?.chainTime ?? Date.now() / 1000),
    slippage: 0.005,
    epochInfo: await raydium.connection.getEpochInfo(),
  })

  // swapRoutes are sorted by out amount, so first one should be the best route
  const targetRoute = swapRoutes[0]

  console.log('best swap route:', {
    input: targetRoute.amountIn.amount.toExact(),
    output: targetRoute.amountOut.amount.toExact(),
    minimumOut: targetRoute.minAmountOut.amount.toExact(),
    swapType: targetRoute.routeType,
    routes: targetRoute.poolInfoList.map((p) => `${p.version === 4 ? 'AMM' : 'CLMM'} ${p.id} }`).join(` -> `),
  })

  console.log('fetching swap route pool keys..')
  const poolKeys = await raydium.tradeV2.computePoolToPoolKeys({
    pools: targetRoute.poolInfoList,
    ammRpcData: ammPoolsRpcInfo,
    clmmRpcData: clmmPoolsRpcInfo,
  })

  console.log('build swap tx..')
  const { execute } = await raydium.tradeV2.swap({
    routeProgram: Router,
    txVersion,
    swapInfo: targetRoute,
    swapPoolKeys: poolKeys,
    ownerInfo: {
      associatedOnly: true,
      checkCreateATAOwner: true,
    },
    computeBudgetConfig: {
      units: 600000,
      microLamports: 100000,
    },
  })

  console.log('execute tx..')
  const { txIds } = await execute({ sequentially: true })
  console.log('txIds:', txIds)
}
/** uncomment code below to execute */
// routeSwap()
